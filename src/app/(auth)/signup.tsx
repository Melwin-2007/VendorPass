/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { SymbolView } from 'expo-symbols';

export default function SignUpScreen() {
  const { signUp, signupProgress, loading } = useAuth();
  const theme = useTheme();

  // Form states
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  // Upload states (mocked with string paths)
  const [selfie, setSelfie] = useState<string | null>(null);
  const [businessPhoto, setBusinessPhoto] = useState<string | null>(null);

  // Checkbox
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Username availability check simulator
  useEffect(() => {
    if (!username) {
      setUsernameAvailable(null);
      return;
    }
    setUsernameLoading(true);
    setUsernameAvailable(null);
    const timer = setTimeout(() => {
      setUsernameLoading(false);
      setUsernameAvailable(username.length > 3);
    }, 800);
    return () => clearTimeout(timer);
  }, [username]);

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!password) return { score: 0, label: '', color: theme.textMuted };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[a-zA-Z]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    switch (score) {
      case 1:
        return { score: 1, label: 'Weak', color: theme.error };
      case 2:
        return { score: 2, label: 'Fair', color: '#F5A623' };
      case 3:
        return { score: 3, label: 'Strong', color: '#F8B600' };
      case 4:
        return { score: 4, label: 'Very Strong', color: theme.success };
      default:
        return { score: 0, label: '', color: theme.textMuted };
    }
  };

  const strength = getPasswordStrength();

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) return;
    setOtpLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setOtpLoading(false);
    setOtpSent(true);
  };

  const handleSignUp = async () => {
    if (!fullName || !username || !email || !phone || !password) return;
    if (password !== confirmPassword) return;
    if (!agreeTerms) return;

    const success = await signUp({
      name: fullName,
      username,
      email,
      phone,
      selfie,
      businessPhoto,
    });

    if (success) {
      router.push('/(auth)/otp');
    }
  };

  const simulateSelfieUpload = () => {
    // Simulated upload
    setSelfie('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80');
  };

  const simulateBusinessUpload = () => {
    // Simulated business shop upload
    setBusinessPhoto('https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500&auto=format&fit=crop&q=80');
  };

  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Sticky Progress Bar */}
      <View style={styles.progressBarBg}>
        <View
          style={[
            styles.progressBarFill,
            { backgroundColor: theme.primary, width: `${signupProgress * 100}%` },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <SymbolView tintColor={theme.text} name="chevron.left" size={24} />
          </Pressable>
          <View style={styles.headerTitleRow}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Create Account</Text>
            <View style={[styles.badge, { backgroundColor: theme.highlight + '20' }]}>
              <Text style={[styles.badgeText, { color: theme.primary }]}>Step 2 of 2</Text>
            </View>
          </View>
        </View>

        {/* Section: Personal Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>PERSONAL DETAILS</Text>

          {/* Full Name */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>FULL NAME</Text>
            <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
              <SymbolView tintColor={theme.textMuted} name="person" size={20} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="As per Aadhaar card"
                placeholderTextColor={theme.textMuted}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
          </View>

          {/* Username */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>USERNAME</Text>
            <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
              <Text style={[styles.usernamePrefix, { color: theme.primary }]}>@</Text>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="yourname"
                placeholderTextColor={theme.textMuted}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
              {usernameLoading && <ActivityIndicator size="small" color={theme.primary} />}
              {!usernameLoading && usernameAvailable === true && (
                <SymbolView tintColor={theme.success} name="checkmark.circle.fill" size={20} />
              )}
              {!usernameLoading && usernameAvailable === false && (
                <SymbolView tintColor={theme.error} name="xmark.circle.fill" size={20} />
              )}
            </View>
          </View>

          {/* Email */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>EMAIL ADDRESS</Text>
            <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
              <SymbolView tintColor={theme.textMuted} name="envelope" size={20} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Enter email address"
                placeholderTextColor={theme.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Mobile Number */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>MOBILE NUMBER</Text>
            <View style={styles.phoneInputRow}>
              <View style={[styles.countryCodeBox, { backgroundColor: theme.secondary }]}>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>
              <View style={[styles.phoneInputWrapper, { borderColor: theme.border }]}>
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="10-digit number"
                  placeholderTextColor={theme.textMuted}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
                <Pressable
                  style={[styles.otpSendButton, { backgroundColor: theme.highlight }]}
                  onPress={handleSendOtp}
                  disabled={otpLoading || phone.length < 10}>
                  {otpLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.otpSendButtonText}>{otpSent ? 'Sent ✓' : 'Send OTP'}</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>PASSWORD</Text>
            <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
              <SymbolView tintColor={theme.textMuted} name="lock" size={20} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Create secure password"
                placeholderTextColor={theme.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
              />
            </View>
            {/* Strength meter */}
            {password ? (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBarsRow}>
                  {[1, 2, 3, 4].map((index) => (
                    <View
                      key={index}
                      style={[
                        styles.strengthBar,
                        {
                          backgroundColor:
                            index <= strength.score ? strength.color : theme.border,
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthLabel, { color: strength.color }]}>
                  {strength.label}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Confirm Password */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>CONFIRM PASSWORD</Text>
            <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
              <SymbolView tintColor={theme.textMuted} name="lock" size={20} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Re-enter password"
                placeholderTextColor={theme.textMuted}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
              />
              {passwordsMatch && (
                <SymbolView tintColor={theme.success} name="checkmark.circle.fill" size={20} />
              )}
            </View>
          </View>
        </View>

        {/* Section: Upload Documents */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>UPLOAD DOCUMENTS</Text>

          {/* Profile Selfie Upload */}
          <View style={styles.selfieUploadSection}>
            <Pressable
              onPress={simulateSelfieUpload}
              style={({ pressed }) => [
                styles.selfieCircle,
                {
                  borderColor: theme.primary,
                  backgroundColor: theme.card,
                  opacity: pressed ? 0.9 : 1.0,
                },
              ]}>
              {selfie ? (
                <View style={styles.selfieImageContainer}>
                  <Image source={{ uri: selfie }} style={styles.selfieImage} />
                  <View style={[styles.selfieEditBadge, { backgroundColor: theme.primary }]}>
                    <SymbolView tintColor="#fff" name="pencil" size={14} />
                  </View>
                </View>
              ) : (
                <View style={styles.selfiePlaceholder}>
                  <SymbolView tintColor={theme.primary} name="camera" size={32} />
                  <Text style={[styles.selfiePlaceholderText, { color: theme.primary }]}>
                    Add Selfie
                  </Text>
                </View>
              )}
            </Pressable>
            <Text style={[styles.uploadCaption, { color: theme.textSecondary }]}>
              Clear face photo — required for identity verification
            </Text>
          </View>

          {/* Business Photo Upload */}
          <View style={styles.businessUploadSection}>
            <Pressable
              onPress={simulateBusinessUpload}
              style={({ pressed }) => [
                styles.businessCard,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.card,
                  opacity: pressed ? 0.9 : 1.0,
                },
              ]}>
              {businessPhoto ? (
                <View style={styles.businessImageContainer}>
                  <Image source={{ uri: businessPhoto }} style={styles.businessImage} />
                  <View style={styles.businessImageGradientOverlay} />
                  <View style={[styles.businessEditBadge, { backgroundColor: theme.primary }]}>
                    <SymbolView tintColor="#fff" name="pencil" size={16} />
                  </View>
                </View>
              ) : (
                <View style={styles.businessPlaceholder}>
                  <SymbolView tintColor={theme.textMuted} name="storefront" size={40} />
                  <Text style={[styles.businessPlaceholderText, { color: theme.textSecondary }]}>
                    Add Business / Shop Photo
                  </Text>
                </View>
              )}
            </Pressable>
            <Text style={[styles.uploadCaption, { color: theme.textSecondary }]}>
              Photo of your shop/stall — builds lender trust
            </Text>
          </View>
        </View>

        {/* Terms and Privacy Checkbox */}
        <Pressable
          onPress={() => setAgreeTerms(!agreeTerms)}
          style={styles.termsContainer}>
          <View
            style={[
              styles.checkbox,
              {
                borderColor: agreeTerms ? theme.primary : theme.textMuted,
                backgroundColor: agreeTerms ? theme.primary : 'transparent',
              },
            ]}>
            {agreeTerms && <SymbolView tintColor="#fff" name="checkmark" size={14} />}
          </View>
          <Text style={[styles.termsText, { color: theme.text }]}>
            I agree to the <Text style={{ color: theme.primary }}>Terms of Service</Text> and{' '}
            <Text style={{ color: theme.primary }}>Privacy Policy</Text>
          </Text>
        </Pressable>

        {/* Submit Button */}
        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            {
              backgroundColor: agreeTerms ? theme.primary : theme.textMuted,
              opacity: pressed && agreeTerms ? 0.9 : 1.0,
            },
            agreeTerms && styles.submitButtonShadow,
          ]}
          onPress={handleSignUp}
          disabled={loading || !agreeTerms}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Create My Account</Text>
          )}
        </Pressable>

        {/* Sign In link */}
        <View style={styles.signInRow}>
          <Text style={[styles.signInText, { color: theme.textSecondary }]}>
            Already have an account?{' '}
          </Text>
          <Pressable onPress={() => router.push('/(auth)/login')}>
            <Text style={[styles.signInLink, { color: theme.primary }]}>Sign In</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#E8E0D5',
    width: '100%',
  },
  progressBarFill: {
    height: 4,
    borderRadius: 2,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: 40,
    paddingBottom: Spacing.six,
  },
  header: {
    marginBottom: Spacing.four,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: Spacing.two,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'Playfair Display' : 'serif',
  },
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  section: {
    marginBottom: Spacing.five,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: Spacing.three,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  fieldContainer: {
    marginBottom: Spacing.four,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: 'bold',
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
    paddingHorizontal: Spacing.three,
  },
  inputIcon: {
    marginRight: Spacing.two,
  },
  usernamePrefix: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 2,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  phoneInputRow: {
    flexDirection: 'row',
  },
  countryCodeBox: {
    width: 60,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.two,
  },
  countryCodeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  phoneInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
  },
  otpSendButton: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    borderRadius: 8,
  },
  otpSendButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.one,
  },
  strengthBarsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  strengthBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  selfieUploadSection: {
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  selfieCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.two,
    overflow: 'hidden',
  },
  selfiePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  selfiePlaceholderText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  selfieImageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  selfieImage: {
    width: '100%',
    height: '100%',
    borderRadius: 65,
  },
  selfieEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  uploadCaption: {
    fontSize: 12,
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  businessUploadSection: {
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  businessCard: {
    width: '100%',
    height: 150,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.two,
    overflow: 'hidden',
  },
  businessPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  businessPlaceholderText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: Spacing.one,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  businessImageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  businessImage: {
    width: '100%',
    height: '100%',
  },
  businessImageGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  businessEditBadge: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.three,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.two,
  },
  termsText: {
    fontSize: 13,
    flex: 1,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  submitButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  submitButtonShadow: {
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
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.four,
  },
  signInText: {
    fontSize: 14,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  signInLink: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
});
