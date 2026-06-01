/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

// @ts-ignore
import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1C1C1E',
    background: '#F9F5EF',
    backgroundElement: '#F1EDE7',
    backgroundSelected: '#E8E0D5',
    textSecondary: '#6B6B6B',
    primary: '#D4820A',
    secondary: '#1A3A4A',
    highlight: '#F5A623',
    card: '#FFFFFF',
    textMuted: '#A0A0A0',
    success: '#2D7D46',
    error: '#C0392B',
    border: '#E8E0D5',
    
    // MD3 spec equivalents
    colorPrimary: '#D4820A',
    colorOnPrimary: '#FFFFFF',
    colorSecondary: '#1A3A4A',
    colorOnSecondary: '#FFFFFF',
    colorSurface: '#FFFFFF',
    colorOnSurface: '#1C1C1E',
    colorBackground: '#F9F5EF',
    colorOnBackground: '#1C1C1E',
    colorError: '#C0392B',
    colorOnError: '#FFFFFF',
    colorOutline: '#E8E0D5',
  },
  dark: {
    text: '#F4F0EA',
    background: '#1C1B19',
    backgroundElement: '#2D2B28',
    backgroundSelected: '#3F3C38',
    textSecondary: '#A0A0A0',
    primary: '#F5A623',
    secondary: '#abcbdf',
    highlight: '#FFB86B',
    card: '#272522',
    textMuted: '#707070',
    success: '#4CAF50',
    error: '#F44336',
    border: '#3F3C38',
    
    // MD3 spec equivalents
    colorPrimary: '#F5A623',
    colorOnPrimary: '#1C1B19',
    colorSecondary: '#abcbdf',
    colorOnSecondary: '#1C1B19',
    colorSurface: '#272522',
    colorOnSurface: '#F4F0EA',
    colorBackground: '#1C1B19',
    colorOnBackground: '#F4F0EA',
    colorError: '#F44336',
    colorOnError: '#1C1B19',
    colorOutline: '#3F3C38',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    serif: 'Georgia',
    rounded: 'System',
    mono: 'Courier',
  },
  android: {
    sans: 'sans-serif',
    serif: 'serif',
    rounded: 'sans-serif-light',
    mono: 'monospace',
  },
  default: {
    sans: 'sans-serif',
    serif: 'serif',
    rounded: 'sans-serif',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

// Material Design 3 Typography scale definitions
export const Typography = {
  displayLarge: {
    fontFamily: Fonts?.sans,
    fontSize: 57,
    fontWeight: '400' as const,
    lineHeight: 64,
    letterSpacing: -0.25,
  },
  displayMedium: {
    fontFamily: Fonts?.sans,
    fontSize: 45,
    fontWeight: '400' as const,
    lineHeight: 52,
    letterSpacing: 0,
  },
  displaySmall: {
    fontFamily: Fonts?.sans,
    fontSize: 36,
    fontWeight: '400' as const,
    lineHeight: 44,
    letterSpacing: 0,
  },
  headlineLarge: {
    fontFamily: Fonts?.sans,
    fontSize: 32,
    fontWeight: '400' as const,
    lineHeight: 40,
    letterSpacing: 0,
  },
  headlineMedium: {
    fontFamily: Fonts?.sans,
    fontSize: 28,
    fontWeight: '400' as const,
    lineHeight: 36,
    letterSpacing: 0,
  },
  headlineSmall: {
    fontFamily: Fonts?.sans,
    fontSize: 24,
    fontWeight: '400' as const,
    lineHeight: 32,
    letterSpacing: 0,
  },
  titleLarge: {
    fontFamily: Fonts?.sans,
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28,
    letterSpacing: 0,
  },
  titleMedium: {
    fontFamily: Fonts?.sans,
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: 0.15,
  },
  titleSmall: {
    fontFamily: Fonts?.sans,
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  bodyLarge: {
    fontFamily: Fonts?.sans,
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    letterSpacing: 0.5,
  },
  bodyMedium: {
    fontFamily: Fonts?.sans,
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontFamily: Fonts?.sans,
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    letterSpacing: 0.4,
  },
  labelLarge: {
    fontFamily: Fonts?.sans,
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontFamily: Fonts?.sans,
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontFamily: Fonts?.sans,
    fontSize: 11,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
} as const;
