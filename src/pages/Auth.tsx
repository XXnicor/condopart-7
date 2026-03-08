import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PawPrint, Loader2, Mail, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { translateSupabaseError } from '@/hooks/useFormError';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Auth = () => {
  const { signIn, signUp, session, resendConfirmation } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Resend confirmation
  const [showResend, setShowResend] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Forgot password
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotErrors, setForgotErrors] = useState<{ email?: string }>({});

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string }>({});

  // Signup form
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupErrors, setSignupErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string }>({});
  const [signupSuccess, setSignupSuccess] = useState<string | null>(null);

  const redirectTo = new URLSearchParams(window.location.search).get('redirect') || '/';

  if (session) {
    navigate(redirectTo, { replace: true });
    return null;
  }

  const validateLogin = () => {
    const errors: typeof loginErrors = {};
    if (!loginEmail.trim()) errors.email = 'Informe seu email';
    else if (!EMAIL_REGEX.test(loginEmail)) errors.email = 'Email inválido';
    if (!loginPassword) errors.password = 'Informe sua senha';
    else if (loginPassword.length < 8) errors.password = 'A senha deve ter pelo menos 8 caracteres';
    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateSignup = () => {
    const errors: typeof signupErrors = {};
    if (!signupName.trim()) errors.name = 'Informe seu nome completo';
    if (!signupEmail.trim()) errors.email = 'Informe seu email';
    else if (!EMAIL_REGEX.test(signupEmail)) errors.email = 'Email inválido';
    if (!signupPassword) errors.password = 'Informe sua senha';
    else if (signupPassword.length < 8) errors.password = 'A senha deve ter pelo menos 8 caracteres';
    if (!signupConfirmPassword) errors.confirmPassword = 'Confirme sua senha';
    else if (signupPassword !== signupConfirmPassword) errors.confirmPassword = 'As senhas não coincidem';
    setSignupErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLogin()) return;
    setLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setLoading(false);
    if (error) {
      const msg = translateSupabaseError(error.message);
      if (error.message.includes('Email not confirmed')) {
        setShowResend(true);
        setResendEmail(loginEmail);
        setResendSuccess(false);
      }
      toast.error(msg);
    } else {
      navigate(redirectTo);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignup()) return;
    setLoading(true);
    const { error } = await signUp(signupEmail, signupPassword, signupName);
    setLoading(false);
    if (error) {
      toast.error(translateSupabaseError(error.message));
    } else {
      setSignupSuccess(`Enviamos um link de confirmação para ${signupEmail}. Verifique sua caixa de entrada.`);
    }
  };

  const handleResend = async () => {
    setResending(true);
    const { error } = await resendConfirmation(resendEmail);
    setResending(false);
    if (error) {
      toast.error('Não foi possível reenviar. Aguarde alguns minutos e tente novamente.');
    } else {
      setResendSuccess(true);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof forgotErrors = {};
    if (!forgotEmail.trim()) errs.email = 'Informe seu email';
    else if (!EMAIL_REGEX.test(forgotEmail)) errs.email = 'Email inválido';
    setForgotErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: window.location.origin + '/reset-password',
    });
    setForgotLoading(false);
    if (error) {
      toast.error('Não foi possível enviar o email. Tente novamente.');
    } else {
      setForgotSuccess(true);
    }
  };

  const resetForgotState = () => {
    setShowForgotPassword(false);
    setForgotSuccess(false);
    setForgotEmail('');
    setForgotErrors({});
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
          <p className="text-sm text-muted-foreground">Encontre pets perdidos no seu condomínio</p>
        </div>

        <Card className="w-full rounded-2xl border-border/50 shadow-md">
          <Tabs defaultValue="login">
            <CardHeader className="pb-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Cadastrar</TabsTrigger>
              </TabsList>
            </CardHeader>

            <TabsContent value="login">
              {showForgotPassword ? (
                <CardContent className="space-y-4">
                  {forgotSuccess ? (
                    <div className="flex flex-col items-center gap-3 py-4 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        Enviamos um link de recuperação para <strong>{forgotEmail}</strong>.
                        <br />Verifique sua caixa de entrada e a pasta de spam.
                      </p>
                      <Button variant="outline" size="sm" onClick={resetForgotState}>
                        Voltar para o login
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <p className="text-sm text-muted-foreground text-center">
                        Informe seu email para receber o link de recuperação de senha.
                      </p>
                      <div className="space-y-1.5">
                        <Label htmlFor="forgot-email">Email</Label>
                        <Input
                          id="forgot-email"
                          type="email"
                          placeholder="seu@email.com"
                          value={forgotEmail}
                          onChange={(e) => { setForgotEmail(e.target.value); setForgotErrors({}); }}
                          className={`text-base min-h-[44px] ${forgotErrors.email ? 'border-destructive' : ''}`}
                          autoComplete="email"
                          autoCorrect="off"
                          autoCapitalize="off"
                        />
                        {forgotErrors.email && <p className="text-xs text-destructive">{forgotErrors.email}</p>}
                      </div>
                      <Button type="submit" className="w-full font-semibold" disabled={forgotLoading}>
                        {forgotLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</> : 'Enviar link de recuperação'}
                      </Button>
                      <Button type="button" variant="ghost" className="w-full text-sm" onClick={resetForgotState}>
                        Voltar para o login
                      </Button>
                    </form>
                  )}
                </CardContent>
              ) : (
                <form onSubmit={handleLogin}>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={loginEmail}
                        onChange={(e) => { setLoginEmail(e.target.value); setLoginErrors(prev => ({ ...prev, email: undefined })); }}
                        className={`text-base min-h-[44px] ${loginErrors.email ? 'border-destructive' : ''}`}
                        autoComplete="email"
                        autoCorrect="off"
                        autoCapitalize="off"
                      />
                      {loginErrors.email && <p className="text-xs text-destructive">{loginErrors.email}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Senha</Label>
                        <button
                          type="button"
                          className="text-sm text-amber-600 hover:underline cursor-pointer"
                          onClick={() => { setShowForgotPassword(true); setForgotEmail(loginEmail); }}
                        >
                          Esqueci minha senha
                        </button>
                      </div>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => { setLoginPassword(e.target.value); setLoginErrors(prev => ({ ...prev, password: undefined })); }}
                        className={`text-base min-h-[44px] ${loginErrors.password ? 'border-destructive' : ''}`}
                        autoComplete="current-password"
                      />
                      {loginErrors.password && <p className="text-xs text-destructive">{loginErrors.password}</p>}
                    </div>
                    <Button type="submit" className="w-full font-semibold" disabled={loading}>
                      {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entrando...</> : 'Entrar'}
                    </Button>

                    {showResend && !resendSuccess && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full border-amber-500 text-amber-600 hover:bg-amber-50"
                        onClick={handleResend}
                        disabled={resending}
                      >
                        {resending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reenviando...</> : <><Mail className="mr-2 h-4 w-4" /> Reenviar email de confirmação</>}
                      </Button>
                    )}

                    {showResend && resendSuccess && (
                      <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                        <span>Email reenviado! Verifique sua caixa de entrada e a pasta de spam.</span>
                      </div>
                    )}
                  </CardContent>
                </form>
              )}
            </TabsContent>

            <TabsContent value="signup">
              {signupSuccess ? (
                <CardContent>
                  <div className="flex flex-col items-center gap-3 py-4 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                      <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                    </div>
                    <p className="text-sm text-foreground font-medium">{signupSuccess}</p>
                    <Button variant="outline" size="sm" onClick={() => setSignupSuccess(null)}>
                      Voltar ao cadastro
                    </Button>
                  </div>
                </CardContent>
              ) : (
                <form onSubmit={handleSignup}>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-name">Nome completo</Label>
                      <Input
                        id="signup-name"
                        placeholder="Seu nome"
                        value={signupName}
                        onChange={(e) => { setSignupName(e.target.value); setSignupErrors(prev => ({ ...prev, name: undefined })); }}
                        className={`text-base min-h-[44px] ${signupErrors.name ? 'border-destructive' : ''}`}
                        autoComplete="name"
                        autoCorrect="off"
                      />
                      {signupErrors.name && <p className="text-xs text-destructive">{signupErrors.name}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={signupEmail}
                        onChange={(e) => { setSignupEmail(e.target.value); setSignupErrors(prev => ({ ...prev, email: undefined })); }}
                        className={`text-base min-h-[44px] ${signupErrors.email ? 'border-destructive' : ''}`}
                        autoComplete="email"
                        autoCorrect="off"
                        autoCapitalize="off"
                      />
                      {signupErrors.email && <p className="text-xs text-destructive">{signupErrors.email}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-password">Senha</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Mínimo 8 caracteres"
                        value={signupPassword}
                        onChange={(e) => { setSignupPassword(e.target.value); setSignupErrors(prev => ({ ...prev, password: undefined })); }}
                        className={`text-base min-h-[44px] ${signupErrors.password ? 'border-destructive' : ''}`}
                        autoComplete="new-password"
                      />
                      {signupErrors.password && <p className="text-xs text-destructive">{signupErrors.password}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-confirm-password">Confirmar senha</Label>
                      <Input
                        id="signup-confirm-password"
                        type="password"
                        placeholder="Repita sua senha"
                        value={signupConfirmPassword}
                        onChange={(e) => { setSignupConfirmPassword(e.target.value); setSignupErrors(prev => ({ ...prev, confirmPassword: undefined })); }}
                        className={`text-base min-h-[44px] ${signupErrors.confirmPassword ? 'border-destructive' : ''}`}
                        autoComplete="new-password"
                      />
                      {signupErrors.confirmPassword && <p className="text-xs text-destructive">{signupErrors.confirmPassword}</p>}
                    </div>
                    <Button type="submit" className="w-full font-semibold" disabled={loading}>
                      {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cadastrando...</> : 'Cadastrar'}
                    </Button>
                  </CardContent>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
