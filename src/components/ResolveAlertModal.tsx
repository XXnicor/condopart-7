import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
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
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <SheetContent
        side="bottom"
        className="flex flex-col max-h-[85dvh] overflow-hidden rounded-t-3xl p-0 [&>button]:hidden"
      >
        {/* Header — fixed, never scrolls */}
        <div className="flex-shrink-0 px-6 pt-6 pb-0">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted" />
          <h2 className="font-display text-lg font-bold text-foreground">
            O {petName} foi encontrado? 🐾
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Conte como foi — sua mensagem será vista por todos do condomínio
          </p>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
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

        {/* Footer — always visible at bottom */}
        <div className="flex-shrink-0 px-6 pb-6 pt-3 border-t border-border/50">
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
              variant="default"
              className="flex-1"
              onClick={handleConfirm}
              disabled={isResolving || (touched && trimmed.length < 10 && trimmed.length > 0)}
            >
              {isResolving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              {isResolving ? 'Confirmando...' : 'Confirmar'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ResolveAlertModal;
