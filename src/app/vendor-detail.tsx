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
import Svg, { Path, Circle, Rect, Defs, LinearGradient as SvgLinearGradient, Stop, G, Text as SvgText } from 'react-native-svg';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';
import Toast from 'react-native-toast-message';
import Animated, { FadeIn, FadeInUp, SlideInRight, useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const HighRiskReport = ({ score }: { score: number }) => {
  const gaugeFillValue = useSharedValue(0);

  React.useEffect(() => {
    gaugeFillValue.value = withTiming(score, { duration: 800, easing: Easing.out(Easing.cubic) });
  }, [score]);

  const animatedArcProps = useAnimatedProps(() => {
    const arcLength = 125.66;
    const offset = arcLength - (arcLength * gaugeFillValue.value) / 850;
    return { strokeDashoffset: offset };
  });

  return (
    <View style={{ paddingBottom: 40, marginTop: 16 }}>
      {/* Top Gauge Section */}
      <View style={{ alignItems: 'center', backgroundColor: '#FFFDF9', paddingVertical: 32, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: '#F0EAD6', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }}>
        <View style={{ height: 100, width: 200, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={200} height={100} viewBox="0 0 100 50">
            <Circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#FDECEA"
              strokeWidth="10"
              strokeDasharray="125.66 125.66"
              strokeDashoffset="125.66"
              strokeLinecap="round"
              transform="rotate(180 50 50)"
            />
            <AnimatedCircle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#C0392B"
              strokeWidth="10"
              strokeDasharray="125.66 125.66"
              strokeLinecap="round"
              transform="rotate(180 50 50)"
              animatedProps={animatedArcProps}
            />
          </Svg>
          <View style={{ position: 'absolute', bottom: 0, alignItems: 'center' }}>
            <Text style={{ fontSize: 42, fontWeight: '800', color: '#1A3A4A', fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif' }}>{score}</Text>
            <Text style={{ fontSize: 10, color: '#8E8E93', fontWeight: 'bold', letterSpacing: 1 }}>OUT OF 850</Text>
          </View>
        </View>

        <View style={{ backgroundColor: '#FDECEA', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginTop: 12, borderWidth: 1, borderColor: '#FADBD8' }}>
          <Text style={{ color: '#C0392B', fontWeight: 'bold', fontSize: 12, letterSpacing: 1 }}>BRONZE — HIGH RISK</Text>
        </View>
      </View>

      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1A3A4A', marginBottom: 16, marginLeft: 4, fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif' }}>Why This Score?</Text>

      {/* Findings */}
      {[
        { icon: '⏱️', title: 'Activity Window Too Short', desc: 'All activity is compressed into just 5 real-world days (~5 in-app months).', color: '#C0392B' },
        { icon: '🔁', title: 'Loan Stacking Detected', desc: 'Received 4 disbursements while servicing EMIs from 7 accounts.', color: '#C0392B' },
        { icon: '📉', title: 'Cash Flow Deeply Negative', desc: 'Debt servicing is over 3x the actual income.', color: '#C0392B', isBar: true },
        { icon: '⚠️', title: 'Suspicious Bookkeeping', desc: 'Counterparty labels suggest fabricated or circular transaction history.', color: '#C0392B' },
        { icon: '🚫', title: 'No Business Verification', desc: 'Zero category tagging, zero utility payments, and zero supplier invoices.', color: '#C0392B' },
      ].map((finding, idx) => (
        <Animated.View key={idx} entering={SlideInRight.delay(idx * 80).duration(400)} style={{ backgroundColor: '#FFFDF9', borderRadius: 12, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: finding.color, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <Text style={{ fontSize: 20, marginRight: 12 }}>{finding.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1A3A4A', marginBottom: 4 }}>{finding.title}</Text>
              <Text style={{ fontSize: 12, color: '#534435', lineHeight: 18 }}>{finding.desc}</Text>
              
              {finding.isBar && (
                <View style={{ marginTop: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 10, color: '#C0392B', fontWeight: 'bold' }}>Outflow: ₹2,97,792</Text>
                    <Text style={{ fontSize: 10, color: '#D4820A', fontWeight: 'bold' }}>Income: ₹94,812</Text>
                  </View>
                  <View style={{ height: 6, backgroundColor: '#F0EAD6', borderRadius: 3, flexDirection: 'row', overflow: 'hidden' }}>
                    <View style={{ width: '75%', backgroundColor: '#C0392B' }} />
                    <View style={{ width: '25%', backgroundColor: '#D4820A' }} />
                  </View>
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      ))}

      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1A3A4A', marginTop: 16, marginBottom: 16, marginLeft: 4, fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif' }}>Positive Signals</Text>
      
      <Animated.View entering={SlideInRight.delay(400).duration(400)} style={{ backgroundColor: '#E8F5E9', borderRadius: 12, padding: 16, marginBottom: 32, borderLeftWidth: 4, borderLeftColor: '#2D7D46' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <SymbolView name="checkmark.circle.fill" tintColor="#2D7D46" size={16} />
          <Text style={{ fontSize: 13, color: '#1B4A29', marginLeft: 8, fontWeight: '600' }}>Some UPI/sales income detected</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <SymbolView name="checkmark.circle.fill" tintColor="#2D7D46" size={16} />
          <Text style={{ fontSize: 13, color: '#1B4A29', marginLeft: 8, fontWeight: '600' }}>Basic wallet usage present</Text>
        </View>
      </Animated.View>

      <View style={{ backgroundColor: '#1A3A4A', padding: 16, borderRadius: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, marginRight: 8 }}>⚡</Text>
        <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14, flex: 1, fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif' }}>Maximum Exposure: ₹5,000 · Weekly Repayment Only</Text>
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');



type TabType = 'Overview' | 'Financials' | 'Risk Report' | 'History';

const HistoryContent = ({ loansList, monthlyInflows, emiCountdown, width }: any) => {
  const activeLoans = loansList.filter((l: any) => l.status !== 'PAID');
  const paidLoans = loansList.filter((l: any) => l.status === 'PAID');
  const totalBorrowed = loansList.reduce((sum: number, l: any) => sum + (l.amount || 0), 0);
  const isStacking = activeLoans.length >= 2;

  const chartProgress = useSharedValue(0);
  React.useEffect(() => {
    chartProgress.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, []);
  const animatedStrokeProps = useAnimatedProps(() => {
    const length = 600; // sufficiently long for path
    return {
      strokeDashoffset: length * (1 - chartProgress.value)
    };
  });
  
  return (
    <View style={{ paddingBottom: 40, paddingTop: 16 }}>
      
      {/* Loan Summary Strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Borrowed', value: `₹${totalBorrowed.toLocaleString('en-IN')}` },
          { label: 'Active Loans', value: activeLoans.length },
          { label: 'Paid in Full', value: paidLoans.length },
          { label: 'Default Rate', value: '0%', color: '#2D7D46' },
        ].map((stat, idx) => (
          <View key={idx} style={{ backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: '#D4820A', paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 }}>
            <Text style={{ fontSize: 12, color: '#8E8E93', marginRight: 8, fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif', fontWeight: '600' }}>{stat.label}</Text>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: stat.color || '#1A3A4A', fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif' }}>{stat.value}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Loan History Section */}
      <Animated.View entering={FadeInUp.delay(0).duration(500)} style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 4 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#D4820A', fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif' }}>Loan History</Text>
          {isStacking && (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FDECEA', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ fontSize: 10, marginRight: 4 }}>⚠️</Text>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#C0392B' }}>Loan Stacking Detected</Text>
            </View>
          )}
        </View>

        {loansList.map((loan: any, idx: number) => {
          const isPaid = loan.status === 'PAID';
          const totalPaid = loan.amountPaid || 0;
          const totalLoan = loan.totalPayback || 0;
          const progressPct = Math.min((totalPaid / totalLoan) * 100, 100);
          
          return (
            <React.Fragment key={loan.id}>
              {isStacking && idx === 1 && (
                <View style={{ backgroundColor: '#FFF4E6', borderRadius: 12, padding: 14, marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, marginRight: 10 }}>⚠️</Text>
                  <Text style={{ fontSize: 13, color: '#895100', flex: 1, fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif', fontWeight: '500' }}>This vendor has 2 active loans simultaneously — elevated stacking risk</Text>
                </View>
              )}

              <View style={{ backgroundColor: '#FFF', borderRadius: 16, borderLeftWidth: 4, borderLeftColor: isPaid ? '#2D7D46' : '#D4820A', padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#1A3A4A', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16, fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif' }}>{loan.lenderName?.charAt(0) || 'L'}</Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: '#1A3A4A', fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif' }}>{loan.lenderName}</Text>
                      <Text style={{ fontSize: 12, color: '#8E8E93', fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif', marginTop: 2 }}>{loan.disbursedDate}</Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: isPaid ? '#E8F5E9' : '#FFF4E6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: isPaid ? '#2D7D46' : '#D4820A' }}>
                      {isPaid ? 'PAID IN FULL ✓' : 'ACTIVE'}
                    </Text>
                  </View>
                </View>

                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#D4820A', fontFamily: Platform.OS === 'web' ? 'JetBrains Mono' : 'monospace', marginBottom: 16 }}>
                  ₹{loan.amount.toLocaleString('en-IN')} @ {loan.interestRate}% · {loan.tenure}
                </Text>

                <View style={{ position: 'relative' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 12, color: isPaid ? '#2D7D46' : '#D4820A', fontWeight: '600', fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif' }}>
                      {isPaid ? 'Completed in 90 days' : `Next EMI: ${emiCountdown || 'Not yet due'}`}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#8E8E93', fontWeight: '500', fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif' }}>
                      ₹{Math.round(totalPaid).toLocaleString('en-IN')} paid / ₹{Math.round(totalLoan).toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={{ height: 6, backgroundColor: '#F0EAD6', borderRadius: 99, overflow: 'hidden' }}>
                    <View style={{ width: `${progressPct}%`, backgroundColor: '#D4820A', height: '100%', borderRadius: 99 }} />
                  </View>
                </View>
              </View>
            </React.Fragment>
          );
        })}
      </Animated.View>

      {/* Digital Transaction Volume Trend card */}
      <Animated.View entering={FadeInUp.delay(100).duration(500)} style={{ backgroundColor: '#FFF', borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3, marginBottom: 16, padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#D4820A', marginBottom: 20, fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif' }}>Digital Transaction Volume Trend</Text>
        
        {(() => {
          const maxInflow = Math.max(100, ...monthlyInflows);
          const avgInflow = monthlyInflows.reduce((a:number, b:number) => a + b, 0) / monthlyInflows.length;
          const avgY = 120 - (avgInflow / maxInflow) * 100;
          
          const points = monthlyInflows.map((val: number, idx: number) => {
            const x = 24 + idx * ((width - 80) / 5);
            const y = 120 - (maxInflow > 0 ? (val / maxInflow) * 100 : 0);
            return { x, y, val };
          });
          
          const dPath = points.map((p: any, i: number) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
          const safeAvgY = isNaN(avgY) ? 120 : avgY;
          
          return (
            <View style={{ width: '100%', height: 160, position: 'relative' }}>
              <Svg width="100%" height={140}>
                <Defs>
                  <SvgLinearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <Stop offset="0" stopColor="rgba(212,130,10,0.15)" />
                    <Stop offset="1" stopColor="rgba(212,130,10,0)" />
                  </SvgLinearGradient>
                </Defs>

                {/* Avg Line */}
                <Path d={`M 20 ${safeAvgY} H ${(width - 60)}`} stroke="#1A3A4A" strokeWidth="1" strokeDasharray="4 4" />

                {/* Area Fill */}
                {points.length > 0 && dPath ? (
                  <Path d={`${dPath} L ${points[points.length-1].x} 140 L ${points[0].x} 140 Z`} fill="url(#areaGrad)" />
                ) : null}
                
                {/* Static Line Path for reliability */}
                {dPath ? (
                  <Path 
                    d={dPath} 
                    fill="none" 
                    stroke="#D4820A" 
                    strokeWidth="2.5" 
                    strokeLinecap="round"
                  />
                ) : null}
                
                {/* Dots */}
                {points.map((p: any, idx: number) => (
                  <Circle 
                    key={idx}
                    cx={p.x}
                    cy={p.y}
                    r={4} 
                    fill="#FFF" 
                    stroke="#1A3A4A"
                    strokeWidth={2}
                  />
                ))}
              </Svg>
              
              {/* Avg Label (Absolute View) */}
              <View style={{ position: 'absolute', right: 20, top: safeAvgY - 14, backgroundColor: 'rgba(255,255,255,0.7)', paddingHorizontal: 4, borderRadius: 4 }}>
                <Text style={{ color: '#1A3A4A', fontSize: 10, fontWeight: 'bold' }}>Avg</Text>
              </View>

              {/* Tooltip on Spike (Absolute View) */}
              {points.length === 6 && (
                <View style={{ position: 'absolute', left: points[5].x - 65, top: points[5].y - 36, alignItems: 'center' }}>
                  <View style={{ backgroundColor: '#1A3A4A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                    <Text style={{ color: '#FFF', fontSize: 9, fontWeight: 'bold' }}>📈 Spike — verify</Text>
                  </View>
                  <View style={{ width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 5, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#1A3A4A', marginTop: 0 }} />
                </View>
              )}

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, marginTop: -10 }}>
                {['M1', 'M2', 'M3', 'M4', 'M5', 'M6'].map((l, i) => (
                  <Text key={i} style={{ fontSize: 11, color: '#8E8E93', fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif' }}>{l}</Text>
                ))}
              </View>
            </View>
          );
        })()}
      </Animated.View>

      {/* Account Timeline */}
      <Animated.View entering={FadeInUp.delay(200).duration(500)} style={{ backgroundColor: '#FFF', borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3, marginBottom: 16, padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#D4820A', marginBottom: 24, fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif' }}>Account Timeline</Text>
        
        <View style={{ paddingLeft: 10 }}>
          {[
            { date: 'Nov 2024', event: 'Joined VendorPASS' },
            { date: 'Dec 2024', event: 'First UPI transaction recorded' },
            { date: 'Jan 2025', event: 'Loan 1 disbursed (₹15,000)' },
            { date: 'Mar 2025', event: 'Loan 1 Paid in Full' },
            { date: 'May 2025', event: 'Loan 2 disbursed (₹40,000)' },
            { date: 'Jul 2025', event: 'Loan 3 disbursed (₹35,000) - Stacking Alert' },
          ].map((item, idx, arr) => (
            <View key={idx} style={{ flexDirection: 'row', marginBottom: idx === arr.length - 1 ? 0 : 28, position: 'relative' }}>
              {/* Vertical line connecting nodes */}
              {idx !== arr.length - 1 && (
                <View style={{ position: 'absolute', left: 5, top: 16, width: 2, height: 44, backgroundColor: '#E8E0D5' }} />
              )}
              {/* Dot */}
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#1A3A4A', borderWidth: 2, borderColor: '#D4820A', marginRight: 16, marginTop: 4, zIndex: 2 }} />
              
              <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Text style={{ fontSize: 13, color: '#8E8E93', fontWeight: 'bold', width: 70, fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif', marginTop: 2 }}>{item.date}</Text>
                <Text style={{ fontSize: 14, color: '#1A3A4A', flex: 1, fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif', fontWeight: '500' }}>{item.event}</Text>
              </View>
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
};

const FinancialsContent = ({ monthlyInflows, monthlyOutflows, expenseRatio, marginRatio }: any) => {
  const donutProgress = useSharedValue(0);
  
  React.useEffect(() => {
    donutProgress.value = withTiming(expenseRatio, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [expenseRatio]);

  const animatedDonutProps = useAnimatedProps(() => {
    const arcLength = 251.2;
    const offset = arcLength * (1 - donutProgress.value / 100);
    return { strokeDashoffset: offset };
  });

  return (
    <View style={{ paddingBottom: 40, paddingTop: 16 }}>
      {/* Monthly Income Chart */}
      <Animated.View entering={FadeInUp.delay(0).duration(500)} style={{ backgroundColor: '#FFFDF9', borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3, marginBottom: 16, padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#D4820A', marginBottom: 24, fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif' }}>Monthly Income (Last 6 Months)</Text>
        
        <View style={{ width: '100%', height: 160, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 10, position: 'relative' }}>
          {/* Trendline Overlay */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 24, zIndex: 5 }} pointerEvents="none">
            <Svg width="100%" height="100%">
              <Path 
                d={`M ${16} ${136 - Math.max(2, (monthlyInflows[0]/Math.max(1000, ...monthlyInflows))*136)} ` +
                   `L ${(width - 80) * 0.2 + 16} ${136 - Math.max(2, (monthlyInflows[1]/Math.max(1000, ...monthlyInflows))*136)} ` +
                   `L ${(width - 80) * 0.4 + 16} ${136 - Math.max(2, (monthlyInflows[2]/Math.max(1000, ...monthlyInflows))*136)} ` +
                   `L ${(width - 80) * 0.6 + 16} ${136 - Math.max(2, (monthlyInflows[3]/Math.max(1000, ...monthlyInflows))*136)} ` +
                   `L ${(width - 80) * 0.8 + 16} ${136 - Math.max(2, (monthlyInflows[4]/Math.max(1000, ...monthlyInflows))*136)} ` +
                   `L ${(width - 80) + 16} ${136 - Math.max(2, (monthlyInflows[5]/Math.max(1000, ...monthlyInflows))*136)}`} 
                stroke="#1A3A4A" 
                strokeWidth="1.5" 
                strokeDasharray="5 5" 
                fill="none" 
              />
            </Svg>
          </View>

          {monthlyInflows.map((val: number, idx: number) => {
            const maxInflow = Math.max(1000, ...monthlyInflows);
            const barHeightPct = Math.max(2, (val / maxInflow) * 100);
            const isCurrent = idx === 5;
            const isEmpty = val < 50;

            return (
              <View key={idx} style={{ alignItems: 'center', width: 30, zIndex: isEmpty ? 1 : 10 }}>
                {isCurrent && !isEmpty && (
                  <View style={{ position: 'absolute', top: -30, backgroundColor: '#1A3A4A', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, zIndex: 10 }}>
                    <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold', fontFamily: Platform.OS === 'web' ? 'JetBrains Mono' : 'monospace' }}>₹{(val/1000).toFixed(1)}k</Text>
                  </View>
                )}
                
                {isEmpty ? (
                  <View style={{ height: 2, width: '100%', borderTopWidth: 1.5, borderTopColor: '#D4820A', borderStyle: 'dashed' }} />
                ) : (
                  <Animated.View entering={FadeInUp.delay(60 * idx).duration(600)} style={{ width: 24, height: `${barHeightPct}%`, borderRadius: 4, overflow: 'hidden' }}>
                    <LinearGradient colors={isCurrent ? ['#D4820A', '#895100'] : ['#F5A623', '#D4820A']} style={{ width: '100%', height: '100%' }} />
                  </Animated.View>
                )}
                <Text style={{ marginTop: 8, fontSize: 11, color: '#8E8E93', fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif' }}>M{idx + 1}</Text>
              </View>
            );
          })}
        </View>
      </Animated.View>

      {/* Expense-to-Income Breakdown */}
      <Animated.View entering={FadeInUp.delay(100).duration(500)} style={{ backgroundColor: '#FFFDF9', borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3, marginBottom: 16, padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#D4820A', marginBottom: 20, fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif' }}>Expense-to-Income Breakdown</Text>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
          <View style={{ width: 140, height: 140, justifyContent: 'center', alignItems: 'center', marginRight: 24 }}>
            <Svg width={140} height={140} viewBox="0 0 100 100">
              <Circle cx="50" cy="50" r="40" fill="none" stroke="#D4820A" strokeWidth="12" />
              <AnimatedCircle cx="50" cy="50" r="40" fill="none" stroke="#1A3A4A" strokeWidth="12" strokeDasharray="251.2 251.2" strokeLinecap="round" transform="rotate(-90 50 50)" animatedProps={animatedDonutProps} />
            </Svg>
            <View style={{ position: 'absolute', alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#1A3A4A', fontFamily: Platform.OS === 'web' ? 'JetBrains Mono' : 'monospace' }}>{expenseRatio}%</Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#1A3A4A', marginRight: 10 }} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1A3A4A', flex: 1, fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif' }}>Fixed Expenses</Text>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1A3A4A', fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif' }}>{expenseRatio}%</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#D4820A', marginRight: 10 }} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1A3A4A', flex: 1, fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif' }}>Net Cash Margin</Text>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1A3A4A', fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif' }}>{marginRatio}%</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 12, borderRadius: 6, flexDirection: 'row', overflow: 'hidden', marginBottom: 20 }}>
          <View style={{ width: `${expenseRatio}%`, backgroundColor: '#1A3A4A', height: '100%' }} />
          <View style={{ width: `${marginRatio}%`, backgroundColor: '#D4820A', height: '100%' }} />
        </View>

        <View style={{ height: 1, backgroundColor: '#E8E0D5', width: '100%', marginBottom: 16 }} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#534435' }}>Debt Servicing Ratio</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#FDECEA', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#C0392B' }}>Critical Warning</Text>
            </View>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#C0392B', fontFamily: Platform.OS === 'web' ? 'JetBrains Mono' : 'monospace' }}>58%</Text>
          </View>
        </View>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: '#F0EAD6', overflow: 'hidden', marginTop: 8 }}>
          <View style={{ width: '58%', backgroundColor: '#C0392B', height: '100%' }} />
        </View>
      </Animated.View>

      {/* Cash Flow Balance Card */}
      <Animated.View entering={FadeInUp.delay(200).duration(500)} style={{ backgroundColor: '#FFFDF9', borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3, marginBottom: 16, padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#D4820A', marginBottom: 20, fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif' }}>Cash Flow Balance</Text>
        
        {monthlyInflows.map((inflow: number, idx: number) => {
          const outflow = monthlyOutflows[idx];
          const maxVal = Math.max(1000, ...monthlyInflows, ...monthlyOutflows);
          const inPct = (inflow / maxVal) * 50;
          const outPct = (outflow / maxVal) * 50;
          const isDeficit = outflow > inflow;

          return (
            <View key={`balance-${idx}`} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, height: 20 }}>
              <Text style={{ width: 30, fontSize: 11, color: '#8E8E93', fontWeight: 'bold' }}>M{idx+1}</Text>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1, alignItems: 'flex-end', paddingRight: 4 }}>
                  <View style={{ height: 14, backgroundColor: isDeficit ? '#C0392B' : '#1A3A4A', width: `${outPct * 2}%`, borderRadius: 4 }} />
                </View>
                <View style={{ width: 2, height: 24, backgroundColor: '#DFD5C6', marginHorizontal: 2 }} />
                <View style={{ flex: 1, alignItems: 'flex-start', paddingLeft: 4, flexDirection: 'row' }}>
                  <View style={{ height: 14, backgroundColor: '#D4820A', width: `${inPct * 2}%`, borderRadius: 4 }} />
                  {isDeficit && <Text style={{ fontSize: 12, marginLeft: 6 }}>⚠️</Text>}
                </View>
              </View>
            </View>
          );
        })}
      </Animated.View>

      {/* Digital vs Cash Split */}
      <Animated.View entering={FadeInUp.delay(300).duration(500)} style={{ backgroundColor: '#FFFDF9', borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3, marginBottom: 16, padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#D4820A', marginBottom: 16, fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif' }}>Digital vs Cash Split</Text>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#D4820A' }}>Digital: 84%</Text>
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#8E8E93' }}>Cash: 16%</Text>
        </View>
        <View style={{ height: 12, borderRadius: 6, flexDirection: 'row', overflow: 'hidden', marginBottom: 16 }}>
          <View style={{ width: '84%', backgroundColor: '#D4820A', height: '100%' }} />
          <View style={{ width: '16%', backgroundColor: '#E8E0D5', height: '100%' }} />
        </View>
        <Text style={{ fontSize: 13, color: '#2D7D46', fontStyle: 'italic', fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif' }}>
          84% of transactions are UPI/wallet-based — strong digital trail
        </Text>
      </Animated.View>

      {/* Cash Management Gaps */}
      <Animated.View entering={FadeInUp.delay(400).duration(500)} style={{ backgroundColor: '#FFFDF9', borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3, marginBottom: 16, padding: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#D4820A', fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif' }}>Cash Management Gaps</Text>
          <View style={{ backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#2D7D46' }}>NO OVERDRAFTS ✓</Text>
          </View>
        </View>

        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 20, marginRight: 12 }}>📱</Text>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#1A3A4A' }}>Digital Payment Share</Text>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#D4820A' }}>84%</Text>
              </View>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: '#F0EAD6', overflow: 'hidden' }}>
                <View style={{ width: '84%', backgroundColor: '#D4820A', height: '100%' }} />
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 1, backgroundColor: '#E8E0D5', width: '100%', marginBottom: 16 }} />

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 20, marginRight: 12 }}>💸</Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#1A3A4A', flex: 1 }}>Overdraft Events</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#2D7D46', marginRight: 6 }}>0</Text>
            <Text style={{ fontSize: 12, color: '#8E8E93' }}>Clean record</Text>
          </View>
        </View>

        <View style={{ height: 1, backgroundColor: '#E8E0D5', width: '100%', marginBottom: 16 }} />

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 20, marginRight: 12 }}>⚡</Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#1A3A4A', flex: 1 }}>Cash Handling Penalties</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#8E8E93', marginRight: 6 }}>None detected</Text>
            <SymbolView name="checkmark.circle.fill" size={16} tintColor="#2D7D46" />
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

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
    viewOnly?: string;
    interest_rate?: string;
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

  // Live database transactions & loans
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [selectedBarIndex, setSelectedBarIndex] = useState<number | null>(null);
  const [selectedLineIndex, setSelectedLineIndex] = useState<number | null>(null);
  const [emiCountdown, setEmiCountdown] = useState<string>('');
  const [baseTimeState, setBaseTimeState] = useState<number>(0);

  // Load request details (parsed from params)
  const reqAmountRaw = params.amount || '₹2,50,000';
  const reqAmountNum = parseInt(reqAmountRaw.replace(/[^0-9]/g, '')) || 250000;
  const reqTenure = params.tenure || '24 Months';
  const reqNote = params.note || 'business inventory expansion';
  const reqCategory = params.category || 'Retail';
  const reqLocation = params.location || 'Mumbai';
  
  // Extract interest from param or default to 12%
  const reqInterestText = params.interest_rate ? `${params.interest_rate}%` : '12%';
  const reqInterestNum = params.interest_rate ? parseFloat(params.interest_rate) : 12.0;



  // Fetch Vendor Profile, Transactions, and Loans
  useEffect(() => {
    if (!vendorId) return;

    const fetchVendorData = async () => {
      try {
        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', vendorId)
          .single();

        if (profileErr) throw profileErr;
        setProfileData(profile);
        setCounterAmount(reqAmountNum);

        const { data: txData, error: txErr } = await supabase
          .from('wallet_transactions')
          .select('*')
          .eq('user_id', vendorId)
          .order('created_at', { ascending: true });

        if (txErr) console.error('Error fetching transactions:', txErr);
        else if (txData) setTransactions(txData);

        const { data: loansData, error: loansErr } = await supabase
          .from('loan_offers')
          .select('*, profiles:profiles!lender_id(name, selfie)')
          .eq('vendor_id', vendorId)
          .order('created_at', { ascending: false });

        if (loansErr) console.error('Error fetching loans:', loansErr);
        else if (loansData) setLoans(loansData);

      } catch (err) {
        console.error('Error fetching vendor profile:', err);
        setProfileData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorData();
  }, [vendorId]);

  // Animated Count-Up and Gauge Fill on Enter
  useEffect(() => {
    if (loading || !profileData) return;

    // Reset animations in requestAnimationFrame to avoid synchronous setState inside useEffect
    const frameId = requestAnimationFrame(() => {
      setCountUpPoints(0);
      setGaugeOffset(188);
      setAnimatedScore(300);
      setPillarAnimPct(0);
      const bTime = profileData?.created_at ? new Date(profileData.created_at).getTime() : Date.now() - 30 * 60 * 1000;
      setBaseTimeState(bTime);
    });

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
      cancelAnimationFrame(frameId);
      clearInterval(interval);
      clearInterval(scoreInterval);
      clearInterval(pillarInterval);
      clearTimeout(timer);
    };
  }, [loading, profileData, activeTab]);

  // Real-time Countdown Timer for Next EMI
  useEffect(() => {
    const activeLoan = loans.find(loan => {
      const principal = Number(loan.amount);
      const interest = Number(loan.interest_rate) || 0;
      const totalPayback = principal + (principal * (interest / 100));
      const amountPaid = Number(loan.amount_paid) || 0;
      return loan.status === 'ACCEPTED' && amountPaid < totalPayback;
    });

    if (!activeLoan || !activeLoan.accepted_at) {
      const frameId = requestAnimationFrame(() => {
        setEmiCountdown('');
      });
      return () => cancelAnimationFrame(frameId);
    }

    const interval = setInterval(() => {
      const baseTime = new Date(activeLoan.accepted_at).getTime();
      const elapsed = Date.now() - baseTime;
      const monthsElapsed = Math.floor(elapsed / (5 * 60 * 1000));
      const nextEmiTime = baseTime + (monthsElapsed + 1) * 5 * 60 * 1000;
      const remainingMs = nextEmiTime - Date.now();
      
      if (remainingMs <= 0) {
        setEmiCountdown('EMI Due Now!');
      } else {
        const mins = Math.floor(remainingMs / 60000);
        const secs = Math.floor((remainingMs % 60000) / 1000);
        setEmiCountdown(`${mins}m ${secs}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [loans]);

  // Derived calculations from live and baseline transactions
  const score = profileData?.trust_score_data?.trust_score ?? profileData?.score ?? 782;
  const baseTime = baseTimeState || (profileData?.created_at ? new Date(profileData.created_at).getTime() : 1773489600000);

  const getMergedTransactions = () => {
    return [...transactions].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  };

  const mergedTx = getMergedTransactions();

  // Compute virtual month statistics (last 6 virtual months)
  const monthlyInflows = [0, 0, 0, 0, 0, 0];
  const monthlyOutflows = [0, 0, 0, 0, 0, 0];
  mergedTx.forEach(tx => {
    const elapsed = new Date(tx.created_at).getTime() - baseTime;
    let mIdx = Math.floor(elapsed / (5 * 60 * 1000));
    if (mIdx < 0) mIdx = 0;
    if (mIdx > 5) mIdx = 5;

    const amt = Number(tx.amount);
    if (tx.type === 'ADD') {
      monthlyInflows[mIdx] += amt;
    } else {
      monthlyOutflows[mIdx] += amt;
    }
  });

  const totalInflow = monthlyInflows.reduce((a, b) => a + b, 0);
  const totalOutflow = monthlyOutflows.reduce((a, b) => a + b, 0);
  const expenseRatio = totalInflow > 0 ? Math.min(95, Math.round((totalOutflow / totalInflow) * 100)) : 35;
  const marginRatio = 100 - expenseRatio;

  // Average daily transactions in current month
  const currentMonthInflow = monthlyInflows[5] || monthlyInflows.reduce((a, b) => a + b, 0) / 6;
  const avgDailyInflow = Math.round(currentMonthInflow / 30);

  // Dynamic loan history listing
  const getLoansList = () => {
    const list: any[] = [];
    loans.forEach(loan => {
      if (loan.status !== 'ACCEPTED') return;
      
      const principal = Number(loan.amount);
      const interest = Number(loan.interest_rate) || 0;
      const totalPayback = principal + (principal * (interest / 100));
      const amountPaid = Number(loan.amount_paid) || 0;
      const isPaid = amountPaid >= totalPayback;
      
      list.push({
        id: loan.id,
        lenderName: loan.profiles?.name || 'Financial Partner',
        disbursedDate: loan.accepted_at ? `Disbursed ${new Date(loan.accepted_at).toLocaleDateString()}` : 'Disbursed recently',
        amount: principal,
        interestRate: interest,
        tenure: loan.tenure,
        amountPaid: amountPaid,
        totalPayback: totalPayback,
        status: isPaid ? 'PAID' : 'ACTIVE',
        accepted_at: loan.accepted_at,
        created_at: loan.created_at
      });
    });



    return list;
  };

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
        interest_rate: reqInterestNum,
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
            source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&auto=format&fit=crop' }}
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
              source={{ uri: profileData?.selfie || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&auto=format&fit=crop' }}
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
          {activeTab === 'Overview' && (() => {
            const findings = profileData?.trust_score_data?.findings || [
              { color: '#2D7D46', label: 'Strong Sales', desc: 'Consistent daily UPI inflow' },
              { color: '#C0392B', label: 'High Debt', desc: 'Multiple EMI deductions' },
              { color: '#D4820A', label: 'Limited History', desc: 'Activity spans only 5 months' },
              { color: '#2D7D46', label: 'Verified Location', desc: 'Geo-ping matches shop address' },
              { color: '#2D7D46', label: 'No Defaults', desc: 'Zero late payment fees' },
            ];

            const generateSuppliers = (vId: string) => {
              const allSuppliers = ['Patel Dairy', 'Aziz Wholesale', 'Mumbai Distributors', 'Kirana Coop', 'Sharma Traders', 'City Fresh Produce', 'Metro Cash & Carry'];
              const hash = vId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
              const numSuppliers = (hash % 3) + 3;
              const suppliers = [];
              for(let i=0; i<numSuppliers; i++) {
                suppliers.push(allSuppliers[(hash + i) % allSuppliers.length]);
              }
              return suppliers;
            };
            const supplierNetwork = generateSuppliers(vendorId || 'default');

            const locDays = profileData?.trust_score_data?.location_consistency_days ?? 28;
            const locName = profileData?.trust_score_data?.location_name ?? 'Dadar Stn Road, Dadar West';
            const locPct = Math.round((locDays / 30) * 100);

            const mergedTx = getMergedTransactions();
            const addTx = mergedTx.filter(tx => tx.type === 'ADD');
            const avgTxAmt = addTx.length > 0 ? Math.round(addTx.reduce((sum, tx) => sum + Number(tx.amount), 0) / addTx.length) : 185;
            const avgDailyCust = Math.max(1, Math.round(addTx.length / 30));
            const repeatRate = Math.min(98, Math.max(12, 50 + (addTx.length % 40)));
            const repeatRingOffset = 100.53 * (1 - repeatRate / 100);

            return (
              <View style={{ paddingBottom: 40, paddingTop: 16 }}>
                {/* Business Description Card */}
                <Animated.View entering={FadeInUp.delay(0).duration(500)} style={{ backgroundColor: '#FFFDF9', borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3, marginBottom: 16, padding: 20 }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#D4820A', marginBottom: 12, fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif' }}>Business Description</Text>
                  <Text numberOfLines={2} style={{ fontSize: 14, color: '#534435', marginBottom: 20, lineHeight: 22, fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif' }}>
                    {profileData?.trust_score_data?.score_explanation || 
                      `${profileData?.name || 'Arjun Singh'} operates a verified retail vegetable stall in Dadar Market serving over 200 daily customers. Operating since 2021, the business has seen a 40% YoY growth in digital transactions.`}
                  </Text>

                  <View style={{ marginBottom: 20, gap: 10 }}>
                    {findings.map((row: any, idx: number) => (
                      <View key={idx} style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: row.color, marginRight: 12 }} />
                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#1A3A4A', width: 130 }}>{row.label}</Text>
                        <Text style={{ fontSize: 13, color: '#534435', flex: 1 }} numberOfLines={1}>{row.desc}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#D4820A', backgroundColor: '#FFFDF9' }}>
                      <Text style={{ fontSize: 11, color: '#D4820A', fontWeight: 'bold' }}>Aadhaar Verified</Text>
                    </View>
                    <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#D4820A', backgroundColor: '#FFFDF9' }}>
                      <Text style={{ fontSize: 11, color: '#D4820A', fontWeight: 'bold' }}>3.5 Years Active</Text>
                    </View>
                  </View>
                </Animated.View>

                {/* Stats Row */}
                <Animated.View entering={FadeInUp.delay(60).duration(500)} style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
                  {/* Left Card */}
                  <View style={{ flex: 1, backgroundColor: '#FFFDF9', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3, justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#8E8E93', letterSpacing: 0.5 }}>AVG DAILY TRANS</Text>
                    <Text style={{ fontSize: 22, fontWeight: '800', color: '#D4820A', marginTop: 12, marginBottom: 16, fontFamily: Platform.OS === 'web' ? 'JetBrains Mono' : 'monospace' }}>₹{avgDailyInflow.toLocaleString('en-IN')}</Text>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 40, gap: 4 }}>
                      {[0.4, 0.6, 0.5, 0.8, 1.0, 0.7, 0.9].map((heightPct, idx) => (
                        <View key={idx} style={{ flex: 1, height: `${heightPct * 100}%`, backgroundColor: heightPct === 1.0 ? '#895100' : '#F0EAD6', borderRadius: 2 }} />
                      ))}
                    </View>
                  </View>
                  
                  {/* Right Card */}
                  <View style={{ flex: 1, backgroundColor: '#1A3A4A', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3, justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#8E8E93', letterSpacing: 0.5 }}>MONTHLY INCOME</Text>
                    <View>
                      <Text style={{ fontSize: 22, fontWeight: '800', color: '#FFF', marginTop: 12, fontFamily: Platform.OS === 'web' ? 'JetBrains Mono' : 'monospace' }}>₹{(currentMonthInflow / 1000).toFixed(1)}k</Text>
                      <Text style={{ fontSize: 12, color: '#2D7D46', fontWeight: 'bold', marginTop: 8 }}>+8% vs Prev.</Text>
                    </View>
                  </View>
                </Animated.View>

                {/* Supplier Network Card */}
                <Animated.View entering={FadeInUp.delay(120).duration(500)} style={{ backgroundColor: '#FFFDF9', borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3, marginBottom: 16, padding: 20 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#D4820A', fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif' }}>Supplier Network</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                      <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#2D7D46' }}>Link Verified ✓</Text>
                    </View>
                  </View>
                  
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {supplierNetwork.map((sup, idx) => (
                      <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1, borderColor: '#D4820A', backgroundColor: '#FFF' }}>
                        <Text style={{ fontSize: 13, color: '#1A3A4A', fontWeight: '600', marginRight: 6 }}>{sup}</Text>
                        <SymbolView name="checkmark.circle.fill" tintColor="#2D7D46" size={14} />
                      </View>
                    ))}
                  </ScrollView>
                </Animated.View>

                {/* Location Consistency Card */}
                <Animated.View entering={FadeInUp.delay(180).duration(500)} style={{ backgroundColor: '#FFFDF9', borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3, marginBottom: 16, padding: 20 }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#D4820A', marginBottom: 16, fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif' }}>Location Consistency</Text>
                  
                  <View style={{ height: 120, width: '100%', backgroundColor: '#F0EAD6', borderRadius: 12, overflow: 'hidden', position: 'relative', marginBottom: 16 }}>
                    <Svg width="100%" height="100%">
                      <Path d="M 0 30 H 400" stroke="#DFD5C6" strokeWidth="4" />
                      <Path d="M 0 80 H 400" stroke="#DFD5C6" strokeWidth="4" />
                      <Path d="M 120 0 V 120" stroke="#DFD5C6" strokeWidth="4" />
                      <Path d="M 280 0 V 120" stroke="#DFD5C6" strokeWidth="4" />
                      <Circle cx="160" cy="60" r="24" fill="#D4820A25" />
                      <Circle cx="160" cy="60" r="8" fill="#D4820A" />
                    </Svg>
                    <View style={{ position: 'absolute', left: 16, bottom: 16, backgroundColor: '#FFF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1A3A4A' }}>{locName}</Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ fontSize: 13, color: '#534435', fontWeight: '500' }}>Geo-verified</Text>
                    <Text style={{ fontSize: 13, color: '#1A3A4A', fontWeight: 'bold' }}>{locDays}/30 days</Text>
                  </View>
                  <View style={{ height: 6, backgroundColor: '#E8E0D5', borderRadius: 3, overflow: 'hidden' }}>
                    <View style={{ width: `${locPct}%`, height: '100%', backgroundColor: '#D4820A' }} />
                  </View>
                </Animated.View>

                {/* Customer Trust Indicators */}
                <Animated.View entering={FadeInUp.delay(240).duration(500)} style={{ backgroundColor: '#FFFDF9', borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3, marginBottom: 16, padding: 20 }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#D4820A', marginBottom: 16, fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif' }}>Customer Trust Indicators</Text>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                    <View style={{ width: 60, height: 60, justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                      <Svg width={60} height={60} viewBox="0 0 40 40" style={{ position: 'absolute' }}>
                        <Circle cx="20" cy="20" r="16" fill="none" stroke="#E8E0D5" strokeWidth="4" />
                        <Circle cx="20" cy="20" r="16" fill="none" stroke="#1A3A4A" strokeWidth="4" strokeDasharray="100.53" strokeDashoffset={repeatRingOffset} strokeLinecap="round" transform="rotate(-90 20 20)" />
                      </Svg>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#1A3A4A', fontFamily: Platform.OS === 'web' ? 'JetBrains Mono' : 'monospace' }}>{repeatRate}%</Text>
                    </View>
                    <View style={{ marginLeft: 16, flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#1A3A4A', marginBottom: 4 }}>Repeat Customer Rate</Text>
                      <Text style={{ fontSize: 12, color: '#8E8E93', lineHeight: 18, fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif' }}>Avg ₹{avgTxAmt} from {avgDailyCust} unique customers/day</Text>
                    </View>
                  </View>

                  <View style={{ height: 1, backgroundColor: '#E8E0D5', width: '100%', marginBottom: 16 }} />
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <SymbolView name="checkmark.shield.fill" size={16} tintColor="#2D7D46" style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#2D7D46' }}>Customer diversity: {repeatRate > 60 ? 'Healthy' : 'Needs Improvement'}</Text>
                  </View>
                </Animated.View>

                {/* Final Recommendation */}
                <Animated.View entering={FadeInUp.delay(300).duration(500)} style={{ backgroundColor: '#FFFDF9', borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3, marginBottom: 16, padding: 20, borderLeftWidth: 6, borderLeftColor: '#C0392B' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <SymbolView name="exclamationmark.triangle.fill" size={20} tintColor="#C0392B" style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#C0392B', fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif', letterSpacing: 0.5 }}>FINAL RECOMMENDATION</Text>
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#1A3A4A', marginBottom: 8, fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif' }}>Application Flagged for Manual Review</Text>
                  <Text style={{ fontSize: 14, color: '#534435', lineHeight: 22, fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif' }}>
                    The combination of severe loan stacking, probable income fabrication (loans labeled as profit/salary), extremely short operating history, and zero business verification signals indicates a high probability of default at 71%. A maximum exposure of ₹5,000 with weekly repayment is the ceiling if any onboarding is approved. If the vendor can provide GST registration, bank statements from a primary banking account, and evidence of physical business premises, a re-evaluation may be considered after 6 months of clean transaction history. Strong recommendation to refer for enhanced due diligence before any disbursement.
                  </Text>
                </Animated.View>
              </View>
            );
          })()}

          {activeTab === 'Financials' && (
            <FinancialsContent 
              monthlyInflows={monthlyInflows} 
              monthlyOutflows={monthlyOutflows} 
              expenseRatio={expenseRatio} 
              marginRatio={marginRatio} 
            />
          )}

          {activeTab === 'Risk Report' && (() => {
            const trustData = profileData?.trust_score_data;
            const score = profileData?.trust_score_data?.trust_score ?? profileData?.score ?? 782;
            
            if (score <= 300) {
              return <HighRiskReport score={score} />;
            }
            
            const defaultProbRaw = trustData?.default_probability || (score >= 750 ? '1.2%' : score >= 650 ? '4.5%' : '12.8%');
            const defaultProbNum = parseFloat(defaultProbRaw) || 2.4;
            
            const riskTier = trustData?.risk_tier || (score >= 750 ? 'LOW RISK' : score >= 650 ? 'MEDIUM RISK' : 'HIGH RISK');
            const riskBadgeColor = riskTier.toUpperCase().includes('LOW') ? '#E8F5E9' : riskTier.toUpperCase().includes('MEDIUM') ? '#FFF3E0' : '#FDECEA';
            const riskTextColor = riskTier.toUpperCase().includes('LOW') ? '#2D7D46' : riskTier.toUpperCase().includes('MEDIUM') ? '#D4820A' : '#E74C3C';
            
            const aiQuote = trustData?.score_explanation || (score >= 750 
              ? "Strong digital footprint and consistent repayment history. AI recommends approval for full amount."
              : score >= 650 
              ? "Moderate cash flow with some variability. AI recommends approval with standard limits."
              : "High expense ratio and inconsistent history detected. AI recommends caution and lower limits.");

            const highlightPillar1 = { 
              name: 'INCOME STABILITY', 
              score: trustData?.pillars?.income_stability?.score || (score >= 700 ? 9.2 : 6.5)
            };
            const highlightPillar2 = { 
              name: 'PAYMENT DISCIPLINE', 
              score: trustData?.pillars?.payment_discipline?.score || (score >= 700 ? 9.5 : 5.8)
            };

            const dynamicPillars = [
              { 
                name: 'Income Stability', 
                val: `${trustData?.pillars?.income_stability?.score || (score >= 700 ? 9.4 : 6.5)}/10`, 
                pct: (trustData?.pillars?.income_stability?.score || (score >= 700 ? 9.4 : 6.5)) * 10, 
                desc: trustData?.pillars?.income_stability?.reason || 'Assesses the consistency and growth of business earnings over time.' 
              },
              { 
                name: 'Cash Flow Health', 
                val: `${trustData?.pillars?.cash_flow_health?.score || (score >= 700 ? 8.8 : 6.2)}/10`, 
                pct: (trustData?.pillars?.cash_flow_health?.score || (score >= 700 ? 8.8 : 6.2)) * 10, 
                desc: trustData?.pillars?.cash_flow_health?.reason || 'Measures liquidity, average balances, and inflow vs outflow frequency.' 
              },
              { 
                name: 'Business Regularity', 
                val: `${trustData?.pillars?.business_regularity?.score || (score >= 700 ? 9.0 : 7.0)}/10`, 
                pct: (trustData?.pillars?.business_regularity?.score || (score >= 700 ? 9.0 : 7.0)) * 10, 
                desc: trustData?.pillars?.business_regularity?.reason || 'Evaluates location consistency and uninterrupted daily sales velocity.' 
              },
              { 
                name: 'Payment Discipline', 
                val: `${trustData?.pillars?.payment_discipline?.score || (score >= 700 ? 9.5 : 5.5)}/10`, 
                pct: (trustData?.pillars?.payment_discipline?.score || (score >= 700 ? 9.5 : 5.5)) * 10, 
                desc: trustData?.pillars?.payment_discipline?.reason || 'Tracks historical timeline of EMI and wholesale supplier invoice payments.' 
              },
              { 
                name: 'Digital Adoption', 
                val: `${trustData?.pillars?.digital_adoption?.score || (score >= 700 ? 8.7 : 7.5)}/10`, 
                pct: (trustData?.pillars?.digital_adoption?.score || (score >= 700 ? 8.7 : 7.5)) * 10, 
                desc: trustData?.pillars?.digital_adoption?.reason || 'Measures volume of UPI transactions and adoption of retail apps.' 
              },
              { 
                name: 'Risk Signals', 
                val: `${trustData?.pillars?.risk_signals?.score || (score >= 700 ? 9.8 : 6.0)}/10`, 
                pct: (trustData?.pillars?.risk_signals?.score || (score >= 700 ? 9.8 : 6.0)) * 10, 
                desc: trustData?.pillars?.risk_signals?.reason || 'Inspects for red flags like overdrafts, stacked loans, or suspicious counterparties.' 
              },
            ];

            return (
              <View>
                {/* Risk Intelligence Card */}
                <View style={styles.detailCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <Text style={[styles.cardGoldTitle, { marginBottom: 0 }]}>Risk Intelligence</Text>
                    <View style={[styles.lowRiskBadge, { backgroundColor: riskBadgeColor }]}>
                      <Text style={[styles.lowRiskBadgeText, { color: riskTextColor }]}>{riskTier.toUpperCase()}</Text>
                    </View>
                  </View>
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={styles.riskLabel}>Default Probability</Text>
                    <Text style={[styles.riskValue, { color: riskTextColor }]}>{defaultProbRaw}</Text>
                  </View>
                  
                  <View style={styles.riskProgressBarBg}>
                    <View style={[styles.riskProgressBarFill, { width: `${defaultProbNum * pillarAnimPct}%` as any, backgroundColor: riskTextColor }]} />
                  </View>
                  
                  <View style={[styles.sideBySideRow, { marginTop: 16, marginBottom: 12 }]}>
                    <View style={styles.pillarScoreCard}>
                      <Text style={styles.pillarLabel}>{highlightPillar1.name}</Text>
                      <Text style={styles.pillarVal}>{highlightPillar1.score} / 10</Text>
                    </View>
                    <View style={styles.pillarScoreCard}>
                      <Text style={styles.pillarLabel}>{highlightPillar2.name}</Text>
                      <Text style={styles.pillarVal}>{highlightPillar2.score} / 10</Text>
                    </View>
                  </View>
                  
                  <View style={styles.aiQuoteBox}>
                    <Text style={styles.aiQuoteText}>
                      {`"${aiQuote}"`}
                    </Text>
                  </View>
                </View>

                {/* All 6 Pillar Scores */}
                <View style={styles.detailCard}>
                  <Text style={styles.cardGoldTitle}>Scoring Pillars Breakdown</Text>
                  
                  {dynamicPillars.map((item, idx) => {
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
            );
          })()}

          {activeTab === 'History' && (
            <HistoryContent 
              loansList={getLoansList()} 
              monthlyInflows={monthlyInflows} 
              emiCountdown={emiCountdown} 
              width={width} 
            />
          )}
        </View>

      </ScrollView>

      {/* 6. Sticky Bottom Action Bar */}
      {params.viewOnly !== 'true' && (
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
      )}

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
  historyStatusBadgeActive: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  historyStatusTextActive: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#D4820A',
  },
  historyLoanCountdown: {
    fontSize: 11,
    color: '#E74C3C',
    fontWeight: '600',
    marginTop: 6,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  chartDetailPanel: {
    backgroundColor: '#F9F5EF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8E0D5',
    marginTop: 12,
  },
  chartDetailTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#8E8E93',
    letterSpacing: 1,
    marginBottom: 4,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  chartDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A3A4A',
    marginBottom: 2,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  chartDetailSub: {
    fontSize: 11,
    color: '#534435',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
});
