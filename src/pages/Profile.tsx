import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Building2,
  Camera,
  ChevronRight,
  KeyRound,
  Loader2,
  LogOut,
  PawPrint,
  Plus,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';
import { uploadAlertPhoto } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import BottomNav from '@/components/BottomNav';

/* ── helpers ────────────────────────────────────────── */

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const getInitials = (name: string | null) => {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
};

/* ── sub-components ─────────────────────────────────── */

const ProfileSkeleton = () => (
  <div className="mx-auto max-w-[480px] space-y-6 px-4 py-6">
    {/* header */}
    <div className="flex flex-col items-center gap-3">
      <Skeleton className="h-20 w-20 rounded-full" />
      <Skeleton className="h-5 w-36" />
      <Skeleton className="h-5 w-20" />
    </div>
    {/* pets */}
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <div className="flex gap-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-14 rounded-full" />
        ))}
      </div>
    </div>
    {/* activity */}
    <div className="space-y-2">
      <Skeleton className="h-4 w-32" />
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  </div>
);

/* ── main component ─────────────────────────────────── */

const Profile = () => {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Sync fields once profile loads
  useEffect(() => {
    if (profile && !initialized) {
      setName(profile.full_name ?? '');
      setPhone(profile.phone ? formatPhone(profile.phone) : '');
      setInitialized(true);
    }
  }, [profile, initialized]);

  const nameError =
    name.trim().length > 0 && name.trim().length < 2
      ? 'Nome deve ter pelo menos 2 caracteres'
      : null;

  const rawPhone = phone.replace(/\D/g, '');
  const isDirty = profile
    ? name.trim() !== (profile.full_name ?? '') ||
      rawPhone !== (profile.phone?.replace(/\D/g, '') ?? '')
    : false;
  const canSave = isDirty && name.trim().length >= 2 && !saving;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast.error('Formato não suportado. Use JPEG, PNG ou WebP.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('A foto deve ter no máximo 10MB');
      return;
    }
    setUploadingAvatar(true);
    try {
      const url = await uploadAlertPhoto(file, `avatars/${user.id}`);
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: url })
        .eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success('Foto atualizada!');
    } catch {
      toast.error('Erro ao enviar foto. Tente novamente.');
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  /* ── queries ── */

  const { data: condoName } = useQuery({
    queryKey: ['condo-name', profile?.condominium_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('condos')
        .select('name')
        .eq('id', profile!.condominium_id!)
        .single();
      return data?.name ?? null;
    },
    enabled: !!profile?.condominium_id,
  });

  const { data: myPets, isLoading: petsLoading } = useQuery({
    queryKey: ['my-pets', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pets')
        .select('id, name, species, breed, photo_url')
        .eq('owner_id', user!.id)
        .order('name', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: myAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['my-alerts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alerts')
        .select('id, title, status, created_at')
        .eq('reporter_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  /* ── handlers ── */

  const handleSave = async () => {
    if (!user || !canSave) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: name.trim(), phone: rawPhone || null })
      .eq('id', user.id);
    setSaving(false);

    if (error) {
      toast.error('Erro ao atualizar. Tente novamente.');
      return;
    }
    await refreshProfile();
    toast.success('Perfil atualizado com sucesso ✓');
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  /* ── loading ── */

  if (!profile) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <ProfileSkeleton />
        <BottomNav />
      </div>
    );
  }

  const statusMap: Record<string, { label: string; variant: 'default' | 'outline' | 'secondary' | 'destructive'; className: string }> = {
    active: { label: 'Ativo', variant: 'outline', className: 'bg-warning/10 text-warning border-warning/30' },
    found: { label: 'Encontrado', variant: 'outline', className: 'bg-success/10 text-success border-success/30' },
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <motion.div
        className="mx-auto max-w-[480px] space-y-6 px-4 py-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* ── 1. HEADER ── */}
        <div className="flex flex-col items-center gap-2">
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <button
            className="relative group"
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploadingAvatar}
          >
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name ?? 'Avatar'}
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
                {getInitials(profile.full_name)}
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              {uploadingAvatar ? (
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              ) : (
                <Camera className="h-5 w-5 text-white" />
              )}
            </div>
          </button>
          <p className="text-lg font-semibold text-foreground">
            {profile.full_name || 'Sem nome'}
          </p>
          {profile.role === 'syndic' ? (
            <Badge className="bg-primary/10 text-primary border-primary/30 gap-1" variant="outline">
              <Shield className="h-3 w-3" /> Síndico
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              Morador
            </Badge>
          )}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            <span>{condoName ?? 'Condomínio não definido'}</span>
          </div>
        </div>

        {/* ── 2. MEUS PETS ── */}
        <div>
          <h2 className="mb-3 text-base font-semibold text-foreground">Meus pets</h2>
          {petsLoading ? (
            <div className="flex gap-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-14 rounded-full shrink-0" />
              ))}
            </div>
          ) : !myPets?.length ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <p className="text-sm text-muted-foreground">
                Você ainda não cadastrou nenhum pet.
              </p>
              <button
                onClick={() => toast.info('Cadastro de pets em breve!')}
                className="flex flex-col items-center gap-1"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-primary/50">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs text-primary font-medium">Adicionar</span>
              </button>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {myPets.map((pet) => (
                <div key={pet.id} className="flex flex-col items-center gap-1 shrink-0">
                  {pet.photo_url ? (
                    <img
                      src={pet.photo_url}
                      alt={pet.name}
                      className="h-14 w-14 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-sm font-semibold">
                      {pet.name[0]?.toUpperCase() ?? '?'}
                    </div>
                  )}
                  <span className="w-14 text-center text-xs text-foreground truncate">
                    {pet.name}
                  </span>
                </div>
              ))}
              <button
                onClick={() => toast.info('Cadastro de pets em breve!')}
                className="flex flex-col items-center gap-1 shrink-0"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-primary/50">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs text-primary font-medium">Adicionar</span>
              </button>
            </div>
          )}
        </div>

        {/* ── 3. MINHA ATIVIDADE ── */}
        <div>
          <h2 className="mb-3 text-base font-semibold text-foreground">Minha atividade</h2>
          {alertsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !myAlerts?.length ? (
            <div className="flex flex-col items-center gap-2 py-6">
              <PawPrint className="h-10 w-10 text-primary/30" />
              <p className="text-sm text-muted-foreground">
                Você ainda não criou nenhum alerta.
              </p>
              <button
                onClick={() => navigate('/create-alert')}
                className="text-sm font-medium text-primary"
              >
                Criar alerta agora →
              </button>
            </div>
          ) : (
            <div>
              {myAlerts.map((alert, idx) => {
                const s = statusMap[alert.status] ?? statusMap.active;
                return (
                  <div key={alert.id}>
                    <button
                      className="flex w-full items-center gap-3 py-3 text-left"
                      onClick={() => navigate(`/alert/${alert.id}`)}
                    >
                      <PawPrint className="h-5 w-5 text-primary shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {alert.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(alert.created_at), "d 'de' MMMM", { locale: ptBR })}
                        </p>
                      </div>
                      <Badge variant={s.variant} className={s.className}>
                        {s.label}
                      </Badge>
                    </button>
                    {idx < myAlerts.length - 1 && <Separator />}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── 4. INFORMAÇÕES DA CONTA ── */}
        <Card className="rounded-2xl border-border/50 shadow-md">
          <CardContent className="space-y-4 p-4">
            <h2 className="text-base font-semibold text-foreground">Informações da conta</h2>
            <div className="space-y-1.5">
              <Label htmlFor="full_name" className="text-xs text-muted-foreground">
                Nome
              </Label>
              <Input
                id="full_name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                className={nameError ? 'border-destructive' : ''}
              />
              {nameError && (
                <p className="text-xs text-destructive">{nameError}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs text-muted-foreground">
                Telefone
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="(11) 99999-9999"
              />
            </div>
            <Button
              className="w-full rounded-2xl"
              disabled={!canSave}
              onClick={handleSave}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                </>
              ) : (
                'Salvar alterações'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* ── 5. RODAPÉ ── */}
        <div className="space-y-1">
          <button
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-muted"
            onClick={() => navigate('/reset-password')}
          >
            <KeyRound className="h-5 w-5 text-muted-foreground" />
            <span className="flex-1 text-sm text-foreground">Redefinir senha</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>

          <button
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-destructive/5"
            onClick={() => setShowLogoutConfirm((v) => !v)}
          >
            <LogOut className="h-5 w-5 text-destructive" />
            <span className="flex-1 text-sm text-destructive">Sair da conta</span>
            <ChevronRight className="h-4 w-4 text-destructive" />
          </button>

          <AnimatePresence>
            {showLogoutConfirm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-2 px-3 pb-2 pt-1">
                  <p className="text-sm text-center text-muted-foreground">
                    Tem certeza que deseja sair?
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-2xl"
                      onClick={() => setShowLogoutConfirm(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 rounded-2xl border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" /> Sair
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <BottomNav />
    </div>
  );
};

export default Profile;
