import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  PanResponder,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth';
import { Spacing } from '@/constants/theme';
import { BottomTabBar, LenderBottomTabBar } from '@/components/BottomTabBar';
import { SymbolView } from '@/components/symbol-view';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

// Custom PanResponder-based Swipeable Row Component
function SwipeableRow({
  children,
  onFlag,
  onArchive,
  onMarkRead,
}: {
  children: React.ReactNode;
  onFlag: () => void;
  onArchive: () => void;
  onMarkRead: () => void;
}) {
  const translateX = useMemo(() => new Animated.Value(0), []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 8;
        },
        onPanResponderMove: (_, gestureState) => {
          let dx = gestureState.dx;
          if (dx < -140) {
            dx = -140 + (dx + 140) * 0.3;
          } else if (dx > 80) {
            dx = 80 + (dx - 80) * 0.3;
          }
          translateX.setValue(dx);
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx < -56) {
            Animated.spring(translateX, {
              toValue: -140,
              useNativeDriver: true,
              tension: 40,
              friction: 7,
            }).start();
          } else if (gestureState.dx > 32) {
            Animated.spring(translateX, {
              toValue: 80,
              useNativeDriver: true,
              tension: 40,
              friction: 7,
            }).start();
          } else {
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
              tension: 40,
              friction: 7,
            }).start();
          }
        },
      }),
    [translateX]
  );

  const reset = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 40,
      friction: 7,
    }).start();
  };

  return (
    <View style={styles.swipeContainer}>
      <View style={styles.backButtonsContainer}>
        <Pressable
          style={[styles.backButton, styles.markReadBtn]}
          onPress={() => {
            onMarkRead();
            reset();
          }}
        >
          <Text style={styles.btnText}>Mark Read ✓</Text>
        </Pressable>

        <View style={{ flex: 1 }} />

        <View style={{ flexDirection: 'row', height: '100%' }}>
          <Pressable
            style={[styles.backButton, styles.flagBtn]}
            onPress={() => {
              onFlag();
              reset();
            }}
          >
            <Text style={styles.btnText}>Flag 🚩</Text>
          </Pressable>
          <Pressable
            style={[styles.backButton, styles.archiveBtn]}
            onPress={() => {
              onArchive();
              reset();
            }}
          >
            <Text style={styles.btnText}>Archive 📁</Text>
          </Pressable>
        </View>
      </View>

      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

// Unread Badge Pulse Component
function UnreadBadge({ count }: { count: number }) {
  const scale = useMemo(() => new Animated.Value(1), []);

  useEffect(() => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.25,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    };

    const interval = setInterval(pulse, 4000);
    return () => clearInterval(interval);
  }, [scale]);

  return (
    <Animated.View style={[styles.unreadBadge, { transform: [{ scale }] }]}>
      <Text style={styles.unreadBadgeText}>{count}</Text>
    </Animated.View>
  );
}

// Online Indicator Dot with Glow Pulse
function OnlineDot() {
  const opacity = useMemo(() => new Animated.Value(1), []);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return <Animated.View style={[styles.onlineDot, { opacity }]} />;
}

