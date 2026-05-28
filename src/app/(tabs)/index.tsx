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
  ActivityIndicator,
} from 'react-native';
import { BottomTabBar, LenderBottomTabBar } from '@/components/BottomTabBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { SymbolView } from '@/components/symbol-view';
import { router, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import { supabase } from '@/lib/supabase';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { LenderPortfolioCard } from '@/components/LenderPortfolioCard';

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
  const { user, signOut, loading } = useAuth();
  const theme = useTheme();
  const safeAreaInsets = useSafeAreaInsets();
  const { applyLoan } = useLocalSearchParams<{ applyLoan?: string }>();


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
  const [supplierModalVisible, setSupplierModalVisible] = useState(false);
  const [docsModalVisible, setDocsModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);
  const [accountModalVisible, setAccountModalVisible] = useState(false);

  // Modal input states
  const [supplierName, setSupplierName] = useState('');

  // Real data lists
  const [lenderOffers, setLenderOffers] = useState<any[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const unreadCount = notificationsList.filter(n => !n.is_read).length;

  // Local metrics state
  const [supplierCount, setSupplierCount] = useState(0);
  const [activeDays, setActiveDays] = useState(0);
  const [dailyAvg, setDailyAvg] = useState('2,340');
  
  // Custom toast notification message
  

  // Score gauge offset state for load animation (radius = 70, semi-circle arc length = 220)
  const [gaugeOffset, setGaugeOffset] = useState(220);

  // Local state for vendor activities
  const [localTrustScoreData, setLocalTrustScoreData] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const activeTrustScoreData = localTrustScoreData || user?.trustScoreData;
  const currentScore = activeTrustScoreData?.trust_score ?? user?.score ?? 742;
  const [isInsightsModalVisible, setIsInsightsModalVisible] = useState(false);
  const [lenderBaseTime, setLenderBaseTime] = useState<number>(0);
  const [lenderNowTime, setLenderNowTime] = useState<number>(0);

  useEffect(() => {
    if (user) {
      const frameId = requestAnimationFrame(() => {
        const timeVal = user.created_at ? new Date(user.created_at).getTime() : Date.now() - 30 * 60 * 1000;
        setLenderBaseTime(timeVal);
        setLenderNowTime(Date.now());
      });
      
      const interval = setInterval(() => {
        setLenderNowTime(Date.now());
      }, 5000);
      return () => {
        cancelAnimationFrame(frameId);
        clearInterval(interval);
      };
    }
  }, [user]);

  const [activities, setActivities] = useState([
    { id: '1', type: 'PAYMENT', title: 'Amul Distributors', date: 'Today, 10:30 AM', amount: '- ₹4,200', status: 'completed' },
    { id: '2', type: 'SALE', title: 'Store Sale: UPI', date: 'Yesterday, 06:15 PM', amount: '+ ₹840', status: 'verified' },
    { id: '3', type: 'SALE', title: 'Loan Disbursement', date: 'Oct 24, 2023', amount: '+ ₹15,000', status: 'verified' },
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

  // Fetch Notifications globally
  useEffect(() => {
    if (!user) return;
    const fetchNotifs = async () => {
      const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (data) setNotificationsList(data);
    };
    fetchNotifs();
    
    const sub = supabase.channel(`notifs_${Date.now()}_${Math.random()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, fetchNotifs)
      .subscribe();
      
    return () => { supabase.removeChannel(sub); };
  }, [user]);

  const handleOpenNotifications = async () => {
    setNotificationsModalVisible(true);
    const unreadIds = notificationsList.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length > 0) {
      await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
    }
  };

  // Fetch dynamic lender offers for Lender
  useEffect(() => {
    if (user?.role === 'LENDER') {
      const fetchLenderData = async () => {
        const { data, error } = await supabase
          .from('loan_offers')
          .select('*, profiles:profiles!vendor_id(name, selfie, score)')
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
        // Fetch Active Days & Suppliers Metrics
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
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    Toast.show({
      type: type,
      text1: message,
      position: 'top',
    });
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
    showToast(`Supplier Linked. ${supplierName} added to your network.`, 'success');
  };

  const handleApproveCredit = async (id: string, amount: number, vendorId: string) => {
    if (!user) return;
    const { error } = await supabase.from('loan_offers').update({ status: 'ACCEPTED', accepted_at: new Date().toISOString() }).eq('id', id);
    if (error) {
      showToast('Approval Failed. Unable to process disbursement.', 'error');
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
      showToast('Disbursement Successful. Funds have been deposited.', 'success');
    }
  };

  const handleDeclineCredit = async (id: string) => {
    const { error } = await supabase.from('loan_offers').update({ status: 'DECLINED' }).eq('id', id);
    if (error) {
      showToast('Action Failed. Unable to process decline request.', 'error');
    } else {
      showToast('Application Declined. Request has been closed.', 'info');
    }
  };



  const renderVendorDashboard = () => {
    // Standing and Color calculations based on currentScore
    let standingText = 'Good Standing';
    let standingColor = '#D4820A'; // Default Orange
    let standingBg = '#D4820A20';
    let gaugeColor = '#D4820A';
    
    const scoreDelta = currentScore - 620;
    const trendPrefix = scoreDelta > 0 ? '↑ +' : scoreDelta < 0 ? '↓ ' : '';
    
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
            onPress={handleOpenNotifications} 
            style={({ pressed }) => [styles.vendorNotifyBtn, { opacity: pressed ? 0.8 : 1 }]}
          >
            <SymbolView tintColor="#895100" name="notifications" size={24} />
            {unreadCount > 0 && <View style={styles.vendorNotifyBadge} />}
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
            <Text style={styles.trendText}>
              {scoreDelta === 0 ? 'No change this month' : `${trendPrefix}${Math.abs(scoreDelta)} this month`}
            </Text>
          </View>
          <Pressable 
            style={styles.heroInsightsBtn}
            onPress={() => setIsInsightsModalVisible(true)}
          >
            <SymbolView name="sparkles" size={16} tintColor="#D4820A" />
            <Text style={styles.heroInsightsBtnText}>View AI Score Insights</Text>
          </Pressable>

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
          <Pressable onPress={() => router.push('/wallet')}>
            <Text style={styles.activitySeeAll}>See All</Text>
          </Pressable>
        </View>

        <View style={styles.activityListContainer}>
          {walletTransactions.length > 0 ? walletTransactions.slice(0, 5).map((item) => {
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
            <Pressable 
              style={styles.insightLinkBtn} 
              onPress={() => setReportModalVisible(true)}
            >
              <Text style={styles.insightLinkLabel}>View Full Report </Text>
              <SymbolView tintColor="#895100" name="arrow_forward" size={14} />
            </Pressable>
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
            onPress={() => showToast('Notifications. Viewing recent alerts.', 'info')}
            style={styles.lenderNavIconBtn}
          >
            <SymbolView name="notifications" size={24} tintColor="#534435" />
            <View style={styles.lenderNavBadge} />
          </Pressable>
          <Pressable 
            onPress={() => showToast('Settings. Managing account preferences.', 'info')}
            style={styles.lenderNavIconBtn}
          >
            <SymbolView name="settings" size={24} tintColor="#534435" />
          </Pressable>
        </View>
      </View>
    );
  };



  const renderLenderDashboard = () => {
    const dbAcceptedOffers = lenderOffers.filter(o => o.status === 'ACCEPTED' && o.profiles?.name && o.profiles.name.trim() !== '');
    const pendingOffers = lenderOffers.filter(o => o.status === 'PENDING' && o.profiles?.name && o.profiles.name.trim() !== '');

    const generateSimulatedLenderLoans = (lenderId: string, baseTime: number) => {
      return [
        {
          id: 'sim-lender-loan-1',
          lender_id: lenderId,
          vendor_id: 'vendor-sim-1',
          amount: 50000,
          interest_rate: 12.0,
          tenure: '6 Months',
          status: 'ACCEPTED',
          created_at: new Date(baseTime + 1 * 5 * 60 * 1000).toISOString(),
          accepted_at: new Date(baseTime + 1.2 * 5 * 60 * 1000).toISOString(),
          profiles: {
            name: 'Raju Kirana Store',
            selfie: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBp-aRKkGDKeuwqhPEmq7g1UC6fAJe7VnCjIBkl8xQ_owajzWgfUPWgUMJOIyoiN0LKTUspoZaFUGMsePMDyMvyc8wOY0Ht8h_r-OZXBP_HQCuvHb2y_yMdS0aE_gbQkkTv3Lfk4ygKkKjRhjN_MvU6GCEuVhiMMajr7ZRd8kQ8WKCxD3dRBu_V3DmsoDaRhR4lC0m7DzQz96jcsebEXvsWN9aBxHGSMpo1wqkYa05F8THygZ30zTg55ArV1Ig9JnHR1x12es4h9pO8',
            score: 742,
          }
        },
        {
          id: 'sim-lender-loan-2',
          lender_id: lenderId,
          vendor_id: 'vendor-sim-2',
          amount: 80000,
          interest_rate: 13.5,
          tenure: '12 Months',
          status: 'ACCEPTED',
          created_at: new Date(baseTime + 2 * 5 * 60 * 1000).toISOString(),
          accepted_at: new Date(baseTime + 2.1 * 5 * 60 * 1000).toISOString(),
          profiles: {
            name: 'Pooja Ceramics',
            selfie: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop',
            score: 795,
          }
        },
        {
          id: 'sim-lender-loan-3',
          lender_id: lenderId,
          vendor_id: 'vendor-sim-3',
          amount: 30000,
          interest_rate: 11.0,
          tenure: '3 Months',
          status: 'ACCEPTED',
          created_at: new Date(baseTime + 4 * 5 * 60 * 1000).toISOString(),
          accepted_at: new Date(baseTime + 4.3 * 5 * 60 * 1000).toISOString(),
          profiles: {
            name: 'Karan Organic Groceries',
            selfie: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop',
            score: 680,
          }
        }
      ];
    };

    const baseTimeVal = lenderBaseTime || (user?.created_at ? new Date(user.created_at).getTime() : 1773489600000);
    const nowTimeVal = lenderNowTime || 1773489600000;
    const acceptedOffers = dbAcceptedOffers.length > 0 
      ? dbAcceptedOffers 
      : generateSimulatedLenderLoans(user?.id || 'lender-id', baseTimeVal);

    // Calculate amount_paid for simulated/fallback loans dynamically
    const acceptedOffersWithPaid = acceptedOffers.map(loan => {
      if (loan.id.startsWith('sim-')) {
        const tenureMonths = parseInt(loan.tenure) || 6;
        const totalLoanVal = Number(loan.amount) * (1 + Number(loan.interest_rate) / 100);
        const emiVal = Math.round(totalLoanVal / tenureMonths);
        const startDate = new Date(loan.accepted_at || loan.created_at);
        const diffMs = Math.max(0, nowTimeVal - startDate.getTime());
        const monthsElapsed = Math.floor(diffMs / (5 * 60 * 1000));
        const computedPaid = Math.min(monthsElapsed * emiVal, totalLoanVal);
        return {
          ...loan,
          amount_paid: computedPaid
        };
      }
      return loan;
    });

    const totalCapital = acceptedOffersWithPaid.reduce((sum, o) => sum + Number(o.amount), 0);
    const activeLoans = acceptedOffersWithPaid.filter(o => {
      const totalLoan = Number(o.amount) * (1 + Number(o.interest_rate) / 100);
      const paid = Number(o.amount_paid) || 0;
      return paid < totalLoan;
    });
    const activeLoansCount = activeLoans.length;

    const avgReturnNumeric = acceptedOffersWithPaid.length > 0 
      ? (acceptedOffersWithPaid.reduce((sum, o) => sum + Number(o.interest_rate), 0) / acceptedOffersWithPaid.length)
      : 8.5;

    const totalRepayments = acceptedOffersWithPaid.reduce((sum, o) => sum + (Number(o.amount_paid) || 0), 0);
    const totalDisbursed = acceptedOffersWithPaid.reduce((sum, o) => sum + Number(o.amount), 0);
    const baseLenderWallet = 500000;

    const dbBalance = walletBalance;
    const computedWalletBalance = dbBalance !== 0 ? dbBalance : (baseLenderWallet - totalDisbursed + totalRepayments);

    const portfolioStats = {
      activeLoans: activeLoansCount,
      capitalDeployed: totalCapital,
      avgReturn: avgReturnNumeric,
      walletBalance: computedWalletBalance
    };
    
    const monthlyYields = avgReturnNumeric > 0 
      ? [avgReturnNumeric * 0.7, avgReturnNumeric * 0.8, avgReturnNumeric * 1.1, avgReturnNumeric * 0.9, avgReturnNumeric * 1.2, avgReturnNumeric]
      : [5.2, 6.1, 8.0, 7.5, 9.2, 8.5];

    return (
      <View style={styles.lenderDashboardContainer}>
        {/* Hero Portfolio Card */}
        <LenderPortfolioCard portfolioStats={portfolioStats} monthlyYields={monthlyYields} />


        {/* Pending Approvals Section */}
        <View style={styles.lenderSectionContainer}>
          <View style={styles.lenderSectionHeader}>
            <View style={styles.lenderSectionTitleRow}>
              <Text style={styles.lenderSectionTitle}>Awaiting Your Decision</Text>
              <View style={styles.lenderBadge}>
                <Text style={styles.lenderBadgeText}>{pendingOffers.length}</Text>
              </View>
            </View>
            <Pressable onPress={() => showToast('Applications. Viewing pending requests.', 'info')}>
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
            {acceptedOffersWithPaid.length > 0 ? (
              acceptedOffersWithPaid.map((loan, index) => {
                const emi = Math.round((Number(loan.amount) * (1 + Number(loan.interest_rate) / 100)) / parseInt(loan.tenure));
                const totalPaid = Number(loan.amount_paid) || 0;
                const totalLoan = Number(loan.amount) + (Number(loan.amount) * (Number(loan.interest_rate) / 100));
                const progressPct = Math.min((totalPaid / totalLoan) * 100, 100);
                
                const startDate = new Date(loan.accepted_at || loan.created_at);
                const diffMs = Math.max(0, nowTimeVal - startDate.getTime());
                const monthsElapsed = Math.floor(diffMs / (5 * 60 * 1000)); // 5 minutes = 1 month in this project
                const expectedPaid = Math.min(monthsElapsed * emi, totalLoan);

                let badgeStyle = styles.lenderActiveBadgeGreen;
                let badgeTextStyle = styles.lenderActiveBadgeTextGreen;
                let badgeText = 'ON TRACK';
                let progressColor = '#2D7D46';

                if (progressPct >= 100) {
                  badgeText = 'PAID';
                  badgeStyle = styles.lenderActiveBadgeGreen;
                  badgeTextStyle = styles.lenderActiveBadgeTextGreen;
                } else if (totalPaid < expectedPaid) {
                  badgeText = 'OVERDUE';
                  badgeStyle = styles.lenderActiveBadgeRed;
                  badgeTextStyle = styles.lenderActiveBadgeTextRed;
                  progressColor = '#C0392B';
                } else if (monthsElapsed === 0 && totalPaid === 0) {
                  badgeText = 'NEW';
                  badgeStyle = styles.lenderActiveBadgeOrange;
                  badgeTextStyle = styles.lenderActiveBadgeTextOrange;
                  progressColor = '#D4820A';
                }

                let bottomText = progressPct >= 100 ? 'COMPLETED' : (monthsElapsed === 0 && totalPaid === 0 ? 'NEW' : `${monthsElapsed} MO IN`);

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
                        <View style={badgeStyle}>
                          <Text style={badgeTextStyle}>{badgeText}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.lenderProgressContainer}>
                      <View style={styles.lenderProgressLabelRow}>
                        <Text style={styles.lenderProgressLabel}>{loan.tenure.toUpperCase()}</Text>
                        <Text style={styles.lenderProgressLabel}>{bottomText}</Text>
                      </View>
                      <View style={styles.lenderProgressBarBg}>
                        <View style={[styles.lenderProgressBarFill, { width: `${progressPct}%`, backgroundColor: progressColor }]} />
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

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#d4820a" />
      </View>
    );
  }

  const isLender = user?.role === 'LENDER';

  return (
    <View style={[styles.container, { backgroundColor: isLender ? '#fdf9f3' : '#F9F5EF' }]}>


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
          onAccountPress={() => setAccountModalVisible(true)}
        />
      )}

      {/* -------------------- MODALS -------------------- */}



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
          <View style={[styles.modalCardContainer, { maxHeight: '85%', padding: 0 }]}>
            <View style={[styles.modalHeader, { padding: 24, paddingBottom: 16 }]}>
              <Text style={styles.modalTitleText}>TrustScore™ Insight</Text>
              <Pressable onPress={() => setReportModalVisible(false)} style={styles.modalCloseBtn}>
                <SymbolView tintColor="#1c1c18" name="xmark" size={20} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingTop: 0, gap: 16 }}>
              {/* 1. Bank-Grade Header */}
              <View style={[styles.insightDetailCard, { backgroundColor: '#FDFCF7', borderColor: '#E8E0D5' }]}>
                <View style={{ borderBottomWidth: 1, borderBottomColor: '#E8E0D5', paddingBottom: 12, marginBottom: 12 }}>
                  <Text style={{ fontSize: 10, color: '#6B6B6B', fontWeight: 'bold', letterSpacing: 1 }}>
                    REF-{activeTrustScoreData?.vendor_id || user?.id?.substring(0,8).toUpperCase()}-{activeTrustScoreData?.score_date || new Date().toISOString().split('T')[0]}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#895100', marginBottom: 4, fontVariant: ['small-caps'] }}>
                      CLASSIFICATION
                    </Text>
                    <View style={{ alignSelf: 'flex-start', backgroundColor: '#FFF5F5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: '#FFE5E5' }}>
                      <Text style={{ color: '#C0392B', fontWeight: 'bold', fontSize: 11 }}>
                        {activeTrustScoreData?.classification_badge || "PENDING CLASSIFICATION"}
                      </Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#895100', fontVariant: ['small-caps'] }}>
                      COMPOSITE SCORE
                    </Text>
                    <Text style={{ fontSize: 32, fontWeight: '900', color: '#1c1c18' }}>
                      {activeTrustScoreData?.trust_score || "N/A"}
                    </Text>
                  </View>
                </View>
                <SparkleWatermark />
              </View>

              {/* 2. Score Summary Bar (6 Pillars) */}
              <View style={styles.insightDetailCard}>
                <View style={styles.insightDetailHeader}>
                  <SymbolView name="chart.bar.fill" size={18} tintColor="#895100" />
                  <Text style={[styles.insightDetailTitle, { color: '#895100' }]}>PILLAR SCORES</Text>
                </View>
                {Object.entries(activeTrustScoreData?.pillar_scores || {
                  "Income Stability": 0, "Cash Flow Health": 0, "Business Regularity": 0,
                  "Payment Discipline": 0, "Digital Adoption": 0, "Risk Signals": 0
                }).map(([key, score]: any) => {
                  const numScore = Number(score) || 0;
                  const color = numScore < 30 ? '#C0392B' : numScore < 60 ? '#F39C12' : '#2D7D46';
                  const label = key.replace(/_/g, ' ').toUpperCase();
                  return (
                    <View key={key} style={{ marginBottom: 12 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: '#1c1c18' }}>{label}</Text>
                        <Text style={{ fontSize: 11, fontWeight: 'bold', color }}>{numScore}/100</Text>
                      </View>
                      <View style={{ height: 6, backgroundColor: '#E8E0D5', borderRadius: 3, overflow: 'hidden' }}>
                        <View style={{ width: `${Math.max(0, Math.min(100, numScore))}%`, height: '100%', backgroundColor: color, borderRadius: 3 }} />
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* 3. Key Findings */}
              <View style={styles.insightDetailCard}>
                <View style={styles.insightDetailHeader}>
                  <SparkleIcon size={18} color="#895100" />
                  <Text style={[styles.insightDetailTitle, { color: '#895100' }]}>KEY FINDINGS</Text>
                </View>
                {Object.entries(activeTrustScoreData?.key_findings || { "Assessment": [activeTrustScoreData?.score_explanation || "No findings available."] }).map(([category, items]: any, catIdx) => (
                  <View key={catIdx} style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1c1c18', marginBottom: 8, fontVariant: ['small-caps'] }}>
                      {category.replace(/_/g, ' ').toUpperCase()}
                    </Text>
                    {(items as string[]).map((item, idx) => (
                      <View key={idx} style={styles.insightListItem}>
                        <View style={[styles.insightListDot, { backgroundColor: '#895100' }]} />
                        <Text style={styles.insightListText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>

              {/* 4. Risk Signals Table */}
              {(activeTrustScoreData?.risk_signals_table?.length > 0) && (
                <View style={[styles.insightDetailCard, styles.insightMistakesCard]}>
                  <View style={styles.insightDetailHeader}>
                    <SymbolView name="exclamationmark.triangle.fill" size={18} tintColor="#C0392B" />
                    <Text style={[styles.insightDetailTitle, { color: '#C0392B' }]}>RISK SIGNALS</Text>
                  </View>
                  <View style={{ borderWidth: 1, borderColor: '#FFE5E5', borderRadius: 8, overflow: 'hidden' }}>
                    <View style={{ flexDirection: 'row', backgroundColor: '#FFE5E5', padding: 8 }}>
                      <Text style={{ flex: 1, fontSize: 10, fontWeight: 'bold', color: '#C0392B' }}>SIGNAL</Text>
                      <Text style={{ flex: 2, fontSize: 10, fontWeight: 'bold', color: '#C0392B' }}>EVIDENCE</Text>
                    </View>
                    {activeTrustScoreData.risk_signals_table.map((row: any, idx: number) => (
                      <View key={idx} style={{ flexDirection: 'row', padding: 8, borderTopWidth: 1, borderTopColor: '#FFE5E5' }}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1c1c18' }}>{row.signal}</Text>
                          <Text style={{ fontSize: 9, fontWeight: 'bold', color: row.severity === 'Critical' ? '#C0392B' : '#F39C12', marginTop: 4 }}>{row.severity?.toUpperCase()}</Text>
                        </View>
                        <Text style={{ flex: 2, fontSize: 11, color: '#6B6B6B' }}>{row.evidence}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* 5. Final Recommendation Box */}
              <View style={[styles.insightDetailCard, { backgroundColor: '#FDFCF7', borderWidth: 2, borderColor: '#1c1c18' }]}>
                <View style={{ alignItems: 'center', padding: 8 }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#6B6B6B', marginBottom: 8, fontVariant: ['small-caps'] }}>
                    FINAL RECOMMENDATION
                  </Text>
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#1c1c18', textAlign: 'center' }}>
                    {activeTrustScoreData?.final_recommendation || "Insufficient data for a definitive recommendation."}
                  </Text>
                </View>
              </View>
            </ScrollView>
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
              {notificationsList.length > 0 ? notificationsList.map(n => (
                <View key={n.id} style={styles.notificationItemCard}>
                  <View style={styles.notificationHeaderRow}>
                    <Text style={styles.notificationItemTitle}>{n.title}</Text>
                    <Text style={styles.notificationTime}>{new Date(n.created_at).toLocaleDateString()}</Text>
                  </View>
                  <Text style={styles.notificationBody}>
                    {n.message}
                  </Text>
                </View>
              )) : (
                <View style={{ padding: 24, alignItems: 'center' }}>
                  <Text style={{ color: '#8E8E93', fontSize: 14 }}>No notifications yet</Text>
                </View>
              )}
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

      {/* AI Score Insights Modal */}
      <Modal
        visible={isInsightsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsInsightsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.insightsModalContent}>
            <View style={styles.insightsModalHeader}>
              <Text style={styles.insightsModalTitle}>AI Score Insights</Text>
              <Pressable onPress={() => setIsInsightsModalVisible(false)} style={styles.modalCloseBtn}>
                <SymbolView tintColor="#534435" name="xmark" size={24} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.insightsScroll}>
              {(() => {
                let summaryText = "Your TrustScore is actively monitored by VendorPass AI. Every 5 minutes acts as a virtual month. Make your EMI payments to build your score!";
                let summaryColor = "#D4820A";
                
                if (activeTrustScoreData?.history && activeTrustScoreData.history.length > 0) {
                  const latest = activeTrustScoreData.history[0];
                  if (latest.score_change < 0) {
                    summaryText = `Warning: Your score recently dropped by ${Math.abs(latest.score_change)} points. Please ensure timely EMI payments to recover your standing.`;
                    summaryColor = "#E74C3C";
                  } else if (latest.score_change > 0) {
                    summaryText = `Great job! Your score recently increased by ${latest.score_change} points. Keep up the good work to unlock higher credit limits.`;
                    summaryColor = "#2D7D46";
                  }
                }

                return (
                  <View style={[styles.insightsSummaryCard, { borderColor: summaryColor, backgroundColor: summaryColor + '10' }]}>
                    <SymbolView name="sparkles" size={32} tintColor={summaryColor} />
                    <Text style={styles.insightsSummaryText}>{summaryText}</Text>
                  </View>
                );
              })()}

              <Text style={styles.insightsTimelineLabel}>SCORE HISTORY</Text>
              
              {(!activeTrustScoreData?.history || activeTrustScoreData.history.length === 0) ? (
                <View style={styles.insightsEmptyState}>
                  <Text style={styles.insightsEmptyText}>No score changes recorded yet.</Text>
                </View>
              ) : (
                activeTrustScoreData.history.map((item: any, idx: number) => {
                  const isPositive = item.score_change >= 0;
                  return (
                    <View key={idx} style={styles.insightItem}>
                      <View style={[styles.insightDot, { backgroundColor: isPositive ? '#2D7D46' : '#E74C3C' }]} />
                      <View style={styles.insightContent}>
                        <View style={styles.insightContentHeader}>
                          <Text style={styles.insightDate}>{new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                          <Text style={[styles.insightScoreChange, { color: isPositive ? '#2D7D46' : '#E74C3C' }]}>
                            {isPositive ? '+' : ''}{item.score_change}
                          </Text>
                        </View>
                        <Text style={styles.insightNarrative}>{item.narrative}</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
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
  heroInsightsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D4820A15',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 20,
    gap: 6,
  },
  heroInsightsBtnText: {
    color: '#D4820A',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
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
  insightDetailCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    position: 'relative',
    overflow: 'hidden',
  },
  insightAnalysisCard: {
    backgroundColor: '#fdf9f3',
    borderColor: '#ffdcbc',
  },
  insightTipsCard: {
    backgroundColor: '#F3FAF5',
    borderColor: '#2D7D4630',
  },
  insightMistakesCard: {
    backgroundColor: '#FDEDEC',
    borderColor: '#C0392B30',
  },
  insightDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  insightDetailTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.0,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  insightDetailText: {
    fontSize: 13,
    color: '#534435',
    lineHeight: 20,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
    zIndex: 1,
  },
  insightListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  insightListDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  insightListText: {
    flex: 1,
    fontSize: 13,
    color: '#1C1C1E',
    lineHeight: 18,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
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
  insightsModalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  insightsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  insightsModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1c18',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  insightsScroll: {
    paddingBottom: 24,
  },
  insightsSummaryCard: {
    backgroundColor: '#FFF8F0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F0E0C9',
  },
  insightsSummaryText: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
    color: '#534435',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  insightsTimelineLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 1.2,
    marginBottom: 16,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  insightItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  insightDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 16,
  },
  insightContent: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
    paddingBottom: 16,
  },
  insightContentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  insightDate: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: Platform.OS === 'web' ? 'JetBrains Mono' : 'monospace',
  },
  insightScoreChange: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  insightNarrative: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1c1c18',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  insightsEmptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  insightsEmptyText: {
    color: '#8E8E93',
    fontSize: 14,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
});
