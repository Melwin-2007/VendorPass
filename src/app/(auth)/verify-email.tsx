import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, Platform, Image } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { SymbolView } from '@/components/symbol-view';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

export default function VerifyEmailScreen() {
  const theme = useTheme();

  // Animation values
  const iconScale = useSharedValue(0.8);
  const iconOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(20);
  const floatY = useSharedValue(0);

  useEffect(() => {
    // 1. Pop icon
    iconScale.value = withTiming(1.0, { duration: 600, easing: Easing.out(Easing.back(1.5)) });
    iconOpacity.value = withTiming(1, { duration: 600 });

    // 2. Continuous floating animation for the mail icon
    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // 3. Fade/slide text
    textOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
    textTranslateY.value = withDelay(400, withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedIconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [
      { scale: iconScale.value },
      { translateY: floatY.value }
    ],
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  return (
    <View style={[styles.container, { backgroundColor: '#F9F5EF' }]}>
      {Platform.OS === 'web' && (
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Playfair+Display:wght@700;900&family=Sora:wght@600;700&display=swap');
        `}} />
      )}

      {/* Decorative Background Elements */}
      <View style={styles.glowRight} />
      <View style={styles.glowLeft} />

      <View style={styles.content}>
        {/* Animated Mail Icon */}
        <Animated.View style={[styles.iconWrapper, animatedIconStyle]}>
          <LinearGradient
            colors={['#D4820A', '#F5A623']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconCircle}
          >
            <SymbolView tintColor="#fff" name="mark_email_unread" size={48} />
          </LinearGradient>
        </Animated.View>

        {/* Verification Text */}
        <Animated.View style={[styles.textBlock, animatedTextStyle]}>
          <Text style={styles.title}>Check your inbox</Text>
          <Text style={styles.subtitle}>
            We've sent a verification link to your email address. Please click the link to verify your account and activate your VendorPASS profile.
          </Text>
        </Animated.View>

        {/* Info Card */}
        <Animated.View style={[styles.infoCard, animatedTextStyle]}>
          <SymbolView tintColor="#895100" name="info" size={20} style={{ marginRight: 12 }} />
          <Text style={styles.infoText}>
            Can't find the email? Check your spam or promotions folder.
          </Text>
        </Animated.View>
      </View>

      {/* Action Buttons */}
      <View style={styles.bottomContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.ctaButton,
            { opacity: pressed ? 0.9 : 1.0 },
            styles.buttonShadow,
          ]}
          onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.ctaButtonText}>Return to Log In</Text>
        </Pressable>
        
        <Pressable
          style={({ pressed }) => [
            styles.secondaryBtn,
            { opacity: pressed ? 0.7 : 1.0 },
          ]}
          onPress={() => alert('Verification email resent!')}>
          <Text style={styles.secondaryBtnText}>Resend Email</Text>
        </Pressable>
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
  glowRight: {
    position: 'absolute',
    top: -96,
    right: -96,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#895100',
    opacity: 0.15,
    ...Platform.select({
      web: {
        filter: 'blur(100px)',
      },
    }),
  },
  glowLeft: {
    position: 'absolute',
    bottom: -96,
    left: -96,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#446274',
    opacity: 0.1,
    ...Platform.select({
      web: {
        filter: 'blur(100px)',
      },
    }),
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.five,
    width: '100%',
    maxWidth: 480,
    zIndex: 2,
    marginTop: -40, // offset for bottom actions
  },
  iconWrapper: {
    marginBottom: Spacing.six,
    ...Platform.select({
      ios: {
        shadowColor: '#D4820A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 8px 30px rgba(212,130,10,0.3)',
      },
    }),
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textBlock: {
    alignItems: 'center',
    marginBottom: Spacing.six,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1A3A4A',
    fontFamily: Platform.OS === 'web' ? 'Playfair Display' : 'serif',
    marginBottom: Spacing.three,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 24,
    color: '#534435',
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
    paddingHorizontal: Spacing.two,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 130, 10, 0.08)',
    padding: Spacing.four,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 130, 10, 0.2)',
    width: '100%',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: '#895100',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
    fontWeight: '500',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.four,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.six,
    backgroundColor: 'rgba(249, 245, 239, 0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    zIndex: 3,
    alignItems: 'center',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      },
    }),
  },
  ctaButton: {
    width: '100%',
    maxWidth: 480,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A3A4A',
    marginBottom: Spacing.four,
  },
  buttonShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#1A3A4A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 6px 20px rgba(26,58,74,0.25)',
      },
    }),
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  secondaryBtn: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  secondaryBtnText: {
    color: '#895100',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
});
