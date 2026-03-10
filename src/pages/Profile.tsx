import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
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
  <div className="space-y-6 px-4 py-6">
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

  const shouldReduceMotion = useReducedMotion();
  const dur = (base: number) => (shouldReduceMotion ? 0 : base);

  const sectionVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: dur(0.07), delayChildren: dur(0.04) },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 6 },
    visible: { opacity: 1, y: 0, transition: { duration: dur(0.22), ease: 'easeOut' as const } },
  };

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

  console.log('[Profile] render — user:', !!user, '| profile:', !!profile, '| petsLoading:', petsLoading, '| petsCount:', myPets?.length ?? 'undefined', '| alertsLoading:', alertsLoading);

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

  const statusMap: Record<string, { label: string; variant: 'default' | 'outline' | 'secondary' | 'destructive'; className: string }> = {
    active: { label: 'Ativo', variant: 'outline', className: 'bg-warning/10 text-warning border-warning/30' },
    found: { label: 'Encontrado', variant: 'outline', className: 'bg-success/10 text-success border-success/30' },
  };

  /* ── render ── */

  return (
    <div className="min-h-screen w-full max-w-[480px] mx-auto overflow-x-hidden relative bg-mesh-light dark:bg-mesh-dark bg-grain pb-24">
      <AnimatePresence>
        {!profile ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <ProfileSkeleton />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Header with gradient background */}
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              className="bg-gradient-to-r from-amber-400 via-amber-500 to-orange-400 rounded-b-3xl overflow-hidden"
            >
              <div className="px-4 py-8 flex flex-col items-center gap-3">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <motion.div variants={itemVariants}>
                  <button
                    className="relative group"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                  >
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name ?? 'Avatar'}
                        className="h-20 w-20 rounded-full object-cover ring-4 ring-white shadow-lg"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-primary text-2xl font-bold ring-4 ring-white shadow-lg">
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
                </motion.div>

                <motion.div
                  variants={itemVariants}
                  className="flex flex-col items-center gap-2"
                >
                  <h1 className="text-2xl font-display font-bold text-white drop-shadow-md">
                    {profile.full_name || 'Sem nome'}
                  </h1>

                  <div className="flex items-center gap-2">
                    {profile.role === 'syndic' ? (
                      <Badge className="bg-white/20 text-white border-white/40 gap-1 backdrop-blur-sm">
                        <Shield className="h-3 w-3" /> Síndico
                      </Badge>
                    ) : (
                      <Badge className="bg-white/20 text-white border-white/40 backdrop-blur-sm">
                        Morador
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-sm text-white/90">
                    <Building2 className="h-4 w-4" />
                    <span className="font-medium">{condoName ?? 'Condomínio não definido'}</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            <div className="px-4 space-y-6">

              {/* ── MEUS PETS ── */}
              <motion.div
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
                className="relative -mt-6 rounded-2xl bg-card p-4 shadow-lg"
              >
                <motion.h2 variants={itemVariants} className="mb-4 text-base font-semibold text-foreground">Meus pets</motion.h2>
                <AnimatePresence>
                  {petsLoading ? (
                    <motion.div
                      key="skeleton-pets"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex gap-4 justify-center"
                    >
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-14 w-14 rounded-full shrink-0" />
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="content-pets"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {!myPets?.length ? (
                        <motion.div variants={itemVariants} className="flex flex-col items-center gap-3 py-6">
                          <p className="text-sm text-muted-foreground">
                            Você ainda não cadastrou nenhum pet.
                          </p>
                          <button
                            onClick={() => toast.info('Cadastro de pets em breve!')}
                            className="flex flex-col items-center gap-1"
                          >
                            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-primary/50 hover:border-primary transition-colors">
                              <Plus className="h-5 w-5 text-primary" />
                            </div>
                            <span className="text-xs text-primary font-medium">Adicionar</span>
                          </button>
                        </motion.div>
                      ) : (
                        <motion.div variants={itemVariants} className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide justify-center">
                          {myPets.map((pet) => (
                            <div
                              key={pet.id}
                              className="flex flex-col items-center gap-2 shrink-0"
                            >
                              {pet.photo_url ? (
                                <img
                                  src={pet.photo_url}
                                  alt={pet.name}
                                  className="h-14 w-14 rounded-full object-cover ring-2 ring-primary/20"
                                />
                              ) : (
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-sm font-semibold ring-2 ring-primary/20">
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
                            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-primary/50 hover:border-primary hover:bg-primary/5 transition-colors">
                              <Plus className="h-5 w-5 text-primary" />
                            </div>
                            <span className="text-xs text-primary font-medium">Adicionar</span>
                          </button>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* ── MINHA ATIVIDADE ── */}
              <motion.div
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
                className="rounded-2xl bg-card p-4 shadow-md"
              >
                <motion.h2 variants={itemVariants} className="mb-3 text-base font-semibold text-foreground">Minha atividade</motion.h2>
                <AnimatePresence>
                  {alertsLoading ? (
                    <motion.div
                      key="skeleton-alerts"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-3"
                    >
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="content-alerts"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {!myAlerts?.length ? (
                        <motion.div variants={itemVariants} className="flex flex-col items-center gap-2 py-6">
                          <PawPrint className="h-10 w-10 text-primary/30" />
                          <p className="text-sm text-muted-foreground">
                            Você ainda não criou nenhum alerta.
                          </p>
                          <button
                            onClick={() => navigate('/create-alert')}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            Criar alerta agora →
                          </button>
                        </motion.div>
                      ) : (
                        <div className="space-y-2">
                          {myAlerts.slice(0, 3).map((alert) => {
                            const s = statusMap[alert.status] ?? statusMap.active;
                            return (
                              <motion.button
                                variants={itemVariants}
                                key={alert.id}
                                className="flex w-full items-center gap-3 rounded-xl bg-secondary/50 p-3 text-left transition-colors hover:bg-secondary"
                                onClick={() => navigate(`/alert/${alert.id}`)}
                              >
                                <PawPrint className="h-5 w-5 text-primary shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-foreground truncate">
                                    {alert.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(alert.created_at), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                  </p>
                                </div>
                                <Badge variant={s.variant} className={`${s.className} text-xs`}>
                                  {s.label}
                                </Badge>
                              </motion.button>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <motion.div
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                {/* ── INFORMAÇÕES DA CONTA ── */}
                <motion.div
                  variants={itemVariants}
                  className="rounded-2xl bg-card p-4 shadow-md"
                >
                  <h2 className="mb-4 text-base font-semibold text-foreground">Informações da conta</h2>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name" className="text-xs font-medium text-muted-foreground">
                        Nome completo
                      </Label>
                      <Input
                        id="full_name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={100}
                        className={`rounded-xl text-base min-h-[44px] input-glow ${nameError ? 'border-destructive' : ''}`}
                        autoComplete="name"
                        autoCorrect="off"
                      />
                      {nameError && (
                        <p className="text-xs text-destructive">{nameError}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-xs font-medium text-muted-foreground">
                        Telefone
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(formatPhone(e.target.value))}
                        placeholder="(11) 99999-9999"
                        className="rounded-xl text-base min-h-[44px] input-glow"
                        autoComplete="tel"
                      />
                    </div>
                    <Button
                      className="w-full rounded-2xl h-11 font-semibold"
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
                  </div>
                </motion.div>

                {/* ── AÇÕES ── */}
                <motion.div
                  variants={itemVariants}
                  className="space-y-2 pb-6"
                >
                  <button
                    className="flex w-full min-h-[44px] items-center gap-3 rounded-2xl bg-card px-4 py-3 text-left transition-colors hover:bg-secondary"
                    onClick={() => navigate('/reset-password')}
                  >
                    <KeyRound className="h-5 w-5 text-primary shrink-0" />
                    <span className="flex-1 text-sm font-medium text-foreground">Redefinir senha</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>

                  <button
                    className="flex w-full min-h-[44px] items-center gap-3 rounded-2xl bg-destructive/10 px-4 py-3 text-left transition-colors hover:bg-destructive/15"
                    onClick={() => setShowLogoutConfirm((v) => !v)}
                  >
                    <LogOut className="h-5 w-5 text-destructive shrink-0" />
                    <span className="flex-1 text-sm font-medium text-destructive">Sair da conta</span>
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
                        <div className="rounded-2xl bg-destructive/5 border border-destructive/20 space-y-3 p-4 mt-2">
                          <p className="text-sm font-medium text-center text-foreground">
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
                              className="flex-1 rounded-2xl bg-destructive hover:bg-destructive/90 text-white font-semibold"
                              onClick={handleLogout}
                            >
                              <LogOut className="mr-2 h-4 w-4" /> Sair
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
