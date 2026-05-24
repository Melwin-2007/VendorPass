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
import { BottomTabBar, LenderBottomTabBar } from '@/components/BottomTabBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { SymbolView } from '@/components/symbol-view';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import Svg, { Path } from 'react-native-svg';
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
  const [lendersModalVisible, setLendersModalVisible] = useState(false);
  const [loanModalVisible, setLoanModalVisible] = useState(false);
  const [supplierModalVisible, setSupplierModalVisible] = useState(false);
  const [docsModalVisible, setDocsModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);
  const [accountModalVisible, setAccountModalVisible] = useState(false);

  // Lenders data state
  const [availableLenders, setAvailableLenders] = useState<any[]>([]);

  // Modal input states
  const [supplierName, setSupplierName] = useState('');
  
  // Loan proposal states
  const [selectedLender, setSelectedLender] = useState<any>(null);
  const [loanAmount, setLoanAmount] = useState('50000');
  const [proposedInterest, setProposedInterest] = useState('12.5');
  const [loanTenure, setLoanTenure] = useState(3); // in months (3, 6, 12)

  // Real data lists
  const [lenderOffers, setLenderOffers] = useState<any[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);

  // Local metrics state
  const [supplierCount, setSupplierCount] = useState(0);
  const [activeDays, setActiveDays] = useState(0);
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
    {
      id: '101',
      name: 'Meera Sharma',
      score: 842,
      amount: '₹45,000',
      rate: '12% p.a.',
      date: 'Today',
      risk: 'Low Risk',
      note: 'Inventory for festival season sale',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlgj-SJy7IHHN72FxR0ksw9nM_XrQpT4CDw_-cf7XWWW3dGev-D7RrwT5t01Jjh9SC4mPC4V72WbitqBuxaang7oo5_1RNOweXOjkLpUEQiI6VM9qNtBGbdtINFD_1tCcctKfd3S9YQXPcSyZOGjFNvmYK-I3Z1kWnVfeBtMZZfSRlX9Ixyo_i322Hmo4RCrCVfMZUl6pIdFZAF7AUYxALh1sSDJykFkLtVia9Fehqnn39siVkTBQ_F8WeSDNBCMApg9u7YLxNIXlV'
    },
    {
      id: '102',
      name: 'Rajesh G.',
      score: 710,
      amount: '₹1,20,000',
      rate: '14% p.a.',
      date: 'Yesterday',
      risk: 'Mid Risk',
      note: 'Store expansion & renovation',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDzzSuHOpEJn-7xe_AibaeP3BNgyVm1sqY9bXQ5vIYvcq-79NQCh2y_iFSBGk36s3oybmkVsCRLc51jEdrOBqHM5E55whcfLhJqMiK32jyP2wIkyr3jqZ0rDwBbjYxu6IeDiI81XyIwD1nrloftvPQ02rxFV0Qr-0eSMEUYcMaQmUXDwg7sQ-besw5_7gDFh78oFgPGVOUwjNNWBYEH5WYnqwJYKzRUP4bzbta3oOY7dwj7h_8YaJ5zTJA-xv3FC8rhF79eRsCcKXh3'
    }
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

  // Fetch Wallet Transactions globally
  useEffect(() => {
    if (!user) return;
    const fetchTransactions = async () => {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setWalletTransactions(data);
        const balance = data.reduce((acc, t) => t.type === 'ADD' ? acc + Number(t.amount) : acc - Number(t.amount), 0);
        setWalletBalance(balance);
      }
    };

    fetchTransactions();

    const subscription = supabase
      .channel(`wallet_changes_${Date.now()}_${Math.random()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallet_transactions', filter: `user_id=eq.${user.id}` }, () => {
        fetchTransactions();
      })
      .subscribe();
      
    return () => { supabase.removeChannel(subscription); };
  }, [user]);

  // Fetch dynamic lender offers for Lender
  useEffect(() => {
    if (user?.role === 'LENDER') {
      const fetchLenderData = async () => {
        const { data, error } = await supabase
          .from('loan_offers')
          .select('*, profiles!loan_offers_vendor_id_fkey(name, selfie, score)')
          .eq('lender_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching loan offers:', error);
          return;
        }

        if (data) {
          setLenderOffers(data);
        }
      };

      fetchLenderData();

      const subscription = supabase
        .channel(`lender_offers_${Date.now()}_${Math.random()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'loan_offers', filter: `lender_id=eq.${user.id}` }, () => {
          fetchLenderData();
        })
        .subscribe();
      return () => { supabase.removeChannel(subscription); };
    }
  }, [user?.role, user?.id]);

  // Fetch dynamic lender profiles and existing applications for Vendor
  useEffect(() => {
    if (user?.role === 'VENDOR') {
      const fetchVendorData = async () => {
        // 1. Fetch available lenders
        const { data: lendersData, error: lendersError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'LENDER')
          .order('created_at', { ascending: false });

        if (lendersError) {
          console.error('Error fetching lender profiles:', lendersError);
        } else if (lendersData) {
          const mappedLenders = lendersData.map((profile) => ({
            id: profile.id,
            name: profile.name || 'Financial Partner',
            rate: '12% - 15% p.a.',
            maxAmount: '₹5,00,000',
            image: profile.selfie || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop',
          }));
          setAvailableLenders(mappedLenders);
        }

        // 2. Fetch Active Days & Suppliers Metrics
        const { data: profileData } = await supabase
          .from('profiles')
          .select('created_at')
          .eq('id', user.id)
          .single();
        
        if (profileData?.created_at) {
          const createdDate = new Date(profileData.created_at).getTime();
          const diffTime = Math.abs(Date.now() - createdDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setActiveDays(diffDays);
        }

        const { data: offersData } = await supabase
          .from('loan_offers')
          .select('lender_id')
          .eq('vendor_id', user.id)
          .eq('status', 'ACCEPTED');

        if (offersData) {
          const uniqueSuppliers = new Set(offersData.map(o => o.lender_id));
          setSupplierCount(uniqueSuppliers.size);
        }
      };

      fetchVendorData();
    }
  }, [user?.role, user?.id]);

  // Helper for showing a temporary toast notification
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };



  const handleApplyLoan = async () => {
    const amt = parseFloat(loanAmount.replace(/,/g, ''));
    const intRate = parseFloat(proposedInterest) || 12.5;

    if (isNaN(amt) || amt <= 0 || amt > 500000) {
      showToast('❌ Please enter a valid amount');
      return;
    }

    if (!user?.id || !selectedLender?.id) return;

    const { error } = await supabase.from('loan_offers').insert([{
      vendor_id: user.id,
      lender_id: selectedLender.id,
      amount: amt,
      interest_rate: intRate,
      tenure: `${loanTenure} Months`,
      status: 'PENDING'
    }]);

    setLoanModalVisible(false);
    
    if (error) {
      console.error("Insert error", error);
      showToast('❌ Failed to send proposal.');
    } else {
      const lenderName = selectedLender?.name || 'Lender';
      showToast(`✅ Proposal sent to ${lenderName}!`);
    }
    setSelectedLender(null);
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

  const handleApproveCredit = async (id: string, amount: number, vendorId: string) => {
    if (!user) return;
    const { error } = await supabase.from('loan_offers').update({ status: 'ACCEPTED', accepted_at: new Date().toISOString() }).eq('id', id);
    if (error) {
      showToast('❌ Failed to approve loan.');
    } else {
      const { data: lenderData } = await supabase.from('profiles').select('name').eq('id', user.id).single();
      const { data: vendorData } = await supabase.from('profiles').select('name').eq('id', vendorId).single();
      const lenderName = lenderData?.name || 'Lender';
      const vendorName = vendorData?.name || 'Vendor';

      // 1. Send transaction for Lender
      await supabase.from('wallet_transactions').insert({
        user_id: user.id,
        amount: amount,
        type: 'SEND',
        description: `Loan Disbursement to ${vendorName}`
      });
      // 2. Add transaction for Vendor
      await supabase.from('wallet_transactions').insert({
        user_id: vendorId,
        amount: amount,
        type: 'ADD',
        description: `Loan Received from ${lenderName}`
      });
      showToast('✅ Loan approved & disbursed!');
    }
  };

  const handleDeclineCredit = async (id: string) => {
    const { error } = await supabase.from('loan_offers').update({ status: 'DECLINED' }).eq('id', id);
    if (error) {
      showToast('❌ Failed to decline loan.');
    } else {
      showToast('ℹ️ Loan application declined.');
    }
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
      if (isExpense) {
        return {
          icon: 'arrow.up',
          iconBg: '#F9EBEA',
          iconColor: '#C0392B',
        };
      } else {
        return {
          icon: 'arrow.down',
          iconBg: '#E8F6F3',
          iconColor: '#2D7D46',
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
              <Text style={styles.heroStatLabel}>WALLET BALANCE</Text>
              <Text style={styles.heroStatValue}>₹{walletBalance.toLocaleString('en-IN')}</Text>
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




        {/* Recent Activity Section */}
        <View style={styles.activityHeaderRow}>
          <Text style={styles.activitySectionTitle}>Recent Activity</Text>
          <Pressable onPress={() => showToast('ℹ️ Displaying recent ledger items.')}>
            <Text style={styles.activitySeeAll}>See All</Text>
          </Pressable>
        </View>

        <View style={styles.activityListContainer}>
          {walletTransactions.length > 0 ? walletTransactions.map((item) => {
            const isPositive = item.type === 'ADD';
            return (
              <View key={item.id} style={styles.activityCard}>
                <View style={styles.activityLeft}>
                  <View style={[styles.activityIconContainer, { backgroundColor: isPositive ? '#E8F6F3' : '#F9EBEA' }]}>
                    <SymbolView tintColor={isPositive ? '#2D7D46' : '#C0392B'} name={isPositive ? 'arrow.down' : 'arrow.up'} size={20} />
                  </View>
                  <View>
                    <Text style={styles.activityItemTitle}>{item.description || item.type}</Text>
                    <Text style={styles.activityItemDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
                  </View>
                </View>
                <Text style={[styles.activityItemAmount, { color: isPositive ? '#2D7D46' : '#C0392B' }]}>
                  {isPositive ? '+' : '-'} ₹{Number(item.amount).toLocaleString('en-IN')}
                </Text>
              </View>
            );
          }) : (
            <Text style={{ textAlign: 'center', color: '#A0A0A0', marginVertical: 20 }}>No transactions yet.</Text>
          )}
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

  const renderLenderTopAppBar = () => {
    return (
      <View style={styles.lenderNavBar}>
        <View style={styles.lenderNavLeft}>
          <View style={styles.lenderNavAvatarContainer}>
            <Image
              alt="Suresh Profile"
              style={styles.lenderNavAvatar}
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA3hLQjdNWbXnIL9iJKiflOBCYQepD67FLny_XMmVvlbMB1INZ9WOVcww8F1O4yV41f5Vj8zm04GtGfxxTE1mAjFWoqtdOF6RTJc0WyDnAWWqPm9jQUcIwNqUL-XnH0TN0cXlwmDsy3EMjKDqBMeYoY6oKSwui1Xnicj61EaQbPSo0gUOifnx5TIcDCQ0GlRoCPmOb67C5r0A6TOnL0GTv_KRoBnCSrvmnb41itPQhebSP-u9C4jgXRvLXXIVMlbFBDWfSqRcqRDSzI' }}
            />
            <View style={styles.lenderVerifiedBadge}>
              <Text style={styles.lenderVerifiedText}>VERIFIED</Text>
            </View>
          </View>
          <View>
            <Text style={styles.lenderWelcomeGreeting}>Welcome Back,</Text>
            <Text style={styles.lenderWelcomeName}>{user?.name?.split(' ')[0] || 'Suresh'} 👋</Text>
          </View>
        </View>
        <View style={styles.lenderNavRight}>
          <Pressable 
            onPress={() => showToast('ℹ️ Notification center opened.')}
            style={styles.lenderNavIconBtn}
          >
            <SymbolView name="notifications" size={24} tintColor="#534435" />
            <View style={styles.lenderNavBadge} />
          </Pressable>
          <Pressable 
            onPress={() => showToast('ℹ️ Settings opened.')}
            style={styles.lenderNavIconBtn}
          >
            <SymbolView name="settings" size={24} tintColor="#534435" />
          </Pressable>
        </View>
      </View>
    );
  };



  const renderLenderDashboard = () => {
    const acceptedOffers = lenderOffers.filter(o => o.status === 'ACCEPTED');
    const pendingOffers = lenderOffers.filter(o => o.status === 'PENDING');
    
    const totalCapital = acceptedOffers.reduce((sum, o) => sum + Number(o.amount), 0);
    const activeLoansCount = acceptedOffers.length;
    const avgReturn = activeLoansCount > 0 
      ? (acceptedOffers.reduce((sum, o) => sum + Number(o.interest_rate), 0) / activeLoansCount).toFixed(1)
      : '0.0';

    return (
      <View style={styles.lenderDashboardContainer}>
        {/* Hero Portfolio Card */}
        <LinearGradient
          colors={['#1A3A4A', '#0F2430', '#0A1A24']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.lenderHeroCard}
        >
          <View style={styles.lenderHeroContent}>
            <Text style={styles.lenderHeroLabel}>TOTAL CAPITAL DEPLOYED</Text>
            <View style={styles.lenderHeroAmountRow}>
              <Text style={styles.lenderHeroCurrency}>₹</Text>
              <Text style={styles.lenderHeroValue}>{totalCapital.toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.lenderHeroDivider} />

            <View style={styles.lenderHeroStatsRow}>
              <View style={styles.lenderHeroStatItem}>
                <Text style={styles.lenderHeroStatLabel}>ACTIVE LOANS</Text>
                <Text style={styles.lenderHeroStatValue}>{activeLoansCount}</Text>
              </View>
              <View style={styles.lenderHeroStatItem}>
                <Text style={styles.lenderHeroStatLabel}>AVG RETURN</Text>
                <Text style={[styles.lenderHeroStatValue, { color: '#ffb86b' }]}>{avgReturn}%</Text>
              </View>
              <View style={styles.lenderHeroStatItem}>
                <Text style={styles.lenderHeroStatLabel}>WALLET BALANCE</Text>
                <Text style={styles.lenderHeroStatValue}>₹{(walletBalance || 0).toLocaleString('en-IN')}</Text>
              </View>
            </View>

            {/* Sparkline Visualizer */}
            <View style={styles.sparklineContainer}>
              <View style={[styles.sparklineBar, { height: '40%' }]} />
              <View style={[styles.sparklineBar, { height: '60%' }]} />
              <View style={[styles.sparklineBar, { height: '80%' }]} />
              <View style={[styles.sparklineBar, { height: '50%' }]} />
              <View style={[styles.sparklineBar, { height: '90%' }]} />
              <View style={[styles.sparklineBar, { height: '70%' }]} />
              <View style={[styles.sparklineBar, { height: '100%', backgroundColor: '#ffb86b' }]} />
            </View>
          </View>
        </LinearGradient>

        {/* Quick Actions Row */}
        <View style={styles.lenderQuickActions}>
          <Pressable 
            onPress={() => router.push('/(tabs)/explore')}
            style={styles.lenderActionBtn}
          >
            <View style={styles.lenderActionIconBg}>
              <SymbolView name="search" size={24} tintColor="#895100" />
            </View>
            <Text style={styles.lenderActionText}>Browse Vendors</Text>
          </Pressable>

          <Pressable 
            onPress={() => showToast('ℹ️ Apply for new loan limit.')}
            style={styles.lenderActionBtn}
          >
            <View style={[styles.lenderActionIconBg, { backgroundColor: '#d4820a' }]}>
              <SymbolView name="add" size={24} tintColor="#ffffff" />
            </View>
            <Text style={[styles.lenderActionText, { color: '#895100', fontWeight: 'bold' }]}>New Loan</Text>
          </Pressable>

          <Pressable 
            onPress={() => showToast('ℹ️ Portfolio tracker.')}
            style={styles.lenderActionBtn}
          >
            <View style={styles.lenderActionIconBg}>
              <SymbolView name="pie_chart" size={24} tintColor="#534435" />
            </View>
            <Text style={styles.lenderActionText}>Portfolio</Text>
          </Pressable>

          <Pressable 
            onPress={() => showToast('ℹ️ At-Risk loans audit.')}
            style={styles.lenderActionBtn}
          >
            <View style={[styles.lenderActionIconBg, { backgroundColor: 'rgba(192, 57, 43, 0.1)' }]}>
              <SymbolView name="warning" size={24} tintColor="#C0392B" />
            </View>
            <Text style={[styles.lenderActionText, { color: '#C0392B' }]}>At-Risk</Text>
          </Pressable>
        </View>

        {/* Pending Approvals Section */}
        <View style={styles.lenderSectionContainer}>
          <View style={styles.lenderSectionHeader}>
            <View style={styles.lenderSectionTitleRow}>
              <Text style={styles.lenderSectionTitle}>Awaiting Your Decision</Text>
              <View style={styles.lenderBadge}>
                <Text style={styles.lenderBadgeText}>{pendingOffers.length}</Text>
              </View>
            </View>
            <Pressable onPress={() => showToast('Viewing all pending applications.')}>
              <Text style={styles.lenderViewAll}>VIEW ALL</Text>
            </Pressable>
          </View>

          {/* Swipeable cards list */}
          {pendingOffers.length > 0 ? (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.lenderCardsScroll}
            >
              {pendingOffers.map((item) => (
                <View key={item.id} style={styles.lenderCard}>
                  <View style={styles.lenderCardTop}>
                    <View style={styles.lenderCardUser}>
                      <Image
                        style={styles.lenderCardAvatar}
                        source={{ uri: item.profiles?.selfie || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop' }}
                      />
                      <View>
                        <Text style={styles.lenderCardName}>{item.profiles?.name || 'Vendor'}</Text>
                        <View style={styles.lenderCardTrustRow}>
                          <SymbolView name="verified_user" size={12} tintColor="#2D7D46" />
                          <Text style={styles.lenderCardTrustText}>TrustScore {item.profiles?.score || 600}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={[styles.lenderRiskBadge, styles.lenderRiskLow]}>
                      <Text style={[styles.lenderRiskText, { color: '#2D7D46' }]}>Low Risk</Text>
                    </View>
                  </View>

                  <View style={styles.lenderCardDetails}>
                    <Text style={styles.lenderCardDetailsLabel}>REQUESTING</Text>
                    <Text style={styles.lenderCardDetailsAmount}>₹{Number(item.amount).toLocaleString('en-IN')}</Text>
                    <Text style={styles.lenderCardDetailsNote}>{item.tenure} @ {item.interest_rate}% p.a.</Text>
                  </View>

                  <View style={styles.lenderCardActions}>
                    <Pressable 
                      onPress={() => handleDeclineCredit(item.id)}
                      style={styles.lenderDeclineBtn}
                    >
                      <Text style={styles.lenderDeclineBtnText}>DECLINE</Text>
                    </Pressable>
                    <Pressable 
                      onPress={() => handleApproveCredit(item.id, Number(item.amount), item.vendor_id)}
                      style={styles.lenderApproveBtn}
                    >
                      <Text style={styles.lenderApproveBtnText}>APPROVE</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.lenderEmptyCard}>
              <SymbolView name="checkmark.circle" size={40} tintColor="#6B6B6B" />
              <Text style={styles.lenderEmptyText}>No pending applications right now.</Text>
            </View>
          )}
        </View>

        {/* Active Loans Feed */}
        <View style={styles.lenderSectionContainer}>
          <View style={styles.lenderSectionHeader}>
            <Text style={styles.lenderSectionTitle}>Active Loans Feed</Text>
            <SymbolView name="filter_list" size={20} tintColor="#534435" />
          </View>

          <View style={styles.lenderActiveFeed}>
            {acceptedOffers.length > 0 ? (
              acceptedOffers.map((loan, index) => {
                const emi = Math.round((Number(loan.amount) * (1 + Number(loan.interest_rate) / 100)) / parseInt(loan.tenure));
                return (
                  <View key={loan.id} style={styles.lenderActiveCard}>
                    <View style={styles.lenderActiveCardTop}>
                      <View style={styles.lenderActiveIconRow}>
                        <View style={styles.lenderActiveIconBg}>
                          <Image source={{ uri: loan.profiles?.selfie || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop' }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                        </View>
                        <View style={{ marginLeft: 8 }}>
                          <Text style={styles.lenderActiveName}>{loan.profiles?.name || 'Vendor'}</Text>
                          <Text style={styles.lenderActiveDue}>EMI: ₹{emi.toLocaleString('en-IN')}/mo</Text>
                        </View>
                      </View>
                      <View style={styles.lenderActiveRight}>
                        <Text style={styles.lenderActiveAmount}>₹{Number(loan.amount).toLocaleString('en-IN')}</Text>
                        <View style={styles.lenderActiveBadgeGreen}>
                          <Text style={styles.lenderActiveBadgeTextGreen}>ON TRACK</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.lenderProgressContainer}>
                      <View style={styles.lenderProgressLabelRow}>
                        <Text style={styles.lenderProgressLabel}>{loan.tenure.toUpperCase()}</Text>
                        <Text style={styles.lenderProgressLabel}>NEW</Text>
                      </View>
                      <View style={styles.lenderProgressBarBg}>
                        <View style={[styles.lenderProgressBarFill, { width: '10%', backgroundColor: '#2D7D46' }]} />
                      </View>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.lenderEmptyCard}>
                <SymbolView name="inventory_2" size={40} tintColor="#6B6B6B" />
                <Text style={styles.lenderEmptyText}>No active loans found.</Text>
              </View>
            )}
          </View>
        </View>

        {/* Global Sign Out Button for Lender only */}
        <Pressable
          style={({ pressed }) => [
            styles.lenderSignOutBtn,
            { opacity: pressed ? 0.8 : 1.0 },
          ]}
          onPress={signOut}>
          <SymbolView tintColor="#C0392B" name="arrow.right.to.line" size={18} style={{ marginRight: 6 }} />
          <Text style={styles.lenderSignOutText}>Sign Out Lender Profile</Text>
        </Pressable>
      </View>
    );
  };

  const isLender = user?.role === 'LENDER';

  return (
    <View style={[styles.container, { backgroundColor: isLender ? '#fdf9f3' : '#F9F5EF' }]}>
      {toastMessage && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {isLender && renderLenderTopAppBar()}

      <ScrollView
        style={[
          styles.scrollView,
          isLender && { marginTop: 64, marginBottom: 80 }
        ]}
        contentContainerStyle={[
          styles.contentContainer,
          contentPlatformStyle,
          isLender && { paddingTop: 16, paddingBottom: 32 }
        ]}>
        
        {isLender ? renderLenderDashboard() : renderVendorDashboard()}

      </ScrollView>

      {isLender ? (
        <LenderBottomTabBar activeTab="home" />
      ) : (
        <BottomTabBar 
          activeTab="home"
          userRole={user?.role}
          onCenterPress={() => setLendersModalVisible(true)}

          onAccountPress={() => setAccountModalVisible(true)}
        />
      )}

      {/* -------------------- MODALS -------------------- */}

      {/* 1. Available Lenders Modal */}
      <Modal
        visible={lendersModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setLendersModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCardContainer, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitleText}>Available Lenders</Text>
              <Pressable onPress={() => setLendersModalVisible(false)} style={styles.modalCloseBtn}>
                <SymbolView tintColor="#1c1c18" name="xmark" size={20} />
              </Pressable>
            </View>
            
            {availableLenders.length > 0 ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                {availableLenders.map((lender) => (
                  <View key={lender.id} style={styles.lenderListCard}>
                    <View style={styles.lenderListCardTop}>
                      <Image source={{ uri: lender.image }} style={styles.lenderListAvatar} />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.lenderListName}>{lender.name}</Text>
                        <Text style={styles.lenderListSub}>Max Limit: {lender.maxAmount}</Text>
                        <Text style={styles.lenderListSub}>Rates: {lender.rate}</Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={styles.lenderListApplyBtn}
                      onPress={() => {
                        setSelectedLender(lender);
                        setLendersModalVisible(false);
                        setTimeout(() => setLoanModalVisible(true), 300);
                      }}
                    >
                      <Text style={styles.lenderListApplyBtnText}>Apply Now</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.lenderEmptyCard}>
                <SymbolView name="business" size={40} tintColor="#6B6B6B" />
                <Text style={styles.lenderEmptyText}>No lenders available right now.</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* 2. Submit Proposal Modal */}
      <Modal
        visible={loanModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setLoanModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCardContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitleText}>Proposal to {selectedLender?.name?.split(' ')[0] || 'Lender'}</Text>
              <Pressable onPress={() => setLoanModalVisible(false)} style={styles.modalCloseBtn}>
                <SymbolView tintColor="#1c1c18" name="xmark" size={20} />
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>REQUESTED LOAN AMOUNT (₹)</Text>
            <TextInput
              style={styles.customModalInput}
              placeholder="e.g. 50000"
              placeholderTextColor="#A0A0A0"
              keyboardType="numeric"
              value={loanAmount}
              onChangeText={setLoanAmount}
            />

            <Text style={styles.inputLabel}>PROPOSED INTEREST RATE (% p.a.)</Text>
            <TextInput
              style={styles.customModalInput}
              placeholder="e.g. 12.5"
              placeholderTextColor="#A0A0A0"
              keyboardType="numeric"
              value={proposedInterest}
              onChangeText={setProposedInterest}
            />

            <Text style={styles.inputLabel}>SELECT TENURE</Text>
            <View style={styles.tenureRow}>
              <Pressable 
                onPress={() => setLoanTenure(3)}
                style={[styles.tenureOption, loanTenure === 3 && styles.tenureOptionActive]}
              >
                <Text style={[styles.tenureOptionText, loanTenure === 3 && styles.tenureOptionTextActive]}>3 Mo</Text>
              </Pressable>
              <Pressable 
                onPress={() => setLoanTenure(6)}
                style={[styles.tenureOption, loanTenure === 6 && styles.tenureOptionActive]}
              >
                <Text style={[styles.tenureOptionText, loanTenure === 6 && styles.tenureOptionTextActive]}>6 Mo</Text>
              </Pressable>
              <Pressable 
                onPress={() => setLoanTenure(12)}
                style={[styles.tenureOption, loanTenure === 12 && styles.tenureOptionActive]}
              >
                <Text style={[styles.tenureOptionText, loanTenure === 12 && styles.tenureOptionTextActive]}>12 Mo</Text>
              </Pressable>
            </View>

            <View style={styles.repaymentSummaryCard}>
              <Text style={styles.repaymentSummaryTitle}>ESTIMATED REPAYMENT DETAIL</Text>
              <View style={styles.repaymentSummaryRow}>
                <Text style={styles.repaymentDetailLabel}>Monthly EMI</Text>
                <Text style={styles.repaymentDetailVal}>
                  ₹{Math.round((parseFloat(loanAmount) || 0) * (1 + (parseFloat(proposedInterest) || 0) / 100) / loanTenure).toLocaleString('en-IN')} / mo
                </Text>
              </View>
              <View style={styles.repaymentSummaryRow}>
                <Text style={styles.repaymentDetailLabel}>Total Payback</Text>
                <Text style={styles.repaymentDetailVal}>
                  ₹{Math.round((parseFloat(loanAmount) || 0) * (1 + (parseFloat(proposedInterest) || 0) / 100)).toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            <Text style={styles.disbursementTargetText}>
              By submitting this proposal, the lender will review your profile.
            </Text>

            <Pressable style={styles.modalPrimaryBtn} onPress={handleApplyLoan}>
              <Text style={styles.modalPrimaryBtnText}>Submit Proposal</Text>
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

  // -------------------- LENDER OVERHAUL STYLES --------------------
  lenderNavBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: '#fdf9f3',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 100,
  },
  lenderNavLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lenderNavAvatarContainer: {
    position: 'relative',
    width: 40,
    height: 40,
  },
  lenderNavAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#895100',
  },
  lenderVerifiedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#2D7D46',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  lenderVerifiedText: {
    color: '#ffffff',
    fontSize: 6,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  lenderWelcomeGreeting: {
    fontSize: 10,
    color: '#6B6B6B',
    textTransform: 'uppercase',
    letterSpacing: 1.0,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  lenderWelcomeName: {
    fontSize: 16,
    color: '#895100',
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  lenderNavRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  lenderNavIconBtn: {
    position: 'relative',
  },
  lenderNavBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C0392B',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  lenderBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: '#fdf9f3',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    borderTopColor: '#E8E0D5',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 16,
    paddingTop: 8,
    zIndex: 100,
    ...Platform.select({
      web: {
        position: 'fixed' as any,
        maxWidth: 600,
        alignSelf: 'center',
        left: '50%' as any,
        transform: 'translateX(-50%)' as any,
        boxShadow: '0 -4px 12px rgba(0,0,0,0.06)',
      }
    }) as any,
  },
  lenderBottomBarItem: {
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.6,
  },
  lenderBottomBarItemActive: {
    opacity: 1.0,
  },
  lenderBottomBarText: {
    fontSize: 10,
    color: '#534435',
    marginTop: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  lenderBottomBarTextActive: {
    fontSize: 10,
    color: '#895100',
    marginTop: 4,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  lenderDashboardContainer: {
    flex: 1,
    gap: 24,
  },
  lenderHeroCard: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  lenderHeroContent: {
    zIndex: 10,
  },
  lenderHeroLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 2.0,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  lenderHeroAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 8,
  },
  lenderHeroCurrency: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '500',
    fontFamily: Platform.OS === 'web' ? 'Playfair Display' : 'serif',
  },
  lenderHeroValue: {
    fontSize: 36,
    color: '#ffffff',
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'JetBrains Mono' : 'monospace',
    letterSpacing: -1,
  },
  lenderHeroDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 16,
  },
  lenderHeroStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lenderHeroStatItem: {
    gap: 4,
  },
  lenderHeroStatLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '600',
    letterSpacing: 1.0,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  lenderHeroStatValue: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  sparklineContainer: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    opacity: 0.4,
    marginTop: 16,
    gap: 4,
  },
  sparklineBar: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  lenderQuickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  lenderActionBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  lenderActionIconBg: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#e6e2dc',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  lenderActionText: {
    fontSize: 10,
    color: '#534435',
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  lenderSectionContainer: {
    gap: 16,
  },
  lenderSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lenderSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lenderSectionTitle: {
    fontSize: 16,
    color: '#1c1c18',
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  lenderBadge: {
    backgroundColor: '#ffdcbc',
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  lenderBadgeText: {
    color: '#2c1700',
    fontSize: 10,
    fontWeight: 'bold',
  },
  lenderViewAll: {
    color: '#895100',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.0,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  lenderCardsScroll: {
    gap: 16,
    paddingBottom: 8,
  },
  lenderCard: {
    width: 280,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8E0D5',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    gap: 16,
  },
  lenderCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  lenderCardUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lenderCardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  lenderCardName: {
    fontSize: 14,
    color: '#1c1c18',
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  lenderCardTrustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  lenderCardTrustText: {
    color: '#2D7D46',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  lenderRiskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  lenderRiskLow: {
    backgroundColor: '#E8F6F3',
    borderColor: '#2D7D4630',
  },
  lenderRiskMid: {
    backgroundColor: '#ffddb430',
    borderColor: '#ffddb4',
  },
  lenderRiskText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  lenderCardDetails: {
    gap: 4,
  },
  lenderCardDetailsLabel: {
    fontSize: 10,
    color: '#6B6B6B',
    fontWeight: 'bold',
    letterSpacing: 1.0,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  lenderCardDetailsAmount: {
    fontSize: 24,
    color: '#895100',
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'JetBrains Mono' : 'monospace',
  },
  lenderCardDetailsNote: {
    fontSize: 11,
    color: '#534435',
    fontStyle: 'italic',
    marginTop: 2,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  lenderCardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  lenderDeclineBtn: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8E0D5',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  lenderDeclineBtnText: {
    fontSize: 11,
    color: '#534435',
    fontWeight: 'bold',
    letterSpacing: 1.0,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  lenderApproveBtn: {
    flex: 1.5,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#895100',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#895100',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  lenderApproveBtnText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: 'bold',
    letterSpacing: 1.0,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  lenderEmptyCard: {
    borderWidth: 1.5,
    borderColor: '#E8E0D5',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
  },
  lenderEmptyText: {
    fontSize: 14,
    color: '#6B6B6B',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  lenderActiveFeed: {
    gap: 12,
  },
  lenderActiveCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E8E0D5',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  lenderActiveCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  lenderActiveIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lenderActiveIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e6e2dc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lenderActiveName: {
    fontSize: 14,
    color: '#1c1c18',
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  lenderActiveDue: {
    fontSize: 11,
    color: '#6B6B6B',
    marginTop: 2,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  lenderActiveRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  lenderActiveAmount: {
    fontSize: 14,
    color: '#1c1c18',
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'JetBrains Mono' : 'monospace',
  },
  lenderActiveBadgeGreen: {
    backgroundColor: '#2D7D4615',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lenderActiveBadgeTextGreen: {
    color: '#2D7D46',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  lenderActiveBadgeOrange: {
    backgroundColor: '#89510015',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lenderActiveBadgeTextOrange: {
    color: '#895100',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  lenderActiveBadgeRed: {
    backgroundColor: '#C0392B15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lenderActiveBadgeTextRed: {
    color: '#C0392B',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  lenderProgressContainer: {
    gap: 6,
  },
  lenderProgressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lenderProgressLabel: {
    fontSize: 9,
    color: '#6B6B6B',
    fontWeight: 'bold',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  lenderProgressBarBg: {
    height: 6,
    backgroundColor: '#f1ede7',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  lenderProgressBarFill: {
    height: '100%',
    borderRadius: 9999,
  },
  lenderSignOutBtn: {
    flexDirection: 'row',
    height: 48,
    borderWidth: 1.5,
    borderColor: '#E8E0D5',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  lenderSignOutText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#C0392B',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  lenderListCard: {
    backgroundColor: '#F9F5EF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8E0D5',
  },
  lenderListCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  lenderListAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#D4820A',
  },
  lenderListName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c1c18',
    marginBottom: 4,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  lenderListSub: {
    fontSize: 12,
    color: '#6B6B6B',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  lenderListApplyBtn: {
    backgroundColor: '#D4820A',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  lenderListApplyBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
});
