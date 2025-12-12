import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import type { PresetProps } from '../../types/animation';

const viewport = { once: true, amount: 0.35 } as const;

export function FadeIn({ delay = 0, children, ...props }: PresetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewport}
      transition={{ duration: 0.45, ease: 'easeOut', delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function SlideUp({ delay = 0, children, ...props }: PresetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewport}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function SlideLeft({ delay = 0, children, ...props }: PresetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -32 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={viewport}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function SlideRight({ delay = 0, children, ...props }: PresetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 32 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={viewport}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function HoverLift({ children, ...props }: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 320, damping: 20 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export const motionPresets = {
  fadeIn: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, ease: 'easeOut' },
  },
  slideUp: {
    initial: { opacity: 0, y: 32 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: 'easeOut' },
  },
  slideLeft: {
    initial: { opacity: 0, x: -32 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.5, ease: 'easeOut' },
  },
  slideRight: {
    initial: { opacity: 0, x: 32 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.5, ease: 'easeOut' },
  },
  hoverLift: {
    whileHover: { y: -4, scale: 1.01 },
    whileTap: { scale: 0.99 },
    transition: { type: 'spring', stiffness: 320, damping: 20 },
  },
};
