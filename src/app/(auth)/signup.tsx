import React, { useState } from 'react';
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
  KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/auth';
import { SymbolView } from '@/components/symbol-view';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';

export default function SignUpScreen() {
  const { signUp, loading, selectedSignupRole } = useAuth();

  // Form states
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secureText, setSecureText] = useState(true);

  // Focus states
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Upload states
  const [selfie, setSelfie] = useState<string | null>(null);
  const [selfieLoading, setSelfieLoading] = useState(false);
  const [businessPhoto, setBusinessPhoto] = useState<string | null>(null);
  const [businessLoading, setBusinessLoading] = useState(false);

  // Checkbox
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!password) return { score: 0, label: '', color: '#A0A0A0' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[a-zA-Z]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    switch (score) {
      case 1:
        return { score: 1, label: 'Weak security profile', color: '#C0392B' };
      case 2:
        return { score: 2, label: 'Fair security profile', color: '#F5A623' };
      case 3:
      case 4:
        return { score: 3, label: 'Strong security profile', color: '#2D7D46' };
      default:
        return { score: 0, label: '', color: '#A0A0A0' };
    }
  };

  const strength = getPasswordStrength();

  const uploadImage = async (uri: string, path: string, mimeType: string): Promise<string> => {
    // Convert file URI to blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Determine extension from mimeType (e.g. image/png -> png)
    const extParts = mimeType.split('/');
    const fileExt = extParts.length > 1 ? extParts[1].toLowerCase() : 'jpg';
    const cleanExt = fileExt === 'jpeg' ? 'jpg' : fileExt;

    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${cleanExt}`;
    const filePath = `${path}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filePath, blob, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      throw error;
    }

    // Retrieve public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const handlePickSelfie = async () => {
    if (selfieLoading) return;
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to select your selfie!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelfieLoading(true);
        const asset = result.assets[0];
        const mimeType = asset.mimeType || 'image/jpeg';
        const publicUrl = await uploadImage(asset.uri, 'selfies', mimeType);
        setSelfie(publicUrl);
      }
    } catch (err: any) {
      if (err.message?.includes('Bucket not found')) {
        alert('Upload failed: "documents" bucket not found.\n\nPlease execute the SQL commands from supabase_setup.sql in your Supabase SQL Editor to create the bucket and configure RLS policies!');
      } else {
        alert('Selfie upload failed: ' + err.message);
      }
    } finally {
      setSelfieLoading(false);
    }
  };

  const handlePickBusiness = async () => {
    if (businessLoading) return;
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to select your storefront photo!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setBusinessLoading(true);
        const asset = result.assets[0];
        const mimeType = asset.mimeType || 'image/jpeg';
        const publicUrl = await uploadImage(asset.uri, 'business_photos', mimeType);
        setBusinessPhoto(publicUrl);
      }
    } catch (err: any) {
      if (err.message?.includes('Bucket not found')) {
        alert('Upload failed: "documents" bucket not found.\n\nPlease execute the SQL commands from supabase_setup.sql in your Supabase SQL Editor to create the bucket and configure RLS policies!');
      } else {
        alert('Storefront photo upload failed: ' + err.message);
      }
    } finally {
      setBusinessLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!fullName || !username || !email || !phone || !password || !confirmPassword) return;
    if (password !== confirmPassword) return;
    if (!agreeTerms) return;

    const success = await signUp({
      name: fullName,
      username,
      email,
      phone,
      selfie,
      businessPhoto,
    }, password);

    if (success) {
      router.replace('/(auth)/verify-email');
    }
  };

  const isFormValid = 
    !!fullName && 
    !!username && 
    !!email && 
    !!phone && 
    !!password && 
    !!confirmPassword && 
    password === confirmPassword && 
    agreeTerms && 
    !selfieLoading && 
    !businessLoading && 
    !!selfie && 
    (selectedSignupRole !== 'VENDOR' || !!businessPhoto);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {Platform.OS === 'web' && (
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400&family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Sora:wght@400;600;700;800&family=JetBrains+Mono:wght@600&display=swap');
          
          .progress-header-glass {
            background: rgba(253, 249, 243, 0.9) !important;
            backdrop-filter: blur(8px) !important;
            -webkit-backdrop-filter: blur(8px) !important;
          }
          .shimmer-upload {
            background: linear-gradient(90deg, #fdf9f3 25%, #f1ede7 50%, #fdf9f3 75%);
            background-size: 200% 100%;
            animation: shimmer 2s infinite linear;
          }
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}} />
      )}

      {/* Top Navigation Anchor */}
      <View style={styles.header}>
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            <Pressable 
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(auth)/role-selection');
                }
              }} 
              style={({ pressed }) => [
                styles.backButton,
                { transform: [{ scale: pressed ? 0.95 : 1.0 }] }
              ]}
              aria-label="Go back"
            >
              <SymbolView name="arrow_back" size={24} tintColor="#895100" />
            </Pressable>
            <Text style={styles.headerTitle}>VendorPASS</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerStepText}>STEP 2 OF 2</Text>
          </View>
        </View>
      </View>

      {/* Sticky Progress Indicator for Mobile */}
      <View 
        {...(Platform.OS === 'web' ? { className: 'progress-header-glass' } : {})}
        style={styles.progressHeader}
      >
        <View style={styles.progressRow}>
          <Text style={styles.progressTitle}>ACCOUNT DETAILS</Text>
          <Text style={styles.progressStepText}>STEP 2 / 2</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Text */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Finish your profile</Text>
          <Text style={styles.heroSubtitle}>
            Verify your identity and set up your vendor credentials to start receiving orders.
          </Text>
        </View>

        {/* Form Section: Personal Details */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <SymbolView name="badge" size={22} tintColor="#895100" />
            <Text style={styles.cardTitle}>PERSONAL DETAILS</Text>
          </View>

          <View style={styles.formContainer}>
            {/* Full Name */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>FULL NAME</Text>
              <View 
                style={[
                  styles.inputWrapper,
                  focusedField === 'fullName' && styles.inputWrapperFocused
                ]}
              >
                <SymbolView name="person" size={20} tintColor="#A0A0A0" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="#A0A0A0"
                  value={fullName}
                  onChangeText={setFullName}
                  onFocus={() => setFocusedField('fullName')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* Username */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>VENDOR USERNAME</Text>
              <View 
                style={[
                  styles.inputWrapper,
                  focusedField === 'username' && styles.inputWrapperFocused
                ]}
              >
                <SymbolView name="alternate_email" size={20} tintColor="#A0A0A0" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="unique_vendor_id"
                  placeholderTextColor="#A0A0A0"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
              <View 
                style={[
                  styles.inputWrapper,
                  focusedField === 'email' && styles.inputWrapperFocused
                ]}
              >
                <SymbolView name="mail" size={20} tintColor="#A0A0A0" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="name@company.com"
                  placeholderTextColor="#A0A0A0"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* Mobile Number */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>MOBILE NUMBER</Text>
              <View 
                style={[
                  styles.inputWrapper,
                  { paddingLeft: 0, overflow: 'hidden' },
                  focusedField === 'phone' && styles.inputWrapperFocused
                ]}
              >
                <View style={styles.phonePrefix}>
                  <Text style={styles.phonePrefixText}>+91</Text>
                </View>
                <TextInput
                  style={[styles.input, { paddingHorizontal: 16 }]}
                  placeholder="00000 00000"
                  placeholderTextColor="#A0A0A0"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>SET PASSWORD</Text>
              <View 
                style={[
                  styles.inputWrapper,
                  focusedField === 'password' && styles.inputWrapperFocused
                ]}
              >
                <SymbolView name="lock" size={20} tintColor="#A0A0A0" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#A0A0A0"
                  secureTextEntry={secureText}
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <Pressable onPress={() => setSecureText(!secureText)} style={styles.showButton}>
                  <Text style={styles.showButtonText}>{secureText ? 'SHOW' : 'HIDE'}</Text>
                </Pressable>
              </View>

              {/* Password Strength Meter */}
              {password ? (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBars}>
                    {[1, 2, 3, 4].map((index) => (
                      <View
                        key={index}
                        style={[
                          styles.strengthBar,
                          {
                            backgroundColor:
                              index <= strength.score ? strength.color : '#e6e2dc',
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <View style={styles.strengthTextRow}>
                    <SymbolView name="check_circle" size={14} tintColor={strength.color} />
                    <Text style={[styles.strengthText, { color: strength.color }]}>
                      {' '}{strength.label}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>

            {/* Verify Password */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>VERIFY PASSWORD</Text>
              <View 
                style={[
                  styles.inputWrapper,
                  focusedField === 'confirmPassword' && styles.inputWrapperFocused
                ]}
              >
                <SymbolView name="lock" size={20} tintColor="#A0A0A0" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#A0A0A0"
                  secureTextEntry={secureText}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  autoCapitalize="none"
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              {confirmPassword && password !== confirmPassword ? (
                <Text style={styles.errorText}>Passwords do not match.</Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Form Section: Upload Documents */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <SymbolView name="cloud_upload" size={22} tintColor="#895100" />
            <Text style={styles.cardTitle}>UPLOAD DOCUMENTS</Text>
          </View>

          <View style={styles.uploadContainer}>
            {/* Selfie Upload */}
            <View style={styles.selfieSection}>
              <Pressable
                onPress={handlePickSelfie}
                disabled={selfieLoading}
                {...(Platform.OS === 'web' && !selfie ? { className: 'shimmer-upload' } : {})}
                style={({ pressed }) => [
                  styles.selfieCircle,
                  !selfie && styles.dashedBorder,
                  { opacity: pressed ? 0.95 : 1.0 }
                ]}
              >
                {selfieLoading ? (
                  <ActivityIndicator size="small" color="#895100" />
                ) : selfie ? (
                  <View style={styles.uploadedContainer}>
                    <Image source={{ uri: selfie }} style={styles.uploadedImageCircle} />
                    <View style={styles.editBadge}>
                      <SymbolView name="pencil" size={12} tintColor="#ffffff" />
                    </View>
                  </View>
                ) : (
                  <SymbolView name="add_a_photo" size={28} tintColor="#895100" />
                )}
              </Pressable>
              <Text style={styles.uploadLabel}>ADD SELFIE</Text>
            </View>

            {/* Storefront Upload */}
            {selectedSignupRole === 'VENDOR' && (
              <View style={styles.storefrontSection}>
                <Text style={styles.storefrontLabel}>BUSINESS STOREFRONT PHOTO</Text>
                <Pressable
                  onPress={handlePickBusiness}
                  disabled={businessLoading}
                  {...(Platform.OS === 'web' && !businessPhoto ? { className: 'shimmer-upload' } : {})}
                  style={({ pressed }) => [
                    styles.storefrontBox,
                    !businessPhoto && styles.dashedBorder,
                    { opacity: pressed ? 0.95 : 1.0 }
                  ]}
                >
                  {businessLoading ? (
                    <ActivityIndicator size="large" color="#895100" />
                  ) : businessPhoto ? (
                    <View style={styles.uploadedContainer}>
                      <Image source={{ uri: businessPhoto }} style={styles.uploadedImageRect} />
                      <View style={styles.editBadgeRect}>
                        <SymbolView name="pencil" size={14} tintColor="#ffffff" />
                      </View>
                    </View>
                  ) : (
                    <View style={styles.storefrontPlaceholder}>
                      <SymbolView name="storefront" size={32} tintColor="#895100" />
                      <Text style={styles.storefrontPlaceholderText}>Click to upload photo</Text>
                      <Text style={styles.storefrontPlaceholderSubtext}>JPG or PNG, max 5MB</Text>
                    </View>
                  )}
                </Pressable>
              </View>
            )}
          </View>
        </View>

        {/* Terms & Conditions */}
        <Pressable 
          onPress={() => setAgreeTerms(!agreeTerms)}
          style={styles.termsRow}
        >
          <View 
            style={[
              styles.checkbox,
              {
                borderColor: agreeTerms ? '#895100' : '#E8E0D5',
                backgroundColor: agreeTerms ? '#895100' : '#ffffff',
              }
            ]}
          >
            {agreeTerms ? <SymbolView name="checkmark" size={12} tintColor="#ffffff" /> : null}
          </View>
          <Text style={styles.termsText}>
            I agree to the <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text> of VendorPASS.
          </Text>
        </Pressable>

        {/* Create Account Button */}
        <View style={styles.submitSection}>
          <Pressable
            disabled={loading || !isFormValid}
            onPress={handleSignUp}
            style={({ pressed }) => [
              styles.submitBtn,
              (!isFormValid || loading) && styles.submitBtnDisabled,
              { transform: [{ scale: pressed && isFormValid && !loading ? 0.98 : 1.0 }] }
            ]}
          >
            <LinearGradient
              colors={isFormValid ? ['#d4820a', '#D4820A'] : ['#E8E0D5', '#E8E0D5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientButton}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Text style={[styles.submitText, !isFormValid && { color: '#A0A0A0' }]}>CREATE MY ACCOUNT</Text>
                  <SymbolView name="rocket_launch" size={20} tintColor={isFormValid ? '#ffffff' : '#A0A0A0'} />
                </>
              )}
            </LinearGradient>
          </Pressable>
          <Text style={styles.securityCaption}>
            Your data is secured using 256-bit bank-grade encryption.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf9f3',
  },
  header: {
    height: 64,
    backgroundColor: '#fdf9f3',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D5',
    zIndex: 50,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    height: '100%',
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    borderRadius: 9999,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#895100',
    fontFamily: Platform.OS === 'web' ? 'Playfair Display' : 'serif',
    letterSpacing: -0.5,
  },
  headerRight: {
    ...Platform.select({
      web: { display: 'flex' },
      default: { display: 'none' },
    }),
  },
  headerStepText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#534435',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
    letterSpacing: 1.5,
  },
  progressHeader: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D5',
    backgroundColor: 'rgba(253, 249, 243, 0.9)',
    zIndex: 40,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      },
      default: {
        // Show on mobile, hide on web md screen in mockup. We show it here by default.
      },
    }),
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#895100',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
    letterSpacing: 1.2,
  },
  progressStepText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#534435',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
    letterSpacing: 1.2,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: '#e6e2dc',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '100%',
    backgroundColor: '#895100',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingTop: 32,
    paddingBottom: 48,
    paddingHorizontal: 24,
    maxWidth: 624, // max-w-xl (576px) + padding spacing
    width: '100%',
    alignSelf: 'center',
  },
  heroSection: {
    marginBottom: 32,
    gap: 8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1c1c18',
    fontFamily: Platform.OS === 'web' ? 'Playfair Display' : 'serif',
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#534435',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D5',
    paddingBottom: 16,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#895100',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
    letterSpacing: 1.5,
  },
  formContainer: {
    gap: 16,
  },
  fieldContainer: {
    width: '100%',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#534435',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderWidth: 1.5,
    borderColor: '#E8E0D5',
    borderRadius: 8,
    backgroundColor: '#fdf9f3',
    paddingHorizontal: 16,
  },
  inputWrapperFocused: {
    borderColor: '#d4820a',
    ...Platform.select({
      web: {
        boxShadow: '0 0 8px rgba(212,130,10,0.2)',
      },
    }),
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1c1c18',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
    height: '100%',
  },
  phonePrefix: {
    height: '100%',
    backgroundColor: '#c7e7fc',
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E8E0D5',
  },
  phonePrefixText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4a687a',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  showButton: {
    paddingHorizontal: 12,
  },
  showButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#895100',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  strengthContainer: {
    marginTop: 12,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  strengthText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  errorText: {
    fontSize: 12,
    color: '#C0392B',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
    marginTop: 6,
    marginLeft: 4,
  },
  uploadContainer: {
    alignItems: 'center',
    gap: 32,
    paddingVertical: 16,
  },
  selfieSection: {
    alignItems: 'center',
    gap: 12,
  },
  selfieCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fdf9f3',
  },
  dashedBorder: {
    borderWidth: 2,
    borderColor: '#d4820a',
    borderStyle: 'dashed',
  },
  uploadedContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  uploadedImageCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 64,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#895100',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  uploadLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1c1c18',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
    letterSpacing: 1.2,
  },
  storefrontSection: {
    width: '100%',
    gap: 12,
  },
  storefrontLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#534435',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
    letterSpacing: 1.2,
  },
  storefrontBox: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fdf9f3',
    overflow: 'hidden',
  },
  uploadedImageRect: {
    width: '100%',
    height: '100%',
  },
  editBadgeRect: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#895100',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  storefrontPlaceholder: {
    alignItems: 'center',
    gap: 8,
  },
  storefrontPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#895100',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  storefrontPlaceholderSubtext: {
    fontSize: 12,
    color: '#A0A0A0',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  termsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 8,
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  termsText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1c1c18',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
    flex: 1,
  },
  termsLink: {
    color: '#895100',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  submitSection: {
    paddingVertical: 16,
    gap: 16,
  },
  submitBtn: {
    width: '100%',
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(212,130,10,0.35)',
      },
      ios: {
        shadowColor: '#D4820A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  submitBtnDisabled: {
    ...Platform.select({
      web: { boxShadow: 'none' },
      ios: { shadowOpacity: 0 },
      android: { elevation: 0 },
    }),
  },
  gradientButton: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
    letterSpacing: 1.2,
  },
  securityCaption: {
    fontSize: 12,
    color: '#A0A0A0',
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
});
