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
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { SymbolView } from '@/components/symbol-view';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomTabBar } from '@/components/BottomTabBar';

type Transaction = {
  id: string;
  amount: number;
  type: 'ADD' | 'SEND';
  description: string;
  created_at: string;
};

export default function WalletScreen() {
  const { user } = useAuth();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'ADD' | 'SEND'>('ADD');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTransactions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user?.id) throw new Error('User not found');
      
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching transactions:', error);
      } else if (data) {
        setTransactions(data);
        const calcBalance = data.reduce((acc, curr) => {
          return curr.type === 'ADD' ? acc + Number(curr.amount) : acc - Number(curr.amount);
        }, 0);
        setBalance(calcBalance);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchTransactions();
    };
    init();
  }, [user]);

  const handleTransactionSubmit = async () => {
    if (!user) return;
    const numAmount = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid positive amount.');
      return;
    }
    if (!description.trim()) {
      alert('Please enter a description.');
      return;
    }

    if (modalType === 'SEND' && numAmount > balance) {
      alert('Insufficient balance.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) throw new Error('User not authenticated');

      const { error } = await supabase.from('wallet_transactions').insert({
        user_id: userData.user.id,
        amount: numAmount,
        type: modalType,
        description: description.trim(),
      });

      if (error) {
        throw error;
      }

      setAmount('');
      setDescription('');
      setModalVisible(false);
      await fetchTransactions(); // refresh data
    } catch (error: any) {
      alert('Transaction failed: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openModal = (type: 'ADD' | 'SEND') => {
    setModalType(type);
    setAmount('');
    setDescription('');
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' && (
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Playfair+Display:wght@700&family=Sora:wght@600;700&family=JetBrains+Mono:wght@500;700&display=swap');
        `}} />
      )}

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <SymbolView name="arrow_back" size={24} tintColor="#1c1c18" />
        </Pressable>
        <Text style={styles.headerTitle}>Vendor Wallet</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Balance Card */}
        <LinearGradient
          colors={['#1A3A4A', '#0F2430']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <View style={styles.glowRight} />
          <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
          <Text style={styles.balanceAmount}>
            ₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </Text>

          <View style={styles.actionRow}>
            <Pressable style={styles.actionBtn} onPress={() => openModal('ADD')}>
              <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(45, 125, 70, 0.2)' }]}>
                <SymbolView name="add" size={24} tintColor="#4CAF50" />
              </View>
              <Text style={styles.actionBtnText}>Add</Text>
            </Pressable>
            
            <Pressable style={styles.actionBtn} onPress={() => openModal('SEND')}>
              <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(192, 57, 43, 0.2)' }]}>
                <SymbolView name="arrow_upward" size={24} tintColor="#E74C3C" />
              </View>
              <Text style={styles.actionBtnText}>Send</Text>
            </Pressable>
          </View>
        </LinearGradient>

        {/* Transactions List */}
        <View style={styles.txHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
        </View>

        <View style={styles.txList}>
          {loading ? (
            <ActivityIndicator size="large" color="#D4820A" style={{ marginTop: 40 }} />
          ) : transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <SymbolView name="receipt" size={48} tintColor="#D1D1D6" />
              <Text style={styles.emptyText}>No transactions yet.</Text>
            </View>
          ) : (
            transactions.map((tx) => {
              const isAdd = tx.type === 'ADD';
              const dateObj = new Date(tx.created_at);
              return (
                <View key={tx.id} style={styles.txCard}>
                  <View style={styles.txLeft}>
                    <View style={[styles.txIcon, { backgroundColor: isAdd ? 'rgba(45, 125, 70, 0.1)' : 'rgba(192, 57, 43, 0.1)' }]}>
                      <SymbolView name={isAdd ? 'arrow.down' : 'arrow.up'} size={20} tintColor={isAdd ? '#2D7D46' : '#C0392B'} />
                    </View>
                    <View>
                      <Text style={styles.txDesc}>{tx.description}</Text>
                      <Text style={styles.txDate}>{dateObj.toLocaleDateString()} at {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                  </View>
                  <Text style={[styles.txAmount, { color: isAdd ? '#2D7D46' : '#1c1c18' }]}>
                    {isAdd ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Action Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modalType === 'ADD' ? 'Add Money' : 'Send Money'}</Text>
              <Pressable onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <SymbolView name="close" size={24} tintColor="#1c1c18" />
              </Pressable>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amount (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                placeholderTextColor="#A0A0A0"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={styles.input}
                placeholder={modalType === 'ADD' ? "e.g. Bank Deposit" : "e.g. Supplier Payment"}
                value={description}
                onChangeText={setDescription}
                placeholderTextColor="#A0A0A0"
              />
            </View>

            <Pressable 
              style={[styles.submitBtn, { backgroundColor: modalType === 'ADD' ? '#2D7D46' : '#D4820A' }]}
              onPress={handleTransactionSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>{modalType === 'ADD' ? 'Add Funds' : 'Send Funds'}</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <BottomTabBar activeTab="wallet" userRole={user?.role} />
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
  balanceCard: {
    borderRadius: 24,
    padding: Spacing.five,
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#1A3A4A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: { elevation: 8 },
      web: { boxShadow: '0 10px 30px rgba(26,58,74,0.3)' },
    }),
  },
  glowRight: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#D4820A',
    opacity: 0.2,
    ...Platform.select({ web: { filter: 'blur(40px)' } }),
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
    marginBottom: Spacing.two,
  },
  balanceAmount: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: Platform.OS === 'web' ? 'JetBrains Mono' : 'monospace',
    marginBottom: Spacing.five,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.four,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: Spacing.three,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  actionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  txHeaderRow: {
    marginTop: Spacing.six,
    marginBottom: Spacing.four,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c1c18',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  txList: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  emptyState: {
    padding: Spacing.six,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: Spacing.three,
    color: '#A0A0A0',
    fontSize: 15,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txDesc: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1c1c18',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
    marginBottom: 2,
  },
  txDate: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'JetBrains Mono' : 'monospace',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
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
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1c1c18',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  closeBtn: {
    padding: 4,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
  },
  inputGroup: {
    marginBottom: Spacing.four,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#534435',
    marginBottom: Spacing.two,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  input: {
    backgroundColor: '#F9F5EF',
    borderWidth: 1,
    borderColor: '#E8E0D5',
    borderRadius: 12,
    padding: Spacing.three,
    fontSize: 16,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
    color: '#1c1c18',
  },
  submitBtn: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
});
