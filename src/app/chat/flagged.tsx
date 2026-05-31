import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/context/auth';
import { SymbolView } from '@/components/symbol-view';
import { supabase } from '@/lib/supabase';
import { useLocalSearchParams, router } from 'expo-router';

type FlagReason = 'SUSPICIOUS' | 'NON_RESPONSIVE' | 'FRAUD' | 'OTHER';

const REASON_LABELS: Record<FlagReason, string> = {
  SUSPICIOUS: 'Suspicious Activity',
  NON_RESPONSIVE: 'Non-Responsive',
  FRAUD: 'Fraud Suspicion',
  OTHER: 'Other',
};

export default function FlaggedViewScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [chat, setChat] = useState<any>(null);
  const [flag, setFlag] = useState<any>(null);
  
  const [selectedReason, setSelectedReason] = useState<FlagReason>('SUSPICIOUS');
  const [detailsText, setDetailsText] = useState('');
  const [timeline, setTimeline] = useState<any[]>([]);

  useEffect(() => {
    if (!chatId || !user) return;

    const fetchFlagAndChat = async () => {
      try {
        const isLender = user.role === 'LENDER';
        const otherCol = isLender ? 'vendor_id' : 'lender_id';
        
        const { data: chatData } = await supabase
          .from('chats')
          .select(`
            *,
            other_profile:profiles!${otherCol}(id, name, selfie, score)
          `)
          .eq('id', chatId)
          .single();
        
        setChat(chatData);

        const { data: flagData } = await supabase
          .from('chat_flags')
          .select('*')
          .eq('chat_id', chatId)
          .maybeSingle();

        if (flagData) {
          setFlag(flagData);
          setSelectedReason(flagData.reason as FlagReason);
          setDetailsText(flagData.details || '');
          setTimeline(flagData.timeline || []);
        } else {
          setTimeline([
            {
              timestamp: new Date().toISOString(),
              event: 'Flag initiated',
              actor: user.name,
            }
          ]);
        }
      } catch (err) {
        console.error('Error loading flag details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFlagAndChat();
  }, [chatId, user]);

  const handleSaveOrUpdateFlag = async (escalated = false) => {
    if (!user || !chat) return;
    setLoading(true);
    try {
      const nowStr = new Date().toISOString();
      const status = escalated ? 'ESCALATED' : 'PENDING';
      
      const newEvent = escalated 
        ? { timestamp: nowStr, event: 'Escalated to VendorPASS Support (Ticket Created)', actor: user.name }
        : { timestamp: nowStr, event: `Reason configured to: ${REASON_LABELS[selectedReason]}`, actor: user.name };
      
      const updatedTimeline = [...timeline, newEvent];

      if (flag) {
        const { error } = await supabase
          .from('chat_flags')
          .update({
            reason: selectedReason,
            details: detailsText,
            status,
            timeline: updatedTimeline,
          })
          .eq('id', flag.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('chat_flags')
          .insert({
            chat_id: chat.id,
            reporter_id: user.id,
            vendor_id: chat.vendor_id,
            reason: selectedReason,
            details: detailsText,
            status,
            timeline: updatedTimeline,
          });

        if (error) throw error;
      }
      
      await supabase.from('messages').insert({
        chat_id: chat.id,
        sender_id: user.id,
        message_type: 'SYSTEM',
        content: escalated 
          ? `Conversation escalated to VendorPASS Support`
          : `Vendor flagged: ${REASON_LABELS[selectedReason]}`,
      });

      router.back();
    } catch (err) {
      console.error('Error saving flag:', err);
      setLoading(false);
    }
  };

  const handleRemoveFlag = async () => {
    if (!flag || !chat || !user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('chat_flags')
        .delete()
        .eq('id', flag.id);

      if (error) throw error;

      await supabase.from('messages').insert({
        chat_id: chat.id,
        sender_id: user.id,
        message_type: 'SYSTEM',
        content: `Flag resolved and removed by ${user.name}`,
      });

      router.back();
    } catch (err) {
      console.error('Error removing flag:', err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#C0392B" />
      </View>
    );
  }

  const otherUser = chat?.other_profile;

  return (
    <View style={styles.container}>
      <View style={styles.redBanner}>
        <SymbolView name="warning" size={20} tintColor="#FFFFFF" />
        <Text style={styles.redBannerText}>
          This vendor has been flagged for review
        </Text>
      </View>

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <SymbolView name="chevron.left" size={24} tintColor="#1A3A4A" />
        </Pressable>
        <Text style={styles.headerTitle}>Escalation Console</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.subjectCard}>
          <Text style={styles.subjectLabel}>FLAGGED SUBJECT</Text>
          <Text style={styles.subjectName}>{otherUser?.name || 'Vendor'}</Text>
          <Text style={styles.subjectSub}>
            TrustScore: {otherUser?.score || 620} ★ | Chat ID: {chat?.id}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>REASON FOR FLAG</Text>
        <View style={styles.cardGroup}>
          {(Object.keys(REASON_LABELS) as FlagReason[]).map((reason) => {
            const isSelected = selectedReason === reason;
            return (
              <Pressable
                key={reason}
                onPress={() => setSelectedReason(reason)}
                style={[
                  styles.reasonRow,
                  isSelected && styles.reasonRowSelected,
                ]}
              >
                <Text
                  style={[
                    styles.reasonText,
                    isSelected && styles.reasonTextSelected,
                  ]}
                >
                  {REASON_LABELS[reason]}
                </Text>
                {isSelected && (
                  <SymbolView name="checkmark.circle.fill" size={18} tintColor="#D4820A" />
                )}
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>ADDITIONAL DETAILS</Text>
        <View style={styles.inputCard}>
          <TextInput
            style={styles.detailsInput}
            placeholder="Describe the suspicious behavior or issue in detail..."
            placeholderTextColor="#A0A0A0"
            value={detailsText}
            onChangeText={setDetailsText}
            multiline
            numberOfLines={4}
          />
        </View>

        {timeline.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>FLAG HISTORY LOG</Text>
            <View style={styles.timelineCard}>
              {timeline.map((event, idx) => {
                const date = new Date(event.timestamp);
                const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <View key={idx} style={styles.timelineRow}>
                    <View style={styles.timelineDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.timelineEvent}>{event.event}</Text>
                      <Text style={styles.timelineMeta}>
                        By {event.actor || 'System'} • {dateStr}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        <View style={styles.actionButtons}>
          <Pressable
            style={styles.btnRedFilled}
            onPress={() => handleSaveOrUpdateFlag(true)}
          >
            <Text style={styles.btnRedFilledText}>
              Escalate to VendorPASS Support
            </Text>
          </Pressable>

          <Pressable
            style={styles.btnAmberOutlined}
            onPress={() => handleSaveOrUpdateFlag(false)}
          >
            <Text style={styles.btnAmberOutlinedText}>Update Flag Info</Text>
          </Pressable>

          {flag && (
            <Pressable
              style={styles.btnGreyOutlined}
              onPress={handleRemoveFlag}
            >
              <Text style={styles.btnGreyOutlinedText}>Remove Flag</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F5EF',
  },
  redBanner: {
    backgroundColor: '#C0392B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  redBannerText: {
    color: '#FFFFFF',
    fontFamily: 'Sora',
    fontSize: 13,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: 'Playfair Display',
    fontSize: 20,
    fontWeight: '700',
    color: '#1A3A4A',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  subjectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#C0392B',
    marginBottom: 20,
    shadowColor: '#1A3A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  subjectLabel: {
    fontFamily: 'DM Sans',
    fontSize: 10,
    fontWeight: '800',
    color: '#A0A0A0',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  subjectName: {
    fontFamily: 'Sora',
    fontSize: 18,
    fontWeight: '700',
    color: '#1A3A4A',
  },
  subjectSub: {
    fontFamily: 'DM Sans',
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: 'DM Sans',
    fontSize: 11,
    fontWeight: '800',
    color: '#A0A0A0',
    letterSpacing: 1.2,
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 4,
  },
  cardGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#1A3A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  reasonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D5',
  },
  reasonRowSelected: {
    backgroundColor: '#FFF9F2',
  },
  reasonText: {
    fontFamily: 'Sora',
    fontSize: 14,
    fontWeight: '500',
    color: '#1A3A4A',
  },
  reasonTextSelected: {
    color: '#D4820A',
    fontWeight: '600',
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#1A3A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  detailsInput: {
    fontFamily: 'DM Sans',
    fontSize: 14,
    color: '#1C1C1E',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#1A3A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C0392B',
    marginTop: 6,
  },
  timelineEvent: {
    fontFamily: 'Sora',
    fontSize: 13,
    fontWeight: '600',
    color: '#1A3A4A',
  },
  timelineMeta: {
    fontFamily: 'DM Sans',
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  actionButtons: {
    marginTop: 24,
    gap: 12,
  },
  btnRedFilled: {
    height: 48,
    backgroundColor: '#C0392B',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnRedFilledText: {
    color: '#FFFFFF',
    fontFamily: 'Sora',
    fontSize: 14,
    fontWeight: '700',
  },
  btnAmberOutlined: {
    height: 48,
    borderWidth: 1.5,
    borderColor: '#D4820A',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnAmberOutlinedText: {
    color: '#D4820A',
    fontFamily: 'Sora',
    fontSize: 14,
    fontWeight: '700',
  },
  btnGreyOutlined: {
    height: 48,
    borderWidth: 1.5,
    borderColor: '#8E8E93',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnGreyOutlinedText: {
    color: '#8E8E93',
    fontFamily: 'Sora',
    fontSize: 14,
    fontWeight: '700',
  },
});
