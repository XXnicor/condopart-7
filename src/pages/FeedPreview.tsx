import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AlertFeedCard from '@/components/AlertFeedCard';

const FeedPreview = () => {
  const navigate = useNavigate();

  // Mock data para 3 pets
  const mockAlerts = [
    {
      id: '1',
      title: 'Bolinha',
      description: 'Cachorro pequeno, branco com manchas marrom. Desapareceu perto do portão principal.',
      photo_url: 'https://images.unsplash.com/photo-1633722715463-d30628519d4d?w=200&h=200&fit=crop',
      location_label: 'Bloco A - Portão Principal',
      status: 'active' as const,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h atrás
      sighting_count: 3,
      comment_count: 5,
    },
    {
      id: '2',
      title: 'Mimi',
      description: 'Gata laranja, muito carinhosa. Saiu da varanda do 302. Qualquer informação avisa!',
      photo_url: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=200&h=200&fit=crop',
      location_label: 'Bloco B - Apto 302',
      status: 'active' as const,
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5h atrás
      sighting_count: 1,
      comment_count: 2,
    },
    {
      id: '3',
      title: 'Thor',
      description: 'Golden retriever encontrado saudável e feliz no estacionamento! Obrigado a todos que ajudaram.',
      photo_url: 'https://images.unsplash.com/photo-1558788353-f76d92427f16?w=200&h=200&fit=crop',
      location_label: 'Estacionamento - Nível 2',
      status: 'found' as const,
      created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12h atrás
      sighting_count: 2,
      comment_count: 8,
    },
  ];

  return (
    <div className="min-h-screen w-full max-w-[480px] mx-auto overflow-x-hidden relative bg-mesh-light dark:bg-mesh-dark bg-grain pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-strong px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-display text-lg font-bold">Alertas</h1>
        </div>
      </header>

      {/* Main content */}
      <main className="px-4 py-4 overflow-y-auto overscroll-contain">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <p className="text-sm text-muted-foreground">
            Mostrando 3 alertas com diferentes status
          </p>
        </motion.div>

        {/* Feed cards with staggered animation */}
        <div className="space-y-3">
          {mockAlerts.map((alert, idx) => (
            <AlertFeedCard
              key={alert.id}
              {...alert}
              index={idx}
              onClick={() => {}}
            />
          ))}
        </div>

        {/* Footer info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="mt-8 rounded-2xl border border-border/50 bg-secondary/30 p-4 text-center text-xs text-muted-foreground"
        >
          <p>
            💡 Cards com animação fadeIn + slideUp staggered (0.1s cada)
          </p>
          <p className="mt-2">
            Badge pulsando em amarelo para perdidos, verde para encontrados
          </p>
        </motion.div>
      </main>
    </div>
  );
};

export default FeedPreview;
