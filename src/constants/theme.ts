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
