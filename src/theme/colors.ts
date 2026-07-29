// Feature: NdoloStitch — Savanna Bloom palette tokens
export const colors = {
  primary: '#558B2F',
  primaryLight: '#7CB342',
  primaryDark: '#33691E',
  accent: '#F9A825',
  accentLight: '#FDD835',
  background: '#FAFAF5',
  surface: '#FFFFFF',
  textPrimary: '#1B1B1B',
  textSecondary: '#5D4037',
  border: '#E8F5E9',
  error: '#C62828',
  success: '#2E7D32',
  warning: '#F57F17',
  muted: '#F1F8E9',
} as const;

export type ColorKey = keyof typeof colors;
