import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth';
import { Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { LenderBottomTabBar } from '@/components/BottomTabBar';
import { SymbolView } from '@/components/symbol-view';

export default function RepaymentsScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [repayments, setRepayments] = useState<any[]>([]);

  useEffect(() => {
    if (user?.role === 'LENDER') {
      const fetchRepayments = async () => {
        const { data, error } = await supabase
          .from('loan_offers')
          .select('*, profiles:profiles!vendor_id(name, selfie, business_photo)')
          .eq('lender_id', user.id)
          .eq('status', 'ACCEPTED')
          .order('created_at', { ascending: false });

        if (data) {
          const validData = data.filter((o: any) => o.profiles?.name && o.profiles.name.trim() !== '');
          setRepayments(validData);
        }
      };

      fetchRepayments();

      const subscription = supabase
        .channel(`lender_repayments_${Date.now()}_${Math.random()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'loan_offers', filter: `lender_id=eq.${user.id}` }, () => {
          fetchRepayments();
        })
        .subscribe();
      return () => { supabase.removeChannel(subscription); };
    }
  }, [user]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Text style={styles.headerTitle}>Repayments Tracker</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {repayments.length > 0 ? repayments.map((loan) => {
          const totalPaid = Number(loan.amount_paid) || 0;
          const totalLoan = Number(loan.amount) + (Number(loan.amount) * (Number(loan.interest_rate) / 100));
          const progress = Math.min((totalPaid / totalLoan) * 100, 100);

          return (
            <View key={loan.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Image source={{ uri: loan.profiles?.selfie || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop' }} style={styles.avatar} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.vendorName}>{loan.profiles?.name || 'Vendor'}</Text>
                  <Text style={styles.loanDetails}>₹{loan.amount.toLocaleString('en-IN')} @ {loan.interest_rate}% p.a.</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>ACTIVE</Text>
                </View>
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressTextRow}>
                  <Text style={styles.progressLabel}>Recovered</Text>
                  <Text style={styles.progressValue}>₹{totalPaid.toLocaleString('en-IN')} / ₹{totalLoan.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                </View>
              </View>
            </View>
          );
        }) : (
          <View style={styles.emptyState}>
            <SymbolView name="receipt" size={48} tintColor="#D1D1D6" />
            <Text style={styles.emptyText}>No active repayments to track.</Text>
          </View>
        )}
      </ScrollView>

      <LenderBottomTabBar activeTab="repayments" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F5EF',
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    backgroundColor: '#F9F5EF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1c1c18',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: Spacing.four,
    marginBottom: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...Platform.select({
      ios: {
        shadowColor: '#1A3A4A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
      web: { boxShadow: '0 4px 12px rgba(26,58,74,0.05)' },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E8E0D5',
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c1c18',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
    marginBottom: 4,
  },
  loanDetails: {
    fontSize: 13,
    color: '#8E8E93',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  statusBadge: {
    backgroundColor: 'rgba(45, 125, 70, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: '#2D7D46',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  progressContainer: {
    marginTop: Spacing.two,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2D7D46',
    fontFamily: Platform.OS === 'web' ? 'JetBrains Mono' : 'monospace',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2D7D46',
    borderRadius: 4,
  },
  emptyState: {
    marginTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: Spacing.three,
    color: '#A0A0A0',
    fontSize: 15,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
});
