import { useState, useCallback } from 'react';

type Errors<T extends string> = Partial<Record<T, string>>;

export function useFormError<T extends string>() {
  const [errors, setErrors] = useState<Errors<T>>({});

  const setError = useCallback((field: T, message: string) => {
    setErrors(prev => ({ ...prev, [field]: message }));
  }, []);

  const clearError = useCallback((field: T) => {
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  const clearAll = useCallback(() => {
    setErrors({});
  }, []);

  const hasErrors = useCallback((errs: Errors<T>) => {
    return Object.values(errs).some(v => v !== undefined);
  }, []);

  return { errors, setErrors, setError, clearError, clearAll, hasErrors };
}

/**
 * Translate Supabase auth errors to pt-BR
 */
export function translateSupabaseError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Email ou senha incorretos';
  if (msg.includes('User already registered')) return 'Este email já possui uma conta';
  if (msg.includes('Email not confirmed')) return 'Confirme seu email antes de entrar. Verifique sua caixa de entrada.';
  if (msg.includes('Email rate limit exceeded')) return 'Muitas tentativas. Aguarde alguns minutos.';
  if (msg.includes('Password should be at least')) return 'A senha deve ter pelo menos 8 caracteres';
  if (msg.includes('New password should be different from the old password')) return 'A nova senha deve ser diferente da senha atual';
  return 'Erro inesperado. Tente novamente.';
}

/**
 * Phone validation for Brazilian format
 */
export function isValidBrazilianPhone(phone: string): boolean {
  if (!phone.trim()) return true; // optional
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || cleaned.length === 11;
}
