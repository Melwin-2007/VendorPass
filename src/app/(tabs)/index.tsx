import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  Modal,
  TextInput,
  Image,
  TouchableOpacity,
} from 'react-native';
import { BottomTabBar } from '@/components/BottomTabBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { SymbolView } from '@/components/symbol-view';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

// Custom sparkles/stars SVGs to match the high-end mockup design
function SparkleIcon({ size = 18, color = '#895100' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path
        d="M 50 0 Q 50 50 100 50 Q 50 50 50 100 Q 50 50 0 50 Q 50 50 50 0 Z"
        fill={color}
      />
    </Svg>
  );
}

function SparkleWatermark() {
  return (
    <View style={{ position: 'absolute', right: -12, bottom: -12, opacity: 0.08, pointerEvents: 'none' }}>
      <Svg width={130} height={130} viewBox="0 0 100 100">
        <Path
          d="M 50 0 Q 50 50 100 50 Q 50 50 50 100 Q 50 50 0 50 Q 50 50 50 0 Z"
          fill="none"
          stroke="#895100"
          strokeWidth="2.5"
        />
      </Svg>
    </View>
  );
}

export default function DashboardScreen() {
  const { user, signOut, updateRole } = useAuth();
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
      paddingBottom: insets.bottom + 50, // Extra bottom padding for custom floating tab bar
    },
    ios: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom + 50, // Extra bottom padding for custom floating tab bar
    },
    web: {
      paddingTop: Spacing.five,
      paddingBottom: 130, // Large spacing for fixed bottom bar on web
    },
  });

  // Vendor Action Modals
  const [ledgerModalVisible, setLedgerModalVisible] = useState(false);
  const [loanModalVisible, setLoanModalVisible] = useState(false);
  const [supplierModalVisible, setSupplierModalVisible] = useState(false);
  const [docsModalVisible, setDocsModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);
  const [accountModalVisible, setAccountModalVisible] = useState(false);

  // Modal input states
  const [saleAmount, setSaleAmount] = useState('');
  const [saleDesc, setSaleDesc] = useState('');
  const [supplierName, setSupplierName] = useState('');
  
  // Loan amount input states
  const [loanAmount, setLoanAmount] = useState('50000');
  const [loanTenure, setLoanTenure] = useState(3); // in months (3 or 6)

  // Local metrics state
  const [supplierCount, setSupplierCount] = useState(4);
  const [activeDays, setActiveDays] = useState(26);
  const [dailyAvg, setDailyAvg] = useState('2,340');
  
  // Custom toast notification message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Score gauge offset state for load animation (radius = 70, semi-circle arc length = 220)
  const [gaugeOffset, setGaugeOffset] = useState(220);

  // Local state for vendor activities
  const [localTrustScoreData, setLocalTrustScoreData] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const activeTrustScoreData = localTrustScoreData || user?.trustScoreData;
  const currentScore = activeTrustScoreData?.trust_score ?? user?.score ?? 742;

  const [activities, setActivities] = useState([
    { id: '1', type: 'PAYMENT', title: 'Amul Distributors', date: 'Today, 10:30 AM', amount: '- ₹4,200', status: 'completed' },
    { id: '2', type: 'SALE', title: 'Store Sale: UPI', date: 'Yesterday, 06:15 PM', amount: '+ ₹840', status: 'verified' },
    { id: '3', type: 'SALE', title: 'Loan Disbursement', date: 'Oct 24, 2023', amount: '+ ₹15,000', status: 'verified' },
  ]);

  // Lender applicants queue state
  const [applicants, setApplicants] = useState([
    { id: '101', name: 'Sunita Kirana Store', score: 764, amount: '₹15,000', rate: '12% p.a.', date: 'Today' },
    { id: '102', name: 'Rajesh Tea Stall', score: 689, amount: '₹8,000', rate: '14% p.a.', date: 'Yesterday' },
    { id: '103', name: 'Pooja Vegetable Cart', score: 615, amount: '₹5,000', rate: '15% p.a.', date: '2 days ago' },
  ]);

  // Animate the gauge when currentScore changes
  useEffect(() => {
    const maxScore = 850; // TrustScore typically goes up to 850
    const boundedScore = Math.min(Math.max(currentScore, 0), maxScore);
    const scorePct = boundedScore / maxScore;
    const targetOffset = 220 * (1 - scorePct);
    
    // Slight delay to allow render then trigger CSS/SVG animation
    const timer = setTimeout(() => {
      setGaugeOffset(targetOffset);
    }, 150);
    return () => clearTimeout(timer);
  }, [currentScore]);

  // Helper for showing a temporary toast notification
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleRecordSale = async () => {
    if (!user?.id || isCalculating) {
      if (!user?.id) showToast('❌ User ID missing. Please refresh the app.');
      return;
    }

    setIsCalculating(true);
    
    // Convert to number
    const numericAmt = Number(saleAmount.replace(/[^0-9.-]+/g, ""));
    if (isNaN(numericAmt)) {
        setIsCalculating(false);
        return;
    }

    // Actually insert into Supabase
    const { error: insertError } = await supabase.from('wallet_transactions').insert([{
      user_id: user.id,
      amount: numericAmt,
      type: 'ADD',
      description: saleDesc || 'Store Sale: UPI'
    }]);

    if (insertError) {
      showToast('❌ Failed to record sale. Check connection.');
      console.error("Sale insert error", insertError);
      setIsCalculating(false);
      return;
    }

    console.log("Successfully inserted transaction. Explicitly calling TrustScore engine...");

    // Directly trigger the edge function so we don't have to rely on the Database Webhook
    const { data: edgeData, error: edgeError } = await supabase.functions.invoke('calculate_trust_score', {
      body: { record: { user_id: user.id } }
    });

    setIsCalculating(false);

    if (edgeError) {
      console.error("Edge Function Error:", edgeError);
      showToast('⚠️ Sale recorded, but TrustScore engine failed to run.');
    } else {
      console.log("Edge Function Response:", edgeData);
      if (edgeData?.parsedTrustScoreData) {
        setLocalTrustScoreData(edgeData.parsedTrustScoreData);
      }
    }

    const newActivity = {
      id: Date.now().toString(),
      type: 'SALE',
      title: saleDesc || 'Store Sale: UPI',
      date: 'Just now',
      amount: `+ ₹${numericAmt.toLocaleString('en-IN')}`,
      status: 'pending_verification',
    };
    setActivities([newActivity, ...activities]);
    
    // Also simulate updating metrics
    setDailyAvg(prev => {
      const prevAmt = parseFloat(prev.replace(/,/g, ''));
      const newAvg = Math.round((prevAmt * activeDays + numericAmt) / (activeDays + 1));
      return newAvg.toLocaleString('en-IN');
    });
    setActiveDays(d => d + 1);

    setSaleAmount('');
    setSaleDesc('');
    setLedgerModalVisible(false);
    showToast('🎉 Sale entry recorded successfully!');
  };

  const handleApplyLoan = () => {
    const amt = parseFloat(loanAmount.replace(/,/g, ''));
    if (isNaN(amt) || amt <= 0 || amt > 50000) {
      showToast('❌ Please enter a valid amount up to ₹50,000');
      return;
    }

    const newActivity = {
      id: Date.now().toString(),
      type: 'SALE',
      title: 'Loan Disbursement',
      date: 'Just now',
      amount: `+ ₹${amt.toLocaleString('en-IN')}`,
      status: 'verified',
    };
    setActivities([newActivity, ...activities]);

    setDailyAvg(prev => {
      const prevAmt = parseFloat(prev.replace(/,/g, ''));
      const newAvg = Math.round((prevAmt * activeDays + amt) / (activeDays + 1));
      return newAvg.toLocaleString('en-IN');
    });
    setActiveDays(d => d + 1);

    setLoanModalVisible(false);
    showToast(`💰 ₹${amt.toLocaleString('en-IN')} disbursed to your bank account!`);
  };

  const handleLinkSupplier = () => {
    if (!supplierName) return;
    const newActivity = {
      id: Date.now().toString(),
      type: 'PAYMENT',
      title: `Linked Supplier: ${supplierName}`,
      date: 'Just now',
      amount: 'Linked',
      status: 'verified',
    };
    setActivities([newActivity, ...activities]);
    setSupplierCount(c => c + 1);
    setSupplierName('');
    setSupplierModalVisible(false);
    showToast(`🔗 Linked to ${supplierName} successfully!`);
  };

  const handleApproveCredit = (id: string) => {
    setApplicants(applicants.filter((app) => app.id !== id));
  };

  const renderVendorDashboard = () => {
    // Standing and Color calculations based on currentScore
    let standingText = 'Good Standing';
    let standingColor = '#D4820A'; // Default Orange
    let standingBg = '#D4820A20';
    let gaugeColor = '#D4820A';
    
    if (currentScore >= 750) {
      standingText = 'Excellent Standing';
      standingColor = '#2D7D46'; // Green
      standingBg = '#2D7D4625';
      gaugeColor = '#2D7D46';
    } else if (currentScore < 600) {
      standingText = 'Poor Standing';
      standingColor = '#E74C3C'; // Red
      standingBg = '#E74C3C20';
      gaugeColor = '#E74C3C';
    } else if (currentScore < 650) {
      standingText = 'Fair Standing';
      standingColor = '#CC8600'; // Darker Orange
      standingBg = '#CC860020';
      gaugeColor = '#CC8600';
    }

    const getActivityStyle = (title: string, amount: string) => {
      const isExpense = amount.startsWith('-');
      if (title.toLowerCase().includes('distributor') || title.toLowerCase().includes('supplier') || isExpense) {
        return {
          icon: 'local_shipping',
          iconBg: '#EAF0F6',
          iconColor: '#3A86C8',
        };
      } else if (title.toLowerCase().includes('loan') || title.toLowerCase().includes('disbursement')) {
        return {
          icon: 'account_balance',
          iconBg: '#FDF2E2',
          iconColor: '#895100',
        };
      } else {
        return {
          icon: 'qr_code_2',
          iconBg: '#FDF2E2',
          iconColor: '#D4820A',
        };
      }
    };

    return (
      <View style={styles.dashboardContainer}>
        {/* Top welcome row */}
        <View style={styles.vendorHeader}>
          <View style={styles.vendorHeaderLeft}>
            <View style={styles.vendorAvatarContainer}>
              <Image 
                alt="Vendor Profile Picture" 
                style={styles.vendorAvatar} 
                source={{ uri: user?.selfie || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBp-aRKkGDKeuwqhPEmq7g1UC6fAJe7VnCjIBkl8xQ_owajzWgfUPWgUMJOIyoiN0LKTUspoZaFUGMsePMDyMvyc8wOY0Ht8h_r-OZXBP_HQCuvHb2y_yMdS0aE_gbQkkTv3Lfk4ygKkKjRhjN_MvU6GCEuVhiMMajr7ZRd8kQ8WKCxD3dRBu_V3DmsoDaRhR4lC0m7DzQz96jcsebEXvsWN9aBxHGSMpo1wqkYa05F8THygZ30zTg55ArV1Ig9JnHR1x12es4h9pO8' }} 
              />
            </View>
            <Text style={styles.vendorWelcomeText}>Good Morning, {user?.name?.split(' ')[0] || 'Raju'} 👋</Text>
          </View>
          <Pressable 
            onPress={() => setNotificationsModalVisible(true)} 
            style={({ pressed }) => [styles.vendorNotifyBtn, { opacity: pressed ? 0.8 : 1 }]}
          >
            <SymbolView tintColor="#895100" name="notifications" size={24} />
            <View style={styles.vendorNotifyBadge} />
          </Pressable>
        </View>

        {/* TrustScore™ Hero Card */}
        <LinearGradient
          colors={['#1A3A4A', '#0F2430']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroCardVector} />
          <Text style={styles.heroLabel}>YOUR TRUSTSCORE™</Text>
          
          {/* Semicircular Gauge */}
          <View style={styles.gaugeWrapper}>
            <Svg height={80} width={160} style={styles.gaugeSvg}>
              <Path
                d="M 10 80 A 70 70 0 0 1 150 80"
                fill="none"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeLinecap="round"
                strokeWidth={12}
              />
              <Path
                d="M 10 80 A 70 70 0 0 1 150 80"
                fill="none"
                stroke={gaugeColor}
                strokeLinecap="round"
                strokeWidth={12}
                strokeDasharray={[220]}
                strokeDashoffset={gaugeOffset}
              />
            </Svg>
            <Text style={styles.gaugeScoreText}>{isCalculating ? '...' : currentScore}</Text>
          </View>

          {/* Standing & Trend Badge */}
          <View style={styles.badgeRow}>
            <View style={[styles.standingBadge, { backgroundColor: standingBg }]}>
              <Text style={[styles.standingBadgeText, { color: standingColor }]}>{standingText}</Text>
            </View>
            <Text style={styles.trendText}>↑ +18 this month</Text>
          </View>

          <View style={styles.heroDivider} />

          {/* Stats Row */}
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>DAILY AVG</Text>
              <Text style={styles.heroStatValue}>₹{dailyAvg}</Text>
            </View>
            <View style={[styles.heroStatItem, { alignItems: 'center' }]}>
              <Text style={styles.heroStatLabel}>ACTIVE DAYS</Text>
              <Text style={styles.heroStatValue}>{activeDays}</Text>
            </View>
            <View style={[styles.heroStatItem, { alignItems: 'flex-end' }]}>
              <Text style={styles.heroStatLabel}>SUPPLIERS</Text>
              <Text style={styles.heroStatValue}>{supplierCount}</Text>
            </View>
          </View>
        </LinearGradient>


        {/* Pre-Approved Loan Banner */}
        <View style={styles.loanBanner}>
          <View>
            <Text style={styles.loanBannerSubtitle}>Pre-Approved Limit</Text>
            <Text style={styles.loanBannerTitle}>Eligible for ₹50,000</Text>
          </View>
          <Pressable 
            onPress={() => setLoanModalVisible(true)}
            style={({ pressed }) => [styles.loanBannerBtn, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={styles.loanBannerBtnText}>Check Offer →</Text>
          </Pressable>
        </View>

        {/* Recent Activity Section */}
        <View style={styles.activityHeaderRow}>
          <Text style={styles.activitySectionTitle}>Recent Activity</Text>
          <Pressable onPress={() => showToast('ℹ️ Displaying recent ledger items.')}>
            <Text style={styles.activitySeeAll}>See All</Text>
          </Pressable>
        </View>

        <View style={styles.activityListContainer}>
          {activities.map((item) => {
            const actStyle = getActivityStyle(item.title, item.amount);
            const isPositive = item.amount.startsWith('+');
            return (
              <View key={item.id} style={styles.activityCard}>
                <View style={styles.activityLeft}>
                  <View style={[styles.activityIconContainer, { backgroundColor: actStyle.iconBg }]}>
                    <SymbolView tintColor={actStyle.iconColor} name={actStyle.icon} size={20} />
                  </View>
                  <View>
                    <Text style={styles.activityItemTitle}>{item.title}</Text>
                    <Text style={styles.activityItemDate}>{item.date}</Text>
                  </View>
                </View>
                <Text style={[styles.activityItemAmount, { color: isPositive ? '#2D7D46' : '#C0392B' }]}>
                  {item.amount}
                </Text>
              </View>
            );
          })}
        </View>

        {/* AI Insight Section */}
        {activeTrustScoreData?.score_explanation ? (
          <View style={styles.insightBox}>
            <SparkleWatermark />
            <View style={styles.insightHeader}>
              <SparkleIcon size={16} />
              <Text style={styles.insightTitle}>TRUSTSCORE™ INSIGHT</Text>
            </View>
            <Text style={styles.insightText}>
              {activeTrustScoreData.score_explanation}
            </Text>
          </View>
        ) : (
          <View style={styles.insightBox}>
            <SparkleWatermark />
            <View style={styles.insightHeader}>
              <SparkleIcon size={16} />
              <Text style={styles.insightTitle}>AI INSIGHT</Text>
            </View>
            <Text style={styles.insightText}>
              Your Tuesday sales are <Text style={styles.boldText}>40% higher</Text> — consider restocking your inventory on Mondays to meet peak demand.
            </Text>
            <Pressable 
              style={styles.insightLinkBtn} 
              onPress={() => setReportModalVisible(true)}
            >
              <Text style={styles.insightLinkLabel}>View Full Report </Text>
              <SymbolView tintColor="#895100" name="arrow_forward" size={14} />
            </Pressable>
          </View>
        )}
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

        {/* Global Sign Out Button for Lender only (since vendor has it in Account tab) */}
        <Pressable
          style={({ pressed }) => [
            styles.signOutButton,
            { borderColor: '#E8E0D5', opacity: pressed ? 0.8 : 1.0 },
          ]}
          onPress={signOut}>
          <SymbolView tintColor="#C0392B" name="arrow.right.to.line" size={18} style={{ marginRight: 6 }} />
          <Text style={[styles.signOutText, { color: '#C0392B' }]}>Sign Out Profile</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F9F5EF' }]}>
      {toastMessage && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
        
        {user?.role === 'LENDER' ? renderLenderDashboard() : renderVendorDashboard()}

      </ScrollView>

      <BottomTabBar 
        activeTab="home"
        userRole={user?.role}
        onCenterPress={() => setLedgerModalVisible(true)}
        onHistoryPress={() => setNotificationsModalVisible(true)}
        onAccountPress={() => setAccountModalVisible(true)}
      />

      {/* -------------------- MODALS -------------------- */}

      {/* 1. Record Sale Modal */}
      <Modal
        visible={ledgerModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setLedgerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCardContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitleText}>Record Sale Entry</Text>
              <Pressable onPress={() => setLedgerModalVisible(false)} style={styles.modalCloseBtn}>
                <SymbolView tintColor="#1c1c18" name="xmark" size={20} />
              </Pressable>
            </View>
            
            <Text style={styles.inputLabel}>SALE AMOUNT (₹)</Text>
            <TextInput
              style={styles.customModalInput}
              placeholder="Enter amount, e.g. 1500"
              placeholderTextColor="#A0A0A0"
              keyboardType="numeric"
              value={saleAmount}
              onChangeText={setSaleAmount}
            />
            
            <Text style={styles.inputLabel}>DESCRIPTION / NOTES</Text>
            <TextInput
              style={styles.customModalInput}
              placeholder="e.g. Store Sale: UPI or Cash items"
              placeholderTextColor="#A0A0A0"
              value={saleDesc}
              onChangeText={setSaleDesc}
            />
            
            <TouchableOpacity 
              style={[styles.modalPrimaryBtn, isCalculating && { opacity: 0.7 }]} 
              onPress={handleRecordSale}
              disabled={isCalculating}
            >
              <Text style={styles.modalPrimaryBtnText}>
                {isCalculating ? 'AI is calculating...' : 'Save Entry'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 2. Apply Loan Modal */}
      <Modal
        visible={loanModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setLoanModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCardContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitleText}>Apply Loan</Text>
              <Pressable onPress={() => setLoanModalVisible(false)} style={styles.modalCloseBtn}>
                <SymbolView tintColor="#1c1c18" name="xmark" size={20} />
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>LOAN AMOUNT ELIGIBILITY</Text>
            <View style={styles.preApprovedBadge}>
              <Text style={styles.preApprovedBadgeText}>Pre-Approved Limit: ₹50,000</Text>
            </View>

            <Text style={styles.inputLabel}>ENTER LOAN AMOUNT (₹)</Text>
            <TextInput
              style={styles.customModalInput}
              placeholder="e.g. 50000"
              placeholderTextColor="#A0A0A0"
              keyboardType="numeric"
              value={loanAmount}
              onChangeText={setLoanAmount}
            />

            <Text style={styles.inputLabel}>SELECT TENURE</Text>
            <View style={styles.tenureRow}>
              <Pressable 
                onPress={() => setLoanTenure(3)}
                style={[styles.tenureOption, loanTenure === 3 && styles.tenureOptionActive]}
              >
                <Text style={[styles.tenureOptionText, loanTenure === 3 && styles.tenureOptionTextActive]}>3 Months</Text>
                <Text style={[styles.tenureSubtext, loanTenure === 3 && styles.tenureSubtextActive]}>@ 12% p.a.</Text>
              </Pressable>
              <Pressable 
                onPress={() => setLoanTenure(6)}
                style={[styles.tenureOption, loanTenure === 6 && styles.tenureOptionActive]}
              >
                <Text style={[styles.tenureOptionText, loanTenure === 6 && styles.tenureOptionTextActive]}>6 Months</Text>
                <Text style={[styles.tenureSubtext, loanTenure === 6 && styles.tenureSubtextActive]}>@ 12% p.a.</Text>
              </Pressable>
            </View>

            <View style={styles.repaymentSummaryCard}>
              <Text style={styles.repaymentSummaryTitle}>ESTIMATED REPAYMENT DETAIL</Text>
              <View style={styles.repaymentSummaryRow}>
                <Text style={styles.repaymentDetailLabel}>Monthly EMI</Text>
                <Text style={styles.repaymentDetailVal}>
                  ₹{loanTenure === 3 ? '16,995' : '8,625'} / mo
                </Text>
              </View>
              <View style={styles.repaymentSummaryRow}>
                <Text style={styles.repaymentDetailLabel}>Total Payback</Text>
                <Text style={styles.repaymentDetailVal}>
                  ₹{loanTenure === 3 ? '50,985' : '51,750'}
                </Text>
              </View>
            </View>

            <Text style={styles.disbursementTargetText}>
              Disbursing directly to SBI Account (Ending in **** 4321)
            </Text>

            <Pressable style={styles.modalPrimaryBtn} onPress={handleApplyLoan}>
              <Text style={styles.modalPrimaryBtnText}>Confirm & Disburse</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* 3. Link Supplier Modal */}
      <Modal
        visible={supplierModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSupplierModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCardContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitleText}>Link Supplier</Text>
              <Pressable onPress={() => setSupplierModalVisible(false)} style={styles.modalCloseBtn}>
                <SymbolView tintColor="#1c1c18" name="xmark" size={20} />
              </Pressable>
            </View>

            <Text style={styles.infoBoxText}>
              Linking your regular wholesale suppliers helps compile transaction behavior directly. This builds a strong alternative credit profile to increase your pre-approved loan limits.
            </Text>

            <Text style={styles.inputLabel}>SUPPLIER / DISTRIBUTOR NAME</Text>
            <TextInput
              style={styles.customModalInput}
              placeholder="e.g. Amul Distributors or Tata Tea Corp"
              placeholderTextColor="#A0A0A0"
              value={supplierName}
              onChangeText={setSupplierName}
            />

            <Text style={styles.inputLabel}>SUPPLIER CLIENT ID (OPTIONAL)</Text>
            <TextInput
              style={styles.customModalInput}
              placeholder="e.g. GSTIN or Wholesaler Account Number"
              placeholderTextColor="#A0A0A0"
            />

            <Pressable style={styles.modalPrimaryBtn} onPress={handleLinkSupplier}>
              <Text style={styles.modalPrimaryBtnText}>Link Supplier Profile</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* 4. My Docs Modal */}
      <Modal
        visible={docsModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDocsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCardContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitleText}>My Documents</Text>
              <Pressable onPress={() => setDocsModalVisible(false)} style={styles.modalCloseBtn}>
                <SymbolView tintColor="#1c1c18" name="xmark" size={20} />
              </Pressable>
            </View>

            <ScrollView style={styles.docsScrollView} showsVerticalScrollIndicator={false}>
              <Text style={styles.docSectionTitle}>VERIFIED SELFIE</Text>
              <View style={styles.docImageWrapper}>
                <Image 
                  style={styles.docImageSelfie}
                  source={{ uri: user?.selfie || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBp-aRKkGDKeuwqhPEmq7g1UC6fAJe7VnCjIBkl8xQ_owajzWgfUPWgUMJOIyoiN0LKTUspoZaFUGMsePMDyMvyc8wOY0Ht8h_r-OZXBP_HQCuvHb2y_yMdS0aE_gbQkkTv3Lfk4ygKkKjRhjN_MvU6GCEuVhiMMajr7ZRd8kQ8WKCxD3dRBu_V3DmsoDaRhR4lC0m7DzQz96jcsebEXvsWN9aBxHGSMpo1wqkYa05F8THygZ30zTg55ArV1Ig9JnHR1x12es4h9pO8' }}
                />
              </View>

              <Text style={styles.docSectionTitle}>BUSINESS STOREFRONT PHOTO</Text>
              <View style={styles.docImageWrapper}>
                <Image 
                  style={styles.docImageStorefront}
                  source={{ uri: user?.businessPhoto || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=600' }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 5. View Report Modal (TrustScore Breakdown) */}
      <Modal
        visible={reportModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCardContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitleText}>TrustScore™ Report</Text>
              <Pressable onPress={() => setReportModalVisible(false)} style={styles.modalCloseBtn}>
                <SymbolView tintColor="#1c1c18" name="xmark" size={20} />
              </Pressable>
            </View>

            <View style={styles.reportScoreBanner}>
              <Text style={styles.reportScoreLabel}>CURRENT SCORE</Text>
              <Text style={styles.reportScoreVal}>{user?.score ?? 742} / 1000</Text>
              <Text style={styles.reportScoreSub}>Standing: Good (Top 12% in area)</Text>
            </View>

            <Text style={styles.inputLabel}>BEHAVIORAL RISK FACTORS</Text>
            
            <View style={styles.factorCard}>
              <View style={styles.factorHeader}>
                <Text style={styles.factorTitle}>Supplier Payments</Text>
                <Text style={styles.factorRatingGood}>96% On-Time</Text>
              </View>
              <View style={styles.factorBarBackground}>
                <View style={[styles.factorBarFill, { width: '96%', backgroundColor: '#2D7D46' }]} />
              </View>
            </View>

            <View style={styles.factorCard}>
              <View style={styles.factorHeader}>
                <Text style={styles.factorTitle}>Sales Stability</Text>
                <Text style={styles.factorRatingGood}>High Volume</Text>
              </View>
              <View style={styles.factorBarBackground}>
                <View style={[styles.factorBarFill, { width: '84%', backgroundColor: '#2D7D46' }]} />
              </View>
            </View>

            <View style={styles.factorCard}>
              <View style={styles.factorHeader}>
                <Text style={styles.factorTitle}>UPI Transaction Depth</Text>
                <Text style={styles.factorRatingExcellent}>Strong (26 days active)</Text>
              </View>
              <View style={styles.factorBarBackground}>
                <View style={[styles.factorBarFill, { width: '92%', backgroundColor: '#2D7D46' }]} />
              </View>
            </View>

            <View style={styles.factorCard}>
              <View style={styles.factorHeader}>
                <Text style={styles.factorTitle}>Supplier Linkage</Text>
                <Text style={styles.factorRatingFair}>{supplierCount} Linked</Text>
              </View>
              <View style={styles.factorBarBackground}>
                <View style={[styles.factorBarFill, { width: '60%', backgroundColor: '#CC8600' }]} />
              </View>
            </View>

            <Text style={styles.reportDisclaimer}>
              Calculated in real-time by VendorPASS Behavioral AI based on ledger entries, SMS invoices, and transaction profiles.
            </Text>
          </View>
        </View>
      </Modal>

      {/* 6. Notifications Modal */}
      <Modal
        visible={notificationsModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setNotificationsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCardContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitleText}>Notifications Inbox</Text>
              <Pressable onPress={() => setNotificationsModalVisible(false)} style={styles.modalCloseBtn}>
                <SymbolView tintColor="#1c1c18" name="xmark" size={20} />
              </Pressable>
            </View>

            <View style={styles.notificationInboxList}>
              <View style={styles.notificationItemCard}>
                <View style={styles.notificationHeaderRow}>
                  <Text style={styles.notificationItemTitle}>🎉 TrustScore Updated</Text>
                  <Text style={styles.notificationTime}>Today</Text>
                </View>
                <Text style={styles.notificationBody}>
                  Namaste, Raju. Your TrustScore improved by 18 points this month. Your rating type is now Good Standing!
                </Text>
              </View>

              <View style={styles.notificationItemCard}>
                <View style={styles.notificationHeaderRow}>
                  <Text style={styles.notificationItemTitle}>💰 Loan Limit Approved</Text>
                  <Text style={styles.notificationTime}>Yesterday</Text>
                </View>
                <Text style={styles.notificationBody}>
                  Pre-approved cash credit line of ₹50,000 is ready for instant disbursement. Get money in your bank account in 2 minutes.
                </Text>
              </View>

              <View style={styles.notificationItemCard}>
                <View style={styles.notificationHeaderRow}>
                  <Text style={styles.notificationItemTitle}>✅ Registration Active</Text>
                  <Text style={styles.notificationTime}>Oct 24</Text>
                </View>
                <Text style={styles.notificationBody}>
                  Your verified selfie and storefront photos have been verified. Welcome to the VendorPASS credit network!
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* 8. Account Modal */}
      <Modal
        visible={accountModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAccountModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCardContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitleText}>My Profile</Text>
              <Pressable onPress={() => setAccountModalVisible(false)} style={styles.modalCloseBtn}>
                <SymbolView tintColor="#1c1c18" name="xmark" size={20} />
              </Pressable>
            </View>

            <View style={styles.profileDetailCard}>
              <View style={styles.profileDetailHeader}>
                <Image 
                  style={styles.profileDetailAvatar}
                  source={{ uri: user?.selfie || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBp-aRKkGDKeuwqhPEmq7g1UC6fAJe7VnCjIBkl8xQ_owajzWgfUPWgUMJOIyoiN0LKTUspoZaFUGMsePMDyMvyc8wOY0Ht8h_r-OZXBP_HQCuvHb2y_yMdS0aE_gbQkkTv3Lfk4ygKkKjRhjN_MvU6GCEuVhiMMajr7ZRd8kQ8WKCxD3dRBu_V3DmsoDaRhR4lC0m7DzQz96jcsebEXvsWN9aBxHGSMpo1wqkYa05F8THygZ30zTg55ArV1Ig9JnHR1x12es4h9pO8' }}
                />
                <View>
                  <Text style={styles.profileDetailName}>{user?.name || 'Raju'}</Text>
                  <Text style={styles.profileDetailRole}>{user?.role || 'VENDOR'} Profile</Text>
                </View>
              </View>
              
              <View style={styles.profileDetailRow}>
                <Text style={styles.profileDetailLabel}>Phone:</Text>
                <Text style={styles.profileDetailValue}>{user?.phone || '9999999999'}</Text>
              </View>
              <View style={styles.profileDetailRow}>
                <Text style={styles.profileDetailLabel}>Email:</Text>
                <Text style={styles.profileDetailValue}>{user?.email || 'vendor@kirana.com'}</Text>
              </View>
            </View>

            <Pressable 
              style={styles.accountActionBtn} 
              onPress={() => {
                setAccountModalVisible(false);
                router.push('/(tabs)/explore');
              }}
            >
              <SymbolView tintColor="#895100" name="graduationcap" size={20} />
              <Text style={styles.accountActionBtnText}>Visit Credit Hub / Explore</Text>
            </Pressable>

            <Pressable style={styles.profileSignOutBtn} onPress={() => {
              setAccountModalVisible(false);
              signOut();
            }}>
              <SymbolView tintColor="#ffffff" name="arrow.right.to.line" size={18} style={{ marginRight: 6 }} />
              <Text style={styles.profileSignOutBtnText}>Sign Out Profile</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  dashboardContainer: {
    flex: 1,
  },
  
  // Custom Toast Notifications
  toastContainer: {
    position: 'absolute',
    top: 40,
    left: 24,
    right: 24,
    backgroundColor: 'rgba(28, 28, 30, 0.95)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
        position: 'fixed' as any,
        top: 24,
        left: '50%' as any,
        transform: 'translateX(-50%)' as any,
        width: 'calc(100% - 48px)' as any,
        maxWidth: 400,
      },
      default: {
        elevation: 6,
      }
    }) as any,
  },
  toastText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },

  // Redesigned Welcome Row
  vendorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  vendorHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vendorAvatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ffdcbc',
  },
  vendorAvatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  vendorWelcomeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#895100',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  vendorNotifyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
      default: { elevation: 2 }
    }) as any,
  },
  vendorNotifyBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C0392B',
  },

  // TrustScore Hero Card
  heroCard: {
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#1A3A4A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 15,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 8px 24px rgba(26,58,74,0.3)',
      },
    }) as any,
  },
  heroCardVector: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  heroLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
    textAlign: 'center',
    marginBottom: 12,
  },
  gaugeWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 88,
    position: 'relative',
    marginBottom: 8,
  },
  gaugeSvg: {
    position: 'absolute',
    top: 0,
  },
  gaugeScoreText: {
    color: '#ffffff',
    fontSize: 48,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'JetBrains Mono' : 'monospace',
    lineHeight: 48,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  standingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  standingBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  trendText: {
    color: '#ffdcbc',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 16,
  },
  heroStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroStatItem: {
    flex: 1,
  },
  heroStatLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.0,
    marginBottom: 4,
  },
  heroStatValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'JetBrains Mono' : 'monospace',
  },

  // Quick Actions Grid
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  actionButtonContainer: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  actionIconButton: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
      },
    }) as any,
  },
  actionButtonLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1c1c18',
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
    lineHeight: 14,
  },

  // Loan Banner
  loanBanner: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#d4820a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
      default: { elevation: 2 }
    }) as any,
  },
  loanBannerSubtitle: {
    fontSize: 13,
    color: '#6B6B6B',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
    marginBottom: 2,
  },
  loanBannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  loanBannerBtn: {
    backgroundColor: 'rgba(212, 130, 10, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  loanBannerBtnText: {
    color: '#d4820a',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },

  // Recent Activity styles
  activityHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  activitySectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c1c18',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  activitySeeAll: {
    fontSize: 14,
    fontWeight: '700',
    color: '#895100',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  activityListContainer: {
    gap: 8,
    marginBottom: 24,
  },
  activityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.03)' },
      default: { elevation: 1 }
    }) as any,
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1E',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  activityItemDate: {
    fontSize: 12,
    color: '#A0A0A0',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
    marginTop: 2,
  },
  activityItemAmount: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'JetBrains Mono' : 'monospace',
  },

  // AI Insight styles
  insightBox: {
    backgroundColor: '#FFF4E6',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#895100',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 24,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#895100',
    letterSpacing: 1.0,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#534435',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
    marginBottom: 12,
  },
  boldText: {
    fontWeight: '700',
    color: '#1C1C1E',
  },
  insightLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightLinkLabel: {
    color: '#895100',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },

  // -------------------- LENDER DASHBOARD STYLES --------------------
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
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginTop: Spacing.three,
    marginBottom: Spacing.three,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
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

  // -------------------- MODALS & POPUPS STYLES --------------------
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    gap: 16,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
      }
    }) as any,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D5',
    paddingBottom: 12,
  },
  modalTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  modalCloseBtn: {
    padding: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#534435',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
    marginBottom: 4,
    marginTop: 8,
  },
  customModalInput: {
    height: 50,
    borderWidth: 1.5,
    borderColor: '#E8E0D5',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#1C1C1E',
    backgroundColor: '#fdf9f3',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  modalPrimaryBtn: {
    height: 50,
    borderRadius: 12,
    backgroundColor: '#895100',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  modalPrimaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },

  // Apply Loan Modal specific styles
  preApprovedBadge: {
    backgroundColor: 'rgba(212, 130, 10, 0.1)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  preApprovedBadgeText: {
    color: '#d4820a',
    fontWeight: '700',
    fontSize: 14,
  },
  tenureRow: {
    flexDirection: 'row',
    gap: 12,
  },
  tenureOption: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E8E0D5',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#fdf9f3',
  },
  tenureOptionActive: {
    borderColor: '#895100',
    backgroundColor: '#ffdcbc40',
  },
  tenureOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#534435',
  },
  tenureOptionTextActive: {
    color: '#895100',
  },
  tenureSubtext: {
    fontSize: 11,
    color: '#A0A0A0',
    marginTop: 2,
  },
  tenureSubtextActive: {
    color: '#895100',
  },
  repaymentSummaryCard: {
    backgroundColor: '#f7f3ed',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  repaymentSummaryTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.0,
    color: '#867463',
  },
  repaymentSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  repaymentDetailLabel: {
    fontSize: 13,
    color: '#6B6B6B',
  },
  repaymentDetailVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  disbursementTargetText: {
    fontSize: 12,
    color: '#867463',
    textAlign: 'center',
    marginTop: 4,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },

  // Link Supplier Modal specific styles
  infoBoxText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#534435',
    backgroundColor: '#FFF4E6',
    borderRadius: 10,
    padding: 12,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },

  // My Docs ScrollView & Images
  docsScrollView: {
    maxHeight: 400,
  },
  docSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#867463',
    marginTop: 16,
    marginBottom: 8,
  },
  docImageWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fdf9f3',
    borderWidth: 1.5,
    borderColor: '#E8E0D5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docImageSelfie: {
    width: 200,
    height: 200,
    resizeMode: 'cover',
  },
  docImageStorefront: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },

  // Report specific styles
  reportScoreBanner: {
    backgroundColor: '#1A3A4A',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  reportScoreLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.0,
  },
  reportScoreVal: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'web' ? 'JetBrains Mono' : 'monospace',
  },
  reportScoreSub: {
    fontSize: 12,
    color: '#ffdcbc',
  },
  factorCard: {
    backgroundColor: '#fdf9f3',
    borderWidth: 1.5,
    borderColor: '#E8E0D5',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  factorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  factorTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  factorRatingGood: {
    fontSize: 12,
    color: '#2D7D46',
    fontWeight: '700',
  },
  factorRatingExcellent: {
    fontSize: 12,
    color: '#2D7D46',
    fontWeight: '700',
  },
  factorRatingFair: {
    fontSize: 12,
    color: '#CC8600',
    fontWeight: '700',
  },
  factorBarBackground: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E8E0D5',
    width: '100%',
  },
  factorBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  reportDisclaimer: {
    fontSize: 11,
    color: '#A0A0A0',
    lineHeight: 14,
    textAlign: 'center',
    marginTop: 8,
  },

  // Notifications Modal Inbox specific styles
  notificationInboxList: {
    gap: 12,
  },
  notificationItemCard: {
    backgroundColor: '#fdf9f3',
    borderWidth: 1.5,
    borderColor: '#E8E0D5',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  notificationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  notificationTime: {
    fontSize: 11,
    color: '#A0A0A0',
  },
  notificationBody: {
    fontSize: 12,
    color: '#534435',
    lineHeight: 16,
  },

  // -------------------- VENDOR CUSTOM FLOATING TAB BAR STYLES --------------------
  floatingTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 20,
    zIndex: 100,
    ...Platform.select({
      ios: {
        paddingBottom: 20,
        height: 100,
      },
      web: {
        position: 'fixed' as any,
        maxWidth: 600,
        alignSelf: 'center',
        left: '50%' as any,
        transform: 'translateX(-50%)' as any,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        boxShadow: '0 -8px 30px rgba(0,0,0,0.06)',
      }
    }) as any,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingTop: 8,
  },
  activeTabCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D4820A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D4820A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  activeTabText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D4820A',
    marginTop: 2,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  inactiveTabText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 6,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  centerTabContainer: {
    width: 64,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerTabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#D4820A',
    justifyContent: 'center',
    alignItems: 'center',
    top: -24,
    shadowColor: '#D4820A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    position: 'absolute',
  },

  // -------------------- NEW MODAL SPECIFIC STYLES --------------------
  walletBalanceCard: {
    backgroundColor: '#1A3A4A',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    gap: 4,
  },
  walletBalanceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.0,
  },
  walletBalanceValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'web' ? 'JetBrains Mono' : 'monospace',
  },
  walletBalanceSub: {
    fontSize: 12,
    color: '#ffdcbc',
    marginTop: 4,
  },
  repaymentStatusBox: {
    backgroundColor: '#fdf9f3',
    borderWidth: 1.5,
    borderColor: '#E8E0D5',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  repaymentStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  repaymentStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  repaymentStatusAmt: {
    fontSize: 15,
    fontWeight: '700',
    color: '#C0392B',
  },
  payNowBtn: {
    height: 40,
    backgroundColor: '#2D7D46',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payNowBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  profileDetailCard: {
    backgroundColor: '#fdf9f3',
    borderWidth: 1.5,
    borderColor: '#E8E0D5',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  profileDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D5',
    paddingBottom: 12,
  },
  profileDetailAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#ffdcbc',
  },
  profileDetailName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  profileDetailRole: {
    fontSize: 12,
    color: '#895100',
    fontWeight: '600',
  },
  profileDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profileDetailLabel: {
    fontSize: 13,
    color: '#6B6B6B',
  },
  profileDetailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  accountActionBtn: {
    flexDirection: 'row',
    height: 50,
    borderWidth: 1.5,
    borderColor: '#E8E0D5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
  },
  accountActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#895100',
  },
  profileSignOutBtn: {
    flexDirection: 'row',
    height: 50,
    backgroundColor: '#C0392B',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSignOutBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
