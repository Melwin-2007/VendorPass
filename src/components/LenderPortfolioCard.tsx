import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutAnimation, Platform } from 'react-native';

interface LenderPortfolioCardProps {
  portfolioStats: {
    activeLoans: number;
    capitalDeployed: number;
    avgReturn: number;
    walletBalance: number;
  };
  monthlyYields: number[];
}

export function LenderPortfolioCard({ portfolioStats, monthlyYields }: LenderPortfolioCardProps) {
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number | null>(5);

  useEffect(() => {
    if (Platform.OS === 'android' && typeof LayoutAnimation.setLayoutAnimationEnabledExperimental === 'function') {
      LayoutAnimation.setLayoutAnimationEnabledExperimental(true);
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, []);

  const formatCurrency = (val: number) => {
    return '₹' + val.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  };

  const maxYield = Math.max(...monthlyYields, 10);

  return (
    <View style={styles.portfolioCard}>
      <Text style={styles.pcHeaderTitle}>TOTAL CAPITAL DEPLOYED</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
        <Text style={styles.pcCurrencySymbol}>₹ </Text>
        <Text style={styles.pcMainAmount}>{portfolioStats.capitalDeployed.toLocaleString('en-IN')}</Text>
      </View>
      
      <View style={styles.pcDivider} />
      
      <View style={styles.pcMetricsRow}>
        <View style={styles.pcMetricCol}>
          <Text style={styles.pcMetricLabel}>ACTIVE LOANS</Text>
          <Text style={styles.pcMetricValue}>{portfolioStats.activeLoans}</Text>
        </View>
        <View style={styles.pcMetricCol}>
          <Text style={styles.pcMetricLabel}>AVG RETURN</Text>
          <Text style={[styles.pcMetricValue, { color: '#D4820A' }]}>{portfolioStats.avgReturn.toFixed(1)}%</Text>
        </View>
        <View style={[styles.pcMetricCol, { alignItems: 'flex-end' }]}>
          <Text style={styles.pcMetricLabel}>WALLET BALANCE</Text>
          <Text style={styles.pcMetricValue}>{formatCurrency(portfolioStats.walletBalance)}</Text>
        </View>
      </View>
      
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <Text style={styles.pcHeaderTitle}>MONTHLY YIELD TREND</Text>
        {selectedMonthIdx !== null && monthlyYields[selectedMonthIdx] !== undefined && (
          <Text style={[styles.pcHeaderTitle, { color: '#D4820A' }]}>
            MONTH {selectedMonthIdx + 1}: {monthlyYields[selectedMonthIdx]?.toFixed(1)}%
          </Text>
        )}
      </View>

      <View style={styles.pcChartContainer}>
        {monthlyYields.map((y, i) => {
          const heightPct = Math.max(10, (y / maxYield) * 100);
          const isSelected = i === selectedMonthIdx;
          return (
            <Pressable 
              key={i} 
              style={styles.pcBarWrapper}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setSelectedMonthIdx(i);
              }}
            >
              <View style={[
                styles.pcBar, 
                { 
                  height: `${heightPct}%`, 
                  backgroundColor: isSelected ? '#D4820A' : '#2A3B45',
                  transform: [{ scaleY: isSelected ? 1.05 : 1 }, { scaleX: isSelected ? 1.05 : 1 }],
                  opacity: isSelected ? 1 : 0.6,
                }
              ]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  portfolioCard: {
    backgroundColor: '#112027',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    marginTop: 8,
  },
  pcHeaderTitle: {
    color: '#8BA1B0',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  pcCurrencySymbol: {
    color: '#E8E0D5',
    fontSize: 24,
    opacity: 0.7,
  },
  pcMainAmount: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'JetBrains Mono' : 'monospace',
  },
  pcDivider: {
    height: 1,
    backgroundColor: '#2A3B45',
    marginBottom: 20,
  },
  pcMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  pcMetricCol: {
    flex: 1,
  },
  pcMetricLabel: {
    color: '#8BA1B0',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 6,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  pcMetricValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  pcChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 50,
    paddingTop: 10,
  },
  pcBarWrapper: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
    height: '100%',
    justifyContent: 'flex-end',
  },
  pcBar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
});
