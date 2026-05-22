import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { SymbolView } from '@/components/symbol-view';

export default function OtpScreen() {
  const { completeOtp, loading } = useAuth();
  const theme = useTheme();
  
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(30);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (text: string, index: number) => {
    setError('');
    const newPin = [...pin];
    newPin[index] = text;
    setPin(newPin);

    // Auto-focus next input
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !pin[index] && index > 0) {
      // Auto-focus previous input on backspace
      const newPin = [...pin];
      newPin[index - 1] = '';
      setPin(newPin);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpValue = pin.join('');
    if (otpValue.length < 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    const success = await completeOtp(otpValue);
    if (success) {
      router.replace('/(auth)/success');
    } else {
      setError('Invalid OTP. Use mock code 123456.');
      setPin(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = () => {
    if (timer === 0) {
      setTimer(30);
      setPin(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* Back Button */}
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <SymbolView tintColor={theme.text} name="chevron.left" size={24} />
        </Pressable>

        {/* Title */}
        <Text style={[styles.title, { color: theme.text }]}>Verify Phone</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Enter the 6-digit code sent to your registered mobile number.
        </Text>
        <Text style={[styles.hintText, { color: theme.primary }]}>
          Hint: Use mock code <Text style={{ fontWeight: 'bold' }}>123456</Text>
        </Text>

        {/* PIN Inputs */}
        <View style={styles.otpRow}>
          {pin.map((digit, index) => (
            <View
              key={index}
              style={[
                styles.otpBox,
                {
                  borderColor: digit ? theme.primary : theme.border,
                  backgroundColor: theme.card,
                },
              ]}>
              <TextInput
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={[styles.otpInput, { color: theme.text }]}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                textAlign="center"
                autoFocus={index === 0}
              />
            </View>
          ))}
        </View>

        {error ? (
          <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
        ) : null}

        {/* Resend Timer */}
        <View style={styles.timerRow}>
          {timer > 0 ? (
            <Text style={[styles.timerText, { color: theme.textSecondary }]}>
              Resend code in <Text style={{ color: theme.primary, fontWeight: 'bold' }}>{timer}s</Text>
            </Text>
          ) : (
            <Pressable onPress={handleResend}>
              <Text style={[styles.resendLink, { color: theme.primary }]}>Resend OTP Code</Text>
            </Pressable>
          )}
        </View>

        {/* Verify Button */}
        <Pressable
          style={({ pressed }) => [
            styles.verifyButton,
            {
              backgroundColor: theme.primary,
              opacity: pressed || loading ? 0.9 : 1.0,
            },
            styles.buttonShadow,
          ]}
          onPress={handleVerify}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.verifyButtonText}>Verify & Continue</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: 60,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: Spacing.three,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'Playfair Display' : 'serif',
    marginBottom: Spacing.one,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
    lineHeight: 22,
    marginBottom: Spacing.one,
  },
  hintText: {
    fontSize: 14,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
    marginBottom: Spacing.five,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.four,
    gap: 8,
  },
  otpBox: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpInput: {
    fontSize: 22,
    fontWeight: 'bold',
    width: '100%',
    height: '100%',
    fontFamily: Platform.OS === 'web' ? 'JetBrains Mono' : 'monospace',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: Spacing.three,
  },
  timerRow: {
    alignItems: 'center',
    marginVertical: Spacing.three,
  },
  timerText: {
    fontSize: 14,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  resendLink: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  verifyButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.four,
  },
  buttonShadow: {
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
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
});
