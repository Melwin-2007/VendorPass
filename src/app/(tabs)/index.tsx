import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { SymbolView } from '@/components/symbol-view';

export default function DashboardScreen() {
  const { user, signOut } = useAuth();
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

  // Vendor Action Modals
  const [ledgerModalVisible, setLedgerModalVisible] = useState(false);
  const [saleAmount, setSaleAmount] = useState('');
  const [saleDesc, setSaleDesc] = useState('');

  // Local state for vendor activities
  const [activities, setActivities] = useState([
    { id: '1', type: 'SALE', title: 'UPI Grocery Sale', date: 'Today, 2:15 PM', amount: '+₹450', status: 'verified' },
    { id: '2', type: 'PAYMENT', title: 'Weekly Micro-Loan Repayment', date: 'Yesterday', amount: '-₹800', status: 'completed' },
    { id: '3', type: 'SALE', title: 'Cash Retail Invoice', date: '21 May 2026', amount: '+₹1,200', status: 'pending_verification' },
  ]);

  // Lender applicants queue state
  const [applicants, setApplicants] = useState([
    { id: '101', name: 'Sunita Kirana Store', score: 764, amount: '₹15,000', rate: '12% p.a.', date: 'Today' },
    { id: '102', name: 'Rajesh Tea Stall', score: 689, amount: '₹8,000', rate: '14% p.a.', date: 'Yesterday' },
    { id: '103', name: 'Pooja Vegetable Cart', score: 615, amount: '₹5,000', rate: '15% p.a.', date: '2 days ago' },
  ]);

  const handleRecordSale = () => {
    if (!saleAmount) return;
    const newActivity = {
      id: Date.now().toString(),
      type: 'SALE',
      title: saleDesc || 'Manual Sale Entry',
      date: 'Just now',
      amount: `+₹${saleAmount}`,
      status: 'pending_verification',
    };
    setActivities([newActivity, ...activities]);
    setSaleAmount('');
    setSaleDesc('');
    setLedgerModalVisible(false);
  };

  const handleApproveCredit = (id: string) => {
    setApplicants(applicants.filter((app) => app.id !== id));
  };

  const renderVendorDashboard = () => {
    const currentScore = user?.score ?? 620;
    const scorePct = Math.min((currentScore - 300) / 550, 1.0); // 300 to 850 range

    return (
      <View style={styles.dashboardContainer}>
        {/* Welcome Row */}
        <View style={styles.welcomeRow}>
          <View>
            <Text style={[styles.welcomeGreeting, { color: theme.textSecondary }]}>Namaste,</Text>
            <Text style={[styles.welcomeName, { color: theme.text }]}>{user?.name}</Text>
          </View>
          <Pressable style={styles.profileBadge}>
            <View style={[styles.profileAvatar, { backgroundColor: theme.primary + '30' }]}>
              <Text style={[styles.profileAvatarText, { color: theme.primary }]}>
                {user?.name.substring(0, 1)}
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Premium Credit Card (Score Gauge) */}
        <View style={[styles.creditCard, { backgroundColor: theme.secondary }]}>
          {/* Card Mandala design */}
          <View style={styles.cardVectorLine} />
          
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardLabel}>TRUSTSCORE PROFILE</Text>
              <Text style={styles.cardTagline}>Behavioral AI Rating</Text>
            </View>
            <SymbolView tintColor={theme.highlight} name="cpu" size={24} />
          </View>

          <View style={styles.gaugeContainer}>
            <View style={[styles.gaugeTrack, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
              <View style={[styles.gaugeFill, { backgroundColor: theme.highlight, width: `${scorePct * 100}%` }]} />
            </View>
            <View style={styles.gaugeValues}>
              <Text style={styles.gaugeLabel}>300</Text>
              <Text style={[styles.gaugeCurrent, { color: theme.highlight }]}>{currentScore}</Text>
              <Text style={styles.gaugeLabel}>850</Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.footerLabel}>RATING TYPE</Text>
              <Text style={styles.footerValue}>GOOD STANDING</Text>
            </View>
            <View style={styles.cardStatusBadge}>
              <Text style={styles.cardStatusText}>ACTIVE</Text>
            </View>
          </View>
        </View>

        {/* Available Credit Limit metrics */}
        <View style={[styles.metricCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>AVAILABLE CREDIT LIMIT</Text>
          <View style={styles.metricRow}>
            <Text style={[styles.metricValue, { color: theme.text }]}>₹20,800</Text>
            <Text style={[styles.metricTotal, { color: theme.textMuted }]}>/ ₹25,000</Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
            <View style={[styles.progressBarFill, { backgroundColor: theme.success, width: '83%' }]} />
          </View>
          <View style={styles.metricSummary}>
            <SymbolView tintColor={theme.success} name="arrow.up.circle.fill" size={14} style={{ marginRight: 4 }} />
            <Text style={[styles.metricSummaryText, { color: theme.success }]}>Top 8% of local vendors</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>QUICK ACTIONS</Text>
        <View style={styles.actionsGrid}>
          <Pressable
            style={[styles.actionButton, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => setLedgerModalVisible(true)}>
            <View style={[styles.actionIconContainer, { backgroundColor: theme.primary + '15' }]}>
              <SymbolView tintColor={theme.primary} name="plus.circle" size={24} />
            </View>
            <Text style={[styles.actionText, { color: theme.text }]}>Record Sale</Text>
          </Pressable>

          <Pressable
            style={[styles.actionButton, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => {}}>
            <View style={[styles.actionIconContainer, { backgroundColor: theme.secondary + '15' }]}>
              <SymbolView tintColor={theme.secondary} name="banknote" size={24} />
            </View>
            <Text style={[styles.actionText, { color: theme.text }]}>Repay Limit</Text>
          </Pressable>

          <Pressable
            style={[styles.actionButton, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => {}}>
            <View style={[styles.actionIconContainer, { backgroundColor: theme.success + '15' }]}>
              <SymbolView tintColor={theme.success} name="square.and.arrow.up" size={24} />
            </View>
            <Text style={[styles.actionText, { color: theme.text }]}>Share Card</Text>
          </Pressable>
        </View>

        {/* Recent Ledger History */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>RECENT LEDGER HISTORY</Text>
        <View style={[styles.historyList, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {activities.map((item) => (
            <View key={item.id} style={styles.historyItem}>
              <View style={[styles.historyIcon, { backgroundColor: item.type === 'SALE' ? theme.success + '15' : theme.primary + '15' }]}>
                <SymbolView
                  tintColor={item.type === 'SALE' ? theme.success : theme.primary}
                  name={item.type === 'SALE' ? 'arrow.down.left.circle' : 'arrow.up.right.circle'}
                  size={20}
                />
              </View>
              <View style={styles.historyDetails}>
                <Text style={[styles.historyTitle, { color: theme.text }]}>{item.title}</Text>
                <Text style={[styles.historyDate, { color: theme.textMuted }]}>{item.date}</Text>
              </View>
              <View style={styles.historyAmountCol}>
                <Text
                  style={[
                    styles.historyAmount,
                    { color: item.type === 'SALE' ? theme.success : theme.primary },
                  ]}>
                  {item.amount}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'verified' ? theme.success + '15' : theme.highlight + '15' }]}>
                  <Text style={[styles.statusText, { color: item.status === 'verified' ? theme.success : theme.primary }]}>
                    {item.status === 'verified' ? 'Verified' : 'Pending'}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Record Sale Modal */}
        <Modal
          visible={ledgerModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setLedgerModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: theme.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Record Sale Entry</Text>
                <Pressable onPress={() => setLedgerModalVisible(false)}>
                  <SymbolView tintColor={theme.text} name="xmark" size={20} />
                </Pressable>
              </View>
              <TextInput
                style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]}
                placeholder="Amount (₹)"
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
                value={saleAmount}
                onChangeText={setSaleAmount}
              />
              <TextInput
                style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]}
                placeholder="Description (e.g. Retail items)"
                placeholderTextColor={theme.textMuted}
                value={saleDesc}
                onChangeText={setSaleDesc}
              />
              <Pressable style={[styles.modalSubmit, { backgroundColor: theme.primary }]} onPress={handleRecordSale}>
                <Text style={styles.modalSubmitText}>Save Entry</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  const renderLenderDashboard = () => {
    return (
      <View style={styles.dashboardContainer}>
        {/* Welcome Row */}
        <View style={styles.welcomeRow}>
          <View>
            <Text style={[styles.welcomeGreeting, { color: theme.textSecondary }]}>Welcome,</Text>
            <Text style={[styles.welcomeName, { color: theme.text }]}>Janata NBFC Partner</Text>
          </View>
          <Pressable style={styles.profileBadge}>
            <View style={[styles.profileAvatar, { backgroundColor: theme.primary + '30' }]}>
              <Text style={[styles.profileAvatarText, { color: theme.primary }]}>J</Text>
            </View>
          </Pressable>
        </View>

        {/* Microfinance Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>DISBURSED CAPITAL</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>₹14.8L</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>ACTIVE VENDORS</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>84</Text>
          </View>
        </View>

        {/* Credit Applications Pipeline */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>CREDIT REQUESTS PIPELINE</Text>
        {applicants.length > 0 ? (
          <View style={styles.pipelineList}>
            {applicants.map((item) => (
              <View key={item.id} style={[styles.appCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.appCardHeader}>
                  <View>
                    <Text style={[styles.appName, { color: theme.text }]}>{item.name}</Text>
                    <Text style={[styles.appDate, { color: theme.textMuted }]}>{item.date}</Text>
                  </View>
                  <View style={[styles.scoreBadgeCircle, { backgroundColor: theme.primary + '15' }]}>
                    <Text style={[styles.scoreBadgeTextCircle, { color: theme.primary }]}>{item.score}</Text>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                <View style={styles.appDetailsRow}>
                  <View>
                    <Text style={[styles.appDetailLabel, { color: theme.textMuted }]}>LIMIT AMOUNT</Text>
                    <Text style={[styles.appDetailValue, { color: theme.text }]}>{item.amount}</Text>
                  </View>
                  <View>
                    <Text style={[styles.appDetailLabel, { color: theme.textMuted }]}>PROPOSED RATE</Text>
                    <Text style={[styles.appDetailValue, { color: theme.success }]}>{item.rate}</Text>
                  </View>
                </View>

                <View style={styles.appActions}>
                  <Pressable
                    style={[styles.appButtonDecline, { borderColor: theme.error }]}
                    onPress={() => handleApproveCredit(item.id)}>
                    <Text style={[styles.appButtonDeclineText, { color: theme.error }]}>Decline</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.appButtonApprove, { backgroundColor: theme.primary }]}
                    onPress={() => handleApproveCredit(item.id)}>
                    <Text style={styles.appButtonApproveText}>Approve Limit</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.emptyState, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <SymbolView tintColor={theme.textMuted} name="checkmark.circle" size={40} />
            <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>All applications reviewed!</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
        
        {user?.role === 'VENDOR' ? renderVendorDashboard() : renderLenderDashboard()}

        {/* Global Sign Out Button */}
        <Pressable
          style={({ pressed }) => [
            styles.signOutButton,
            { borderColor: theme.border, opacity: pressed ? 0.8 : 1.0 },
          ]}
          onPress={signOut}>
          <SymbolView tintColor={theme.error} name="arrow.right.to.line" size={18} style={{ marginRight: 6 }} />
          <Text style={[styles.signOutText, { color: theme.error }]}>Sign Out Profile</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.four,
  },
  dashboardContainer: {
    flex: 1,
  },
  welcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: Spacing.four,
  },
  welcomeGreeting: {
    fontSize: 14,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  welcomeName: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'Playfair Display' : 'serif',
  },
  profileBadge: {
    width: 44,
    height: 44,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  creditCard: {
    height: 200,
    borderRadius: 24,
    padding: Spacing.four,
    marginBottom: Spacing.four,
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#1A3A4A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 10px 25px rgba(26,58,74,0.25)',
      },
    }),
  },
  cardVectorLine: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    top: -50,
    right: -50,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.three,
  },
  cardLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  cardTagline: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'Playfair Display' : 'serif',
    marginTop: 2,
  },
  gaugeContainer: {
    marginVertical: Spacing.two,
  },
  gaugeTrack: {
    height: 8,
    borderRadius: 4,
    width: '100%',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 4,
  },
  gaugeValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  gaugeLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10,
    fontFamily: Platform.OS === 'web' ? 'JetBrains Mono' : 'monospace',
  },
  gaugeCurrent: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'JetBrains Mono' : 'monospace',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  footerLabel: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 9,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  footerValue: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  cardStatusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cardStatusText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  metricCard: {
    borderWidth: 1.5,
    borderRadius: 20,
    padding: Spacing.three,
    marginBottom: Spacing.four,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.0,
    marginBottom: 6,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.two,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'JetBrains Mono' : 'monospace',
  },
  metricTotal: {
    fontSize: 14,
    marginLeft: 4,
    fontFamily: Platform.OS === 'web' ? 'JetBrains Mono' : 'monospace',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    width: '100%',
    marginBottom: Spacing.two,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  metricSummary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricSummaryText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginTop: Spacing.three,
    marginBottom: Spacing.three,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: Spacing.four,
  },
  actionButton: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  historyList: {
    borderWidth: 1.5,
    borderRadius: 20,
    padding: Spacing.three,
    marginBottom: Spacing.four,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  historyIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.two,
  },
  historyDetails: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  historyDate: {
    fontSize: 11,
    marginTop: 2,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  historyAmountCol: {
    alignItems: 'flex-end',
  },
  historyAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'JetBrains Mono' : 'monospace',
    marginBottom: 2,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: Spacing.four,
  },
  statBox: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: Spacing.three,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1.0,
    marginBottom: 4,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'JetBrains Mono' : 'monospace',
  },
  pipelineList: {
    gap: 16,
    marginBottom: Spacing.four,
  },
  appCard: {
    borderWidth: 1.5,
    borderRadius: 20,
    padding: Spacing.three,
  },
  appCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appName: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  appDate: {
    fontSize: 11,
    marginTop: 2,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  scoreBadgeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreBadgeTextCircle: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'JetBrains Mono' : 'monospace',
  },
  divider: {
    height: 1.2,
    marginVertical: Spacing.three,
  },
  appDetailsRow: {
    flexDirection: 'row',
    gap: Spacing.six,
    marginBottom: Spacing.three,
  },
  appDetailLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.8,
    marginBottom: 4,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  appDetailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'JetBrains Mono' : 'monospace',
  },
  appActions: {
    flexDirection: 'row',
    gap: 12,
  },
  appButtonDecline: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appButtonDeclineText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  appButtonApprove: {
    flex: 2,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appButtonApproveText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  emptyState: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: Spacing.five,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  signOutButton: {
    flexDirection: 'row',
    height: 48,
    borderWidth: 1.5,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.two,
    marginBottom: Spacing.five,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  modalCard: {
    borderRadius: 24,
    padding: Spacing.four,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  modalInput: {
    height: 50,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    fontSize: 14,
  },
  modalSubmit: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSubmitText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
});
