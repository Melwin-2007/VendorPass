import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  ScrollView,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth';
import { Spacing } from '@/constants/theme';
import { SymbolView } from '@/components/symbol-view';
import { supabase } from '@/lib/supabase';
import { BottomTabBar } from '@/components/BottomTabBar';

export default function HistoryScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [vendorApplications, setVendorApplications] = useState<any[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Repayment Modal
  const [repayModalVisible, setRepayModalVisible] = useState(false);
  const [selectedRepayment, setSelectedRepayment] = useState<any>(null);
  const [repayAmount, setRepayAmount] = useState('');

  useEffect(() => {
    if (user?.role === 'VENDOR') {
      const fetchApps = async () => {
        const { data, error } = await supabase
          .from('loan_offers')
          .select('*, profiles!loan_offers_lender_id_fkey(name, selfie)')
          .eq('vendor_id', user.id)
          .order('created_at', { ascending: false });
        
        if (!error && data) {
          setVendorApplications(data);
        }
      };

      fetchApps();

      const subscription = supabase
        .channel(`vendor_history_offers_${Date.now()}_${Math.random()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'loan_offers', filter: `vendor_id=eq.${user.id}` }, () => {
          fetchApps();
        })
        .subscribe();
      return () => { supabase.removeChannel(subscription); };
    }
  }, [user]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleRepayLoan = async () => {
    if (!user || !selectedRepayment) return;
    const amt = parseFloat(repayAmount.replace(/,/g, ''));
    if (isNaN(amt) || amt <= 0) {
      showToast('❌ Invalid amount');
      return;
    }

    const newAmountPaid = (Number(selectedRepayment.amount_paid) || 0) + amt;

    const { error } = await supabase.from('loan_offers')
      .update({ amount_paid: newAmountPaid })
      .eq('id', selectedRepayment.id);

    if (error) {
      showToast('❌ Repayment failed');
    } else {
      // 1. Send from Vendor
      await supabase.from('wallet_transactions').insert({
        user_id: user.id,
        amount: amt,
        type: 'SEND',
        description: 'Loan EMI Repayment'
      });
      // 2. Add to Lender
      await supabase.from('wallet_transactions').insert({
        user_id: selectedRepayment.lender_id,
        amount: amt,
        type: 'ADD',
        description: 'EMI Received'
      });
      showToast('✅ Repayment successful!');
      setRepayModalVisible(false);
      setRepayAmount('');
      setSelectedRepayment(null);
    }
  };

  return (
    <View style={styles.container}>
      {toastMessage && (
        <View style={styles.toastOverlay}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <SymbolView name="arrow_back" size={24} tintColor="#1c1c18" />
        </Pressable>
        <Text style={styles.headerTitle}>Active Applications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {vendorApplications.length > 0 ? vendorApplications.map((app) => (
          <View key={app.id} style={[styles.activityCard, { marginTop: 12, flexDirection: 'column', alignItems: 'stretch' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={styles.activityLeft}>
                <Image source={{ uri: app.profiles?.selfie || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop' }} style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#E8E0D5' }} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.activityItemTitle}>{app.profiles?.name || 'Lender'}</Text>
                  <Text style={styles.activityItemDate}>₹{app.amount.toLocaleString('en-IN')} • {app.tenure}</Text>
                </View>
              </View>
              <View style={{ backgroundColor: app.status === 'ACCEPTED' ? '#2D7D4620' : app.status === 'DECLINED' ? '#E74C3C20' : '#D4820A20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: app.status === 'ACCEPTED' ? '#2D7D46' : app.status === 'DECLINED' ? '#E74C3C' : '#D4820A' }}>
                  {app.status}
                </Text>
              </View>
            </View>
            {app.status === 'ACCEPTED' && (
              <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E8E0D5', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ fontSize: 10, color: '#6B6B6B', fontWeight: 'bold' }}>REPAID</Text>
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#2D7D46' }}>₹{(Number(app.amount_paid) || 0).toLocaleString('en-IN')} / ₹{app.amount.toLocaleString('en-IN')}</Text>
                </View>
                <Pressable
                  onPress={() => {
                    setSelectedRepayment(app);
                    setRepayModalVisible(true);
                  }}
                  style={{ backgroundColor: '#2D7D46', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12 }}
                >
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Repay EMI</Text>
                </Pressable>
              </View>
            )}
          </View>
        )) : (
          <View style={{ marginTop: 40, alignItems: 'center' }}>
            <SymbolView name="folder_open" size={48} tintColor="#D1D1D6" />
            <Text style={{ marginTop: 12, color: '#A0A0A0', fontSize: 15, fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif' }}>
              No active applications found.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Repayment Modal */}
      <Modal
        visible={repayModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setRepayModalVisible(false);
          setSelectedRepayment(null);
          setRepayAmount('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCardContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitleText}>Repay EMI</Text>
              <Pressable onPress={() => {
                setRepayModalVisible(false);
                setSelectedRepayment(null);
                setRepayAmount('');
              }} style={styles.modalCloseBtn}>
                <SymbolView tintColor="#1c1c18" name="xmark" size={20} />
              </Pressable>
            </View>

            {selectedRepayment && (
              <View style={styles.modalBody}>
                <View style={{ backgroundColor: '#F5F5F5', padding: 16, borderRadius: 12, marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, color: '#6B6B6B', marginBottom: 4 }}>Total Loan</Text>
                  <Text style={{ fontSize: 16, fontWeight: 'bold' }}>₹{Number(selectedRepayment.amount).toLocaleString('en-IN')}</Text>
                  <View style={{ height: 1, backgroundColor: '#E0E0E0', marginVertical: 8 }} />
                  <Text style={{ fontSize: 12, color: '#6B6B6B', marginBottom: 4 }}>Already Paid</Text>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#2D7D46' }}>₹{(Number(selectedRepayment.amount_paid) || 0).toLocaleString('en-IN')}</Text>
                </View>

                <Text style={styles.modalLabel}>Enter EMI Amount (₹)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. 5000"
                  placeholderTextColor="#A0A0A0"
                  keyboardType="numeric"
                  value={repayAmount}
                  onChangeText={setRepayAmount}
                />
                <Text style={{ fontSize: 12, color: '#895100', marginTop: 8 }}>
                  Note: Amount will be deducted from your VendorPASS Wallet.
                </Text>

                <Pressable onPress={handleRepayLoan} style={[styles.modalSubmitBtn, { backgroundColor: '#2D7D46', marginTop: 24 }]}>
                  <Text style={styles.modalSubmitBtnText}>Proceed to Pay</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <BottomTabBar activeTab="history" userRole={user?.role} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F5EF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    backgroundColor: '#F9F5EF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1c18',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: 100,
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1c1c18',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
    marginBottom: 2,
  },
  activityItemDate: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  toastOverlay: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: '#1c1c18',
    borderRadius: 12,
    padding: 16,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCardContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.five,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.five,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.five,
  },
  modalTitleText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1c1c18',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  modalCloseBtn: {
    padding: 4,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
  },
  modalBody: {
    marginTop: Spacing.two,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#534435',
    marginBottom: Spacing.two,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  modalInput: {
    backgroundColor: '#F9F5EF',
    borderWidth: 1,
    borderColor: '#E8E0D5',
    borderRadius: 12,
    padding: Spacing.three,
    fontSize: 16,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
    color: '#1c1c18',
  },
  modalSubmitBtn: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  modalSubmitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
});
