import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface FadeInProps {
  children: ReactNode
  delay?: number
  className?: string
}

export default function FadeIn({
  children,
  delay = 0,
  className
}: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.2,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
