import { motion } from 'framer-motion'

interface LittixLogoProps {
  dark?: boolean
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
}

export default function LittixLogo({ dark = true, size = 'md', animated = true }: LittixLogoProps) {
  const sizes = {
    sm: 'text-base tracking-tight font-black',
    md: 'text-xl tracking-tight font-black',
    lg: 'text-3xl tracking-tight font-black',
  }
  const dotSize = { sm: 6, md: 7, lg: 9 }[size]

  return (
    <motion.span
      className={`${sizes[size]} inline-flex items-center gap-0.5`}
      initial={animated ? { opacity: 0, y: -6 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <span className={dark ? 'text-white' : 'text-[#111]'}>Lit</span>
      <motion.span
        className="text-transparent bg-clip-text"
        style={{ backgroundImage: 'linear-gradient(120deg, #A855F7, #D946EF, #A855F7)', backgroundSize: '200% 100%' }}
        animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
      >
        tix
      </motion.span>
      <span className="relative ml-1 inline-block" style={{ width: dotSize, height: dotSize, marginBottom: '2px' }}>
        <motion.span
          className="absolute inset-0 rounded-full bg-[#A855F7]"
          animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <span className="absolute inset-0 rounded-full bg-[#A855F7]" />
      </span>
    </motion.span>
  )
}
