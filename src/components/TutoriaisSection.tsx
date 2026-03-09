import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

const tutorials = [
  { title: 'Como criar um alerta', src: '/videos/tutorial-criar-alerta.mp4' },
  { title: 'Como reportar um avistamento', src: '/videos/tutorial-avistamento.mp4' },
  { title: 'Como compartilhar no WhatsApp', src: '/videos/tutorial-compartilhar.mp4' },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
};

type VideoStatus = 'loading' | 'ready' | 'error';

const TutorialCard = ({ title, src, index }: { title: string; src: string; index: number }) => {
  const [status, setStatus] = useState<VideoStatus>('loading');

  return (
    <motion.div
      className="flex-shrink-0 w-[200px] snap-start"
      variants={cardVariants}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      data-testid={`card-tutorial-${index}`}
    >
      <div className="relative rounded-2xl overflow-hidden bg-stone-100 aspect-[9/16]">
        {status !== 'ready' && (
          <div className={`absolute inset-0 flex items-center justify-center rounded-2xl bg-stone-100 ${status === 'loading' ? 'animate-pulse' : ''}`}>
            <Play className={`w-10 h-10 ${status === 'loading' ? 'text-stone-300' : 'text-stone-200'}`} />
          </div>
        )}
        <video
          className="w-full h-full object-cover rounded-2xl"
          src={src}
          autoPlay
          muted
          loop
          playsInline
          onCanPlay={() => setStatus('ready')}
          onError={() => setStatus('error')}
          style={{ display: status === 'ready' ? 'block' : 'none' }}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent rounded-b-2xl p-3">
          <p className="text-white text-xs font-semibold leading-tight">{title}</p>
        </div>
      </div>
    </motion.div>
  );
};

const TutoriaisSection = () => {
  return (
    <motion.section
      className="mt-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2, ease: 'easeOut' }}
      data-testid="section-tutorials"
    >
      <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-1">Como usar o EncontraPet</h2>
      <p className="text-sm text-stone-400 mb-4">Aprenda em segundos</p>

      <motion.div
        className="flex overflow-x-auto gap-3 pb-3 scroll-smooth snap-x snap-mandatory scrollbar-hide"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {tutorials.map((t, i) => (
          <TutorialCard key={t.src} title={t.title} src={t.src} index={i} />
        ))}
      </motion.div>
    </motion.section>
  );
};

export default TutoriaisSection;
