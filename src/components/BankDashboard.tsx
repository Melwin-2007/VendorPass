import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Animated,
} from 'react-native';
import { SymbolView } from '@/components/symbol-view';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BottomTabInset } from '@/constants/theme';
import { useAuth } from '@/context/auth';

// Custom font helper to resolve Google Fonts on web and default system fonts on mobile
const FONT_SERIF = Platform.select({ web: 'Playfair Display', default: 'serif' });
const FONT_SANS_DISPLAY = Platform.select({ web: 'Sora', default: 'sans-serif' });
const FONT_SANS_BODY = Platform.select({ web: 'DM Sans', default: 'sans-serif' });
const FONT_MONO = Platform.select({ web: 'JetBrains Mono', default: 'monospace' });

// Mock Data
const MOCK_BANK_USER = {
  name: "Axis Institutional Desk",
  verified: true,
  avatarInitials: "AX",
};

const MOCK_METRICS = {
  totalCapitalSyndicated: 48500000,
  activeTranches: 4,
  avgPortfolioScore: 731,
  yieldRate: 14.2,
};

const MOCK_TRANCHES = [
  { id: "1", label: "Tranche A — Elite", scoreRange: "770–850", vendorCount: 1240, totalCapitalRequired: 18500000, avgScore: 812, color: "#D4820A" },
  { id: "2", label: "Tranche B — Prime", scoreRange: "700–769", vendorCount: 3870, totalCapitalRequired: 24200000, avgScore: 734, color: "#446274" },
  { id: "3", label: "Tranche C — Standard", scoreRange: "600–699", vendorCount: 6120, totalCapitalRequired: 31800000, avgScore: 651, color: "#1A3A4A" },
  { id: "4", label: "Tranche D — Emerging", scoreRange: "500–599", vendorCount: 4450, totalCapitalRequired: 19400000, avgScore: 548, color: "#7A9BAD" },
];

const MOCK_ACTIVE_SYNDICATIONS = [
  { id: "1", trancheLabel: "Tranche A — Elite", amountDeployed: 15000000, status: "ACTIVE", maturityDate: "Dec 2025", yieldEarned: 1065000 },
  { id: "2", trancheLabel: "Tranche B — Prime", amountDeployed: 22000000, status: "ACTIVE", maturityDate: "Mar 2026", yieldEarned: 1562000 },
  { id: "3", trancheLabel: "Tranche C — Standard", amountDeployed: 11500000, status: "SETTLED", maturityDate: "Aug 2024", yieldEarned: 3283000 },
];

// Formatting Helpers
const formatCrore = (amount: number): string => {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
  return `₹${amount.toLocaleString('en-IN')}`;
};

const formatIndian = (num: number): string => num.toLocaleString('en-IN');