export default function ChatInboxScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [chats, setChats] = useState<any[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'FLAGGED' | 'OVERDUE'>('ALL');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Search slide animation
  const searchHeight = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    Animated.timing(searchHeight, {
      toValue: searchOpen ? 54 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [searchOpen, searchHeight]);

  useEffect(() => {
    if (!user) return;

    const fetchChats = async () => {
      try {
        const isLender = user.role === 'LENDER';
        const userCol = isLender ? 'lender_id' : 'vendor_id';
        const otherCol = isLender ? 'vendor_id' : 'lender_id';

        const { data: loanData } = await supabase
          .from('loan_offers')
          .select('*')
          .eq('status', 'ACCEPTED');

        const { data: chatData, error: chatError } = await supabase
          .from('chats')
          .select(`
            *,
            other_profile:profiles!${otherCol}(id, name, selfie, updated_at, score)
          `)
          .eq(userCol, user.id);

        if (chatError) throw chatError;

        const nowTime = Date.now();

        const checkOverdue = (vendorId: string) => {
          if (!loanData) return false;
          const vendorLoans = loanData.filter((o) => o.vendor_id === vendorId);
          for (const offer of vendorLoans) {
            const elapsedMonths = Math.floor((nowTime - new Date(offer.accepted_at).getTime()) / (5 * 60 * 1000));
            const tenureMonths = parseInt(offer.tenure.replace(/\D/g, '')) || 1;
            const totalLoan = Number(offer.amount) * (1 + Number(offer.interest_rate) / 100);
            const emiAmount = totalLoan / tenureMonths;
            const paidMonths = Math.floor((Number(offer.amount_paid) || 0) / emiAmount);
            if (elapsedMonths > paidMonths && (Number(offer.amount_paid) || 0) < totalLoan) {
              return true;
            }
          }
          return false;
        };

        const formattedChats = await Promise.all(
          (chatData || []).map(async (chat: any) => {
            const { data: lastMsg } = await supabase
              .from('messages')
              .select('*')
              .eq('chat_id', chat.id)
              .order('created_at', { ascending: false })
              .limit(1);

            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('chat_id', chat.id)
              .eq('is_read', false)
              .not('sender_id', 'eq', user.id);

            const { data: flagData } = await supabase
              .from('chat_flags')
              .select('*')
              .eq('chat_id', chat.id)
              .eq('status', 'PENDING')
              .maybeSingle();

            const isOnline = chat.other_profile
              ? new Date(chat.other_profile.updated_at).getTime() > nowTime - 24 * 60 * 60 * 1000
              : false;

            const isOverdue = checkOverdue(chat.vendor_id);

            return {
              ...chat,
              lastMessage: lastMsg?.[0] || null,
              unreadCount: count || 0,
              isFlagged: !!flagData,
              flagDetail: flagData || null,
              isOnlineToday: isOnline,
              isOverdue,
            };
          })
        );

        formattedChats.sort((a: any, b: any) => {
          const tA = new Date(a.lastMessage?.created_at || a.created_at).getTime();
          const tB = new Date(b.lastMessage?.created_at || b.created_at).getTime();
          return tB - tA;
        });

        setChats(formattedChats);
      } catch (err) {
        console.error('Error fetching chats:', err);
      }
    };

    const loadInbox = async () => {
      await fetchChats();
    };

    loadInbox();

    const channel = supabase
      .channel(`chat_inbox_realtime_${user.id}_${Date.now()}_${Math.random()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, async () => {
        await fetchChats();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, async () => {
        await fetchChats();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_flags' }, async () => {
        await fetchChats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Archive action
  const handleArchive = async (chatId: string) => {
    if (!user) return;
    const isLender = user.role === 'LENDER';
    const field = isLender ? 'archived_by_lender' : 'archived_by_vendor';
    await supabase.from('chats').update({ [field]: true }).eq('id', chatId);
  };

  // Flag action
  const handleFlag = (chatId: string) => {
    router.push({
      pathname: '/chat/flagged',
      params: { chatId },
    });
  };

  // Mark Read action
  const handleMarkRead = async (chatId: string) => {
    if (!user) return;
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('chat_id', chatId)
      .not('sender_id', 'eq', user.id);
  };

  // Filter & Search Logic
  const filteredChats = chats.filter((c: any) => {
    const isLender = user?.role === 'LENDER';
    if (isLender && c.archived_by_lender) return false;
    if (!isLender && c.archived_by_vendor) return false;

    if (filter === 'UNREAD' && c.unreadCount === 0) return false;
    if (filter === 'FLAGGED' && !c.isFlagged) return false;
    if (filter === 'OVERDUE' && !c.isOverdue) return false;

    if (searchQuery.trim() !== '') {
      const name = c.other_profile?.name || '';
      const text = c.lastMessage?.content || '';
      if (
        !name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !text.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
    }

    return true;
  });

  const totalUnread = chats.reduce((acc, c) => acc + c.unreadCount, 0);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.headerTitle}>Messages</Text>
          {totalUnread > 0 && (
            <View style={styles.badgePill}>
              <Text style={styles.badgeText}>{totalUnread}</Text>
            </View>
          )}
        </View>
        <Pressable
          onPress={() => setSearchOpen(!searchOpen)}
          style={styles.searchToggle}
        >
          <SymbolView name="search" size={24} tintColor="#1A3A4A" />
        </Pressable>
      </View>

      <Animated.View style={[styles.searchContainer, { height: searchHeight }]}>
        {searchOpen && (
          <View style={styles.searchBar}>
            <SymbolView name="search" size={18} tintColor="#8E8E93" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search conversations..."
              placeholderTextColor="#8E8E93"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery !== '' && (
              <Pressable onPress={() => setSearchQuery('')}>
                <SymbolView name="xmark.circle.fill" size={18} tintColor="#8E8E93" />
              </Pressable>
            )}
          </View>
        )}
      </Animated.View>

      <View style={{ height: 48, marginBottom: 12 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {(['ALL', 'UNREAD', 'FLAGGED', 'OVERDUE'] as const).map((type) => {
            const isActive = filter === type;
            const labelMap: Record<string, string> = {
              ALL: 'All',
              UNREAD: 'Unread',
              FLAGGED: 'Flagged',
              OVERDUE: 'Overdue',
            };
            return (
              <Pressable
                key={type}
                onPress={() => setFilter(type)}
                style={[
                  styles.filterChip,
                  isActive ? styles.chipActive : styles.chipInactive,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    isActive ? styles.chipTextActive : styles.chipTextInactive,
                  ]}
                >
                  {labelMap[type]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {filteredChats.length > 0 ? (
          filteredChats.map((item) => {
            const otherUser = item.other_profile;
            if (!otherUser) return null;

            const isUnread = item.unreadCount > 0;

            let prefix = '';
            if (item.lastMessage?.message_type === 'LOAN_APPROVED') prefix = '💰 ';
            if (item.lastMessage?.message_type === 'COUNTER_OFFER') prefix = '🔄 ';
            if (item.lastMessage?.message_type === 'LOAN_APPLICATION') prefix = '📄 ';
            if (item.lastMessage?.message_type === 'OVERDUE_ALERT') prefix = '⚠️ ';
            if (item.lastMessage?.message_type === 'PAYMENT_RECEIVED') prefix = '✅ ';

            let timeStr = '';
            if (item.lastMessage?.created_at) {
              const date = new Date(item.lastMessage.created_at);
              timeStr = date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              });
            }

            return (
              <SwipeableRow
                key={item.id}
                onFlag={() => handleFlag(item.id)}
                onArchive={() => handleArchive(item.id)}
                onMarkRead={() => handleMarkRead(item.id)}
              >
                <Pressable
                  style={[
                    styles.threadCard,
                    isUnread && styles.threadCardUnread,
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: `/chat/[id]`,
                      params: { id: item.id },
                    })
                  }
                >
                  <View style={styles.avatarContainer}>
                    <Image
                      source={{
                        uri:
                          otherUser.selfie ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150',
                      }}
                      style={styles.avatar}
                    />
                    {item.isOnlineToday && <OnlineDot />}
                  </View>

                  <View style={styles.centerContainer}>
                    <Text
                      style={[
                        styles.vendorName,
                        isUnread && styles.vendorNameUnread,
                      ]}
                    >
                      {otherUser.name || 'User'}
                    </Text>
                    <Text style={styles.lastMsg} numberOfLines={1}>
                      {prefix}
                      {item.lastMessage?.content || 'No messages yet'}
                    </Text>
                  </View>

                  <View style={styles.rightContainer}>
                    <Text style={styles.timestamp}>{timeStr}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      {item.isOverdue && (
                        <View style={styles.overduePill}>
                          <Text style={styles.overdueText}>OVERDUE</Text>
                        </View>
                      )}
                      {isUnread && <UnreadBadge count={item.unreadCount} />}
                    </View>
                  </View>
                </Pressable>
              </SwipeableRow>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <SymbolView name="chat_bubble" size={48} tintColor="#D1D1D6" />
            <Text style={styles.emptyTitle}>No messages found</Text>
            <Text style={styles.emptySub}>
              Tap browse or your connections to start a new chat.
            </Text>
          </View>
        )}
      </ScrollView>

      {user?.role === 'LENDER' ? (
        <LenderBottomTabBar activeTab="chat" />
      ) : (
        <BottomTabBar activeTab="chat" userRole={user?.role} />
      )}
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
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontFamily: 'Playfair Display',
    fontSize: 26,
    fontWeight: '700',
    color: '#1A3A4A',
  },
  badgePill: {
    backgroundColor: '#D4820A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Sora',
  },
  searchToggle: {
    padding: 4,
  },
  searchContainer: {
    overflow: 'hidden',
    paddingHorizontal: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 44,
    shadowColor: '#1A3A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontFamily: 'DM Sans',
    fontSize: 14,
    color: '#1A3A4A',
  },
  filterContainer: {
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: '#D4820A',
    borderColor: '#D4820A',
  },
  chipInactive: {
    backgroundColor: 'transparent',
    borderColor: '#E8E0D5',
  },
  chipText: {
    fontFamily: 'Sora',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  chipTextInactive: {
    color: '#8E8E93',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  swipeContainer: {
    position: 'relative',
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  backButtonsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    overflow: 'hidden',
  },
  backButton: {
    width: 70,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markReadBtn: {
    backgroundColor: '#1A3A4A',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  flagBtn: {
    backgroundColor: '#FFB86B',
  },
  archiveBtn: {
    backgroundColor: '#8E8E93',
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Sora',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  threadCard: {
    height: 72,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#1A3A4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  threadCardUnread: {
    backgroundColor: '#F7F3EB',
    borderColor: 'rgba(212, 130, 10, 0.1)',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8E0D5',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2D7D46',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  vendorName: {
    fontFamily: 'Sora',
    fontSize: 14,
    fontWeight: '600',
    color: '#1A3A4A',
    marginBottom: 4,
  },
  vendorNameUnread: {
    fontWeight: '700',
  },
  lastMsg: {
    fontFamily: 'DM Sans',
    fontSize: 13,
    color: '#8E8E93',
  },
  rightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  timestamp: {
    fontFamily: 'DM Sans',
    fontSize: 11,
    color: '#A0A0A0',
    textAlign: 'right',
  },
  overduePill: {
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#FFD3D3',
  },
  overdueText: {
    color: '#C0392B',
    fontSize: 8,
    fontWeight: '800',
    fontFamily: 'Sora',
  },
  unreadBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#D4820A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Sora',
  },
  emptyState: {
    marginTop: 80,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontFamily: 'Sora',
    fontSize: 18,
    fontWeight: '700',
    color: '#1A3A4A',
    marginTop: Spacing.four,
  },
  emptySub: {
    fontFamily: 'DM Sans',
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: Spacing.two,
    lineHeight: 20,
  },
});
