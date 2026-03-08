import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building2, Shield, Users, Loader2, Check } from 'lucide-react';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

interface Condo {
  id: string;
  name: string;
}

const CondoSelection = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [condos, setCondos] = useState<Condo[]>([]);
  const [loadingCondos, setLoadingCondos] = useState(true);
  const [selectedCondo, setSelectedCondo] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ condo?: string; role?: string }>({});

  useEffect(() => {
    const fetchCondos = async () => {
      const { data } = await supabase.from('condos').select('id, name').order('name');
      if (data) setCondos(data);
      setLoadingCondos(false);
    };
    fetchCondos();
  }, []);

  const handleSubmit = async () => {
    const errs: typeof errors = {};
    if (!selectedCondo) errs.condo = 'Selecione seu condomínio para continuar';
    if (!selectedRole) errs.role = 'Selecione seu papel no condomínio';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ condominium_id: selectedCondo, role: selectedRole })
      .eq('id', user?.id);

    if (error) {
      toast.error('Não foi possível salvar suas informações. Tente novamente.');
    } else {
      await refreshProfile();
      toast.success('Condomínio selecionado! ✅');
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-[480px] mx-auto">
        <Card className="w-full rounded-2xl border-border/50 shadow-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="font-display text-xl">Selecione seu Condomínio</CardTitle>
            <CardDescription>Escolha onde você mora e seu papel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Condo cards */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Condomínio</p>
              <div className="grid grid-cols-1 gap-2">
                {loadingCondos ? (
                  <SkeletonCard variant="condo" count={4} />
                ) : condos.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { setSelectedCondo(c.id); setErrors(prev => ({ ...prev, condo: undefined })); }}
                    className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                      selectedCondo === c.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      selectedCondo === c.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                    }`}>
                      {selectedCondo === c.id ? <Check className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                    </div>
                    <span className={`text-sm font-semibold ${selectedCondo === c.id ? 'text-primary' : 'text-foreground'}`}>
                      {c.name}
                    </span>
                  </button>
                ))}
              </div>
              {errors.condo && <p className="text-xs text-destructive">{errors.condo}</p>}
            </div>

            {/* Role selection */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Papel</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setSelectedRole('resident'); setErrors(prev => ({ ...prev, role: undefined })); }}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all ${
                    selectedRole === 'resident'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  <Users className="h-5 w-5" />
                  <span className="text-xs font-semibold">Residente</span>
                </button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => { setSelectedRole('admin'); setErrors(prev => ({ ...prev, role: undefined })); }}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all ${
                        selectedRole === 'admin'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/30'
                      }`}
                    >
                      <Shield className="h-5 w-5" />
                      <span className="text-xs font-semibold">Admin</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Função administrativa — sujeita a aprovação</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              {errors.role && <p className="text-xs text-destructive">{errors.role}</p>}
            </div>

            <Button onClick={handleSubmit} className="w-full font-semibold" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 'Continuar'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CondoSelection;
