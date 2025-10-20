export const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 12 },
}

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
  exit: { opacity: 0 },
}

export const pop = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
}

export const spring = {
  type: 'spring',
  stiffness: 220,
  damping: 24,
  mass: 0.6,
}

