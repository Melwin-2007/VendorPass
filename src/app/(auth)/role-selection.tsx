import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAuth, UserRole } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { SymbolView } from 'expo-symbols';

export default function RoleSelectionScreen() {
  const { selectRole, selectedSignupRole } = useAuth();
  const theme = useTheme();
  const [selected, setSelected] = useState<UserRole | null>(selectedSignupRole);

  const handleContinue = () => {
    if (selected) {
      selectRole(selected);
      router.push('/(auth)/signup');
    }
  };

  const rolesList: {
    id: UserRole;
    title: string;
    description: string;
    icon: string;
    iconColor: string;
    iconBg: string;
    accentColor: string;
  }[] = [
    {
      id: 'VENDOR',
      title: 'Vendor / Merchant',
      description: 'Street vendors, kirana owners, hawkers, micro-merchants',
      icon: 'cart',
      iconColor: '#D4820A',
      iconBg: '#FFF4E6',
      accentColor: '#D4820A',
    },
    {
      id: 'LENDER',
      title: 'Lender / NBFC',
      description: 'Microfinance institutions, individual lenders, credit unions',
      icon: 'building.columns',
      iconColor: '#1A3A4A',
      iconBg: '#E6F0F4',
      accentColor: '#1A3A4A',
    },
    {
      id: 'BANK',
      title: 'Bank / Financial Institution',
      description: 'Scheduled banks, cooperative banks, RRBs',
      icon: 'landmark',
      iconColor: '#2D7D46',
      iconBg: '#EBF7EE',
      accentColor: '#2D7D46',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <SymbolView tintColor={theme.text} name="chevron.left" size={24} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Create Account</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Who are you signing up as?
          </Text>
        </View>

        {/* Roles List */}
        <View style={styles.cardsContainer}>
          {rolesList.map((item) => {
            const isSelected = selected === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setSelected(item.id)}
                style={({ pressed }) => [
                  styles.roleCard,
                  {
                    backgroundColor: theme.card,
                    borderColor: isSelected ? item.accentColor : theme.border,
                    transform: [{ scale: pressed ? 0.98 : 1.0 }],
                  },
                  isSelected && styles.cardSelectedShadow,
                ]}>
                {/* Left Accent Bar */}
                {isSelected ? (
                  <View style={[styles.accentBar, { backgroundColor: item.accentColor }]} />
                ) : null}

                {/* Role Icon */}
                <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>
                  <SymbolView tintColor={item.iconColor} name={item.icon as any} size={28} />
                </View>

                {/* Role Description */}
                <View style={styles.detailsContainer}>
                  <Text style={[styles.roleTitle, { color: theme.text }]}>{item.title}</Text>
                  <Text style={[styles.roleDesc, { color: theme.textSecondary }]}>
                    {item.description}
                  </Text>
                </View>

                {/* Radio Indicator */}
                <View
                  style={[
                    styles.radioOutline,
                    { borderColor: isSelected ? item.accentColor : theme.textMuted },
                  ]}>
                  {isSelected ? (
                    <View style={[styles.radioFill, { backgroundColor: item.accentColor }]} />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Sticky Bottom Continue Button */}
      <View style={[styles.bottomContainer, { backgroundColor: theme.background }]}>
        <Pressable
          style={({ pressed }) => [
            styles.continueButton,
            {
              backgroundColor: selected ? theme.primary : theme.textMuted,
              opacity: selected && pressed ? 0.9 : 1.0,
            },
            selected && styles.buttonShadow,
          ]}
          onPress={handleContinue}
          disabled={!selected}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: 60,
    paddingBottom: 120, // space for button
  },
  header: {
    marginBottom: Spacing.five,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: Spacing.three,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'Playfair Display' : 'serif',
    marginBottom: Spacing.one,
  },
  headerSubtitle: {
    fontSize: 15,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  cardsContainer: {
    gap: Spacing.three,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 20,
    borderWidth: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.three,
  },
  detailsContainer: {
    flex: 1,
    paddingRight: Spacing.two,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
    marginBottom: 4,
  },
  roleDesc: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  radioOutline: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioFill: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  cardSelectedShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
      },
    }),
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  continueButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
});
