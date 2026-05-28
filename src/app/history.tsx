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
import Toast from 'react-native-toast-message';
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
  

  // Repayment Modal
  const [repayModalVisible, setRepayModalVisible] = useState(false);
  const [selectedRepayment, setSelectedRepayment] = useState<any>(null);

  const [currentTime, setCurrentTime] = useState<number | null>(null);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      if (!selectedRepayment) {
        setCurrentTime(null);
      } else {
        setCurrentTime(Date.now());
      }
    });
    return () => cancelAnimationFrame(frameId);
  }, [selectedRepayment]);

  useEffect(() => {
    if (user?.role === 'VENDOR') {
      const fetchApps = async () => {
        // Fetch direct loan offers
        const { data: offers, error: offersErr } = await supabase
          .from('loan_offers')
          .select('*, profiles:profiles!lender_id(name, selfie)')
          .eq('vendor_id', user.id)
          .order('created_at', { ascending: false });
        
        // Fetch public loan requests
        const { data: publicReqs, error: reqsErr } = await supabase
          .from('public_loan_requests')
          .select('*')
          .eq('vendor_id', user.id)
          .eq('status', 'PENDING')
          .order('created_at', { ascending: false });
        
        let merged: any[] = [];
        if (offers) {
          const validOffers = offers.filter((o: any) => o.profiles?.name && o.profiles.name.trim() !== '');
          merged = [...validOffers];
        }
        if (publicReqs) {
          const mappedReqs = publicReqs.map(r => ({
            ...r,
            isPublicRequest: true,
            profiles: {
              name: 'Public Broadcasting Feed',
              selfie: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBp-aRKkGDKeuwqhPEmq7g1UC6fAJe7VnCjIBkl8xQ_owajzWgfUPWgUMJOIyoiN0LKTUspoZaFUGMsePMDyMvyc8wOY0Ht8h_r-OZXBP_HQCuvHb2y_yMdS0aE_gbQkkTv3Lfk4ygKkKjRhjN_MvU6GCEuVhiMMajr7ZRd8kQ8WKCxD3dRBu_V3DmsoDaRhR4lC0m7DzQz96jcsebEXvsWN9aBxHGSMpo1wqkYa05F8THygZ30zTg55ArV1Ig9JnHR1x12es4h9pO8'
            }
          }));
          merged = [...merged, ...mappedReqs];
        }
        
        setVendorApplications(merged);
      };

      fetchApps();

      const subscription = supabase
        .channel(`vendor_history_changes_${Date.now()}_${Math.random()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'loan_offers', filter: `vendor_id=eq.${user.id}` }, () => {
          fetchApps();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'public_loan_requests', filter: `vendor_id=eq.${user.id}` }, () => {
          fetchApps();
        })
        .subscribe();
      return () => { supabase.removeChannel(subscription); };
    }
  }, [user]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    Toast.show({
      type: type,
      text1: message,
      position: 'top',
    });
  };

  const handleVendorAcceptOffer = async (app: any) => {
    if (!user) return;
    
    const lenderName = app.profiles?.name || 'Lender';
    const vendorName = user.name || 'Vendor';
    const amount = Number(app.amount);
    
    const { error: updateErr } = await supabase
      .from('loan_offers')
      .update({ 
        status: 'ACCEPTED', 
        accepted_at: new Date().toISOString() 
      })
      .eq('id', app.id);
      
    if (updateErr) {
      showToast('Acceptance failed. Try again.', 'error');
      return;
    }
    
    // Send from Lender
    const { error: tx1Err } = await supabase.from('wallet_transactions').insert({
      user_id: app.lender_id,
      amount: amount,
      type: 'SEND',
      description: `Loan Disbursement to ${vendorName}`
    });
    
    // Add to Vendor
    const { error: tx2Err } = await supabase.from('wallet_transactions').insert({
      user_id: user.id,
      amount: amount,
      type: 'ADD',
      description: `Loan Received from ${lenderName}`
    });
    
    if (tx1Err || tx2Err) {
      console.error("Disbursement transactions failed:", tx1Err, tx2Err);
    }
    
    await supabase.from('notifications').insert([
      {
        user_id: user.id,
        title: 'Loan Disbursed 🎉',
        message: `₹${amount.toLocaleString('en-IN')} has been credited to your wallet from ${lenderName}.`
      },
      {
        user_id: app.lender_id,
        title: 'Offer Accepted 🤝',
        message: `${vendorName} accepted your loan offer of ₹${amount.toLocaleString('en-IN')}.`
      }
    ]);
    
    showToast('Loan Offer Accepted! Funds disbursed.', 'success');
  };

  const handleVendorRejectOffer = async (id: string) => {
    const { error } = await supabase
      .from('loan_offers')
      .update({ status: 'DECLINED' })
      .eq('id', id);
      
    if (error) {
      showToast('Action failed. Try again.', 'error');
    } else {
      showToast('Offer declined.', 'info');
    }
  };

  const handleVendorCancelOffer = async (id: string) => {
    const { error } = await supabase
      .from('loan_offers')
      .delete()
      .eq('id', id);
      
    if (error) {
      showToast('Cancellation failed. Try again.', 'error');
    } else {
      showToast('Loan request cancelled.', 'success');
    }
  };

  const handleVendorCancelPublicRequest = async (id: string) => {
    const { error } = await supabase
      .from('public_loan_requests')
      .delete()
      .eq('id', id);
      
    if (error) {
      showToast('Cancellation failed. Try again.', 'error');
    } else {
      showToast('Public broadcast request cancelled.', 'success');
    }
  };  let amountDue = 0;
  let totalLoanAmount = 0;
  let nextUnlockMinutes = 0;
  let isFullyPaid = false;
  let alreadyPaid = 0;
  let demoMonthsElapsed = 0;
  let emiAmount = 0;

  if (selectedRepayment && currentTime !== null) {
    const principal = Number(selectedRepayment.amount);
    const interest = Number(selectedRepayment.interest_rate) || 0;
    totalLoanAmount = principal + (principal * (interest / 100));
    
    const tenureMatches = selectedRepayment.tenure.match(/(\d+)/);
    const tenureMonths = tenureMatches ? parseInt(tenureMatches[1], 10) : 1;
    emiAmount = totalLoanAmount / tenureMonths;

    const baseTime = selectedRepayment.accepted_at ? new Date(selectedRepayment.accepted_at).getTime() : new Date(selectedRepayment.created_at).getTime();
    const elapsedMilliseconds = currentTime - baseTime;
    // 1 demo month = 5 real minutes (300,000 ms)
    demoMonthsElapsed = Math.floor(elapsedMilliseconds / (5 * 60 * 1000));
    const accruedAmount = demoMonthsElapsed * emiAmount;

    alreadyPaid = Number(selectedRepayment.amount_paid) || 0;
    amountDue = accruedAmount - alreadyPaid;

    if (amountDue > (totalLoanAmount - alreadyPaid)) {
      amountDue = totalLoanAmount - alreadyPaid;
    }

    if (alreadyPaid >= totalLoanAmount) {
      isFullyPaid = true;
      amountDue = 0;
    } else if (amountDue <= 0) {
      amountDue = 0;
      const nextUnlockTime = baseTime + ((demoMonthsElapsed + 1) * 5 * 60 * 1000);
      nextUnlockMinutes = Math.ceil((nextUnlockTime - currentTime) / (60 * 1000));
    }
  }
  const handleRepayLoan = async () => {
    if (!user || !selectedRepayment || amountDue <= 0) return;

    const newAmountPaid = alreadyPaid + amountDue;

    const { error } = await supabase.from('loan_offers')
      .update({ amount_paid: newAmountPaid })
      .eq('id', selectedRepayment.id);

    if (error) {
      showToast('Repayment Failed. Unable to process transaction.', 'error');
    } else {
      const lenderName = selectedRepayment.profiles?.name || 'Lender';
      const vendorName = user.name || 'Vendor';
      
      const cleanAmount = Math.round(amountDue * 100) / 100;

      // 1. Send from Vendor
      const { error: tx1Err } = await supabase.from('wallet_transactions').insert({
        user_id: user.id,
        amount: cleanAmount,
        type: 'SEND',
        description: `Month ${demoMonthsElapsed} EMI to ${lenderName}`
      });
      
      // 2. Add to Lender
      const { error: tx2Err } = await supabase.from('wallet_transactions').insert({
        user_id: selectedRepayment.lender_id,
        amount: cleanAmount,
        type: 'ADD',
        description: `Month ${demoMonthsElapsed} EMI from ${vendorName}`
      });

      if (tx1Err || tx2Err) {
        console.error("TX Error:", tx1Err, tx2Err);
        showToast('Transaction Error. Ledger update failed.', 'error');
      } else {
        const paidMonths = Math.floor(alreadyPaid / emiAmount);
        const isPayingLate = demoMonthsElapsed > paidMonths;
        const isCompletingLoan = (cleanAmount + alreadyPaid) >= totalLoanAmount;

        let scoreDelta = 0;
        let aiReason = '';

        if (isPayingLate) {
          scoreDelta = -10;
          aiReason = `Paid EMI late. Deducted 10 points.`;
        } else {
          scoreDelta = 5;
          aiReason = `Paid EMI on time! Added 5 points.`;
        }

        if (isCompletingLoan) {
          scoreDelta += 15;
          aiReason += ` Successfully completed the loan! Bonus +15 points.`;
        }

        const { data: profile } = await supabase.from('profiles').select('score, trust_score_data').eq('id', user.id).single();
        const newScore = Math.max(0, (profile?.score || 620) + scoreDelta);
        const existingData = profile?.trust_score_data || {};
        const historyArray = Array.isArray(existingData.history) ? existingData.history : [];
        
        const newHistoryItem = {
          timestamp: new Date().toISOString(),
          score_change: scoreDelta,
          narrative: aiReason,
          type: scoreDelta > 0 ? 'reward' : 'penalty'
        };
        
        const newData = {
          ...existingData,
          trust_score: newScore,
          last_updated: new Date().toISOString(),
          history: [newHistoryItem, ...historyArray]
        };

        await supabase.from('profiles').update({ score: newScore, trust_score_data: newData }).eq('id', user.id);

        await supabase.from('notifications').insert({
          user_id: user.id,
          title: 'TrustScore Update',
          message: aiReason
        });

        showToast('Payment Successful. EMI has been processed.', 'success');
        setRepayModalVisible(false);
        setSelectedRepayment(null);
      }
    }
  };

  return (
    <View style={styles.container}>

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
                  <Text style={styles.activityItemDate}>
                    ₹{Number(app.amount).toLocaleString('en-IN')} • {app.interest_rate ? `${app.interest_rate}% p.a. • ` : ''}{app.tenure}
                  </Text>
                </View>
              </View>
              <View style={{ backgroundColor: app.status === 'ACCEPTED' ? '#2D7D4620' : app.status === 'DECLINED' ? '#E74C3C20' : '#D4820A20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: app.status === 'ACCEPTED' ? '#2D7D46' : app.status === 'DECLINED' ? '#E74C3C' : '#D4820A' }}>
                  {app.status}
                </Text>
              </View>
            </View>
            {app.status === 'ACCEPTED' && (() => {
              const principal = Number(app.amount) || 0;
              const interest = Number(app.interest_rate) || 0;
              const totalAmount = principal + (principal * (interest / 100));
              const amountPaid = Number(app.amount_paid) || 0;
              const isFullyPaid = amountPaid >= totalAmount;

              return (
                <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E8E0D5', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ fontSize: 10, color: '#6B6B6B', fontWeight: 'bold' }}>REPAID</Text>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#2D7D46' }}>₹{amountPaid.toLocaleString('en-IN')} / ₹{principal.toLocaleString('en-IN')}</Text>
                  </View>
                  {isFullyPaid ? (
                    <View style={{ backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#2D7D4630' }}>
                      <Text style={{ color: '#2D7D46', fontSize: 12, fontWeight: 'bold' }}>Loan Repaid 🎉</Text>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => {
                        setSelectedRepayment(app);
                        setRepayModalVisible(true);
                      }}
                      style={{ backgroundColor: '#2D7D46', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12 }}
                    >
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Repay EMI</Text>
                    </Pressable>
                  )}
                </View>
              );
            })()}
            {app.status === 'PENDING' && (
              app.isPublicRequest ? (
                <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E8E0D5', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ fontSize: 9, color: '#8E8E93', fontWeight: 'bold', letterSpacing: 0.5 }}>STATUS</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#D4820A', marginTop: 2 }}>Broadcasting to Lenders</Text>
                  </View>
                  <Pressable
                    onPress={() => handleVendorCancelPublicRequest(app.id)}
                    style={{ backgroundColor: '#E74C3C15', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }}
                  >
                    <Text style={{ color: '#E74C3C', fontSize: 12, fontWeight: 'bold' }}>Cancel Broadcast</Text>
                  </Pressable>
                </View>
              ) : app.created_by === 'VENDOR' ? (
                <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E8E0D5', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ fontSize: 9, color: '#8E8E93', fontWeight: 'bold', letterSpacing: 0.5 }}>STATUS</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#D4820A', marginTop: 2 }}>Awaiting Lender Review</Text>
                  </View>
                  <Pressable
                    onPress={() => handleVendorCancelOffer(app.id)}
                    style={{ backgroundColor: '#E74C3C15', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }}
                  >
                    <Text style={{ color: '#E74C3C', fontSize: 12, fontWeight: 'bold' }}>Cancel Request</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E8E0D5', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ fontSize: 9, color: '#8E8E93', fontWeight: 'bold', letterSpacing: 0.5 }}>OFFERED RATE</Text>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#D4820A', marginTop: 2 }}>{app.interest_rate || '12'}% p.a.</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Pressable
                      onPress={() => handleVendorRejectOffer(app.id)}
                      style={{ backgroundColor: '#E74C3C15', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, marginRight: 12 }}
                    >
                      <Text style={{ color: '#E74C3C', fontSize: 12, fontWeight: 'bold' }}>Decline</Text>
                    </Pressable>
                    
                    <Pressable
                      onPress={() => handleVendorAcceptOffer(app)}
                      style={{ backgroundColor: '#2D7D46', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }}
                    >
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Accept Offer</Text>
                    </Pressable>
                  </View>
                </View>
              )
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
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCardContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitleText}>Repay EMI</Text>
              <Pressable onPress={() => {
                setRepayModalVisible(false);
                setSelectedRepayment(null);
              }} style={styles.modalCloseBtn}>
                <SymbolView tintColor="#1c1c18" name="xmark" size={20} />
              </Pressable>
            </View>

            {selectedRepayment && (
              <View style={styles.modalBody}>
                <View style={{ backgroundColor: '#F5F5F5', padding: 16, borderRadius: 12, marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, color: '#6B6B6B', marginBottom: 4 }}>Total Loan</Text>
                  <Text style={{ fontSize: 16, fontWeight: 'bold' }}>₹{totalLoanAmount.toLocaleString('en-IN')}</Text>
                  <View style={{ height: 1, backgroundColor: '#E0E0E0', marginVertical: 8 }} />
                  <Text style={{ fontSize: 12, color: '#6B6B6B', marginBottom: 4 }}>Already Paid</Text>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#2D7D46' }}>₹{(Number(selectedRepayment.amount_paid) || 0).toLocaleString('en-IN')}</Text>
                </View>

                <Text style={styles.modalLabel}>Current EMI Amount Due</Text>
                {isFullyPaid ? (
                  <View style={[styles.modalInput, { backgroundColor: '#E8F5E9', borderColor: '#2D7D46', justifyContent: 'center' }]}>
                    <Text style={{ fontSize: 16, color: '#2D7D46', fontWeight: 'bold' }}>Loan Fully Paid! 🎉</Text>
                  </View>
                ) : amountDue > 0 ? (
                  <View style={[styles.modalInput, { backgroundColor: '#F9F5EF', justifyContent: 'center' }]}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold' }}>₹{amountDue.toLocaleString('en-IN')}</Text>
                  </View>
                ) : (
                  <View style={[styles.modalInput, { backgroundColor: '#FFF3E0', borderColor: '#D4820A', justifyContent: 'center' }]}>
                    <Text style={{ fontSize: 14, color: '#D4820A', fontWeight: '600' }}>EMIs are up to date.</Text>
                    <Text style={{ fontSize: 12, color: '#895100', marginTop: 4 }}>Next EMI due in {nextUnlockMinutes} min</Text>
                  </View>
                )}

                <Text style={{ fontSize: 12, color: '#895100', marginTop: 8 }}>
                  Note: Amount will be deducted from your VendorPASS Wallet.
                </Text>

                <Pressable 
                  onPress={amountDue > 0 ? handleRepayLoan : undefined} 
                  style={[styles.modalSubmitBtn, { backgroundColor: amountDue > 0 ? '#2D7D46' : '#A0A0A0', marginTop: 24 }]}
                >
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
