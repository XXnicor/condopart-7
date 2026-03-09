import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, PawPrint, Loader2, AlertCircle } from 'lucide-react';
import LocationPicker from '@/components/LocationPicker';
import ImageUpload from '@/components/ImageUpload';
import { toast } from 'sonner';
import BottomNav from '@/components/BottomNav';

const CreateAlert = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [petName, setPetName] = useState('');
  const [description, setDescription] = useState('');
  const [lastSeen, setLastSeen] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ petName?: string; description?: string; lastSeen?: string }>({});

  const validate = () => {
    const errs: typeof errors = {};
    if (!petName.trim()) errs.petName = 'Informe o nome do pet';
    else if (petName.trim().length < 2) errs.petName = 'Nome muito curto';
    if (!description.trim()) errs.description = 'Descreva o pet e as circunstâncias do desaparecimento';
    else if (description.trim().length < 10) errs.description = 'Descrição muito curta. Adicione mais detalhes.';
    if (!lastSeen.trim()) errs.lastSeen = 'Confirme o local no mapa antes de continuar';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    // Parse location data from LocationPicker (JSON string with lat, lng, label)
    let locationLat: number | undefined;
    let locationLng: number | undefined;
    let locationLabel = lastSeen.trim();

    try {
      const parsed = JSON.parse(lastSeen);
      if (parsed?.lat && parsed?.lng) {
        locationLat = parsed.lat;
        locationLng = parsed.lng;
        locationLabel = parsed.label || '';
      }
    } catch {
      // Not JSON, use as plain label
    }

    const { data: insertData, error } = await supabase.from('alerts').insert({
      reporter_id: user!.id,
      condominium_id: profile!.condominium_id,
      title: petName.trim(),
      description: description.trim(),
      location_lat: locationLat,
      location_lng: locationLng,
      location_label: locationLabel,
      photo_url: photoUrl,
      status: 'active',
      type: 'lost',
    }).select('id').single();

    setLoading(false);

    if (error) {
      toast.error('Erro ao criar alerta. Verifique os dados e tente novamente.');
    } else {
      toast.success('Alerta criado com sucesso! 🐾');
      navigate(`/alert/${insertData.id}`);
    }
  };

  const isSubmitDisabled = loading || uploading;

  return (
    <div className="min-h-screen w-full max-w-[480px] mx-auto overflow-x-hidden relative bg-mesh-light dark:bg-mesh-dark bg-grain pb-24">
      <header className="sticky top-0 z-40 glass-strong px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-display text-lg font-bold">Criar Alerta</h1>
        </div>
      </header>

      <main className="px-4 py-4 overflow-y-auto overscroll-contain">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo upload */}
          <ImageUpload
            userId={user?.id ?? ''}
            onUploadComplete={(url) => setPhotoUrl(url)}
            onReset={() => setPhotoUrl(null)}
            onUploadingChange={setUploading}
          />

          <div className="space-y-1.5">
            <Label htmlFor="pet-name">Nome do pet *</Label>
            <div className="relative">
              <PawPrint className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="pet-name"
                placeholder="Ex: Rex, Luna..."
                value={petName}
                onChange={(e) => { setPetName(e.target.value); setErrors(prev => ({ ...prev, petName: undefined })); }}
                className={`pl-9 text-base min-h-[44px] input-glow ${errors.petName ? 'border-destructive' : ''}`}
                maxLength={100}
                autoComplete="off"
                autoCorrect="off"
                data-testid="input-pet-name"
              />
            </div>
            {errors.petName && <p className="flex items-center gap-1 text-xs text-rose-500 mt-1"><AlertCircle className="h-3 w-3 shrink-0" />{errors.petName}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-sm font-medium">Descrição *</Label>
            <Textarea
              id="description"
              placeholder="Cor, raça, tamanho, coleira... (mínimo 10 caracteres)"
              value={description}
              onChange={(e) => { setDescription(e.target.value); setErrors(prev => ({ ...prev, description: undefined })); }}
              rows={3}
              maxLength={1000}
              className={`text-base input-glow ${errors.description ? 'border-destructive' : ''}`}
              autoCorrect="off"
              data-testid="input-description"
            />
            <div className="flex items-center justify-between">
              {errors.description ? <p className="flex items-center gap-1 text-xs text-rose-500"><AlertCircle className="h-3 w-3 shrink-0" />{errors.description}</p> : <span />}
              <span className={`text-xs font-medium ${description.length > 900 ? 'text-warning' : 'text-stone-400'} tabular-nums`}>
                {description.length}/1000
              </span>
            </div>
          </div>

          <LocationPicker
            value={lastSeen}
            onChange={(val) => { setLastSeen(val); setErrors(prev => ({ ...prev, lastSeen: undefined })); }}
            error={errors.lastSeen}
          />

          <Button type="submit" className="w-full font-semibold btn-tactile h-12 text-base" size="lg" disabled={isSubmitDisabled} data-testid="button-submit-alert">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : '🐾 Criar Alerta'}
          </Button>
        </form>
      </main>

      <BottomNav />
    </div>
  );
};

export default CreateAlert;
