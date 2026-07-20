import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  variant?: 'forward' | 'back' | 'modal' | 'fade'
}

const variants = {
  forward: {
    initial: { opacity: 0, x: 24, scale: 0.99 },
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: -16, scale: 0.99 },
  },
  back: {
    initial: { opacity: 0, x: -24, scale: 0.99 },
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: 16, scale: 0.99 },
  },
  modal: {
    initial: { opacity: 0, y: 32, scale: 0.97 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -12, scale: 0.99 },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
}

export default function PageTransition({ children, variant = 'forward' }: Props) {
  const v = variants[variant]
  return (
    <motion.div
      initial={v.initial}
      animate={v.animate}
      exit={v.exit}
      transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
      className="w-full min-h-screen"
    >
      {children}
    </motion.div>
  )
}
