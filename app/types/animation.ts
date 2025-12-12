import type { HTMLMotionProps } from 'framer-motion';

export interface PresetProps extends HTMLMotionProps<'div'> {
  delay?: number;
}
