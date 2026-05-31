import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  Image,
  Animated,
  Modal,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth';
import { SymbolView } from '@/components/symbol-view';
import { supabase } from '@/lib/supabase';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

// Animated message bubble wrapper (spring bounce on mount)
function AnimatedMessageBubble({
  children,
}: {
  children: React.ReactNode;
  isLender: boolean;
}) {
  const scale = useMemo(() => new Animated.Value(0.8), []);

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  return (
    <Animated.View style={{ transform: [{ scale }], width: '100%' }}>
      {children}
    </Animated.View>
  );
}

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  const [chat, setChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Send button animations
  const sendBtnWidth = useMemo(() => new Animated.Value(0), []);
  const sendBtnScale = useMemo(() => new Animated.Value(0.5), []);

  useEffect(() => {
    const hasText = inputText.trim().length > 0;
    Animated.parallel([
      Animated.timing(sendBtnWidth, {
        toValue: hasText ? 52 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(sendBtnScale, {
        toValue: hasText ? 1 : 0.5,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [inputText, sendBtnWidth, sendBtnScale]);

  const handleSendMessage = async (textToSend?: string) => {
    const finalContent = textToSend || inputText;
    if (!finalContent.trim() || !user || !id) return;

    setInputText('');
    try {
      const { error } = await supabase.from('messages').insert({
        chat_id: id,
        sender_id: user.id,
        content: finalContent,
        message_type: 'TEXT',
      });
      if (error) throw error;
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Quick Reply selection
  const handleSelectQuickReply = (template: string) => {
    setInputText(template);
    setShowQuickReplies(false);
  };

  // Action: Accept Counter Offer
  const handleAcceptCounterOffer = async (loanOfferId: string) => {
    try {
      const { error } = await supabase
        .from('loan_offers')
        .update({ status: 'ACCEPTED', accepted_at: new Date().toISOString() })
        .eq('id', loanOfferId);
      if (error) throw error;
    } catch (err) {
      console.error('Error accepting offer:', err);
    }
  };

  // Action: Decline Counter Offer
  const handleDeclineCounterOffer = async (loanOfferId: string) => {
    try {
      const { error } = await supabase
        .from('loan_offers')
        .update({ status: 'DECLINED' })
        .eq('id', loanOfferId);
      if (error) throw error;
    } catch (err) {
      console.error('Error declining offer:', err);
    }
  };

  // Action: Mark EMI Received (Lender only)
  const handleMarkReceived = async (loanOfferId: string, emiAmount: number) => {
    if (!user) return;
    try {
      const { data: offer } = await supabase
        .from('loan_offers')
        .select('*')
        .eq('id', loanOfferId)
        .single();

      if (offer) {
        const newPaid = (Number(offer.amount_paid) || 0) + emiAmount;
        const totalLoan = Number(offer.amount) * (1 + Number(offer.interest_rate) / 100);

        await supabase
          .from('loan_offers')
          .update({ amount_paid: newPaid })
          .eq('id', loanOfferId);

        await supabase.from('messages').insert({
          chat_id: id,
          sender_id: user.id,
          message_type: 'PAYMENT_RECEIVED',
          content: `₹${emiAmount.toLocaleString('en-IN')} Received`,
          metadata: {
            loan_offer_id: loanOfferId,
            amount: emiAmount,
            progress: Math.min((newPaid / totalLoan) * 100, 100),
          },
        });

        await supabase.from('wallet_transactions').insert({
          user_id: offer.vendor_id,
          amount: -emiAmount,
          type: 'SEND',
          description: `EMI Repayment Received`,
        });

        await supabase.from('wallet_transactions').insert({
          user_id: offer.lender_id,
          amount: emiAmount,
          type: 'ADD',
          description: `EMI Repayment Collected`,
        });
      }
    } catch (err) {
      console.error('Error marking EMI as received:', err);
    }
  };

  const handleSendReminderText = async (amount: number) => {
    await handleSendMessage(`Friendly Reminder: Your EMI payment of ₹${amount.toLocaleString('en-IN')} is overdue. Please pay it as soon as possible to maintain your TrustScore.`);
  };

  const handleFlag = (chatId: string) => {
    router.push({
      pathname: '/chat/flagged',
      params: { chatId },
    });
  };

  const handleBlock = () => {
    alert('User has been blocked. They will no longer be able to message you.');
    setShowMenu(false);
  };

  const handleExportChat = () => {
    alert('Chat transcript exported successfully as PDF.');
    setShowMenu(false);
  };

  const renderMessageContent = (msg: any) => {
    const isCurrentUser = msg.sender_id === user?.id;

    switch (msg.message_type) {
      case 'SYSTEM':
        return (
          <View style={styles.systemPill}>
            <Text style={styles.systemPillText}>{msg.content}</Text>
          </View>
        );

      case 'LOAN_APPROVED': {
        const meta = msg.metadata || {};
        return (
          <LinearGradient
            colors={['#1A3A4A', '#2E5A70']}
            style={styles.actionCard}
          >
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardHeaderIcon}>✅</Text>
              <Text style={styles.cardHeaderTitleLight}>Loan Approved</Text>
            </View>
            <View style={{ marginTop: 8 }}>
              <Text style={styles.cardTextLight}>
                Amount: ₹{Number(meta.amount || 0).toLocaleString('en-IN')}
              </Text>
              <Text style={styles.cardTextLight}>
                Tenure: {meta.tenure || 'N/A'}
              </Text>
            </View>
            <Pressable
              style={{ marginTop: 12 }}
              onPress={() => router.push('/repayments')}
            >
              <Text style={styles.cardLinkGold}>View Details →</Text>
            </Pressable>
          </LinearGradient>
        );
      }

      case 'EMI_REMINDER': {
        const meta = msg.metadata || {};
        const emi = Number(meta.amount || 0);
        return (
          <View style={[styles.actionCard, { backgroundColor: '#FFF4E6' }]}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardHeaderIcon}>🔔</Text>
              <Text style={styles.cardHeaderTitleDark}>EMI Due in 3 Days</Text>
            </View>
            <View style={{ marginTop: 8 }}>
              <Text style={styles.cardTextDark}>
                Amount: ₹{emi.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.cardTextDark}>
                Due Date: {meta.due_date || 'N/A'}
              </Text>
            </View>
            {user?.role === 'LENDER' && (
              <Pressable
                style={styles.cardButtonTeal}
                onPress={() => handleMarkReceived(meta.loan_offer_id, emi)}
              >
                <Text style={styles.cardButtonTealText}>Mark Received</Text>
              </Pressable>
            )}
          </View>
        );
      }

      case 'PAYMENT_RECEIVED': {
        const meta = msg.metadata || {};
        const pct = Math.round(Number(meta.progress || 0));
        return (
          <View style={[styles.actionCard, { backgroundColor: '#E8F5E9' }]}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardHeaderIcon}>💸</Text>
              <Text style={styles.cardHeaderTitleDark}>
                ₹{Number(meta.amount || 0).toLocaleString('en-IN')} Received
              </Text>
              <View style={styles.cardBadgeGreen}>
                <Text style={styles.cardBadgeGreenText}>On Time ✓</Text>
              </View>
            </View>
            <View style={{ marginTop: 12 }}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
              </View>
              <Text style={styles.progressText}>
                Repayment progress: {pct}%
              </Text>
            </View>
          </View>
        );
      }

      case 'OVERDUE_ALERT': {
        const meta = msg.metadata || {};
        const amt = Number(meta.amount || 0);
        return (
          <View style={[styles.actionCard, { backgroundColor: '#FFF0F0' }]}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardHeaderIcon}>⚠️</Text>
              <Text style={styles.cardHeaderTitleDark}>
                EMI Overdue by {meta.days || 5} Days
              </Text>
            </View>
            <Text style={[styles.cardTextDark, { marginTop: 6 }]}>
              Amount: ₹{amt.toLocaleString('en-IN')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              {user?.role === 'LENDER' && (
                <>
                  <Pressable
                    style={styles.cardButtonGold}
                    onPress={() => handleSendReminderText(amt)}
                  >
                    <Text style={styles.cardButtonGoldText}>Send Reminder</Text>
                  </Pressable>
                  <Pressable
                    style={styles.cardButtonRedOutlined}
                    onPress={() => handleFlag(chat.id)}
                  >
                    <Text style={styles.cardButtonRedOutlinedText}>Escalate</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        );
      }

      case 'COUNTER_OFFER': {
        const meta = msg.metadata || {};
        const isOfferCreator = meta.created_by === user?.role;
        return (
          <View
            style={[
              styles.actionCard,
              { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#D4820A' },
            ]}
          >
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardHeaderIcon}>🔄</Text>
              <Text style={styles.cardHeaderTitleDark}>
                {isOfferCreator ? 'Counter Offer Sent' : 'Counter Offer Received'}
              </Text>
            </View>
            <View style={styles.termsGrid}>
              <View style={styles.termCol}>
                <Text style={styles.termLabel}>Amount</Text>
                <Text style={styles.termVal}>
                  ₹{Number(meta.amount || 0).toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.termCol}>
                <Text style={styles.termLabel}>Interest</Text>
                <Text style={styles.termVal}>{meta.interest_rate}% p.a.</Text>
              </View>
              <View style={styles.termCol}>
                <Text style={styles.termLabel}>Tenure</Text>
                <Text style={styles.termVal}>{meta.tenure}</Text>
              </View>
            </View>
            {!isOfferCreator && (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <Pressable
                  style={styles.btnGreen}
                  onPress={() => handleAcceptCounterOffer(meta.loan_offer_id)}
                >
                  <Text style={styles.btnGreenText}>Accept</Text>
                </Pressable>
                <Pressable
                  style={styles.btnRed}
                  onPress={() => handleDeclineCounterOffer(meta.loan_offer_id)}
                >
                  <Text style={styles.btnRedText}>Decline</Text>
                </Pressable>
              </View>
            )}
          </View>
        );
      }

      case 'LOAN_APPLICATION': {
        const meta = msg.metadata || {};
        return (
          <View
            style={[
              styles.actionCard,
              {
                backgroundColor: '#FFFFFF',
                borderLeftWidth: 4,
                borderLeftColor: '#1A3A4A',
              },
            ]}
          >
            <View style={styles.cardHeaderRow}>
              <Image
                source={{
                  uri:
                    meta.vendor_selfie ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150',
                }}
                style={styles.cardAvatar}
              />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.cardTitleText}>
                  {meta.vendor_name || 'Vendor'}
                </Text>
                <View style={styles.miniTrustScoreBadge}>
                  <Text style={styles.miniTrustScoreBadgeText}>
                    {meta.vendor_score || 620} ★
                  </Text>
                </View>
              </View>
            </View>
            <Text style={[styles.cardTextDark, { marginTop: 10 }]}>
              Requested Loan: ₹{Number(meta.amount || 0).toLocaleString('en-IN')}
            </Text>
            <Text style={styles.cardTextMuted}>
              Interest target: {meta.interest_rate}% | Tenure: {meta.tenure}
            </Text>
            {user?.role === 'LENDER' && (
              <Pressable
                style={{ marginTop: 12 }}
                onPress={() =>
                  router.push({
                    pathname: '/vendor-detail',
                    params: { id: chat?.vendor_id },
                  })
                }
              >
                <Text style={styles.cardLinkTeal}>Review Application →</Text>
              </Pressable>
            )}
          </View>
        );
      }

      case 'TEXT':
      default: {
        return (
          <View
            style={[
              styles.bubble,
              isCurrentUser ? styles.bubbleSent : styles.bubbleReceived,
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                isCurrentUser ? styles.bubbleTextSent : styles.bubbleTextReceived,
              ]}
            >
              {msg.content}
            </Text>
          </View>
        );
      }
    }
  };

  useEffect(() => {
    if (!id || !user) return;

    const fetchChatDetails = async () => {
      try {
        const isLender = user.role === 'LENDER';
        const otherCol = isLender ? 'vendor_id' : 'lender_id';

        const { data, error } = await supabase
          .from('chats')
          .select(`
            *,
            other_profile:profiles!${otherCol}(id, name, selfie, score, updated_at, role)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        setChat(data);

        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('chat_id', id)
          .not('sender_id', 'eq', user.id);
      } catch (err) {
        console.error('Error fetching chat details:', err);
      }
    };

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', id)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        setLoading(false);
      }
    };

    const loadConversation = async () => {
      await fetchChatDetails();
      await fetchMessages();
    };

    loadConversation();

    const channel = supabase
      .channel(`chat_messages_${id}_${user.id}_${Date.now()}_${Math.random()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${id}`,
        },
        async () => {
          await fetchMessages();
          await fetchChatDetails();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chats',
          filter: `id=eq.${id}`,
        },
        async () => {
          await fetchChatDetails();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, user]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#D4820A" />
      </View>
    );
  }

  const otherUser = chat?.other_profile;
  const isLenderViewer = user?.role === 'LENDER';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <SymbolView name="chevron.left" size={24} tintColor="#1A3A4A" />
        </Pressable>

        <Image
          source={{
            uri:
              otherUser?.selfie ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150',
          }}
          style={styles.headerAvatar}
        />

        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.headerName}>{otherUser?.name || 'User'}</Text>
          {isLenderViewer ? (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>
                {otherUser?.score || 620} ★
              </Text>
            </View>
          ) : (
            <View style={[styles.headerBadge, { backgroundColor: '#E8F5E9' }]}>
              <Text style={[styles.headerBadgeText, { color: '#2D7D46' }]}>
                Verified Lender ✓
              </Text>
            </View>
          )}
        </View>

        <Pressable onPress={() => setShowMenu(true)} style={styles.menuButton}>
          <Text style={styles.menuDots}>•••</Text>
        </Pressable>
      </View>

      {/* Messages Stream */}
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg) => {
          const isCurrentUser = msg.sender_id === user?.id;
          const isSystem = msg.message_type === 'SYSTEM';

          const date = new Date(msg.created_at);
          const timeStr = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <View key={msg.id} style={{ marginBottom: 12, width: '100%' }}>
              {isSystem ? (
                renderMessageContent(msg)
              ) : (
                <AnimatedMessageBubble isLender={isCurrentUser}>
                  <View
                    style={{
                      alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
                      width: '100%',
                    }}
                  >
                    {renderMessageContent(msg)}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        marginTop: 4,
                        marginHorizontal: 8,
                      }}
                    >
                      <Text style={styles.timeLabel}>{timeStr}</Text>
                      {isCurrentUser && (
                        <View style={{ marginLeft: 2 }}>
                          {msg.is_read ? (
                            <Text style={{ color: '#D4820A', fontSize: 10, fontWeight: 'bold' }}>✓✓</Text>
                          ) : (
                            <Text style={{ color: '#A0A0A0', fontSize: 10 }}>✓</Text>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                </AnimatedMessageBubble>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Sticky Input Bar */}
      <View style={[styles.inputBarContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.inputBar}>
          <Pressable
            onPress={() => setShowAttachments(true)}
            style={styles.iconContainer}
          >
            <SymbolView name="link" size={22} tintColor="#8E8E93" />
          </Pressable>

          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#8E8E93"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />

          <Pressable
            onPress={() => setShowQuickReplies(true)}
            style={styles.iconContainer}
          >
            <SymbolView name="bookmark" size={22} tintColor="#D4820A" />
          </Pressable>

          <Pressable style={styles.iconContainer}>
            <SymbolView name="sparkles" size={22} tintColor="#1A3A4A" />
          </Pressable>

          <Animated.View
            style={[
              styles.sendBtnWrapper,
              { width: sendBtnWidth, opacity: sendBtnScale },
            ]}
          >
            <Pressable
              onPress={() => handleSendMessage()}
              style={styles.sendBtn}
            >
              <SymbolView name="chevron.right" size={20} tintColor="#FFFFFF" />
            </Pressable>
          </Animated.View>
        </View>
      </View>

      {/* 3-Dot Options Sheet */}
      <Modal visible={showMenu} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowMenu(false)} />
          <View style={styles.menuSheet}>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                router.push({
                  pathname: '/vendor-detail',
                  params: { id: chat?.vendor_id },
                });
              }}
            >
              <Text style={styles.menuItemText}>View Profile</Text>
            </Pressable>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                handleFlag(chat.id);
              }}
            >
              <Text style={[styles.menuItemText, { color: '#D4820A' }]}>Flag Vendor</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={handleBlock}>
              <Text style={[styles.menuItemText, { color: '#C0392B' }]}>Block User</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={handleExportChat}>
              <Text style={styles.menuItemText}>Export Chat</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Quick Reply Tray */}
      <Modal visible={showQuickReplies} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowQuickReplies(false)}
          />
          <View style={styles.sheetContent}>
            <Text style={styles.sheetTitle}>Quick Replies</Text>
            <ScrollView style={{ maxHeight: 250 }}>
              {[
                'Your EMI of ₹18,250 is due in 3 days',
                'Payment received — thank you ✓',
                'Please confirm your repayment details',
                'Your loan request has been approved',
                'We need to discuss your active account',
              ].map((template) => (
                <Pressable
                  key={template}
                  style={styles.templateChip}
                  onPress={() => handleSelectQuickReply(template)}
                >
                  <Text style={styles.templateText}>{template}</Text>
                </Pressable>
              ))}
              <Pressable
                style={styles.createCustomTemplate}
                onPress={() => {
                  alert('Custom templates can be configured in settings.');
                }}
              >
                <Text style={styles.createCustomText}>+ Create Custom Template</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Attachment Tray */}
      <Modal visible={showAttachments} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowAttachments(false)}
          />
          <View style={styles.sheetContent}>
            <Text style={styles.sheetTitle}>Add Attachment</Text>
            <View style={styles.attachmentGrid}>
              {[
                { label: 'Send Invoice', icon: '📄', type: 'INVOICE' },
                { label: 'Share Report', icon: '📊', type: 'REPORT' },
                { label: 'Upload Photo', icon: '🖼️', type: 'PHOTO' },
                { label: 'Loan PDF', icon: '📋', type: 'PDF' },
              ].map((item) => (
                <Pressable
                  key={item.label}
                  style={styles.attachmentItem}
                  onPress={() => {
                    setShowAttachments(false);
                    handleSendMessage(`Attached ${item.label} (${item.type})`);
                  }}
                >
                  <View style={styles.attachmentIconBox}>
                    <Text style={{ fontSize: 24 }}>{item.icon}</Text>
                  </View>
                  <Text style={styles.attachmentLabel}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    padding: 4,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8E0D5',
    marginLeft: 8,
  },
  headerName: {
    fontFamily: 'Sora',
    fontWeight: '600',
    fontSize: 15,
    color: '#1A3A4A',
  },
  headerBadge: {
    backgroundColor: '#FFF4E6',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D4820A',
    fontFamily: 'Sora',
  },
  menuButton: {
    padding: 8,
  },
  menuDots: {
    fontSize: 16,
    color: '#1A3A4A',
    letterSpacing: 1.5,
  },
  messageList: {
    padding: 16,
    paddingBottom: 24,
  },
  systemPill: {
    alignSelf: 'center',
    backgroundColor: '#E8E0D5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginVertical: 12,
  },
  systemPillText: {
    fontFamily: 'DM Sans',
    fontSize: 11,
    color: '#6B6B6B',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: '75%',
    shadowColor: '#1A3A4A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  bubbleSent: {
    backgroundColor: '#D4820A',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
  },
  bubbleReceived: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 18,
    alignSelf: 'flex-start',
  },
  bubbleText: {
    fontFamily: 'DM Sans',
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextSent: {
    color: '#FFFFFF',
  },
  bubbleTextReceived: {
    color: '#1C1C1E',
  },
  timeLabel: {
    fontFamily: 'DM Sans',
    fontSize: 10,
    color: '#A0A0A0',
  },
  actionCard: {
    borderRadius: 20,
    padding: 16,
    width: '85%',
    marginVertical: 8,
    alignSelf: 'center',
    shadowColor: '#1A3A4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  cardHeaderTitleLight: {
    fontFamily: 'Sora',
    fontWeight: '700',
    fontSize: 15,
    color: '#FFFFFF',
  },
  cardHeaderTitleDark: {
    fontFamily: 'Sora',
    fontWeight: '700',
    fontSize: 15,
    color: '#1A3A4A',
  },
  cardTextLight: {
    fontFamily: 'DM Sans',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  cardTextDark: {
    fontFamily: 'DM Sans',
    fontSize: 13,
    color: '#1C1C1E',
  },
  cardTextMuted: {
    fontFamily: 'DM Sans',
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 4,
  },
  cardLinkGold: {
    fontFamily: 'Sora',
    fontWeight: '700',
    fontSize: 13,
    color: '#FFB86B',
  },
  cardLinkTeal: {
    fontFamily: 'Sora',
    fontWeight: '700',
    fontSize: 13,
    color: '#1A3A4A',
  },
  cardBadgeGreen: {
    backgroundColor: '#C8E6C9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 'auto',
  },
  cardBadgeGreenText: {
    color: '#2E7D32',
    fontSize: 10,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2E7D32',
    borderRadius: 4,
  },
  progressText: {
    fontFamily: 'JetBrains Mono',
    fontSize: 11,
    color: '#6B6B6B',
    marginTop: 6,
  },
  cardButtonTeal: {
    backgroundColor: '#1A3A4A',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  cardButtonTealText: {
    color: '#FFFFFF',
    fontFamily: 'Sora',
    fontSize: 13,
    fontWeight: '700',
  },
  cardButtonGold: {
    backgroundColor: '#D4820A',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    flex: 1,
  },
  cardButtonGoldText: {
    color: '#FFFFFF',
    fontFamily: 'Sora',
    fontSize: 12,
    fontWeight: '700',
  },
  cardButtonRedOutlined: {
    borderColor: '#C0392B',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    flex: 1,
  },
  cardButtonRedOutlinedText: {
    color: '#C0392B',
    fontFamily: 'Sora',
    fontSize: 12,
    fontWeight: '700',
  },
  termsGrid: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  termCol: {
    flex: 1,
    backgroundColor: '#F9F5EF',
    padding: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  termLabel: {
    fontFamily: 'DM Sans',
    fontSize: 10,
    color: '#8E8E93',
  },
  termVal: {
    fontFamily: 'Sora',
    fontSize: 12,
    fontWeight: '700',
    color: '#1A3A4A',
    marginTop: 2,
  },
  btnGreen: {
    backgroundColor: '#2E7D32',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    flex: 1,
  },
  btnGreenText: {
    color: '#FFFFFF',
    fontFamily: 'Sora',
    fontSize: 13,
    fontWeight: '700',
  },
  btnRed: {
    backgroundColor: '#C0392B',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    flex: 1,
  },
  btnRedText: {
    color: '#FFFFFF',
    fontFamily: 'Sora',
    fontSize: 13,
    fontWeight: '700',
  },
  cardAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  cardTitleText: {
    fontFamily: 'Sora',
    fontWeight: '600',
    fontSize: 13,
    color: '#1A3A4A',
  },
  miniTrustScoreBadge: {
    backgroundColor: '#FFF4E6',
    alignSelf: 'flex-start',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
  },
  miniTrustScoreBadgeText: {
    color: '#D4820A',
    fontSize: 8,
    fontWeight: '700',
  },
  inputBarContainer: {
    backgroundColor: '#F9F5EF',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 4,
    shadowColor: '#1A3A4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    padding: 8,
  },
  input: {
    flex: 1,
    fontFamily: 'DM Sans',
    fontSize: 14,
    color: '#1C1C1E',
    maxHeight: 80,
    paddingVertical: 8,
    marginLeft: 4,
  },
  sendBtnWrapper: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D4820A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 58, 74, 0.4)',
    justifyContent: 'flex-end',
  },
  menuSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  menuItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D5',
  },
  menuItemText: {
    fontFamily: 'Sora',
    fontSize: 15,
    fontWeight: '600',
    color: '#1A3A4A',
  },
  sheetContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  sheetTitle: {
    fontFamily: 'Sora',
    fontWeight: '700',
    fontSize: 16,
    color: '#1A3A4A',
    marginBottom: 16,
  },
  templateChip: {
    padding: 12,
    backgroundColor: '#F9F5EF',
    borderRadius: 12,
    marginBottom: 8,
  },
  templateText: {
    fontFamily: 'DM Sans',
    fontSize: 13,
    color: '#1C1C1E',
  },
  createCustomTemplate: {
    borderColor: '#D4820A',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  createCustomText: {
    fontFamily: 'Sora',
    fontSize: 13,
    fontWeight: '600',
    color: '#D4820A',
  },
  attachmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
    marginTop: 8,
  },
  attachmentItem: {
    width: '45%',
    alignItems: 'center',
    backgroundColor: '#F9F5EF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  attachmentIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#1A3A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  attachmentLabel: {
    fontFamily: 'Sora',
    fontSize: 12,
    fontWeight: '600',
    color: '#1A3A4A',
  },
});
