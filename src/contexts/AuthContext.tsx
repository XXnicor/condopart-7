import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthError, Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  condominium_id: string | null;
  role: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resendConfirmation: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, userMeta?: Record<string, unknown>) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      setProfile({
        id: data.id,
        full_name: data.full_name,
        phone: data.phone,
        condominium_id: data.condominium_id,
        role: data.role,
        avatar_url: data.avatar_url,
      });
      return;
    }

    if (error && error.code !== 'PGRST116') {
      console.error('Failed to fetch profile:', error.message);
      return;
    }

    const fullName = (userMeta?.full_name as string) ?? null;
    await supabase
      .from('profiles')
      .upsert({ id: userId, full_name: fullName }, { onConflict: 'id', ignoreDuplicates: true });

    const { data: refetched } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (refetched) {
      setProfile({
        id: refetched.id,
        full_name: refetched.full_name,
        phone: refetched.phone,
        condominium_id: refetched.condominium_id,
        role: refetched.role,
        avatar_url: refetched.avatar_url,
      });
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const waitForProfile = async (userId: string): Promise<void> => {
    for (let i = 0; i < 10; i++) {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (data) return;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error('getSession error:', error);
          setSession(null);
          setUser(null);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          try {
            await fetchProfile(session.user.id, session.user.user_metadata);
          } catch (profileError) {
            console.error('initAuth profile error:', profileError);
          }
        }
      } catch (err) {
        console.error('initAuth error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        try {
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            try {
              await fetchProfile(session.user.id, session.user.user_metadata);
            } catch (profileError) {
              console.error('profile error on auth change:', profileError);
            }
          } else {
            setProfile(null);
          }
        } finally {
          if (mounted) setLoading(false);
        }
      }
    );

    const safetyTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('Auth timeout — forcing loading false');
        setLoading(false);
      }
    }, 5000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    
    // Se o signup foi bem-sucedido, aguarda o profile ser criado pelo trigger
    if (!error && data.user) {
      await waitForProfile(data.user.id);
      // Carrega o profile após confirmar que existe
      await fetchProfile(data.user.id, data.user.user_metadata);
    }
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const resendConfirmation = async (email: string) => {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    return { error };
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signUp, signIn, signOut, refreshProfile, resendConfirmation }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
