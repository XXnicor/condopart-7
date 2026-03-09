import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

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

const OnboardingOverlay = () => {
  const [visible, setVisible] = useState<boolean>(
    () => localStorage.getItem('onboarding_done') === null
  );
  const [step, setStep] = useState(0);

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

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="onboarding-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="w-full max-w-[340px] rounded-2xl bg-white dark:bg-zinc-900 p-8 shadow-2xl"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Slide animado por passo */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.22 }}
              >
                {/* Ícone */}
                <p className="text-[64px] leading-none text-center select-none" aria-hidden>
                  {current.icon}
                </p>

                {/* Título */}
                <h2 className="mt-4 text-center font-semibold text-xl text-zinc-900 dark:text-zinc-50 leading-snug">
                  {current.title}
                </h2>

                {/* Descrição */}
                <p className="mt-2 text-center text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {current.description}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Dots indicadores de passo */}
            <div className="flex items-center justify-center gap-2 mt-6" aria-hidden>
              {steps.map((_, i) => (
                <span
                  key={i}
                  className={`h-2 w-2 rounded-full transition-colors duration-300 ${
                    i === step
                      ? 'bg-amber-500'
                      : 'bg-zinc-200 dark:bg-zinc-700'
                  }`}
                />
              ))}
            </div>

            {/* Botão primário */}
            <motion.button
              onClick={handleNext}
              className="mt-6 w-full rounded-xl bg-amber-500 py-3 text-sm font-medium text-white transition-colors hover:bg-amber-600 active:bg-amber-600"
              whileTap={{ scale: 0.97 }}
            >
              {isLast ? 'Começar' : 'Próximo'}
            </motion.button>

            {/* Botão "Pular" — só no primeiro passo */}
            {step === 0 && (
              <button
                onClick={handleDone}
                className="mt-3 w-full text-sm text-zinc-400 dark:text-zinc-500 hover:text-zinc-500 transition-colors"
              >
                Pular
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OnboardingOverlay;
