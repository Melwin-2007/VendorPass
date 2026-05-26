import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/auth';
import { supabase } from '@/lib/supabase';
import { SymbolView } from '@/components/symbol-view';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';

export default function LendersModalScreen() {
  const { user } = useAuth();
  
  // States
  const [loading, setLoading] = useState(true);
  const [availableLenders, setAvailableLenders] = useState<any[]>([]);
  
  const [step, setStep] = useState<'CHECKING' | 'LENDERS' | 'PROPOSAL'>('CHECKING');
  const [selectedLender, setSelectedLender] = useState<any>(null);
  
  // Proposal states
  const [loanAmount, setLoanAmount] = useState('50000');
  const [proposedInterest, setProposedInterest] = useState('12.5');
  const [loanTenure, setLoanTenure] = useState(3);
  
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    Toast.show({ type, text1: message, position: 'top' });
  };
  
  useEffect(() => {
    if (!user) return;
    
    const initialize = async () => {
      // 1. Check eligibility
      const { data: existingLoans } = await supabase
        .from('loan_offers')
        .select('*, amount, interest_rate, amount_paid')
        .eq('vendor_id', user.id)
        .in('status', ['PENDING', 'ACCEPTED']);
        
      let hasActiveLoan = false;
      if (existingLoans && existingLoans.length > 0) {
        for (const loan of existingLoans) {
          if (loan.status === 'PENDING') {
            hasActiveLoan = true; break;
          }
          if (loan.status === 'ACCEPTED') {
            const principal = Number(loan.amount);
            const interest = Number(loan.interest_rate) || 0;
            const totalLoanAmount = principal + (principal * (interest / 100));
            const alreadyPaid = Number(loan.amount_paid) || 0;
            if (Math.round(alreadyPaid) < Math.round(totalLoanAmount)) {
              hasActiveLoan = true; break;
            }
          }
        }
      }
      
      if (hasActiveLoan) {
        showToast('Active Loan Detected. Repayment required before new applications.', 'error');
        router.back();
        return;
      }
      
      // 2. Fetch lenders
      const { data: lendersData } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'LENDER')
        .order('created_at', { ascending: false });
        
      if (lendersData) {
        const mappedLenders = lendersData.map((profile) => ({
          id: profile.id,
          name: profile.name || 'Financial Partner',
          rate: '12% - 15% p.a.',
          maxAmount: '₹5,00,000',
          image: profile.selfie || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop',
        }));
        setAvailableLenders(mappedLenders);
      }
      
      setStep('LENDERS');
      setLoading(false);
    };
    
    initialize();
  }, [user]);

  const handleApplyLoan = async () => {
    const amt = parseFloat(loanAmount.replace(/,/g, ''));
    const intRate = parseFloat(proposedInterest) || 12.5;

    if (isNaN(amt) || amt <= 0 || amt > 500000) {
      showToast('Invalid Amount. Please enter a valid numerical value.', 'error');
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

    if (error) {
      showToast('Submission Failed. Unable to process loan proposal.', 'error');
    } else {
      showToast(`Proposal Submitted. Awaiting review from ${selectedLender.name || 'Lender'}.`, 'success');
    }
    router.back();
  };

  return (
    <View style={styles.modalOverlay}>
      <Pressable style={styles.modalBackground} onPress={() => router.back()} />
      <View style={[styles.modalCardContainer, step === 'LENDERS' ? { maxHeight: '80%' } : {}]}>
        
        {step === 'CHECKING' && (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#D4820A" />
            <Text style={{ marginTop: 16, fontFamily: 'Sora', color: '#534435' }}>Checking Eligibility...</Text>
          </View>
        )}

        {step === 'LENDERS' && (
          <>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitleText}>Available Lenders</Text>
              <Pressable onPress={() => router.back()} style={styles.modalCloseBtn}>
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
                        setStep('PROPOSAL');
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
          </>
        )}

        {step === 'PROPOSAL' && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitleText}>Proposal to {selectedLender?.name?.split(' ')[0] || 'Lender'}</Text>
              <Pressable onPress={() => setStep('LENDERS')} style={styles.modalCloseBtn}>
                <SymbolView tintColor="#1c1c18" name="arrow.backward" size={20} />
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
          </ScrollView>
        )}

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalCardContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitleText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A3A4A',
    fontFamily: 'Playfair Display',
  },
  modalCloseBtn: {
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
  },
  lenderListCard: {
    backgroundColor: '#F9F5EF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
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
  },
  lenderListName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A3A4A',
  },
  lenderListSub: {
    fontSize: 12,
    color: '#6B6B6B',
    marginTop: 2,
  },
  lenderListApplyBtn: {
    backgroundColor: '#D4820A',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  lenderListApplyBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  lenderEmptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  lenderEmptyText: {
    marginTop: 12,
    color: '#6B6B6B',
    fontSize: 14,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 16,
  },
  customModalInput: {
    backgroundColor: '#F9F5EF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#1A3A4A',
  },
  tenureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  tenureOption: {
    flex: 1,
    backgroundColor: '#F9F5EF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tenureOptionActive: {
    borderColor: '#D4820A',
    backgroundColor: '#FFF',
  },
  tenureOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B6B6B',
  },
  tenureOptionTextActive: {
    color: '#D4820A',
    fontWeight: '700',
  },
  repaymentSummaryCard: {
    backgroundColor: '#1A3A4A',
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
  },
  repaymentSummaryTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A0B0BA',
    letterSpacing: 1,
    marginBottom: 12,
  },
  repaymentSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  repaymentDetailLabel: {
    fontSize: 14,
    color: '#FFF',
  },
  repaymentDetailVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D4820A',
  },
  disbursementTargetText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  modalPrimaryBtn: {
    backgroundColor: '#D4820A',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  modalPrimaryBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
