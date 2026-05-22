import React from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { SymbolView } from 'expo-symbols';

export default function ExploreScreen() {
  const theme = useTheme();
  const safeAreaInsets = useSafeAreaInsets();

  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    ios: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.five,
      paddingBottom: Spacing.four,
    },
  });

  const loans = [
    {
      id: '1',
      title: 'Daily Micro-Credit',
      amount: '₹1,000 - ₹5,000',
      rate: '0.1% daily interest',
      tenure: '7 to 30 days',
      provider: 'Bharat MicroFinance NBFC',
      tag: 'RECOMMENDED',
    },
    {
      id: '2',
      title: 'Weekly Kirana Stocking Loan',
      amount: '₹10,000 - ₹25,000',
      rate: '1.2% weekly interest',
      tenure: '1 to 3 months',
      provider: 'Saffron Credit Co-op',
      tag: 'POPULAR',
    },
    {
      id: '3',
      title: 'Vendor Upgrade Capital',
      amount: '₹50,000 - ₹1,00,000',
      rate: '14% flat p.a.',
      tenure: '6 to 12 months',
      provider: 'Janata Union Bank',
      tag: 'BEST RATE',
    },
  ];

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Credit Hub</Text>
        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
          Compare rates and access personalized loans powered by your behavioral TrustScore™.
        </Text>
      </View>

      {/* Credit Offers Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>PERSONALIZED LOANS</Text>
        {loans.map((loan) => (
          <Pressable
            key={loan.id}
            style={({ pressed }) => [
              styles.loanCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                opacity: pressed ? 0.95 : 1.0,
              },
            ]}>
            <View style={styles.loanHeader}>
              <View>
                <Text style={[styles.loanTitle, { color: theme.text }]}>{loan.title}</Text>
                <Text style={[styles.loanProvider, { color: theme.textSecondary }]}>{loan.provider}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: theme.primary + '15' }]}>
                <Text style={[styles.badgeText, { color: theme.primary }]}>{loan.tag}</Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.loanDetailsRow}>
              <View style={styles.detailCol}>
                <Text style={[styles.detailLabel, { color: theme.textMuted }]}>LIMIT AMOUNT</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{loan.amount}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={[styles.detailLabel, { color: theme.textMuted }]}>INTEREST RATE</Text>
                <Text style={[styles.detailValue, { color: theme.success }]}>{loan.rate}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={[styles.detailLabel, { color: theme.textMuted }]}>TENURE</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{loan.tenure}</Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.applyButton,
                { backgroundColor: theme.secondary, opacity: pressed ? 0.9 : 1.0 },
              ]}>
              <Text style={styles.applyButtonText}>Apply Instantly</Text>
              <SymbolView tintColor="#fff" name="chevron.right" size={14} />
            </Pressable>
          </Pressable>
        ))}
      </View>

      {/* Educational Hub */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>FINANCIAL EDUCATION</Text>
        <Pressable
          style={[styles.eduCard, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '20' }]}>
          <SymbolView tintColor={theme.primary} name="graduationcap" size={28} style={styles.eduIcon} />
          <View style={styles.eduDetails}>
            <Text style={[styles.eduTitle, { color: theme.text }]}>How to grow your TrustScore™</Text>
            <Text style={[styles.eduDesc, { color: theme.textSecondary }]}>
              Learn simple transactions, digital ledger tips, and repayment strategies to boost credit limits.
            </Text>
          </View>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.four,
  },
  header: {
    marginVertical: Spacing.four,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'Playfair Display' : 'serif',
    marginBottom: Spacing.one,
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
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
  loanCard: {
    borderWidth: 1.5,
    borderRadius: 20,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  loanTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  loanProvider: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  divider: {
    height: 1.2,
    marginVertical: Spacing.three,
  },
  loanDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.8,
    marginBottom: 4,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'JetBrains Mono' : 'monospace',
  },
  applyButton: {
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.one,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  eduCard: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: Spacing.three,
    alignItems: 'center',
  },
  eduIcon: {
    marginRight: Spacing.three,
  },
  eduDetails: {
    flex: 1,
  },
  eduTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
    marginBottom: 2,
  },
  eduDesc: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
});
