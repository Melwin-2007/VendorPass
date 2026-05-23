import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import { useColorScheme, Platform } from 'react-native';

import { AuthProvider } from '@/context/auth';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        {Platform.OS === 'web' && (
          <style dangerouslySetInnerHTML={{ __html: `
            @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Sora:wght@100..800&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap');
            input, textarea, select {
              outline: none !important;
              box-shadow: none !important;
            }
          `}} />
        )}
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="wallet" options={{ animation: 'slide_from_bottom' }} />
        </Stack>
      </AuthProvider>
    </ThemeProvider>
  );
}
