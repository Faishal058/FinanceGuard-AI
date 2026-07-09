import type { Variants, Transition } from 'framer-motion'

/* ─────────────────────────────────────────────────────────
   EASING CURVES
───────────────────────────────────────────────────────── */
export const ease = {
  out: [0.0, 0.0, 0.2, 1.0] as [number, number, number, number],
  inOut: [0.4, 0.0, 0.2, 1.0] as [number, number, number, number],
  in: [0.4, 0.0, 1.0, 1.0] as [number, number, number, number],
  bounce: [0.175, 0.885, 0.32, 1.275] as [number, number, number, number],
}

/* ─────────────────────────────────────────────────────────
   SPRING CONFIGS
───────────────────────────────────────────────────────── */
export const spring = {
  default: { type: 'spring', stiffness: 300, damping: 25 } as Transition,
  fast: { type: 'spring', stiffness: 500, damping: 35 } as Transition,
  slow: { type: 'spring', stiffness: 150, damping: 20 } as Transition,
  bounce: { type: 'spring', stiffness: 200, damping: 12 } as Transition,
  sidebar: { type: 'spring', stiffness: 350, damping: 30 } as Transition,
}

/* ─────────────────────────────────────────────────────────
   DURATION TOKENS
───────────────────────────────────────────────────────── */
export const duration = {
  instant: 0,
  fast: 0.15,
  base: 0.25,
  slow: 0.4,
  slower: 0.6,
  page: 0.35,
}

/* ─────────────────────────────────────────────────────────
   PAGE TRANSITIONS
───────────────────────────────────────────────────────── */
export const pageVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.page,
      ease: ease.out,
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: duration.fast, ease: ease.in },
  },
}

/* ─────────────────────────────────────────────────────────
   ITEM VARIANTS (used inside stagger containers)
───────────────────────────────────────────────────────── */
export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.slow, ease: ease.out },
  },
}

export const itemVariantsFast: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.base, ease: ease.out },
  },
}

/* ─────────────────────────────────────────────────────────
   CONTAINER WITH STAGGER
───────────────────────────────────────────────────────── */
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.1,
    },
  },
}

export const containerVariantsFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
}

/* ─────────────────────────────────────────────────────────
   FADE VARIANTS
───────────────────────────────────────────────────────── */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: duration.base, ease: ease.out } },
  exit: { opacity: 0, transition: { duration: duration.fast } },
}

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: duration.slow, ease: ease.out } },
  exit: { opacity: 0, y: -10, transition: { duration: duration.fast } },
}

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -16 },
  visible: { opacity: 1, y: 0, transition: { duration: duration.base, ease: ease.out } },
  exit: { opacity: 0, y: -16, transition: { duration: duration.fast } },
}

/* ─────────────────────────────────────────────────────────
   SLIDE VARIANTS
───────────────────────────────────────────────────────── */
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: duration.base, ease: ease.out } },
  exit: { opacity: 0, x: -20, transition: { duration: duration.fast } },
}

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: duration.base, ease: ease.out } },
  exit: { opacity: 0, x: 20, transition: { duration: duration.fast } },
}

export const slideInBottom: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: spring.default },
  exit: { opacity: 0, y: 20, transition: { duration: duration.fast } },
}

/* ─────────────────────────────────────────────────────────
   SCALE VARIANTS
───────────────────────────────────────────────────────── */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: duration.base, ease: ease.out },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: { duration: duration.fast },
  },
}

export const scaleInCenter: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: spring.bounce,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: duration.fast },
  },
}

/* ─────────────────────────────────────────────────────────
   MODAL / OVERLAY
───────────────────────────────────────────────────────── */
export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: duration.base } },
  exit: { opacity: 0, transition: { duration: duration.fast } },
}

export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: spring.fast,
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 4,
    transition: { duration: duration.fast },
  },
}

/* ─────────────────────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────────────────────── */
export const sidebarVariants = {
  expanded: { width: 240 },
  collapsed: { width: 64 },
}

export const sidebarLabelVariants: Variants = {
  expanded: { opacity: 1, width: 'auto', transition: { duration: duration.base, ease: ease.out, delay: 0.05 } },
  collapsed: { opacity: 0, width: 0, transition: { duration: duration.fast, ease: ease.in } },
}

/* ─────────────────────────────────────────────────────────
   NOTIFICATION / TOAST
───────────────────────────────────────────────────────── */
export const notificationVariants: Variants = {
  hidden: { opacity: 0, x: 40, scale: 0.95 },
  visible: { opacity: 1, x: 0, scale: 1, transition: spring.default },
  exit: { opacity: 0, x: 40, scale: 0.95, transition: { duration: duration.fast } },
}

/* ─────────────────────────────────────────────────────────
   CARD HOVER PROPS (use spread in motion.div)
───────────────────────────────────────────────────────── */
export const cardHoverProps = {
  whileHover: { y: -3, transition: spring.fast },
  whileTap: { scale: 0.99 },
}

export const buttonHoverProps = {
  whileHover: { scale: 1.02, transition: spring.fast },
  whileTap: { scale: 0.97 },
}

/* ─────────────────────────────────────────────────────────
   CHART ANIMATIONS
───────────────────────────────────────────────────────── */
export const chartEntryVariants: Variants = {
  hidden: { opacity: 0, scaleY: 0 },
  visible: { opacity: 1, scaleY: 1, transition: { duration: duration.slow, ease: ease.out } },
}

/* ─────────────────────────────────────────────────────────
   THINKING / LOADING
───────────────────────────────────────────────────────── */
export const thinkingDotVariants = (delay: number) => ({
  animate: {
    y: [0, -6, 0],
    opacity: [0.4, 1, 0.4],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      delay,
      ease: ease.inOut,
    },
  },
})

/* ─────────────────────────────────────────────────────────
   SHIMMER (skeleton loading)
───────────────────────────────────────────────────────── */
export const shimmerVariants: Variants = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'linear',
    },
  },
}

/* ─────────────────────────────────────────────────────────
   NUMBER COUNTER (for animated metrics)
───────────────────────────────────────────────────────── */
export const numberCounterTransition: Transition = {
  duration: duration.slower,
  ease: ease.out,
}