export function BankDashboard() {
  const { signOut } = useAuth();

  // Animation state values
  const countAnim = useRef(new Animated.Value(0)).current;
  const trancheEntrances = useMemo(() => MOCK_TRANCHES.map(() => new Animated.Value(0)), []);
  const trancheBars = useMemo(() => MOCK_TRANCHES.map(() => new Animated.Value(0)), []);

  // Numerical display values for count-up
  const [displayMetrics, setDisplayMetrics] = useState({
    totalCapitalSyndicated: 0,
    activeTranches: 0,
    avgPortfolioScore: 0,
    yieldRate: 0,
    repaymentRate: 0,
  });

  // Modal inputs and options
  const [deployModalVisible, setDeployModalVisible] = useState(false);
  const [selectedTranche, setSelectedTranche] = useState<typeof MOCK_TRANCHES[0] | null>(null);
  const [amountToDeploy, setAmountToDeploy] = useState('');
  const [selectedTenure, setSelectedTenure] = useState(12); // in months (6, 12, 24)

  useEffect(() => {
    // 1. Metric count-up listener
    const listener = countAnim.addListener(({ value }) => {
      setDisplayMetrics({
        totalCapitalSyndicated: value * MOCK_METRICS.totalCapitalSyndicated,
        activeTranches: Math.round(value * MOCK_METRICS.activeTranches),
        avgPortfolioScore: Math.round(value * MOCK_METRICS.avgPortfolioScore),
        yieldRate: value * MOCK_METRICS.yieldRate,
        repaymentRate: value * 96.4,
      });
    });

    // 2. Start macro count-up animation
    Animated.timing(countAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: false,
    }).start();

    // 3. Staggered card entrance and bar fill animations
    MOCK_TRANCHES.forEach((_, index) => {
      Animated.timing(trancheEntrances[index], {
        toValue: 1,
        duration: 600,
        delay: index * 150,
        useNativeDriver: true,
      }).start();

      Animated.timing(trancheBars[index], {
        toValue: 1,
        duration: 800,
        delay: index * 200,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      countAnim.removeListener(listener);
    };
  }, []);

  const handleOpenDeployModal = (tranche: typeof MOCK_TRANCHES[0]) => {
    setSelectedTranche(tranche);
    setAmountToDeploy('');
    setSelectedTenure(12);
    setDeployModalVisible(true);
  };

  const handleConfirmSyndication = () => {
    const amt = parseFloat(amountToDeploy);
    if (!amt || isNaN(amt) || amt <= 0) {
      Toast.show({
        type: 'error',
        text1: '❌ Invalid Amount',
        text2: 'Please enter a valid amount to deploy.',
      });
      return;
    }

    setDeployModalVisible(false);
    Toast.show({
      type: 'success',
      text1: '✅ Syndication Confirmed',
      text2: `₹${formatIndian(amt)} deployed to ${selectedTranche?.label}`,
    });
  };

  const handleQuickAction = (action: string) => {
    Toast.show({
      type: 'info',
      text1: action,
      text2: `Viewing ${action.toLowerCase()} dashboard section.`,
    });
  };

  // Live computation for projected yield: amount * 14.2% p.a. / 12 * selectedTenure
  const numericAmount = parseFloat(amountToDeploy) || 0;
  const projectedYield = (numericAmount * 0.142 / 12) * selectedTenure;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* SECTION 1 — Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{MOCK_BANK_USER.avatarInitials}</Text>
          </View>
          <View style={styles.partnerInfo}>
            <Text style={styles.partnerName}>Axis Institutional</Text>
            <View style={styles.verifiedBadge}>
              <SymbolView name="checkmark" size={8} tintColor="#FFFFFF" style={{ marginRight: 2 }} />
              <Text style={styles.verifiedText}>VERIFIED PARTNER</Text>
            </View>
          </View>
        </View>
        <View style={styles.topBarRight}>
          <Pressable
            style={styles.iconButton}
            onPress={() => handleQuickAction('Notifications')}
          >
            <SymbolView name="notifications" size={22} tintColor="#1A3A4A" />
          </Pressable>
          <Pressable
            style={styles.iconButton}
            onPress={() => handleQuickAction('Settings')}
          >
            <SymbolView name="settings" size={22} tintColor="#1A3A4A" />
          </Pressable>
        </View>
      </View>

      {/* SECTION 2 — Hero Macro Card */}
      <LinearGradient
        colors={['#1A3A4A', '#0A1A24']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View>
          <Text style={styles.heroLabel}>TOTAL CAPITAL SYNDICATED</Text>
          <Text style={styles.heroValue}>
            {formatCrore(displayMetrics.totalCapitalSyndicated)}
          </Text>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>
              {displayMetrics.activeTranches}
            </Text>
            <Text style={styles.metricLabel}>Active</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>
              {displayMetrics.avgPortfolioScore}
            </Text>
            <Text style={styles.metricLabel}>Avg Score</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>
              {displayMetrics.yieldRate.toFixed(1)}%
            </Text>
            <Text style={styles.metricLabel}>Yield p.a.</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>
              {displayMetrics.repaymentRate.toFixed(1)}%
            </Text>
            <Text style={styles.metricLabel}>Repayment</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickActionsRow}
        >
          {["Browse Tranches", "New Syndication", "Portfolio", "At-Risk"].map((action) => (
            <Pressable
              key={action}
              style={({ pressed }) => [
                styles.quickActionPill,
                { transform: [{ scale: pressed ? 0.95 : 1 }] }
              ]}
              onPress={() => handleQuickAction(action)}
            >
              <Text style={styles.quickActionText}>{action}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </LinearGradient>

      {/* SECTION 3 — TrustScore Tranche Browser */}
      <View style={styles.sectionHeaderContainer}>
        <Text style={styles.sectionTitle}>TrustScore Tranches</Text>
        <Text style={styles.sectionSubtitle}>Tap to deploy capital</Text>
      </View>

      <View style={styles.tranchesContainer}>
        {MOCK_TRANCHES.map((tranche, index) => {
          const entranceAnim = trancheEntrances[index];
          const barAnim = trancheBars[index];

          const translateY = entranceAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [30, 0],
          });
          const opacity = entranceAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          });

          // Calculate progress percentage
          const finalPctVal = ((tranche.avgScore - 300) / 550) * 100;
          const fillWidth = barAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', `${finalPctVal}%`],
          });

          return (
            <Animated.View
              key={tranche.id}
              style={[
                styles.trancheCard,
                { opacity, transform: [{ translateY }] }
              ]}
            >
              <View style={styles.trancheCardRow1}>
                <View style={styles.accentLabelRow}>
                  <View style={[styles.leftAccentBar, { backgroundColor: tranche.color }]} />
                  <Text style={styles.trancheLabel}>{tranche.label}</Text>
                </View>
                <View style={styles.scoreRangeBadge}>
                  <Text style={styles.scoreRangeText}>{tranche.scoreRange}</Text>
                </View>
              </View>

              <View style={styles.trancheCardRow2}>
                <View>
                  <Text style={styles.trancheStatsLabel}>Vendor Count</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <Text style={[styles.vendorCountValue, { color: tranche.color }]}>
                      {formatIndian(tranche.vendorCount)}
                    </Text>
                    <Text style={styles.vendorCountUnit}> vendors</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.trancheStatsLabel}>Capital Required</Text>
                  <Text style={styles.capitalRequiredValue}>
                    {formatCrore(tranche.totalCapitalRequired)}
                  </Text>
                </View>
              </View>

              <View style={styles.scoreBarContainer}>
                <View style={styles.scoreBarHeader}>
                  <Text style={styles.scoreBarLabel}>Avg Score</Text>
                  <Text style={styles.scoreBarValue}>{tranche.avgScore}</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <Animated.View style={[styles.progressBarFill, { width: fillWidth, backgroundColor: tranche.color }]} />
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.deployButton,
                  { transform: [{ scale: pressed ? 0.98 : 1 }] }
                ]}
                onPress={() => handleOpenDeployModal(tranche)}
              >
                <Text style={styles.deployButtonText}>Deploy Capital →</Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {/* SECTION 4 — Active Syndications Feed */}
      <View style={styles.sectionHeaderContainer}>
        <Text style={styles.sectionTitle}>Active Syndications</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.syndicationsScroll}
      >
        {MOCK_ACTIVE_SYNDICATIONS.map((syndication) => {
          const isActive = syndication.status === 'ACTIVE';
          return (
            <View key={syndication.id} style={styles.syndicationCard}>
              <View style={styles.syndicationHeader}>
                <Text style={styles.syndicationTrancheLabel} numberOfLines={1}>
                  {syndication.trancheLabel}
                </Text>
                <View style={[
                  styles.statusChip,
                  { backgroundColor: isActive ? '#E8F5E9' : '#FFF8E1' }
                ]}>
                  <SymbolView 
                    name={isActive ? "checkmark.circle.fill" : "lock"} 
                    size={10} 
                    tintColor={isActive ? "#2E7D32" : "#D4820A"} 
                    style={{ marginRight: 4 }} 
                  />
                  <Text style={[
                    styles.statusChipText,
                    { color: isActive ? '#2E7D32' : '#D4820A' }
                  ]}>
                    {syndication.status}
                  </Text>
                </View>
              </View>

              <Text style={styles.syndicationAmount}>
                {formatCrore(syndication.amountDeployed)}
              </Text>

              <View style={styles.syndicationDetails}>
                <Text style={styles.syndicationYield}>
                  Yield Earned: ₹{formatIndian(syndication.yieldEarned)}
                </Text>
                <Text style={styles.syndicationMaturity}>
                  Matures: {syndication.maturityDate}
                </Text>
              </View>

              <View style={styles.miniProgressBarBg}>
                <View style={[
                  styles.miniProgressBarFill,
                  {
                    width: isActive ? '70%' : '100%',
                    backgroundColor: isActive ? '#D4820A' : '#E0E0E0'
                  }
                ]} />
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* SECTION 5 — API Console Teaser Card */}
      <View style={styles.apiTeaserCard}>
        {/* Monospace API key string background watermark */}
        <Text style={styles.apiWatermark} numberOfLines={3}>
          vp_live_sk_xK9mN2pQvp_live_sk_xK9mN2pQvp_live_sk_xK9mN2pQvp_live_sk_xK9mN2pQvp_live_sk_xK9mN2pQ
        </Text>
        <View style={styles.apiTeaserContent}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={styles.apiTeaserTitle}>TrustScore API</Text>
            <Text style={styles.apiTeaserSubtitle}>Expose scores to partners</Text>
          </View>
          <Pressable
            style={styles.apiTeaserButton}
            onPress={() => Toast.show({
              type: 'info',
              text1: '🔐 API Console',
              text2: 'This dashboard console is locked in demo mode.',
            })}
          >
            <Text style={styles.apiTeaserButtonText}>View Console →</Text>
          </Pressable>
        </View>
      </View>

      {/* SIGN OUT BUTTON */}
      <Pressable
        style={({ pressed }) => [
          styles.signOutButton,
          { opacity: pressed ? 0.8 : 1.0, transform: [{ scale: pressed ? 0.98 : 1 }] }
        ]}
        onPress={signOut}
      >
        <SymbolView tintColor="#C0392B" name="arrow.right.to.line" size={18} style={{ marginRight: 8 }} />
        <Text style={styles.signOutButtonText}>Sign Out Bank Profile</Text>
      </Pressable>

      {/* Bottom spacer for tabs padding */}
      <View style={{ height: BottomTabInset + Spacing.six }} />

      {/* DEPLOY CAPITAL MODAL */}
      <Modal
        visible={deployModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDeployModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setDeployModalVisible(false)} />
          <View style={styles.modalSheet}>
            {selectedTranche && (
              <View>
                <Text style={styles.modalTrancheTitle}>{selectedTranche.label}</Text>
                <View style={styles.modalMutedRow}>
                  <Text style={styles.modalMutedText}>Score Band: {selectedTranche.scoreRange}</Text>
                  <Text style={styles.modalBullet}> • </Text>
                  <Text style={styles.modalMutedText}>{formatIndian(selectedTranche.vendorCount)} Vendors Available</Text>
                </View>

                <Text style={styles.modalInputLabel}>Amount to Deploy (₹)</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="numeric"
                  placeholder="e.g. 5000000"
                  placeholderTextColor="#A0A0A0"
                  value={amountToDeploy}
                  onChangeText={setAmountToDeploy}
                  autoFocus
                />

                <View style={styles.projectedYieldContainer}>
                  <Text style={styles.projectedYieldText}>
                    Projected Yield: <Text style={styles.projectedYieldValue}>₹{formatIndian(Math.round(projectedYield))}</Text>
                  </Text>
                </View>

                <View style={styles.tenurePillsContainer}>
                  {[6, 12, 24].map((t) => {
                    const isSelected = selectedTenure === t;
                    return (
                      <Pressable
                        key={t}
                        style={[
                          styles.tenurePill,
                          isSelected ? styles.tenurePillSelected : styles.tenurePillUnselected
                        ]}
                        onPress={() => setSelectedTenure(t)}
                      >
                        <Text style={[
                          styles.tenurePillText,
                          isSelected ? styles.tenurePillTextSelected : styles.tenurePillTextUnselected
                        ]}>
                          {t}M
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Pressable
                  style={styles.confirmButton}
                  onPress={handleConfirmSyndication}
                >
                  <Text style={styles.confirmButtonText}>Confirm Syndication</Text>
                </Pressable>

                <Pressable
                  style={styles.cancelButton}
                  onPress={() => setDeployModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf9f3',
  },
  scrollContent: {
    paddingTop: Platform.OS === 'web' ? Spacing.four : 12,
  },
  // SECTION 1 — Top Bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D4820A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: FONT_SERIF,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  partnerInfo: {
    marginLeft: 12,
  },
  partnerName: {
    fontFamily: FONT_SANS_DISPLAY,
    fontSize: 16,
    fontWeight: '600',
    color: '#1A3A4A',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4820A',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  verifiedText: {
    fontFamily: FONT_SANS_BODY,
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  topBarRight: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(26, 58, 74, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  // SECTION 2 — Hero Macro Card
  heroCard: {
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 16,
    marginTop: 16,
    overflow: 'hidden',
  },
  heroLabel: {
    fontFamily: FONT_SANS_BODY,
    fontSize: 11,
    fontWeight: '400',
    color: '#7A9BAD',
    letterSpacing: 1.5,
  },
  heroValue: {
    fontFamily: FONT_SERIF,
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  metricItem: {
    flex: 1,
  },
  metricValue: {
    fontFamily: FONT_MONO,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  metricLabel: {
    fontFamily: FONT_SANS_BODY,
    fontSize: 11,
    color: '#7A9BAD',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 18,
  },
  quickActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickActionPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
  },
  quickActionText: {
    fontFamily: FONT_SANS_BODY,
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  // SECTION 3 — TrustScore Tranche Browser
  sectionHeaderContainer: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: FONT_SANS_DISPLAY,
    fontSize: 18,
    fontWeight: '600',
    color: '#1A3A4A',
  },
  sectionSubtitle: {
    fontFamily: FONT_SANS_BODY,
    fontSize: 13,
    color: '#446274',
    marginTop: 2,
  },
  tranchesContainer: {
    gap: 12,
  },
  trancheCard: {
    backgroundColor: '#FFFDF9',
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFE6D7',
    ...Platform.select({
      ios: {
        shadowColor: '#1A3A4A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: {
        elevation: 3.5,
      },
      web: {
        boxShadow: '0 4px 12px rgba(26,58,74,0.04)',
      }
    }),
  },
  trancheCardRow1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accentLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  leftAccentBar: {
    width: 4,
    height: 18,
    borderRadius: 2,
    marginRight: 8,
  },
  trancheLabel: {
    fontFamily: FONT_SANS_DISPLAY,
    fontSize: 15,
    fontWeight: '600',
    color: '#1A3A4A',
  },
  scoreRangeBadge: {
    backgroundColor: '#fdf9f3',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#F0E8D8',
  },
  scoreRangeText: {
    fontFamily: FONT_SANS_BODY,
    fontSize: 11,
    fontWeight: '500',
    color: '#D4820A',
  },
  trancheCardRow2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  trancheStatsLabel: {
    fontFamily: FONT_SANS_BODY,
    fontSize: 11,
    color: '#446274',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  vendorCountValue: {
    fontFamily: FONT_MONO,
    fontSize: 20,
    fontWeight: '600',
  },
  vendorCountUnit: {
    fontFamily: FONT_SANS_BODY,
    fontSize: 12,
    color: '#446274',
  },
  capitalRequiredValue: {
    fontFamily: FONT_MONO,
    fontSize: 16,
    fontWeight: '600',
    color: '#1A3A4A',
  },
  scoreBarContainer: {
    marginTop: 14,
  },
  scoreBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  scoreBarLabel: {
    fontFamily: FONT_SANS_BODY,
    fontSize: 11,
    color: '#446274',
  },
  scoreBarValue: {
    fontFamily: FONT_MONO,
    fontSize: 12,
    fontWeight: '600',
    color: '#1A3A4A',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F0E8D8',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  deployButton: {
    backgroundColor: '#D4820A',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  deployButtonText: {
    fontFamily: FONT_SANS_BODY,
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // SECTION 4 — Active Syndications Feed
  syndicationsScroll: {
    paddingLeft: 16,
    paddingRight: 8,
    paddingBottom: 12,
  },
  syndicationCard: {
    width: 220,
    backgroundColor: '#FFFDF9',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFE6D7',
    marginRight: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#1A3A4A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: {
        elevation: 2.5,
      },
      web: {
        boxShadow: '0 4px 10px rgba(26,58,74,0.03)',
      }
    }),
  },
  syndicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  syndicationTrancheLabel: {
    fontFamily: FONT_SANS_BODY,
    fontSize: 13,
    fontWeight: '500',
    color: '#1A3A4A',
    flex: 1,
    marginRight: 6,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusChipText: {
    fontFamily: FONT_SANS_BODY,
    fontSize: 10,
    fontWeight: '500',
  },
  syndicationAmount: {
    fontFamily: FONT_SERIF,
    fontSize: 22,
    fontWeight: '700',
    color: '#1A3A4A',
  },
  syndicationDetails: {
    marginTop: 8,
    marginBottom: 12,
  },
  syndicationYield: {
    fontFamily: FONT_SANS_BODY,
    fontSize: 12,
    color: '#446274',
  },
  syndicationMaturity: {
    fontFamily: FONT_SANS_BODY,
    fontSize: 11,
    color: '#7A9BAD',
    marginTop: 2,
  },
  miniProgressBarBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E8E0D5',
    overflow: 'hidden',
  },
  miniProgressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  // SECTION 5 — API Console Teaser Card
  apiTeaserCard: {
    backgroundColor: '#1A3A4A',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 32,
    overflow: 'hidden',
    position: 'relative',
  },
  apiWatermark: {
    fontFamily: FONT_MONO,
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.07,
    position: 'absolute',
    left: 8,
    right: 8,
    top: 8,
    lineHeight: 16,
    pointerEvents: 'none',
  },
  apiTeaserContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  apiTeaserTitle: {
    fontFamily: FONT_SANS_DISPLAY,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  apiTeaserSubtitle: {
    fontFamily: FONT_SANS_BODY,
    fontSize: 12,
    color: '#7A9BAD',
    marginTop: 2,
  },
  apiTeaserButton: {
    backgroundColor: '#D4820A',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  apiTeaserButtonText: {
    fontFamily: FONT_SANS_BODY,
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // DEPLOY CAPITAL MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalTrancheTitle: {
    fontFamily: FONT_SERIF,
    fontSize: 20,
    fontWeight: '700',
    color: '#1A3A4A',
  },
  modalMutedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  modalMutedText: {
    fontFamily: FONT_SANS_BODY,
    fontSize: 13,
    color: '#446274',
  },
  modalBullet: {
    color: '#7A9BAD',
    fontSize: 13,
  },
  modalInputLabel: {
    fontFamily: FONT_SANS_BODY,
    fontSize: 11,
    fontWeight: '600',
    color: '#1A3A4A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#F0E8D8',
    borderRadius: 12,
    padding: 12,
    fontFamily: FONT_MONO,
    fontSize: 18,
    color: '#1A3A4A',
    backgroundColor: '#fdf9f3',
  },
  projectedYieldContainer: {
    marginTop: 12,
    marginBottom: 16,
  },
  projectedYieldText: {
    fontFamily: FONT_SANS_BODY,
    fontSize: 14,
    color: '#446274',
  },
  projectedYieldValue: {
    fontWeight: '600',
    color: '#D4820A',
  },
  tenurePillsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  tenurePill: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
  },
  tenurePillSelected: {
    backgroundColor: '#D4820A',
    borderColor: '#D4820A',
  },
  tenurePillUnselected: {
    backgroundColor: '#fdf9f3',
    borderColor: '#F0E8D8',
  },
  tenurePillText: {
    fontFamily: FONT_SANS_BODY,
    fontSize: 14,
    fontWeight: '600',
  },
  tenurePillTextSelected: {
    color: '#FFFFFF',
  },
  tenurePillTextUnselected: {
    color: '#D4820A',
  },
  confirmButton: {
    backgroundColor: '#1A3A4A',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  confirmButtonText: {
    fontFamily: FONT_SANS_DISPLAY,
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontFamily: FONT_SANS_BODY,
    fontSize: 14,
    fontWeight: '500',
    color: '#446274',
  },
  signOutButton: {
    flexDirection: 'row',
    height: 48,
    borderWidth: 1.5,
    borderColor: '#EFE6D7',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: '#FFFDF9',
  },
  signOutButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#C0392B',
    fontFamily: FONT_SANS_DISPLAY,
  },
});
