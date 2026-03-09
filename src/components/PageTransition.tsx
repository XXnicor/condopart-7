import { motion } from 'framer-motion'
import { ReactNode } from 'react'

const variants = {
  forward: {
    initial:  { opacity: 0, x: 24, scale: 0.99 },
    animate:  { opacity: 1, x: 0,  scale: 1    },
    exit:     { opacity: 0, x: -24, scale: 0.99 }
  },
  back: {
    initial:  { opacity: 0, x: -24, scale: 0.99 },
    animate:  { opacity: 1, x: 0,   scale: 1    },
    exit:     { opacity: 0, x: 24,  scale: 0.99 }
  },
  tab: {
    initial:  { opacity: 0, y: 8, scale: 0.98 },
    animate:  { opacity: 1, y: 0, scale: 1    },
    exit:     { opacity: 0, y: 8, scale: 0.98 }
  },
  modal: {
    initial:  { opacity: 0, y: 32, scale: 0.97 },
    animate:  { opacity: 1, y: 0,  scale: 1    },
    exit:     { opacity: 0, y: 32, scale: 0.97 }
  }
}

const transition = {
  duration: 0.22,
  ease: [0.25, 0.46, 0.45, 0.94]
}

interface PageTransitionProps {
  children: ReactNode
  type?: keyof typeof variants
  id?: string
}

export default function PageTransition({
  children,
  type = 'forward',
  id
}: PageTransitionProps) {
  return (
    <motion.div
      key={id}
      variants={variants[type]}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={transition}
      className="w-full min-h-screen page-transition"
    >
      {children}
    </motion.div>
  )
}
