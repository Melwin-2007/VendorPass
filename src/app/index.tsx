import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

export default function EntryScreen() {
  const { isAuthenticated, loading } = useAuth();
  const theme = useTheme();
  const [showSpinner, setShowSpinner] = useState(false);

  // Animations
  const logoScale = useSharedValue(0.85);
  const logoOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(20);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    // 1. Animate Logo Fade + Scale
    logoScale.value = withTiming(1.0, { duration: 800, easing: Easing.out(Easing.back(1.2)) });
    logoOpacity.value = withTiming(1, { duration: 800 });

    // 2. Animate Tagline slide up
    textTranslateY.value = withDelay(400, withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) }));
    textOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));

    // Show spinner if routing takes a bit
    const spinnerTimer = setTimeout(() => setShowSpinner(true), 1500);

    // 3. Routing check timer (2.5s delay)
    const routeTimer = setTimeout(() => {
      if (!loading) {
        if (isAuthenticated) {
          router.replace('/(tabs)');
        } else {
          router.replace('/(auth)/login');
        }
      }
    }, 2500);
    return () => {
      clearTimeout(spinnerTimer);
      clearTimeout(routeTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, loading]);

  const animatedLogoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  // Background Gradient Hero Style (Mocked using CSS style or secondary dark color)
  return (
    <View style={[styles.container, { backgroundColor: theme.secondary }]}>
      {/* Background vector network styling */}
      <View style={[styles.mandalaDot, { opacity: 0.1, width: 280, height: 280, borderRadius: 140 }]} />
      <View style={[styles.mandalaDot, { opacity: 0.05, width: 400, height: 400, borderRadius: 200 }]} />

      <View style={styles.centerContainer}>
        {/* Animated Logo */}
        <Animated.View style={[styles.logoContainer, animatedLogoStyle]}>
          <View style={[styles.logoIcon, { backgroundColor: theme.primary }]}>
            <Text style={styles.logoLetter}>V</Text>
          </View>
          <Text style={styles.logoText}>
            Vendor<Text style={{ color: theme.highlight }}>PASS</Text>
          </Text>
        </Animated.View>

        {/* Animated Tagline */}
        <Animated.View style={[styles.taglineContainer, animatedTextStyle]}>
          <Text style={styles.tagline}>AI-Powered Credit for Every Vendor</Text>
          <Text style={styles.taglineSub}>&quot;Your Business. Your Score. Your Future.&quot;</Text>
        </Animated.View>

        {showSpinner ? (
          <ActivityIndicator size="small" color={theme.highlight} style={styles.loader} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  mandalaDot: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#D4820A',
    top: '30%',
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.three,
  },
  logoLetter: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
  },
  logoText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'Playfair Display' : 'serif',
  },
  taglineContainer: {
    alignItems: 'center',
  },
  tagline: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
    marginBottom: Spacing.one,
  },
  taglineSub: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  loader: {
    marginTop: Spacing.five,
  },
});
