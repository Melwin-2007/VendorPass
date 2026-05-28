import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Platform, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from '@/components/symbol-view';
import { useAuth } from '@/context/auth';
import { supabase } from '@/lib/supabase';
import { LenderBottomTabBar } from '@/components/BottomTabBar';
import Animated, { FadeInUp, useSharedValue, withTiming, useAnimatedProps, Easing, withDelay, useAnimatedStyle, withSpring, SharedValue } from 'react-native-reanimated';
import Svg, { Path, Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TabType = 'All' | 'Active' | 'Closed' | 'Overdue';

export default function PortfolioScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [activeTab, setActiveTab] = useState<TabType>('All');
  const [loans, setLoans] = useState<any[]>([]);
  const [isReady, setIsReady] = useState(false);

  // Fetch Lender Loans
  useEffect(() => {
    if (!user || user.role !== 'LENDER') return;

    const fetchLoans = async () => {
      const { data, error } = await supabase
        .from('loan_offers')
        .select('*, profiles:profiles!vendor_id(name, selfie, score)')
        .eq('lender_id', user.id)
        .eq('status', 'ACCEPTED')
        .order('created_at', { ascending: false });

      if (data) {
        setLoans(data);
      }
      setIsReady(true);
    };

    fetchLoans();
  }, [user]);

  // Animated Donut Segments
  const arcProgress1 = useSharedValue(0);
  const arcProgress2 = useSharedValue(0);
  const arcProgress3 = useSharedValue(0);
  const arcProgress4 = useSharedValue(0);

  useEffect(() => {
    if (isReady) {
      arcProgress1.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
      arcProgress2.value = withDelay(150, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));
      arcProgress3.value = withDelay(300, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));
      arcProgress4.value = withDelay(450, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));
    }
  }, [isReady]);

  const baseTimeVal = (user as any)?.created_at ? new Date((user as any).created_at).getTime() : Date.now() - 30 * 24 * 60 * 60 * 1000;
  const nowTimeVal = Date.now();
  const dbLoans = loans;

  let totalCapital = 0;
  let totalRecovered = 0;
  let totalPending = 0;
  let totalOverdue = 0;
  let overdueCasesCount = 0;
  
  let secureSum = 0;
  let stableSum = 0;
  let neutralSum = 0;
  let criticalSum = 0;

  const processedLoans = dbLoans.map(loan => {
    const tenureStr = loan.tenure || '6 Months';
    const tenureMonths = parseInt(tenureStr) || 6;
    const principal = Number(loan.amount);
    const interestRate = Number(loan.interest_rate) || 0;
    const totalPayback = principal * (1 + interestRate / 100);
    const emiVal = Math.round(totalPayback / tenureMonths);
    
    const startDate = new Date(loan.accepted_at || loan.created_at);
    const diffMs = Math.max(0, nowTimeVal - startDate.getTime());
    const monthsElapsed = Math.floor(diffMs / (5 * 60 * 1000)); // 5 mins = 1 month
    
    // Simulate paid amount for demo
    let computedPaid = Number(loan.amount_paid) || 0;
    if (loan.id.startsWith('sim-')) {
      if (loan.profiles.name === 'Goel Logistics') {
        computedPaid = emiVal * 4; // 4 months paid, but 12 elapsed -> Overdue
      } else if (loan.profiles.name === 'Priya\'s Gourmet') {
        computedPaid = emiVal * 11;
      } else if (loan.profiles.name === 'Sharma Kirana Store') {
        computedPaid = emiVal * 18;
      } else {
        computedPaid = Math.min(monthsElapsed * emiVal, totalPayback);
      }
    }

    const expectedPaid = Math.min(monthsElapsed * emiVal, totalPayback);
    const hasGracePeriodExpired = (diffMs % (5 * 60 * 1000)) > (2 * 60 * 1000);
    const isPaid = computedPaid >= totalPayback;
    const isOverdue = !isPaid && computedPaid < expectedPaid && hasGracePeriodExpired;
    
    totalCapital += principal;
    totalRecovered += computedPaid;
    totalPending += (totalPayback - computedPaid);

    if (isOverdue) {
      totalOverdue += (expectedPaid - computedPaid);
      overdueCasesCount++;
    }

    const score = loan.profiles?.score || 600;
    if (score >= 750) secureSum += principal;
    else if (score >= 650) stableSum += principal;
    else if (score >= 500) neutralSum += principal;
    else criticalSum += principal;

    return {
      ...loan,
      principal,
      totalPayback,
      computedPaid,
      emiVal,
      tenureMonths,
      monthsElapsed,
      isPaid,
      isOverdue,
      score
    };
  });

  const displayList = processedLoans.filter(l => {
    if (activeTab === 'Active') return !l.isPaid && !l.isOverdue;
    if (activeTab === 'Closed') return l.isPaid;
    if (activeTab === 'Overdue') return l.isOverdue;
    return true; // All
  });

  // Calculate Donut Arc Percentages
  const securePct = secureSum / totalCapital || 0;
  const stablePct = stableSum / totalCapital || 0;
  const neutralPct = neutralSum / totalCapital || 0;
  const criticalPct = criticalSum / totalCapital || 0;

  const R = 46;
  const CIRCUMFERENCE = 2 * Math.PI * R;

  const createAnimatedProps = (pct: number, offsetPct: number, progressVal: SharedValue<number>) => {
    return useAnimatedProps(() => {
      const targetLen = pct * CIRCUMFERENCE;
      const strokeDashoffset = CIRCUMFERENCE - (targetLen * progressVal.value);
      return {
        strokeDasharray: `${CIRCUMFERENCE} ${CIRCUMFERENCE}`,
        strokeDashoffset,
      };
    });
  };

  const aProps1 = createAnimatedProps(securePct, 0, arcProgress1);
  const aProps2 = createAnimatedProps(stablePct, securePct, arcProgress2);
  const aProps3 = createAnimatedProps(neutralPct, securePct + stablePct, arcProgress3);
  const aProps4 = createAnimatedProps(criticalPct, securePct + stablePct + neutralPct, arcProgress4);

  const formatAmountLakhs = (val: number) => {
    if (val >= 100000) {
      return '₹' + (val / 100000).toFixed(1) + 'L';
    }
    return '₹' + val.toLocaleString('en-IN');
  };

  const renderCard = (loan: any, idx: number) => {
    const isOverdue = loan.isOverdue;
    const isClosed = loan.isPaid;
    const vendorIdStr = loan.vendor_id.substring(0, 6).toUpperCase();
    const progressPct = Math.min((loan.computedPaid / loan.totalPayback) * 100, 100);
    const monthsPaid = Math.floor(loan.computedPaid / loan.emiVal);

    return (
      <Animated.View key={loan.id} entering={FadeInUp.delay(80 * idx).duration(400)}>
        <Pressable 
          onPress={() => router.push(`/vendor-detail?vendorId=${loan.vendor_id}&viewOnly=true`)}
          style={({ pressed }) => [
            styles.loanCard,
            isOverdue && styles.loanCardOverdue,
            { transform: [{ scale: pressed ? 0.98 : 1.0 }] }
          ]}
        >
          {/* Top Row */}
          <View style={styles.lcTopRow}>
            <View style={styles.lcVendorInfo}>
              <View style={styles.lcVendorIconBox}>
                <SymbolView name="storefront" size={20} tintColor="#895100" />
              </View>
              <View>
                <Text style={styles.lcVendorName}>{loan.profiles?.name || 'Vendor'}</Text>
                <Text style={styles.lcVendorId}>Vendor ID: #VP-{vendorIdStr}</Text>
              </View>
            </View>
            <View style={[styles.lcStatusBadge, isOverdue && styles.lcStatusBadgeRed, isClosed && styles.lcStatusBadgeClosed]}>
              <Text style={[styles.lcStatusText, isOverdue && styles.lcStatusTextRed, isClosed && styles.lcStatusTextClosed]}>
                {isClosed ? 'CLOSED' : (isOverdue ? 'OVERDUE' : 'ACTIVE')}
              </Text>
            </View>
          </View>

          {/* Middle Row */}
          <View style={styles.lcMiddleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.lcMetricLabel}>LOAN AMOUNT</Text>
              <Text style={styles.lcAmountVal}>₹{loan.principal.toLocaleString('en-IN')}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.lcMetricLabel}>{isOverdue ? 'PENDING SINCE' : 'NEXT EMI'}</Text>
              <Text style={[styles.lcEmiVal, isOverdue && styles.lcEmiValRed]}>
                {isOverdue ? `${Math.max(1, loan.monthsElapsed - monthsPaid) * 30} Days` : `₹${loan.emiVal.toLocaleString('en-IN')}`}
              </Text>
            </View>
          </View>

          {/* Bottom Row */}
          <View style={styles.lcBottomRow}>
            <Text style={styles.lcTenureText}>Tenure: {monthsPaid} / {loan.tenureMonths} Months</Text>
            <Text style={[styles.lcProgressPctText, isOverdue && styles.lcProgressPctTextRed]}>{Math.round(progressPct)}%</Text>
          </View>
          <View style={styles.lcProgressBarBg}>
            <View style={[styles.lcProgressBarFill, isOverdue && styles.lcProgressBarFillRed, { width: `${progressPct}%` }]} />
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image 
            source={{ uri: user?.selfie || 'https://lh3.googleusercontent.com/aida-public/AB6AXuA3hLQjdNWbXnIL9iJKiflOBCYQepD67FLny_XMmVvlbMB1INZ9WOVcww8F1O4yV41f5Vj8zm04GtGfxxTE1mAjFWoqtdOF6RTJc0WyDnAWWqPm9jQUcIwNqUL-XnH0TN0cXlwmDsy3EMjKDqBMeYoY6oKSwui1Xnicj61EaQbPSo0gUOifnx5TIcDCQ0GlRoCPmOb67C5r0A6TOnL0GTv_KRoBnCSrvmnb41itPQhebSP-u9C4jgXRvLXXIVMlbFBDWfSqRcqRDSzI' }} 
            style={styles.headerAvatar} 
          />
          <Text style={styles.headerWordmark}>Vendor<Text style={{ color: '#CC8A00' }}>PASS</Text></Text>
        </View>
        <SymbolView name="notifications" size={24} tintColor="#CC8A00" />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 2. Portfolio Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroSubLabel}>LENDING OVERVIEW</Text>
          <Text style={styles.heroTitle}>Portfolio Health</Text>

          <View style={styles.bentoGrid}>
            {/* Left Col: Donut */}
            <View style={styles.bentoLeftCard}>
              <SymbolView name="bar_chart" size={24} tintColor="#E8E0D5" style={{ position: 'absolute', top: 16, right: 16 }} />
              <View style={styles.donutContainer}>
                <Svg width={120} height={120} viewBox="0 0 100 100" style={{ transform: [{ rotate: '-90deg' }] }}>
                  {/* Background Circle */}
                  <Circle cx={50} cy={50} r={R} stroke="#F0EAD6" strokeWidth={8} fill="none" />
                  
                  {/* Segments */}
                  {securePct > 0 && <AnimatedCircle cx={50} cy={50} r={R} stroke="#CC8A00" strokeWidth={8} fill="none" strokeLinecap="round" animatedProps={aProps1} />}
                  {stablePct > 0 && <AnimatedCircle cx={50} cy={50} r={R} stroke="#F5A623" strokeWidth={8} fill="none" strokeLinecap="round" animatedProps={aProps2} rotation={(securePct * 360)} originX="50" originY="50" />}
                  {neutralPct > 0 && <AnimatedCircle cx={50} cy={50} r={R} stroke="#95A5A6" strokeWidth={8} fill="none" strokeLinecap="round" animatedProps={aProps3} rotation={((securePct + stablePct) * 360)} originX="50" originY="50" />}
                  {criticalPct > 0 && <AnimatedCircle cx={50} cy={50} r={R} stroke="#C0392B" strokeWidth={8} fill="none" strokeLinecap="round" animatedProps={aProps4} rotation={((securePct + stablePct + neutralPct) * 360)} originX="50" originY="50" />}
                </Svg>
                
                <View style={styles.donutCenterLabel}>
                  <Text style={styles.donutCenterLabelText}>TOTAL DEPLOYED</Text>
                  <Text style={styles.donutCenterVal}>{formatAmountLakhs(totalCapital)}</Text>
                </View>
              </View>

              {/* Legend Grid */}
              <View style={styles.legendGrid}>
                <View style={styles.legendRow}>
                  <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#CC8A00' }]} /><Text style={styles.legendText}>Secure</Text></View>
                  <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#F5A623' }]} /><Text style={styles.legendText}>Stable</Text></View>
                </View>
                <View style={styles.legendRow}>
                  <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#95A5A6' }]} /><Text style={styles.legendText}>Neutral</Text></View>
                  <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#C0392B' }]} /><Text style={styles.legendText}>Critical</Text></View>
                </View>
              </View>
            </View>

            {/* Right Col: Stats Grid */}
            <View style={styles.bentoRightCol}>
              <View style={[styles.statCard, { borderLeftColor: '#2D7D46', borderLeftWidth: 4 }]}>
                <Text style={styles.statLabel}>RECOVERED</Text>
                <Text style={styles.statVal}>{formatAmountLakhs(totalRecovered)}</Text>
                <Text style={styles.statDelta}>+12% vs LY</Text>
              </View>
              
              <View style={[styles.statCard, { borderLeftColor: '#CC8A00', borderLeftWidth: 4 }]}>
                <Text style={styles.statLabel}>TOTAL LENT</Text>
                <Text style={styles.statVal}>{formatAmountLakhs(totalCapital)}</Text>
                <Text style={styles.statDeltaMuted}>Total All Time</Text>
              </View>
              
              <View style={[styles.statCard, { borderLeftColor: '#95A5A6', borderLeftWidth: 4 }]}>
                <Text style={styles.statLabel}>PENDING</Text>
                <Text style={styles.statVal}>{formatAmountLakhs(totalPending)}</Text>
                <Text style={styles.statDeltaMuted}>In Repayment</Text>
              </View>

              <View style={[styles.statCard, { borderLeftColor: '#C0392B', borderLeftWidth: 4 }]}>
                <Text style={styles.statLabel}>OVERDUE</Text>
                <Text style={[styles.statVal, { color: '#C0392B' }]}>{formatAmountLakhs(totalOverdue)}</Text>
                <Text style={styles.statDeltaRed}>{overdueCasesCount} Active Cases</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 3. Filter Tabs */}
        <View style={styles.filterTabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTabsScroll}>
            {(['All', 'Active', 'Closed', 'Overdue'] as TabType[]).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <Pressable 
                  key={tab} 
                  style={[styles.filterPill, isActive && styles.filterPillActive]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>{tab}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* 4. Loan Cards List */}
        <View style={styles.loanCardsContainer}>
          {displayList.length > 0 ? (
            displayList.map((loan, idx) => renderCard(loan, idx))
          ) : (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <SymbolView name="inventory_2" size={40} tintColor="#E8E0D5" />
              <Text style={{ marginTop: 16, color: '#8E8E93', fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif' }}>No loans found in this category.</Text>
            </View>
          )}
        </View>

      </ScrollView>

      {/* 5. Bottom Navigation */}
      <LenderBottomTabBar activeTab="portfolio" />
    </View>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8', // Warm Ivory
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#F5F0E8',
    zIndex: 10,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerWordmark: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A3A4A',
    fontFamily: Platform.OS === 'web' ? 'Playfair Display' : 'serif',
  },
  scrollContent: {
    paddingBottom: 120, // space for bottom nav
  },
  heroSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  heroSubLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#8E8E93',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A3A4A',
    marginTop: 4,
    marginBottom: 20,
    fontFamily: Platform.OS === 'web' ? 'Playfair Display' : 'serif',
  },
  bentoGrid: {
    flexDirection: 'column',
    gap: 16,
  },
  bentoLeftCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    alignItems: 'center',
    position: 'relative',
    width: '100%',
  },
  donutContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  donutCenterLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenterLabelText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#8E8E93',
    letterSpacing: 0.5,
  },
  donutCenterVal: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A3A4A',
    fontFamily: Platform.OS === 'web' ? 'DM Mono' : 'monospace',
    marginTop: 2,
  },
  legendGrid: {
    width: '100%',
    paddingHorizontal: 8,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: '#534435',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  bentoRightCol: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'space-between',
    gap: 12,
    width: '100%',
  },
  statCard: {
    backgroundColor: '#F8F4ED',
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: '#E5DED0',
    padding: 16,
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A3A4A',
    fontFamily: Platform.OS === 'web' ? 'DM Mono' : 'monospace',
    marginBottom: 4,
  },
  statDelta: {
    fontSize: 9,
    color: '#2D7D46',
    fontWeight: '600',
  },
  statDeltaMuted: {
    fontSize: 9,
    color: '#A0AAB2',
    fontWeight: '500',
  },
  statDeltaRed: {
    fontSize: 9,
    color: '#C0392B',
    fontWeight: '600',
  },
  filterTabsContainer: {
    marginTop: 24,
    marginBottom: 16,
  },
  filterTabsScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  filterPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#E8E0D5',
    backgroundColor: '#F5F0E8',
  },
  filterPillActive: {
    backgroundColor: '#D4820A',
    borderColor: '#D4820A',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#534435',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  loanCardsContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  loanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#1A3A4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 2,
    borderWidth: 0.5,
    borderColor: '#E5DED0',
  },
  loanCardOverdue: {
    borderLeftWidth: 4,
    borderLeftColor: '#C0392B',
  },
  lcTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  lcVendorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lcVendorIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F5F0E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lcVendorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A3A4A',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
    marginBottom: 2,
  },
  lcVendorId: {
    fontSize: 11,
    color: '#8E8E93',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  lcStatusBadge: {
    backgroundColor: '#E8F5E9', // Teal/Green tint for ACTIVE
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lcStatusBadgeRed: {
    backgroundColor: '#FDECEA',
  },
  lcStatusBadgeClosed: {
    backgroundColor: '#F0F0F0',
  },
  lcStatusText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#2D7D46',
    letterSpacing: 0.5,
  },
  lcStatusTextRed: {
    color: '#C0392B',
  },
  lcStatusTextClosed: {
    color: '#8E8E93',
  },
  lcMiddleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  lcMetricLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#A0AAB2',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  lcAmountVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A3A4A',
    fontFamily: Platform.OS === 'web' ? 'DM Mono' : 'monospace',
  },
  lcEmiVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#D4820A',
    fontFamily: Platform.OS === 'web' ? 'DM Mono' : 'monospace',
  },
  lcEmiValRed: {
    color: '#C0392B',
  },
  lcBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  lcTenureText: {
    fontSize: 11,
    color: '#534435',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  lcProgressPctText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CC8A00',
  },
  lcProgressPctTextRed: {
    color: '#C0392B',
  },
  lcProgressBarBg: {
    height: 4,
    backgroundColor: '#F0EAD6',
    borderRadius: 2,
    overflow: 'hidden',
  },
  lcProgressBarFill: {
    height: '100%',
    backgroundColor: '#CC8A00',
    borderRadius: 2,
  },
  lcProgressBarFillRed: {
    backgroundColor: '#C0392B',
  },
});
