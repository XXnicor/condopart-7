import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { PawPrint, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryReady(true);
        setChecking(false);
      }
    });

    // Give it a moment to detect the recovery event from the URL hash
    const timeout = setTimeout(() => setChecking(false), 2000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (success) {
      const timeout = setTimeout(() => navigate('/', { replace: true }), 2000);
      return () => clearTimeout(timeout);
    }
  }, [success, navigate]);

  const validate = () => {
    const errs: typeof errors = {};
    if (!password) errs.password = 'Informe a nova senha';
    else if (password.length < 8) errs.password = 'A senha deve ter pelo menos 8 caracteres';
    if (!confirmPassword) errs.confirmPassword = 'Confirme a nova senha';
    else if (password !== confirmPassword) errs.confirmPassword = 'As senhas não coincidem';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      if (error.message.includes('New password should be different from the old password')) {
        toast.error('A nova senha deve ser diferente da senha atual');
      } else {
        toast.error('Erro ao salvar a senha. Tente novamente.');
      }
    } else {
      setSuccess(true);
    }
  };

  return (
    <div className="flex min-h-screen w-full max-w-[480px] mx-auto overflow-x-hidden flex-col items-center justify-center bg-background px-4">
      <div className="w-full">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <PawPrint className="h-9 w-9 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-extrabold text-foreground">
            Pet<span className="text-primary">Alert</span> Condo
          </h1>
        </div>

        <Card className="w-full rounded-2xl border-border/50 shadow-md">
          <CardContent className="p-6">
            {checking ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Verificando link...</p>
              </div>
            ) : success ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="text-sm font-medium text-foreground">Senha alterada com sucesso! ✅</p>
                <p className="text-xs text-muted-foreground">Redirecionando...</p>
              </div>
            ) : !recoveryReady ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  Link inválido ou expirado. Solicite um novo link de recuperação.
                </p>
                <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
                  Voltar para o login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-lg font-bold text-foreground text-center">Criar nova senha</h2>
                <div className="space-y-1.5">
                  <Label htmlFor="new-password">Nova senha</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined })); }}
                    className={`text-base min-h-[44px] ${errors.password ? 'border-destructive' : ''}`}
                    autoComplete="new-password"
                  />
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-new-password">Confirmar nova senha</Label>
                  <Input
                    id="confirm-new-password"
                    type="password"
                    placeholder="Repita a nova senha"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setErrors(prev => ({ ...prev, confirmPassword: undefined })); }}
                    className={`text-base min-h-[44px] ${errors.confirmPassword ? 'border-destructive' : ''}`}
                    autoComplete="new-password"
                  />
                  {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                </div>
                <Button type="submit" className="w-full font-semibold" disabled={loading}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 'Salvar nova senha'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
