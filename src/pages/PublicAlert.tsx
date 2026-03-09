import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, PawPrint, SearchX } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function setMetaTag(property: string, content: string) {
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

const PublicAlert = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [alert, setAlert] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchAlert = async () => {
      const { data } = await supabase
        .from('alerts')
        .select('id, title, description, photo_url, status, location_label, created_at')
        .eq('id', id)
        .maybeSingle();
      setAlert(data);
      setLoading(false);
    };
    fetchAlert();
  }, [id]);

  // OG meta tags
  useEffect(() => {
    if (!alert) return;
    document.title = `${alert.title} está perdido — PetAlert 🐾`;
    setMetaTag('og:title', `${alert.title} está perdido! 🐾`);
    setMetaTag('og:description', alert.description?.slice(0, 150) || 'Ajude a encontrar este pet');
    setMetaTag('og:image', alert.photo_url || '');
    setMetaTag('og:url', window.location.href);
    return () => {
      document.title = 'PetAlert Condo';
      ['og:title', 'og:description', 'og:image', 'og:url'].forEach(prop => {
        document.querySelector(`meta[property="${prop}"]`)?.remove();
      });
    };
  }, [alert]);

  if (loading) {
    return (
    <div className="min-h-screen w-full max-w-[480px] mx-auto overflow-x-hidden relative bg-mesh-light dark:bg-mesh-dark bg-grain">
      <header className="glass-strong px-4 py-3">
        <span className="font-display text-xl font-extrabold text-primary">PetAlert</span>
      </header>
      <main className="space-y-4 px-4 py-4 overflow-y-auto overscroll-contain">
        <Skeleton className="h-[280px] w-full rounded-2xl" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </main>
      </div>
    );
  }

  if (!alert) {
    return (
      <div className="flex min-h-screen w-full max-w-[480px] mx-auto overflow-x-hidden flex-col items-center justify-center bg-mesh-light dark:bg-mesh-dark gap-4 px-4">
        <SearchX className="h-16 w-16 text-muted-foreground/30" />
        <p className="text-lg font-semibold text-foreground">Alerta não encontrado</p>
        <p className="text-sm text-muted-foreground text-center">Este link pode ter expirado ou sido removido.</p>
        <Button variant="outline" onClick={() => navigate('/')}>Ir para o início</Button>
      </div>
    );
  }

  const isActive = alert.status === 'active';
  const description = alert.description || '';
  const isLong = description.length > 180;

  return (
    <div className="min-h-screen w-full max-w-[480px] mx-auto overflow-x-hidden relative bg-mesh-light dark:bg-mesh-dark bg-grain">
      {/* Header */}
      <header className="glass-strong px-4 py-3">
        <span className="font-display text-xl font-extrabold text-primary tracking-tight">PetAlert</span>
      </header>

      <main className="space-y-4 px-4 py-4 pb-8 overflow-y-auto overscroll-contain">
        {/* Photo */}
        <div className="overflow-hidden rounded-2xl bg-secondary shadow-md">
          <AspectRatio ratio={4 / 3}>
            {alert.photo_url ? (
              <img src={alert.photo_url} alt={alert.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-accent/30">
                <PawPrint className="h-16 w-16 text-primary/20" />
              </div>
            )}
          </AspectRatio>
        </div>

        {/* Status badge */}
        {isActive ? (
          <Badge className="bg-primary text-primary-foreground animate-pulse">🔴 Perdido</Badge>
        ) : (
          <Badge className="bg-success text-success-foreground">✅ Encontrado</Badge>
        )}

        {/* Info */}
        <h1 className="text-2xl font-bold text-foreground">{alert.title}</h1>

        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          {alert.location_label && (
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {alert.location_label}</span>
          )}
          <span>Perdido em {format(new Date(alert.created_at), "d 'de' MMMM", { locale: ptBR })}</span>
        </div>

        {/* Description */}
        <p className="text-base text-foreground/80 leading-relaxed">
          {isLong && !expanded ? description.slice(0, 180) + '...' : description}
          {isLong && !expanded && (
            <button onClick={() => setExpanded(true)} className="ml-1 text-primary font-medium hover:underline">
              Ver mais
            </button>
          )}
        </p>

        {/* CTA */}
        {isActive ? (
          <Card className="rounded-2xl border-primary/20 bg-accent/30">
            <CardContent className="space-y-3 p-4">
              <p className="font-display font-bold text-foreground">Você viu este pet?</p>
              <p className="text-sm text-muted-foreground">Registre um avistamento e ajude o dono a encontrá-lo.</p>
              <Button
                className="w-full font-semibold"
                onClick={() => navigate(`/auth?redirect=/alert/${alert.id}`)}
              >
                Registrar avistamento
              </Button>
              <p className="text-xs text-muted-foreground text-center">É necessário ter uma conta para registrar</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-2xl border-success/20 bg-success/5">
            <CardContent className="space-y-2 p-4 text-center">
              <p className="font-display font-bold text-foreground">🎉 Pet encontrado!</p>
              <p className="text-sm text-muted-foreground">
                Este pet já foi encontrado pelo dono. Obrigado a todos que ajudaram!
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center">
        <p className="text-xs text-muted-foreground">PetAlert Condo — ajudando pets a voltarem para casa 🐾</p>
        <button onClick={() => navigate('/auth')} className="mt-1 text-xs text-primary hover:underline">
          Criar conta gratuita
        </button>
      </footer>
    </div>
  );
};

export default PublicAlert;
