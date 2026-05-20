export const colors = {
  surface: '#131313',
  surfaceContainerLowest: '#0e0e0e',
  surfaceContainerLow: '#1c1b1b',
  surfaceContainer: '#201f1f',
  surfaceContainerHigh: '#2a2a2a',
  surfaceVariant: '#353534',
  primaryContainer: '#ff9156',
  primary: '#ffba98',
  onPrimary: '#552000',
  secondaryContainer: '#474746',
  onSecondaryContainer: '#dcc1b5',
  onSurface: '#e5e2e1',
  onSurfaceVariant: '#dcc1b5',
  outlineVariant: '#56433a',
  outline: '#a48c81',
  error: '#ffb4ab',
  errorContainer: '#93000a',
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
}

export const gradientColors: [string, string] = ['#ff9156', '#fc7c31']

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
}

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
}

export const typography = {
  displayBold: {
    fontSize: 36,
    fontWeight: '900' as const,
    letterSpacing: -1.5,
    color: colors.onSurface,
  },
  headlineBold: {
    fontSize: 28,
    fontWeight: '800' as const,
    letterSpacing: -1,
    color: colors.onSurface,
  },
  headlineMd: {
    fontSize: 22,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
    color: colors.onSurface,
  },
  titleBold: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.onSurface,
  },
  bodyBase: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: colors.onSurface,
    lineHeight: 22,
  },
  bodyMd: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: colors.onSurfaceVariant,
    lineHeight: 20,
  },
  label: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
    color: colors.onSurfaceVariant,
  },
  labelSm: {
    fontSize: 9,
    fontWeight: '700' as const,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
    color: colors.onSurfaceVariant,
  },
}

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 20,
  },
}
