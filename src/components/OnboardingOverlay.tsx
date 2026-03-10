import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface Step {
  icon: string;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    icon: '🐾',
    title: 'Bem-vindo ao EncontraPet',
    description: 'Veja alertas de pets perdidos no seu condomínio em tempo real.',
  },
  {
    icon: '📸',
    title: 'Crie um alerta',
    description: 'Toque em + para registrar um pet perdido com foto e descrição.',
  },
  {
    icon: '👀',
    title: 'Registre avistamentos',
    description: 'Viu o pet? Registre um avistamento e ajude o dono a encontrá-lo.',
  },
];

const easing = [0.22, 1, 0.36, 1];

const OnboardingOverlay = () => {
  const [visible, setVisible] = useState<boolean>(false);
  const [step, setStep] = useState(0);
  const [mounted, setMounted] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    setMounted(true);
    const isDone = localStorage.getItem('onboarding_done');
    if (isDone === null) {
      setVisible(true);
    }
  }, []);

  const handleDone = () => {
    localStorage.setItem('onboarding_done', 'true');
    setVisible(false);
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep((s) => s + 1);
    } else {
      handleDone();
    }
  };

  // Helper to respect reduced motion
  const dur = (base: number) => (prefersReducedMotion ? 0 : base);
  const movement = (base: number) => (prefersReducedMotion ? 0 : base);

  if (!mounted) return null;

  const current = steps[step];
  const isLast = step === steps.length - 1;

  // Variants parent for staggered children
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: dur(0.07),
        delayChildren: dur(0.05),
      },
    },
    exit: { opacity: 0, transition: { duration: dur(0.15) } },
  };

  // Standard item variant (inherits 'hidden' and 'visible' from parent)
  const itemVariants = {
    hidden: { opacity: 0, y: movement(5) },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: dur(0.2), ease: easing },
    },
    exit: { opacity: 0, y: movement(-5), transition: { duration: dur(0.15) } },
  };

  const overlayContent = (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="overlay-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: dur(0.18) }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.95, y: movement(8) }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.95, y: movement(8) }}
            transition={{ duration: dur(0.22), ease: easing }}
            className="w-full max-w-[340px] rounded-2xl bg-white p-8 shadow-2xl"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {/* 1. Apresentação */}
                <motion.div variants={itemVariants}>
                  <p className="text-center text-[64px] leading-none select-none" aria-hidden>
                    {current.icon}
                  </p>
                  <h2 className="mt-4 text-center text-xl font-semibold leading-snug text-zinc-900">
                    {current.title}
                  </h2>
                  <p className="mt-2 text-center text-sm leading-relaxed text-zinc-500">
                    {current.description}
                  </p>
                </motion.div>

                {/* 2. Dots */}
                <motion.div
                  variants={itemVariants}
                  className="mt-6 flex items-center justify-center gap-2"
                  aria-hidden
                >
                  {steps.map((_, i) => (
                    <span
                      key={i}
                      className={`h-2 w-2 rounded-full transition-colors duration-300 ${
                        i === step ? 'bg-amber-500' : 'bg-zinc-200'
                      }`}
                    />
                  ))}
                </motion.div>

                {/* 3. Botão Primário */}
                <motion.div variants={itemVariants}>
                  <button
                    onClick={handleNext}
                    className="mt-6 w-full rounded-xl bg-amber-500 py-3 text-sm font-medium text-white transition-colors hover:bg-amber-600 active:bg-amber-600"
                  >
                    {isLast ? 'Começar' : 'Próximo'}
                  </button>
                </motion.div>

                {/* 4. Botão Pular */}
                <AnimatePresence>
                  {step === 0 && (
                    <motion.div variants={itemVariants} initial="hidden" animate="visible" exit="hidden">
                      <button
                        onClick={handleDone}
                        className="mt-3 w-full text-sm text-zinc-400 transition-colors hover:text-zinc-500"
                      >
                        Pular
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(overlayContent, document.body);
};

export default OnboardingOverlay;
