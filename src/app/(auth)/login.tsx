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
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { SymbolView } from 'expo-symbols';

export default function LoginScreen() {
  const { signIn, loading } = useAuth();
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
      style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer} bounces={false}>
        {/* Top Hero Section */}
        <View style={[styles.heroSection, { backgroundColor: theme.secondary }]}>
          <View style={styles.logoRow}>
            <View style={[styles.logoIcon, { backgroundColor: theme.primary }]}>
              <Text style={styles.logoLetter}>V</Text>
            </View>
            <Text style={styles.logoText}>
              Vendor<Text style={{ color: theme.highlight }}>PASS</Text>
            </Text>
          </View>
          <Text style={styles.heroTitle}>Welcome Back</Text>
          <Text style={styles.heroSubtitle}>Sign in to your account to continue</Text>
          <View style={[styles.goldBar, { backgroundColor: theme.primary }]} />
        </View>

        {/* Sliding White Card */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          {errorMessage ? (
            <View style={[styles.errorContainer, { backgroundColor: theme.error + '15', borderColor: theme.error }]}>
              <Text style={[styles.errorText, { color: theme.error }]}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Email field */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>EMAIL ADDRESS</Text>
            <View
              style={[
                styles.inputWrapper,
                { borderColor: emailFocused ? theme.primary : theme.border },
                emailFocused && styles.inputFocusedShadow,
              ]}>
              <SymbolView tintColor={theme.textMuted} name="envelope" size={20} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Enter your email"
                placeholderTextColor={theme.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>
          </View>

          {/* Password field */}
          <View style={styles.fieldContainer}>
            <View style={styles.passwordHeader}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>PASSWORD</Text>
              <Pressable onPress={() => {}}>
                <Text style={[styles.forgotPassword, { color: theme.primary }]}>Forgot Password?</Text>
              </Pressable>
            </View>
            <View
              style={[
                styles.inputWrapper,
                { borderColor: passwordFocused ? theme.primary : theme.border },
                passwordFocused && styles.inputFocusedShadow,
              ]}>
              <SymbolView tintColor={theme.textMuted} name="lock" size={20} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Enter password"
                placeholderTextColor={theme.textMuted}
                secureTextEntry={secureText}
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
              <Pressable style={styles.eyeButton} onPress={() => setSecureText(!secureText)}>
                <SymbolView
                  tintColor={theme.primary}
                  name={secureText ? 'eye.slash' : 'eye'}
                  size={20}
                />
              </Pressable>
            </View>
          </View>

          {/* Sign In Button */}
          <Pressable
            style={({ pressed }) => [
              styles.signInButton,
              {
                backgroundColor: theme.primary,
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

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            <Text style={[styles.dividerText, { color: theme.textMuted }]}>or continue with</Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
          </View>

          {/* Google Sign In Button */}
          <Pressable
            style={({ pressed }) => [
              styles.googleButton,
              {
                borderColor: theme.border,
                backgroundColor: theme.card,
                opacity: pressed ? 0.8 : 1.0,
              },
            ]}
            onPress={() => {
              // Mock auth
              signIn('ramesh@kirana.com', 'password').then((success) => {
                if (success) router.replace('/(tabs)');
              });
            }}>
            <SymbolView tintColor="#EA4335" name="g.circle.fill" size={20} style={styles.googleIcon} />
            <Text style={[styles.googleButtonText, { color: theme.text }]}>Continue with Google</Text>
          </Pressable>

          {/* Sign Up Link */}
          <View style={styles.signUpRow}>
            <Text style={[styles.signUpText, { color: theme.textSecondary }]}>Don&apos;t have an account? </Text>
            <Pressable onPress={() => router.push('/(auth)/role-selection')}>
              <Text style={[styles.signUpLink, { color: theme.primary }]}>Sign Up</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
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
  heroSection: {
    paddingTop: 60,
    paddingHorizontal: Spacing.four,
    paddingBottom: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.two,
  },
  logoLetter: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  logoText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'Playfair Display' : 'serif',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'Playfair Display' : 'serif',
    marginBottom: Spacing.one,
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
    marginBottom: Spacing.three,
  },
  goldBar: {
    width: 40,
    height: 3,
    borderRadius: 1.5,
  },
  card: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.five,
  },
  errorContainer: {
    borderWidth: 1,
    padding: Spacing.three,
    borderRadius: 12,
    marginBottom: Spacing.three,
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
    letterSpacing: 1.2,
    marginBottom: Spacing.one,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  forgotPassword: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
  },
  inputFocusedShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#D4820A',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 0 0 3px rgba(212,130,10,0.15)',
      },
    }),
  },
  inputIcon: {
    marginRight: Spacing.two,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  eyeButton: {
    padding: Spacing.one,
  },
  signInButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.two,
    ...Platform.select({
      ios: {
        shadowColor: '#D4820A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 8px 24px rgba(212,130,10,0.35)',
      },
    }),
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  },
  dividerText: {
    marginHorizontal: Spacing.three,
    fontSize: 12,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  googleButton: {
    flexDirection: 'row',
    height: 56,
    borderWidth: 1.5,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  googleIcon: {
    marginRight: Spacing.two,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  signUpText: {
    fontSize: 14,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
});
