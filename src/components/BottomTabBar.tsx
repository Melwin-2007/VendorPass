import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Modal } from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from '@/components/symbol-view';

type BottomTabBarProps = {
  activeTab: 'home' | 'wallet' | 'history' | 'account' | 'chat';
  userRole?: string | null;
  onHomePress?: () => void;
  onWalletPress?: () => void;
  onCenterPress?: () => void;
  onHistoryPress?: () => void;
  onChatPress?: () => void;
};

export function BottomTabBar({ 
  activeTab, 
  userRole,
  onHomePress,
  onWalletPress,
  onCenterPress,
  onHistoryPress,
  onChatPress
}: BottomTabBarProps) {
  
  const defaultHomePress = () => router.push('/(tabs)');
  const defaultWalletPress = () => router.push('/wallet');
  const defaultCenterPress = () => router.push('/lenders-modal');

  // Only render for vendors (not lenders)
  if (userRole === 'LENDER') return null;

  return (
    <View style={styles.floatingTabBar}>
      <Pressable style={styles.tabItem} onPress={onHomePress || defaultHomePress}>
        {activeTab === 'home' ? (
          <View style={styles.activeTabCircle}>
            <SymbolView tintColor="#ffffff" name="home" size={22} />
          </View>
        ) : (
          <SymbolView tintColor="#8E8E93" name="home" size={22} />
        )}
        <Text style={activeTab === 'home' ? styles.activeTabText : styles.inactiveTabText}>Home</Text>
      </Pressable>

      <Pressable style={styles.tabItem} onPress={onWalletPress || defaultWalletPress}>
        {activeTab === 'wallet' ? (
          <View style={styles.activeTabCircle}>
            <SymbolView tintColor="#ffffff" name="account_balance_wallet" size={22} />
          </View>
        ) : (
          <SymbolView tintColor="#8E8E93" name="account_balance_wallet" size={22} />
        )}
        <Text style={activeTab === 'wallet' ? styles.activeTabText : styles.inactiveTabText}>Wallet</Text>
      </Pressable>

      <View style={styles.centerTabContainer}>
        <Pressable 
          style={({ pressed }) => [styles.centerTabButton, { transform: [{ scale: pressed ? 0.95 : 1.0 }] }]}
          onPress={onCenterPress || defaultCenterPress}
        >
          <SymbolView tintColor="#ffffff" name="payments" size={26} />
        </Pressable>
      </View>

      <Pressable style={styles.tabItem} onPress={onHistoryPress || (() => router.push('/history'))}>
        {activeTab === 'history' ? (
          <View style={styles.activeTabCircle}>
            <SymbolView tintColor="#ffffff" name="receipt_long" size={22} />
          </View>
        ) : (
          <SymbolView tintColor="#8E8E93" name="receipt_long" size={22} />
        )}
        <Text style={activeTab === 'history' ? styles.activeTabText : styles.inactiveTabText}>History</Text>
      </Pressable>

      <Pressable style={styles.tabItem} onPress={onChatPress || (() => router.push('/chat' as any))}>
        {activeTab === 'chat' ? (
          <View style={styles.activeTabCircle}>
            <SymbolView tintColor="#ffffff" name="chat_bubble" size={22} />
          </View>
        ) : (
          <SymbolView tintColor="#8E8E93" name="chat_bubble" size={22} />
        )}
        <Text style={activeTab === 'chat' ? styles.activeTabText : styles.inactiveTabText}>Chat</Text>
      </Pressable>
    </View>
  );
}



export function LenderBottomTabBar({ activeTab }: { activeTab?: 'home' | 'portfolio' | 'repayments' | 'chat' | 'browse' }) {
  return (
    <View style={styles.floatingTabBar}>
      <Pressable style={styles.tabItem} onPress={() => router.push('/(tabs)')}>
        {activeTab === 'home' ? (
          <View style={styles.activeTabCircle}>
            <SymbolView tintColor="#ffffff" name="home" size={22} />
          </View>
        ) : (
          <SymbolView tintColor="#8E8E93" name="home" size={22} />
        )}
        <Text style={activeTab === 'home' ? styles.activeTabText : styles.inactiveTabText}>Home</Text>
      </Pressable>

      <Pressable style={styles.tabItem} onPress={() => router.push('/(tabs)/portfolio')}>
        {activeTab === 'portfolio' ? (
          <View style={styles.activeTabCircle}>
            <SymbolView tintColor="#ffffff" name="pie_chart" size={22} />
          </View>
        ) : (
          <SymbolView tintColor="#8E8E93" name="pie_chart" size={22} />
        )}
        <Text style={activeTab === 'portfolio' ? styles.activeTabText : styles.inactiveTabText}>Portfolio</Text>
      </Pressable>

      <View style={styles.centerTabContainer}>
        <Pressable 
          style={({ pressed }) => [styles.centerTabButton, { backgroundColor: '#CC8A00', borderColor: '#F5F0E8', shadowColor: '#CC8A00', shadowOpacity: 0.6, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } }, { transform: [{ scale: pressed ? 0.95 : 1.0 }] }]}
          onPress={() => router.push('/(tabs)/explore')}
        >
          <SymbolView tintColor="#ffffff" name="add" size={32} />
        </Pressable>
      </View>

      <Pressable style={styles.tabItem} onPress={() => router.push('/repayments')}>
        {activeTab === 'repayments' ? (
          <View style={styles.activeTabCircle}>
            <SymbolView tintColor="#ffffff" name="calendar_today" size={22} />
          </View>
        ) : (
          <SymbolView tintColor="#8E8E93" name="calendar_today" size={22} />
        )}
        <Text style={activeTab === 'repayments' ? styles.activeTabText : styles.inactiveTabText}>Repayments</Text>
      </Pressable>

      <Pressable style={styles.tabItem} onPress={() => router.push('/chat' as any)}>
        {activeTab === 'chat' ? (
          <View style={styles.activeTabCircle}>
            <SymbolView tintColor="#ffffff" name="chat_bubble" size={22} />
          </View>
        ) : (
          <SymbolView tintColor="#8E8E93" name="chat_bubble" size={22} />
        )}
        <Text style={activeTab === 'chat' ? styles.activeTabText : styles.inactiveTabText}>Chat</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
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
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -32,
  },
  centerTabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1A3A4A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1A3A4A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 4,
    borderColor: '#F9F5EF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 300,
  }
});
