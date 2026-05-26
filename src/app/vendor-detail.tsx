import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  ImageBackground,
  TextInput,
  Platform,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from '@/components/symbol-view';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

type TabType = 'Overview' | 'Financials' | 'Risk Report' | 'History';

export default function VendorDetailScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    vendorId: string;
    oppId?: string;
    isReal?: string;
    amount?: string;
    tenure?: string;
    note?: string;
    category?: string;
    location?: string;
  }>();

  const vendorId = params.vendorId;
  const isReal = params.isReal === 'true';

  // State
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('Overview');
  const [countUpPoints, setCountUpPoints] = useState(0);
  const [gaugeOffset, setGaugeOffset] = useState(188); // circle circumference is ~188 (radius 30)
  const [animatedScore, setAnimatedScore] = useState(300);
  const [pillarAnimPct, setPillarAnimPct] = useState(0);

  // Counter offer states
  const [counterModalVisible, setCounterModalVisible] = useState(false);
  const [counterAmount, setCounterAmount] = useState(250000);
  const [counterRate, setCounterRate] = useState('12');
  const [counterTenure, setCounterTenure] = useState('24 Months');

  // Load request details (parsed from params)
  const reqAmountRaw = params.amount || '₹2,50,000';
  const reqAmountNum = parseInt(reqAmountRaw.replace(/[^0-9]/g, '')) || 250000;
  const reqTenure = params.tenure || '24 Months';
  const reqNote = params.note || 'business inventory expansion';
  const reqCategory = params.category || 'Retail';
  const reqLocation = params.location || 'Mumbai';
  
  // Extract interest from param or default to 12%
  const reqInterestText = params.isReal === 'true' ? '12%' : '12%'; 

  // Fetch Vendor Profile
  useEffect(() => {
    if (!vendorId) return;

    const fetchVendorProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', vendorId)
          .single();

        if (error) throw error;
        setProfileData(data);

        // Initialize counter defaults from parsed parameters
        setCounterAmount(reqAmountNum);
      } catch (err) {
        console.error('Error fetching vendor profile:', err);
        // Fallback mock profile data if db fetch fails
        setProfileData({
          name: 'Arjun Singh',
          selfie: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBp-aRKkGDKeuwqhPEmq7g1UC6fAJe7VnCjIBkl8xQ_owajzWgfUPWgUMJOIyoiN0LKTUspoZaFUGMsePMDyMvyc8wOY0Ht8h_r-OZXBP_HQCuvHb2y_yMdS0aE_gbQkkTv3Lfk4ygKkKjRhjN_MvU6GCEuVhiMMajr7ZRd8kQ8WKCxD3dRBu_V3DmsoDaRhR4lC0m7DzQz96jcsebEXvsWN9aBxHGSMpo1wqkYa05F8THygZ30zTg55ArV1Ig9JnHR1x12es4h9pO8',
          business_photo: 'https://images.unsplash.com/photo-1607349913338-fca6f7fc42d0?q=80&w=600&auto=format&fit=crop',
          score: 782,
          trust_score_data: {
            trust_score: 782,
            score_explanation: 'Arjun Singh operates a verified Retail vegetable shop in Mumbai Dadar Market. He has maintained a stable cash flow and shown consistent digital payment adoption over his 3.5 years of active operation.',
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVendorProfile();
  }, [vendorId]);

  // Animated Count-Up and Gauge Fill on Enter
  useEffect(() => {
    if (loading || !profileData) return;

    // Reset animations
    setCountUpPoints(0);
    setGaugeOffset(188);
    setAnimatedScore(300);
    setPillarAnimPct(0);

    // Animate points count up from 0 to 12
    let currentPt = 0;
    const interval = setInterval(() => {
      currentPt += 1;
      setCountUpPoints(currentPt);
      if (currentPt >= 12) clearInterval(interval);
    }, 80);

    // Animate score count up from 300 to target score
    const targetScore = profileData?.trust_score_data?.trust_score ?? profileData?.score ?? 782;
    let currentScoreVal = 300;
    const scoreDiff = targetScore - 300;
    const scoreSteps = 20;
    const scoreStepVal = Math.ceil(scoreDiff / scoreSteps);
    const scoreInterval = setInterval(() => {
      currentScoreVal += scoreStepVal;
      if (currentScoreVal >= targetScore) {
        setAnimatedScore(targetScore);
        clearInterval(scoreInterval);
      } else {
        setAnimatedScore(currentScoreVal);
      }
    }, 40);

    // Animate score gauge arc
    const maxScore = 850;
    const scorePct = Math.min(Math.max(targetScore, 0), maxScore) / maxScore;
    const targetOffset = 188 * (1 - scorePct);
    const timer = setTimeout(() => {
      setGaugeOffset(targetOffset);
    }, 200);

    // Animate scoring pillars (pct width fills up from 0 to target)
    let pillarPct = 0;
    const pillarInterval = setInterval(() => {
      pillarPct += 0.05;
      if (pillarPct >= 1) {
        setPillarAnimPct(1);
        clearInterval(pillarInterval);
      } else {
        setPillarAnimPct(pillarPct);
      }
    }, 30);

    return () => {
      clearInterval(interval);
      clearInterval(scoreInterval);
      clearInterval(pillarInterval);
      clearTimeout(timer);
    };
  }, [loading, profileData, activeTab]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    Toast.show({
      type: type,
      text1: message,
      position: 'top',
    });
  };

  // Decline Application
  const handleDecline = () => {
    showToast('Application declined and closed.', 'info');
    router.back();
  };

  // Approve Loan (inserts a proposal in loan_offers)
  const handleApprove = async () => {
    if (!user) {
      showToast('You must be signed in to approve loans.', 'error');
      return;
    }

    try {
      const { error } = await supabase.from('loan_offers').insert({
        lender_id: user.id,
        vendor_id: vendorId,
        amount: reqAmountNum,
        interest_rate: 12.0, // Default review rate
        tenure: reqTenure,
        status: 'PENDING',
      });

      if (error) throw error;

      showToast('Loan Approved! Proposal sent to vendor.', 'success');
      router.back();
    } catch (err) {
      console.error('Error approving loan:', err);
      showToast('Failed to submit loan approval.', 'error');
    }
  };

  // Submit Counter Offer
  const handleSendCounter = async () => {
    if (!user) {
      showToast('You must be signed in to submit offers.', 'error');
      return;
    }

    const rateNum = parseFloat(counterRate);
    if (isNaN(rateNum) || rateNum <= 0) {
      showToast('Please enter a valid interest rate.', 'error');
      return;
    }

    try {
      const { error } = await supabase.from('loan_offers').insert({
        lender_id: user.id,
        vendor_id: vendorId,
        amount: counterAmount,
        interest_rate: rateNum,
        tenure: counterTenure,
        status: 'PENDING',
      });

      if (error) throw error;

      showToast('Counter offer sent to vendor successfully!', 'success');
      setCounterModalVisible(false);
      router.back();
    } catch (err) {
      console.error('Error submitting counter offer:', err);
      showToast('Failed to send counter offer.', 'error');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4820A" />
      </View>
    );
  }

  const score = profileData?.trust_score_data?.trust_score ?? profileData?.score ?? 782;
  const ratingText = score >= 750 ? 'Elite' : score >= 650 ? 'High' : 'Standard';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      
      {/* 1. Header Navigation Bar */}
      <View style={styles.topHeader}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <SymbolView name="arrow.left" size={20} tintColor="#1A3A4A" />
        </Pressable>
        <Text style={styles.headerWordmark}>
          Vendor<Text style={{ color: '#D4820A' }}>PASS</Text>
        </Text>
        <View style={styles.headerProfileIcon}>
          <Image
            style={{ width: 32, height: 32, borderRadius: 16 }}
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA3hLQjdNWbXnIL9iJKiflOBCYQepD67FLny_XMmVvlbMB1INZ9WOVcww8F1O4yV41f5Vj8zm04GtGfxxTE1mAjFWoqtdOF6RTJc0WyDnAWWqPm9jQUcIwNqUL-XnH0TN0cXlwmDsy3EMjKDqBMeYoY6oKSwui1Xnicj61EaQbPSo0gUOifnx5TIcDCQ0GlRoCPmOb67C5r0A6TOnL0GTv_KRoBnCSrvmnb41itPQhebSP-u9C4jgXRvLXXIVMlbFBDWfSqRcqRDSzI' }}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 2. Full-bleed Shop Hero Banner */}
        <ImageBackground
          source={{ uri: profileData?.business_photo || 'https://images.unsplash.com/photo-1607349913338-fca6f7fc42d0?q=80&w=600&auto=format&fit=crop' }}
          style={styles.heroBackground}
          blurRadius={Platform.OS === 'web' ? 12 : 6}
        >
          <View style={styles.heroOverlay} />
          
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: profileData?.selfie || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBp-aRKkGDKeuwqhPEmq7g1UC6fAJe7VnCjIBkl8xQ_owajzWgfUPWgUMJOIyoiN0LKTUspoZaFUGMsePMDyMvyc8wOY0Ht8h_r-OZXBP_HQCuvHb2y_yMdS0aE_gbQkkTv3Lfk4ygKkKjRhjN_MvU6GCEuVhiMMajr7ZRd8kQ8WKCxD3dRBu_V3DmsoDaRhR4lC0m7DzQz96jcsebEXvsWN9aBxHGSMpo1wqkYa05F8THygZ30zTg55ArV1Ig9JnHR1x12es4h9pO8' }}
              style={styles.avatarImage}
            />
            <View style={styles.activeStatusDot} />
          </View>
          
          <Text style={styles.vendorNameText}>{profileData?.name || 'Arjun Singh'}</Text>
          <Text style={styles.vendorLocationText}>{reqLocation.toUpperCase()}, MUMBAI</Text>
        </ImageBackground>

        {/* 3. TrustScore Card */}
        <View style={styles.trustScoreCard}>
          <View style={styles.scoreGaugeRow}>
            <View>
              <Text style={styles.largeScoreText}>{animatedScore}</Text>
              <Text style={styles.trustScoreLabel}>TRUSTSCORE™</Text>
            </View>
            
            <View style={styles.gaugeContainer}>
              <Svg width={75} height={75} viewBox="0 0 80 80">
                <Circle
                  cx="40"
                  cy="40"
                  r="30"
                  fill="none"
                  stroke="#E8E0D5"
                  strokeWidth="7"
                />
                <Circle
                  cx="40"
                  cy="40"
                  r="30"
                  fill="none"
                  stroke="#D4820A"
                  strokeWidth="7"
                  strokeDasharray="188"
                  strokeDashoffset={gaugeOffset}
                  strokeLinecap="round"
                  transform="rotate(-90 40 40)"
                />
              </Svg>
            </View>
          </View>
          
          <Text style={styles.pointsTrendText}>+{countUpPoints} pts this month</Text>
          
          <View style={styles.cardDivider} />
          
          <View style={styles.statPillsRow}>
            <View style={styles.statPill}>
              <Text style={styles.statPillLabel}>REPAYMENT</Text>
              <Text style={styles.statPillValue}>{ratingText}</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statPillLabel}>TENURE</Text>
              <Text style={styles.statPillValue}>3.5y</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statPillLabel}>HEALTH</Text>
              <Text style={styles.statPillValue}>Elite</Text>
            </View>
          </View>
        </View>

        {/* 4. Tab Navigation Header */}
        <View style={styles.tabsContainer}>
          {(['Overview', 'Financials', 'Risk Report', 'History'] as TabType[]).map((tab) => {
            const isActive = activeTab === tab;
            let iconName = 'info.circle';
            if (tab === 'Financials') iconName = 'chart.bar';
            else if (tab === 'Risk Report') iconName = 'exclamationmark.triangle';
            else if (tab === 'History') iconName = 'clock';

            return (
              <Pressable key={tab} onPress={() => setActiveTab(tab)} style={styles.tabItem}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <SymbolView 
                    name={iconName} 
                    size={14} 
                    tintColor={isActive ? '#1A3A4A' : '#8E8E93'} 
                    style={{ marginRight: 4 }} 
                  />
                  <Text style={[styles.tabItemText, isActive && styles.tabItemTextActive]}>
                    {tab === 'Risk Report' ? 'RISK' : tab.toUpperCase()}
                  </Text>
                </View>
                {isActive && <View style={styles.tabActiveBar} />}
              </Pressable>
            );
          })}
        </View>

        {/* 5. Tab Content Views */}
        <View style={styles.tabContentContainer}>
          {activeTab === 'Overview' && (
            <View>
              {/* Business Description Card */}
              <View style={styles.detailCard}>
                <Text style={styles.cardGoldTitle}>Business Description</Text>
                <Text style={styles.cardBodyText}>
                  {profileData?.trust_score_data?.score_explanation || 
                    `${profileData?.name || 'Arjun Singh'} operates a verified retail vegetable stall in Dadar Market serving over 200 daily customers. Operating since 2021, the business has seen a 40% YoY growth in digital transactions.`
                  }
                </Text>
                <View style={styles.tagsRow}>
                  <View style={styles.outlinePill}>
                    <Text style={styles.outlinePillText}>Aadhaar Verified</Text>
                  </View>
                  <View style={styles.outlinePill}>
                    <Text style={styles.outlinePillText}>3.5 Years Active</Text>
                  </View>
                </View>
              </View>

              {/* Stats Row */}
              <View style={styles.sideBySideRow}>
                <View style={[styles.statCard, { flex: 1 }]}>
                  <Text style={styles.statLabel}>AVG DAILY TRANS</Text>
                  <Text style={styles.statBigGoldVal}>₹4,250</Text>
                  
                  {/* SVG bar chart */}
                  <View style={styles.miniChartContainer}>
                    <Svg width="100%" height={32}>
                      <Rect x="0%" y="40%" width="10%" height="60%" fill="#E8E0D5" rx={2} />
                      <Rect x="15%" y="20%" width="10%" height="80%" fill="#E8E0D5" rx={2} />
                      <Rect x="30%" y="50%" width="10%" height="50%" fill="#E8E0D5" rx={2} />
                      <Rect x="45%" y="10%" width="10%" height="90%" fill="#E8E0D5" rx={2} />
                      <Rect x="60%" y="30%" width="10%" height="70%" fill="#D4820A" rx={2} />
                      <Rect x="75%" y="15%" width="10%" height="85%" fill="#D4820A" rx={2} />
                      <Rect x="90%" y="5%" width="10%" height="95%" fill="#895100" rx={2} />
                    </Svg>
                  </View>
                </View>
                
                <View style={[styles.tealStatCard, { flex: 1 }]}>
                  <Text style={styles.tealStatLabel}>MONTHLY INCOME</Text>
                  <Text style={styles.tealStatBigVal}>₹1.2L</Text>
                  <Text style={styles.tealStatSubtext}>+8% vs Prev.</Text>
                </View>
              </View>

              {/* Supplier Network Section */}
              <View style={styles.detailCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={styles.cardGoldTitle}>Supplier Network</Text>
                  <View style={styles.supplierBadge}>
                    <SymbolView name="checkmark.seal.fill" size={10} tintColor="#2D7D46" style={{ marginRight: 3 }} />
                    <Text style={styles.supplierBadgeText}>Link Verified</Text>
                  </View>
                </View>
                
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.supplierScroll}>
                  {['Patel Dairy ✓', 'Aziz Wholesale ✓', 'Mumbai Distributors ✓', 'Kirana Coop ✓'].map((sup, idx) => (
                    <View key={idx} style={styles.supplierChip}>
                      <Text style={styles.supplierChipText}>{sup}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>

              {/* Location Consistency Card */}
              <View style={styles.detailCard}>
                <Text style={styles.cardGoldTitle}>Location Consistency</Text>
                
                {/* Styled static map visual representation */}
                <View style={styles.mapSnippetContainer}>
                  <Svg width="100%" height={100} style={{ backgroundColor: '#F0EAD6' }}>
                    {/* Grid map lines */}
                    <Path d="M 0 30 H 400" stroke="#DFD5C6" strokeWidth="2" />
                    <Path d="M 0 70 H 400" stroke="#DFD5C6" strokeWidth="2" />
                    <Path d="M 100 0 V 100" stroke="#DFD5C6" strokeWidth="2" />
                    <Path d="M 250 0 V 100" stroke="#DFD5C6" strokeWidth="2" />
                    
                    {/* Pin overlay */}
                    <Circle cx="170" cy="50" r="16" fill="#D4820A25" />
                    <Circle cx="170" cy="50" r="6" fill="#D4820A" />
                  </Svg>
                  <View style={styles.mapPinLabel}>
                    <Text style={styles.mapPinLabelText}>Dadar Stn Road, Dadar West</Text>
                  </View>
                </View>

                <View style={{ marginTop: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={styles.locProgressText}>Geo-verified at this location</Text>
                    <Text style={styles.locProgressVal}>28 / 30 days</Text>
                  </View>
                  <View style={styles.locProgressBarBg}>
                    <View style={[styles.locProgressBarFill, { width: '93%' }]} />
                  </View>
                </View>
              </View>

              {/* Customer Trust Indicators */}
              <View style={styles.detailCard}>
                <Text style={styles.cardGoldTitle}>Customer Trust Indicators</Text>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                  <View style={{ width: 50, height: 50 }}>
                    <Svg width={50} height={50} viewBox="0 0 40 40">
                      <Circle cx="20" cy="20" r="16" fill="none" stroke="#E8E0D5" strokeWidth="4" />
                      <Circle cx="20" cy="20" r="16" fill="none" stroke="#D4820A" strokeWidth="4" strokeDasharray="100" strokeDashoffset="26" strokeLinecap="round" transform="rotate(-90 20 20)" />
                    </Svg>
                    <Text style={styles.trustRingText}>74%</Text>
                  </View>
                  <View style={{ marginLeft: 16, flex: 1 }}>
                    <Text style={styles.trustMetricTitle}>Repeat Customer Rate</Text>
                    <Text style={styles.trustMetricSub}>Avg transaction: ₹185 from 23 unique customers/day</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {activeTab === 'Financials' && (
            <View>
              {/* Monthly Income Chart */}
              <View style={styles.detailCard}>
                <Text style={styles.cardGoldTitle}>Monthly Income (Last 6 Months)</Text>
                <View style={styles.largeChartContainer}>
                  <Svg width="100%" height={120}>
                    {/* Y Axis line */}
                    <Path d="M 30 10 V 100" stroke="#1A3A4A30" strokeWidth="1" />
                    {/* X Axis line */}
                    <Path d="M 30 100 H 320" stroke="#1A3A4A30" strokeWidth="1" />
                    
                    {/* Bars */}
                    {/* Dec */}
                    <Rect x="50" y="45" width="22" height="55" fill="#1A3A4A" rx={4} />
                    {/* Jan */}
                    <Rect x="90" y="35" width="22" height="65" fill="#1A3A4A" rx={4} />
                    {/* Feb */}
                    <Rect x="130" y="55" width="22" height="45" fill="#1A3A4A" rx={4} />
                    {/* Mar */}
                    <Rect x="170" y="25" width="22" height="75" fill="#1A3A4A" rx={4} />
                    {/* Apr */}
                    <Rect x="210" y="15" width="22" height="85" fill="#D4820A" rx={4} />
                    {/* May */}
                    <Rect x="250" y="20" width="22" height="80" fill="#D4820A" rx={4} />
                  </Svg>
                  <View style={styles.chartXLabelsRow}>
                    <Text style={styles.chartXLabel}>Dec</Text>
                    <Text style={styles.chartXLabel}>Jan</Text>
                    <Text style={styles.chartXLabel}>Feb</Text>
                    <Text style={styles.chartXLabel}>Mar</Text>
                    <Text style={styles.chartXLabel}>Apr</Text>
                    <Text style={styles.chartXLabel}>May</Text>
                  </View>
                </View>
              </View>

              {/* Expense Ratio Donut Chart */}
              <View style={styles.detailCard}>
                <Text style={styles.cardGoldTitle}>Expense-to-Income Breakdown</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginVertical: 12 }}>
                  <View style={{ width: 80, height: 80, justifyContent: 'center', alignItems: 'center' }}>
                    <Svg width={80} height={80} viewBox="0 0 40 40">
                      <Circle cx="20" cy="20" r="15" fill="none" stroke="#D4820A" strokeWidth="5" />
                      <Circle cx="20" cy="20" r="15" fill="none" stroke="#1A3A4A" strokeWidth="5" strokeDasharray="94" strokeDashoffset="61" strokeLinecap="round" transform="rotate(-90 20 20)" />
                    </Svg>
                    <View style={{ position: 'absolute' }}>
                      <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#1A3A4A' }}>35%</Text>
                    </View>
                  </View>
                  
                  <View>
                    <View style={styles.legendRow}>
                      <View style={[styles.legendDot, { backgroundColor: '#1A3A4A' }]} />
                      <Text style={styles.legendText}>Fixed Expenses (35%)</Text>
                    </View>
                    <View style={styles.legendRow}>
                      <View style={[styles.legendDot, { backgroundColor: '#D4820A' }]} />
                      <Text style={styles.legendText}>Net Cash Flow Margin (65%)</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Split and Gaps */}
              <View style={styles.detailCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={styles.cardGoldTitle}>Cash Management Gaps</Text>
                  <View style={{ backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#2D7D46' }}>✓ NO OVERDRAFTS</Text>
                  </View>
                </View>
                
                <Text style={styles.cardBodyText}>
                  Digital payments make up 84% of all business inflows. Zero cash handling penalties or overdraft issues have been recorded in the past 6 months.
                </Text>
              </View>
            </View>
          )}

          {activeTab === 'Risk Report' && (
            <View>
              {/* Risk Intelligence Card */}
              <View style={styles.detailCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <Text style={[styles.cardGoldTitle, { marginBottom: 0 }]}>Risk Intelligence</Text>
                  <View style={styles.lowRiskBadge}>
                    <Text style={styles.lowRiskBadgeText}>LOW RISK</Text>
                  </View>
                </View>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={styles.riskLabel}>Default Probability</Text>
                  <Text style={styles.riskValue}>2.4%</Text>
                </View>
                
                <View style={styles.riskProgressBarBg}>
                  <View style={[styles.riskProgressBarFill, { width: `${2.4 * pillarAnimPct}%` as any, backgroundColor: '#2D7D46' }]} />
                </View>
                
                <View style={[styles.sideBySideRow, { marginTop: 16, marginBottom: 12 }]}>
                  <View style={styles.pillarScoreCard}>
                    <Text style={styles.pillarLabel}>STABILITY PILLAR</Text>
                    <Text style={styles.pillarVal}>9.2 / 10</Text>
                  </View>
                  <View style={styles.pillarScoreCard}>
                    <Text style={styles.pillarLabel}>NETWORK PILLAR</Text>
                    <Text style={styles.pillarVal}>8.5 / 10</Text>
                  </View>
                </View>
                
                <View style={styles.aiQuoteBox}>
                  <Text style={styles.aiQuoteText}>
                    "Strong digital footprint and consistent repayment history. AI recommends approval for full amount."
                  </Text>
                </View>
              </View>

              {/* All 6 Pillar Scores */}
              <View style={styles.detailCard}>
                <Text style={styles.cardGoldTitle}>Scoring Pillars Breakdown</Text>
                
                {[
                  { name: 'Income Stability', val: '9.4/10', pct: 94, desc: 'Assesses the consistency and growth of business earnings over time.' },
                  { name: 'Cash Flow Health', val: '8.8/10', pct: 88, desc: 'Measures liquidity, average balances, and inflow vs outflow frequency.' },
                  { name: 'Business Regularity', val: '9.0/10', pct: 90, desc: 'Evaluates location consistency and uninterrupted daily sales velocity.' },
                  { name: 'Payment Discipline', val: '9.5/10', pct: 95, desc: 'Tracks historical timeline of EMI and wholesale supplier invoice payments.' },
                  { name: 'Digital Adoption', val: '8.7/10', pct: 87, desc: 'Measures volume of UPI transactions and adoption of retail apps.' },
                  { name: 'Risk Signals', val: '9.8/10', pct: 98, desc: 'Inspects for red flags like overdrafts, stacked loans, or suspicious counterparties.' },
                ].map((item, idx) => {
                  const currentWidth = item.pct * pillarAnimPct;
                  return (
                    <View key={idx} style={styles.pillarProgressRow}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={styles.pillarProgressName}>{item.name}</Text>
                        <Text style={styles.pillarProgressValText}>{item.val}</Text>
                      </View>
                      <View style={styles.locProgressBarBg}>
                        <View style={[styles.locProgressBarFill, { width: `${currentWidth}%` as any, backgroundColor: '#1A3A4A' }]} />
                      </View>
                      <Text style={{ fontSize: 10, color: '#8E8E93', marginTop: 4, fontStyle: 'italic', fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif' }}>
                        {item.desc}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {activeTab === 'History' && (
            <View>
              {/* Previous Loan History */}
              <View style={styles.detailCard}>
                <Text style={styles.cardGoldTitle}>Previous Loans</Text>
                
                <View style={styles.historyLoanCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <View>
                      <Text style={styles.historyLenderName}>Amul Coop Credit</Text>
                      <Text style={styles.historyLoanDate}>Disbursed Sep 2024</Text>
                    </View>
                    <View style={styles.historyStatusBadgePaid}>
                      <Text style={styles.historyStatusTextPaid}>PAID IN FULL</Text>
                    </View>
                  </View>
                  <Text style={styles.historyLoanTerms}>₹75,000 @ 11.5% • 12 Months Tenure</Text>
                </View>

                <View style={[styles.historyLoanCard, { marginTop: 12 }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <View>
                      <Text style={styles.historyLenderName}>State Bank Micro</Text>
                      <Text style={styles.historyLoanDate}>Disbursed Jan 2023</Text>
                    </View>
                    <View style={styles.historyStatusBadgePaid}>
                      <Text style={styles.historyStatusTextPaid}>PAID IN FULL</Text>
                    </View>
                  </View>
                  <Text style={styles.historyLoanTerms}>₹50,000 @ 14% • 6 Months Tenure</Text>
                </View>
              </View>

              {/* UPI Transaction Volume Trend */}
              <View style={styles.detailCard}>
                <Text style={styles.cardGoldTitle}>Digital Transaction Volume Trend</Text>
                <View style={styles.largeChartContainer}>
                  <Svg width="100%" height={100}>
                    {/* Axis */}
                    <Path d="M 20 80 H 320" stroke="#1A3A4A20" strokeWidth="1" />
                    
                    {/* Line path */}
                    <Path 
                      d="M 30 75 Q 80 50 130 65 T 230 25 T 310 15" 
                      fill="none" 
                      stroke="#D4820A" 
                      strokeWidth="3.5" 
                      strokeLinecap="round" 
                    />
                    
                    {/* Dots at peaks */}
                    <Circle cx="30" cy="75" r="4" fill="#1A3A4A" />
                    <Circle cx="130" cy="65" r="4" fill="#1A3A4A" />
                    <Circle cx="230" cy="25" r="4" fill="#1A3A4A" />
                    <Circle cx="310" cy="15" r="4" fill="#1A3A4A" />
                  </Svg>
                  <View style={styles.chartXLabelsRow}>
                    <Text style={styles.chartXLabel}>Q1 24</Text>
                    <Text style={styles.chartXLabel}>Q2 24</Text>
                    <Text style={styles.chartXLabel}>Q3 24</Text>
                    <Text style={styles.chartXLabel}>Q4 24</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

      </ScrollView>

      {/* 6. Sticky Bottom Action Bar */}
      <View style={[styles.bottomActionBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.termsDisplayRow}>
          <View>
            <Text style={styles.bottomBarLabel}>LOAN REQUESTED</Text>
            <Text style={styles.bottomBarValue}>{reqAmountRaw} @ {reqInterestText} p.a.</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.bottomBarLabel}>TENURE</Text>
            <Text style={styles.bottomBarValue}>{reqTenure}</Text>
          </View>
        </View>

        <View style={styles.buttonsRow}>
          <Pressable onPress={handleDecline} style={styles.declineBtn}>
            <Text style={styles.declineBtnText}>Decline</Text>
          </Pressable>
          
          <Pressable onPress={handleApprove} style={{ flex: 1, marginLeft: 16 }}>
            <LinearGradient
              colors={['#D4820A', '#895100']}
              style={styles.approveGradientBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.approveBtnText}>Approve Loan</Text>
            </LinearGradient>
          </Pressable>
        </View>

        <Pressable onPress={() => setCounterModalVisible(true)} style={styles.counterOfferLinkBtn}>
          <Text style={styles.counterOfferLinkText}>COUNTER OFFER</Text>
        </Pressable>
      </View>

      {/* 7. Counter Offer Sliding Bottom Sheet Modal */}
      <Modal
        visible={counterModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCounterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackground} onPress={() => setCounterModalVisible(false)} />
          <View style={styles.modalCardContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitleText}>Counter Offer Terms</Text>
              <Pressable onPress={() => setCounterModalVisible(false)} style={styles.modalCloseBtn}>
                <SymbolView tintColor="#1C1C18" name="xmark" size={20} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
              {/* Amount slider simulated or input */}
              <Text style={styles.modalLabel}>PROPOSED AMOUNT (₹)</Text>
              <TextInput
                style={styles.modalTextInput}
                keyboardType="numeric"
                value={counterAmount.toString()}
                onChangeText={(val) => {
                  const cleaned = parseInt(val.replace(/[^0-9]/g, '')) || 0;
                  setCounterAmount(cleaned);
                }}
              />
              
              {/* Interest rate input */}
              <Text style={styles.modalLabel}>PROPOSED INTEREST RATE (% P.A.)</Text>
              <TextInput
                style={styles.modalTextInput}
                keyboardType="decimal-pad"
                value={counterRate}
                onChangeText={setCounterRate}
                placeholder="e.g. 12"
              />
              <Text style={styles.inputHelperHint}>AI Suggested: 12% p.a.</Text>

              {/* Tenure toggle options */}
              <Text style={styles.modalLabel}>SELECT TENURE</Text>
              <View style={styles.tenureOptionsRow}>
                {['3 Months', '6 Months', '12 Months', '18 Months', '24 Months'].map((ten) => {
                  const isSelected = counterTenure === ten;
                  return (
                    <Pressable
                      key={ten}
                      onPress={() => setCounterTenure(ten)}
                      style={[styles.tenureOptionBtn, isSelected && styles.tenureOptionBtnSelected]}
                    >
                      <Text style={[styles.tenureOptionText, isSelected && styles.tenureOptionTextSelected]}>
                        {ten}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable onPress={handleSendCounter} style={{ marginTop: 24 }}>
                <LinearGradient
                  colors={['#D4820A', '#895100']}
                  style={styles.modalSubmitBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.modalSubmitBtnText}>Send Counter Offer</Text>
                </LinearGradient>
              </Pressable>
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
    backgroundColor: '#F9F5EF', // Warm Ivory background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F5EF',
  },
  topHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    backgroundColor: '#F9F5EF',
  },
  backBtn: {
    padding: 6,
  },
  headerWordmark: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A3A4A',
    fontFamily: Platform.OS === 'web' ? 'Playfair Display' : 'serif',
  },
  headerProfileIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E8E0D5',
  },
  scrollContent: {
    paddingBottom: 220, // Large bottom padding to prevent sticky bar overlap
  },
  heroBackground: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(26, 58, 74, 0.45)', // Warm dark overlay
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  avatarImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  activeStatusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#2D7D46',
    borderWidth: 2.5,
    borderColor: '#ffffff',
    position: 'absolute',
    bottom: 2,
    right: 4,
  },
  vendorNameText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  vendorLocationText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    letterSpacing: 1,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  
  // TrustScore Card
  trustScoreCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    marginHorizontal: 16,
    marginTop: -24, // Overlaps bottom of hero banner
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    ...Platform.select({
      ios: {
        shadowColor: '#1a3a4a',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: { elevation: 4 },
      web: { boxShadow: '0 6px 20px rgba(26,58,74,0.06)' },
    }),
  },
  scoreGaugeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  largeScoreText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#D4820A',
    fontFamily: Platform.OS === 'web' ? 'JetBrains Mono' : 'monospace',
    lineHeight: 48,
  },
  trustScoreLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#8E8E93',
    letterSpacing: 1.5,
    marginTop: 2,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  gaugeContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointsTrendText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2D7D46',
    marginTop: 10,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F0EAD6',
    marginVertical: 14,
  },
  statPillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statPill: {
    flex: 1,
    alignItems: 'center',
  },
  statPillLabel: {
    fontSize: 9,
    color: '#8E8E93',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  statPillValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1c1c18',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },

  // Tabs Header
  tabsContainer: {
    flexDirection: 'row',
    marginTop: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D5',
    paddingHorizontal: 16,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabItemText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  tabItemTextActive: {
    color: '#1A3A4A',
  },
  tabActiveBar: {
    position: 'absolute',
    bottom: -1,
    width: '60%',
    height: 2.5,
    backgroundColor: '#D4820A',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },

  // Tab Contents
  tabContentContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  detailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  cardGoldTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#D4820A',
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? 'Playfair Display' : 'serif',
  },
  cardBodyText: {
    fontSize: 13,
    color: '#534435',
    lineHeight: 19,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  tagsRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  outlinePill: {
    borderWidth: 1,
    borderColor: '#E8E0D5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
  },
  outlinePillText: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },

  // Overview Extra Widgets
  sideBySideRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#8E8E93',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statBigGoldVal: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#D4820A',
    fontFamily: Platform.OS === 'web' ? 'JetBrains Mono' : 'monospace',
  },
  miniChartContainer: {
    marginTop: 10,
    height: 32,
    justifyContent: 'flex-end',
  },
  tealStatCard: {
    backgroundColor: '#1A3A4A',
    borderRadius: 20,
    padding: 16,
    marginLeft: 6,
  },
  tealStatLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  tealStatBigVal: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: Platform.OS === 'web' ? 'JetBrains Mono' : 'monospace',
  },
  tealStatSubtext: {
    fontSize: 10,
    color: '#2D7D46',
    fontWeight: 'bold',
    marginTop: 10,
  },
  supplierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  supplierBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#2D7D46',
  },
  supplierScroll: {
    paddingVertical: 4,
  },
  supplierChip: {
    backgroundColor: '#F9F5EF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E8E0D5',
  },
  supplierChipText: {
    fontSize: 11,
    color: '#1A3A4A',
    fontWeight: '600',
  },
  mapSnippetContainer: {
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    position: 'relative',
  },
  mapPinLabel: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(28,28,30,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  mapPinLabelText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '600',
  },
  locProgressText: {
    fontSize: 11,
    color: '#534435',
    fontWeight: '600',
  },
  locProgressVal: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#D4820A',
  },
  locProgressBarBg: {
    height: 5,
    backgroundColor: '#E8E0D5',
    borderRadius: 3,
    overflow: 'hidden',
  },
  locProgressBarFill: {
    height: '100%',
    backgroundColor: '#D4820A',
    borderRadius: 3,
  },
  trustRingText: {
    position: 'absolute',
    top: 17,
    left: 14,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#D4820A',
  },
  trustMetricTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1A3A4A',
  },
  trustMetricSub: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
    lineHeight: 15,
  },

  // Financials tab extra styles
  largeChartContainer: {
    marginTop: 8,
    paddingHorizontal: 8,
  },
  chartXLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 4,
  },
  chartXLabel: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '500',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: '#534435',
    fontWeight: '500',
  },

  // Risk Tab Extra Styles
  lowRiskBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  lowRiskBadgeText: {
    color: '#2D7D46',
    fontSize: 10,
    fontWeight: 'bold',
  },
  riskLabel: {
    fontSize: 12,
    color: '#534435',
    fontWeight: '600',
  },
  riskValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2D7D46',
  },
  riskProgressBarBg: {
    height: 4,
    backgroundColor: '#E8E0D5',
    borderRadius: 2,
    overflow: 'hidden',
  },
  riskProgressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  pillarScoreCard: {
    flex: 1,
    backgroundColor: '#F9F5EF',
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E0D5',
  },
  pillarLabel: {
    fontSize: 8,
    color: '#8E8E93',
    fontWeight: '700',
    marginBottom: 2,
  },
  pillarVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1A3A4A',
  },
  aiQuoteBox: {
    backgroundColor: '#F9F5EF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8E0D5',
    borderStyle: 'dashed',
  },
  aiQuoteText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#534435',
    lineHeight: 17,
    textAlign: 'center',
  },
  pillarProgressRow: {
    marginBottom: 10,
  },
  pillarProgressName: {
    fontSize: 11,
    color: '#534435',
    fontWeight: '600',
  },
  pillarProgressValText: {
    fontSize: 11,
    color: '#1A3A4A',
    fontWeight: 'bold',
  },

  // History Tab Extra Styles
  historyLoanCard: {
    backgroundColor: '#F9F5EF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8E0D5',
  },
  historyLenderName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1A3A4A',
  },
  historyLoanDate: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 2,
  },
  historyStatusBadgePaid: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  historyStatusTextPaid: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#2D7D46',
  },
  historyLoanTerms: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D4820A',
    marginTop: 8,
  },

  // Sticky Bottom Action Bar
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    paddingTop: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0EAD6',
    ...Platform.select({
      ios: {
        shadowColor: '#1A3A4A',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: { elevation: 6 },
      web: { boxShadow: '0 -4px 20px rgba(26,58,74,0.05)' },
    }),
  },
  termsDisplayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  bottomBarLabel: {
    fontSize: 9,
    color: '#8E8E93',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bottomBarValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A3A4A',
    marginTop: 2,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  declineBtn: {
    width: '30%',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E74C3C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineBtnText: {
    color: '#E74C3C',
    fontSize: 14,
    fontWeight: '700',
  },
  approveGradientBtn: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  approveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  counterOfferLinkBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  counterOfferLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D4820A',
    letterSpacing: 1.5,
  },

  // Modal Counter offer sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalBackground: {
    ...StyleSheet.absoluteFill,
  },
  modalCardContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A3A4A',
  },
  modalCloseBtn: {
    padding: 6,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
  },
  modalLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 1,
    marginTop: 14,
    marginBottom: 6,
  },
  modalTextInput: {
    height: 48,
    backgroundColor: '#F9F5EF',
    borderWidth: 1,
    borderColor: '#E8E0D5',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: '600',
    color: '#1A3A4A',
  },
  inputHelperHint: {
    fontSize: 11,
    color: '#D4820A',
    marginTop: 4,
    fontWeight: '500',
  },
  tenureOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  tenureOptionBtn: {
    backgroundColor: '#F9F5EF',
    borderWidth: 1,
    borderColor: '#E8E0D5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  tenureOptionBtnSelected: {
    backgroundColor: '#D4820A15',
    borderColor: '#D4820A',
  },
  tenureOptionText: {
    fontSize: 12,
    color: '#534435',
    fontWeight: '500',
  },
  tenureOptionTextSelected: {
    color: '#D4820A',
    fontWeight: '700',
  },
  modalSubmitBtnGradient: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSubmitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
