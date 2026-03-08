import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, PawPrint, Loader2 } from 'lucide-react';
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
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-[480px] items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-display text-lg font-bold">Criar Alerta</h1>
        </div>
      </header>

      <main className="mx-auto max-w-[480px] px-4 py-4">
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
                className={`pl-9 ${errors.petName ? 'border-destructive' : ''}`}
                maxLength={100}
              />
            </div>
            {errors.petName && <p className="text-xs text-destructive">{errors.petName}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              placeholder="Cor, raça, tamanho, coleira... (mínimo 10 caracteres)"
              value={description}
              onChange={(e) => { setDescription(e.target.value); setErrors(prev => ({ ...prev, description: undefined })); }}
              rows={3}
              maxLength={1000}
              className={errors.description ? 'border-destructive' : ''}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>

          <LocationPicker
            value={lastSeen}
            onChange={(val) => { setLastSeen(val); setErrors(prev => ({ ...prev, lastSeen: undefined })); }}
            error={errors.lastSeen}
          />

          <Button type="submit" className="w-full font-semibold" size="lg" disabled={isSubmitDisabled}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando alerta...</> : '🐾 Criar Alerta'}
          </Button>
        </form>
      </main>

      <BottomNav />
    </div>
  );
};

export default CreateAlert;
