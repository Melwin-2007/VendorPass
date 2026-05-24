import React from 'react';
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
import { LenderBottomTabBar } from '@/components/BottomTabBar';
import { SymbolView } from '@/components/symbol-view';

export default function ChatScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.emptyState}>
          <SymbolView name="forum" size={64} tintColor="#D1D1D6" />
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptySub}>When vendors reach out or reply to your offers, their messages will appear here.</Text>
        </View>
      </ScrollView>

      <LenderBottomTabBar activeTab="chat" />
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
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: Spacing.four,
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1c18',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  emptySub: {
    marginTop: Spacing.two,
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  }
});
