import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useAlertActions } from '@/hooks/useAlertActions';
import { toast } from 'sonner';

interface ResolveAlertModalProps {
  alertId: string;
  petName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ResolveAlertModal = ({ alertId, petName, isOpen, onClose, onSuccess }: ResolveAlertModalProps) => {
  const [note, setNote] = useState('');
  const [touched, setTouched] = useState(false);
  const { resolve, isResolving } = useAlertActions();

  const trimmed = note.trim();
  const showError = touched && trimmed.length > 0 && trimmed.length < 10;

  const handleConfirm = async () => {
    setTouched(true);
    if (trimmed.length < 10) return;

    await resolve(alertId, trimmed);
    toast.success('Alerta encerrado! O condomínio foi notificado. 🐾');
    setNote('');
    setTouched(false);
    onSuccess();
  };

  const handleClose = () => {
    if (isResolving) return;
    setNote('');
    setTouched(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Bottom sheet */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[480px]"
          >
            <div className="rounded-t-3xl bg-card shadow-2xl flex flex-col max-h-[85dvh] overflow-hidden">
              {/* Scrollable content */}
              <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-6 pb-2">
                {/* Handle bar */}
                <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted" />

                <h2 className="font-display text-lg font-bold text-foreground">
                  O {petName} foi encontrado? 🐾
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Conte como foi — sua mensagem será vista por todos do condomínio
                </p>

                <div className="relative mt-4">
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Como o pet foi encontrado?
                  </label>
                  <Textarea
                    placeholder="Ex: Estava no jardim do bloco B, voltou sozinho..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    onBlur={() => setTouched(true)}
                    className="min-h-[100px] text-sm"
                    maxLength={500}
                    disabled={isResolving}
                  />
                  <span className="mt-1 block text-right text-xs text-muted-foreground">
                    {trimmed.length}/500
                  </span>
                </div>
              </div>

              {/* Pinned footer with action buttons */}
              <div className="px-6 pb-6 pt-3 border-t border-border/50">
                {showError && (
                  <p className="mb-2 text-xs text-destructive">
                    Descreva com pelo menos 10 caracteres
                  </p>
                )}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleClose}
                    disabled={isResolving}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                    onClick={handleConfirm}
                    disabled={isResolving || (touched && trimmed.length < 10 && trimmed.length > 0)}
                  >
                    {isResolving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    {isResolving ? 'Confirmando...' : 'Confirmar encerramento'}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ResolveAlertModal;
