import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen() {
  const { signIn, signUp, loading, selectRole } = useAuth();
  const theme = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      setErrorMessage('Please fill in all fields.');
      return;
    }
    setErrorMessage('');
    const success = await signIn(email, password);
    if (success) {
      router.replace('/(tabs)');
    } else {
      setErrorMessage('Invalid credentials. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: '#F9F5EF' }]}>
      
      {Platform.OS === 'web' && (
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&family=Playfair+Display:wght@700;900&family=Sora:wght@600;700&family=JetBrains+Mono:wght@600&display=swap');
        `}} />
      )}

      <ScrollView contentContainerStyle={styles.scrollContainer} bounces={false}>
        {/* Top Hero Section (Height ~350px) with Curve */}
        <View style={styles.heroWrapper}>
          <View style={styles.heroBackground}>
            {/* Network Pattern overlay */}
            <View style={styles.patternOverlay} />
            
            {/* Top right and bottom left glow effects */}
            <View style={styles.glowRight} />
            <View style={styles.glowLeft} />

            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>VendorPASS</Text>
              <Text style={styles.heroSubtitle}>Welcome Back</Text>
            </View>
          </View>
        </View>

        {/* Content Card overlapping the hero section */}
        <View style={styles.card}>
          {errorMessage ? (
            <View style={[styles.errorContainer, { borderColor: theme.error }]}>
              <Text style={[styles.errorText, { color: theme.error }]}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Email Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
            <View
              style={[
                styles.inputWrapper,
                { borderColor: emailFocused ? '#D4820A' : '#E8E0D5' },
                emailFocused && styles.inputFocusedShadow,
              ]}>
              <MaterialIcons
                name="mail"
                size={20}
                color={emailFocused ? '#D4820A' : '#A0A0A0'}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="name@company.com"
                placeholderTextColor="#A0A0A0"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>
          </View>

          {/* Password Field */}
          <View style={styles.fieldContainer}>
            <View style={styles.passwordHeader}>
              <Text style={styles.fieldLabel}>PASSWORD</Text>
              <Pressable onPress={() => {}}>
                <Text style={styles.forgotPassword}>Forgot Password?</Text>
              </Pressable>
            </View>
            <View
              style={[
                styles.inputWrapper,
                { borderColor: passwordFocused ? '#D4820A' : '#E8E0D5' },
                passwordFocused && styles.inputFocusedShadow,
              ]}>
              <MaterialIcons
                name="lock"
                size={20}
                color={passwordFocused ? '#D4820A' : '#A0A0A0'}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#A0A0A0"
                secureTextEntry={secureText}
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => passwordFocused && setPasswordFocused(false)}
              />
              <Pressable style={styles.eyeButton} onPress={() => setSecureText(!secureText)}>
                <MaterialIcons
                  name={secureText ? 'visibility' : 'visibility-off'}
                  size={20}
                  color="#A0A0A0"
                />
              </Pressable>
            </View>
          </View>

          {/* Sign In Button */}
          <Pressable
            style={({ pressed }) => [
              styles.signInButton,
              {
                opacity: pressed || loading ? 0.9 : 1.0,
                transform: [{ scale: pressed ? 0.98 : 1.0 }],
              },
            ]}
            onPress={handleSignIn}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.signInButtonText}>Sign In</Text>
            )}
          </Pressable>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign In Button */}
          <Pressable
            style={({ pressed }) => [
              styles.googleButton,
              {
                opacity: pressed ? 0.95 : 1.0,
                transform: [{ scale: pressed ? 0.98 : 1.0 }],
              },
            ]}
            onPress={async () => {
              const email = 'raju.vendor@vendorpass.ai';
              const password = 'Password123!';
              
              const success = await signIn(email, password);
              if (success) {
                router.replace('/(tabs)');
              } else {
                selectRole?.('VENDOR');
                const signupSuccess = await signUp({
                  name: 'Raju Kirana Store',
                  username: 'raju_kirana',
                  email,
                  phone: '9876543210',
                  selfie: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBp-aRKkGDKeuwqhPEmq7g1UC6fAJe7VnCjIBkl8xQ_owajzWgfUPWgUMJOIyoiN0LKTUspoZaFUGMsePMDyMvyc8wOY0Ht8h_r-OZXBP_HQCuvHb2y_yMdS0aE_gbQkkTv3Lfk4ygKkKjRhjN_MvU6GCEuVhiMMajr7ZRd8kQ8WKCxD3dRBu_V3DmsoDaRhR4lC0m7DzQz96jcsebEXvsWN9aBxHGSMpo1wqkYa05F8THygZ30zTg55ArV1Ig9JnHR1x12es4h9pO8',
                  businessPhoto: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=600',
                }, password);
                
                if (signupSuccess) {
                  await signIn(email, password);
                  router.replace('/(tabs)');
                }
              }
            }}>
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBAtjl6tQHt_LLCf3Jcoforjqd0tnFGf4OXKOh7VYK9xerWtsjv3A8vo37w67W96Y5_H0zmaW9YdFK1Chpq6jA64q_lWBLbMhrqvz7uWd2qN2hw8kyF_IiMXbz-9qZJF2rftwrvztwDcp-XOdBhZ8jw33haXA3cHPbgoCnc3Kz5UiTwFpw7XWCGVw0-1uJxyZogRDIBCj27masHXIgu9gY9b2Y_9c7M17CFofpdN5nKyHas0NSoAbgbHQUqQnSJv0IJBpW6LJfMQDSN' }}
              style={styles.googleIcon}
            />
            <Text style={styles.googleButtonText}>Google Sign In</Text>
          </Pressable>

          {/* Footer Link */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>{"Don't have an account? "}</Text>
            <Pressable onPress={() => router.push('/(auth)/role-selection')}>
              <Text style={styles.footerLink}>Join VendorPASS</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Ambient Visual Elements (top right grid dots) */}
      <View style={styles.ambientDots}>
        <View style={styles.dotRow}>
          <View style={styles.dot} />
          <View style={[styles.dot, { opacity: 0.4 }]} />
          <View style={[styles.dot, { opacity: 0.2 }]} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  heroWrapper: {
    width: '100%',
    height: 353,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F9F5EF',
  },
  heroBackground: {
    width: '140%',
    height: 353,
    left: '-20%',
    borderBottomLeftRadius: 320,
    borderBottomRightRadius: 320,
    backgroundColor: '#1A3A4A',
    position: 'absolute',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  patternOverlay: {
    ...StyleSheet.absoluteFill,
    opacity: 0.1,
    backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1px, transparent 0)',
    backgroundSize: '40px 40px',
    ...Platform.select({
      native: {
        // Native fallback pattern if any
      },
    }),
  },
  glowRight: {
    position: 'absolute',
    top: -96,
    right: -96,
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: '#895100',
    opacity: 0.2,
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
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: '#446274',
    opacity: 0.2,
    ...Platform.select({
      web: {
        filter: 'blur(100px)',
      },
    }),
  },
  heroContent: {
    width: '71.4%', // 100% of screen width (since parent is 140% wide, 1/1.4 = 71.4%)
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'web' ? 'Playfair Display' : 'serif',
    marginBottom: Spacing.one,
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 22,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'Playfair Display' : 'serif',
    maxWidth: 280,
    textAlign: 'center',
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -48,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.six,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  errorContainer: {
    borderWidth: 1.5,
    backgroundColor: 'rgba(192, 57, 43, 0.08)',
    padding: Spacing.three,
    borderRadius: 12,
    marginBottom: Spacing.four,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  fieldContainer: {
    marginBottom: Spacing.four,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#6B6B6B',
    letterSpacing: 1.2,
    marginBottom: Spacing.one,
    marginLeft: 4,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  forgotPassword: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#895100',
    letterSpacing: 1.2,
    marginBottom: Spacing.one,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderWidth: 1.5,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    paddingHorizontal: Spacing.three,
  },
  inputFocusedShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#D4820A',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 0 0 4px rgba(212,130,10,0.1)',
      },
    }),
  },
  inputIcon: {
    marginRight: Spacing.two,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1C1C1E',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  eyeButton: {
    padding: Spacing.one,
  },
  signInButton: {
    height: 56,
    backgroundColor: '#D4820A',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.two,
    shadowColor: '#D4820A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 4,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.five,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8E0D5',
  },
  dividerText: {
    marginHorizontal: Spacing.three,
    fontSize: 11,
    fontWeight: 'bold',
    color: '#6B6B6B',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  googleButton: {
    flexDirection: 'row',
    height: 56,
    borderWidth: 1.5,
    borderColor: '#E8E0D5',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: Spacing.two,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.four,
  },
  footerText: {
    fontSize: 14,
    color: '#6B6B6B',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#895100',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
    textDecorationLine: 'underline',
  },
  ambientDots: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: Spacing.five,
    opacity: 0.2,
    zIndex: 20,
    pointerEvents: 'none',
  },
  dotRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#895100',
  },
});
