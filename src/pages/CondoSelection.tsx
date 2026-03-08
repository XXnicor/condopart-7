import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GOLDEN_PARK_CONDO } from '@/lib/constants';

const CondoSelection = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);

  const assignCondo = useCallback(async () => {
    if (!user) return;
    setFailed(false);

    const { error } = await supabase
      .from('profiles')
      .update({ condominium_id: GOLDEN_PARK_CONDO.id, role: 'resident' })
      .eq('id', user.id);

    if (error) {
      setFailed(true);
      return;
    }

    await refreshProfile();
    navigate('/');
  }, [user, refreshProfile, navigate]);

  useEffect(() => {
    assignCondo();
  }, [assignCondo]);

  return (
    <div className="flex min-h-screen w-full max-w-[480px] mx-auto overflow-x-hidden flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
          <Building2 className="h-6 w-6 text-amber-500" style={{ width: 48, height: 48 }} />
        </div>

        <div>
          <h1 className="font-display text-lg font-bold text-foreground">
            {GOLDEN_PARK_CONDO.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {GOLDEN_PARK_CONDO.address}
          </p>
        </div>

        {failed ? (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-1.5 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">Não foi possível configurar seu acesso.</p>
            </div>
            <Button onClick={assignCondo} variant="outline" size="sm">
              Tentar novamente
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Configurando seu acesso...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CondoSelection;
