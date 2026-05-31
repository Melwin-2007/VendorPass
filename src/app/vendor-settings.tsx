import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal, Platform } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useAuth } from '@/context/auth';
import { SymbolView } from '@/components/symbol-view';
import { supabase } from '@/lib/supabase';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

const CustomToggle = ({ value, onValueChange }: { value: boolean, onValueChange: (val: boolean) => void }) => {
  const thumbStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: withSpring(value ? 20 : 2, { damping: 15, stiffness: 120 }) }],
      backgroundColor: withSpring(value ? '#D4820A' : '#FFFFFF'),
    };
  });
  
  const trackStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withSpring(value ? '#F9F5EF' : '#E8E0D5'),
      borderColor: withSpring(value ? '#D4820A' : '#E8E0D5'),
    };
  });

  return (
    <Pressable onPress={() => onValueChange(!value)}>
      <Animated.View style={[styles.toggleTrack, trackStyle]}>
        <Animated.View style={[styles.toggleThumb, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
};

export default function VendorSettingsScreen() {
  const { user, signOut } = useAuth();
  const [showSignOut, setShowSignOut] = useState(false);

  const [prefs, setPrefs] = useState({
    pref_emi_reminders: user?.pref_emi_reminders ?? true,
    pref_overdue_alerts: user?.pref_overdue_alerts ?? true,
    pref_chat_notifs: user?.pref_chat_notifs ?? true,
    pref_weekly_report: user?.pref_weekly_report ?? false,
    pref_biometric: user?.pref_biometric ?? true,
  });

  const handleToggle = async (key: keyof typeof prefs, val: boolean) => {
    setPrefs(prev => ({ ...prev, [key]: val }));
    if (!user) return;
    
    const { error } = await supabase
      .from('profiles')
      .update({ [key]: val })
      .eq('id', user.id);
      
    if (error) {
      console.error('Error updating setting:', error);
      setPrefs(prev => ({ ...prev, [key]: !val }));
    }
  };

  const handleSignOut = () => {
    setShowSignOut(false);
    signOut();
    router.replace('/');
  };

  const SettingRow = ({ icon, label, rightElement, showDivider = true, onPress }: any) => (
    <Pressable 
      style={({ pressed }) => [
        styles.settingRow, 
        pressed && onPress && { transform: [{ scale: 0.98 }], backgroundColor: '#F0EAD6' }
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingRowLeft}>
        <View style={styles.iconBox}>
          <Text style={{ fontSize: 18 }}>{icon}</Text>
        </View>
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      <View style={styles.settingRowRight}>
        {rightElement || <SymbolView name="chevron.right" size={14} tintColor="#A0A0A0" />}
      </View>
      {showDivider && <View style={styles.divider} />}
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <SymbolView name="chevron.left" size={24} tintColor="#1A3A4A" />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Image 
            source={{ uri: user?.selfie || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&auto=format&fit=crop' }} 
            style={styles.avatar} 
          />
          <View style={styles.profileInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.profileName}>{user?.name || 'Vendor Name'}</Text>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>Verified ✓</Text>
              </View>
            </View>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>
          <Pressable>
            <Text style={styles.editProfileText}>Edit Profile →</Text>
          </Pressable>
        </View>

        {/* ACCOUNT */}
        <Text style={styles.sectionTitle}>ACCOUNT</Text>
        <View style={styles.cardGroup}>
          <SettingRow icon="👤" label="Personal Information" onPress={() => {}} />
          <SettingRow icon="🔒" label="Change Password" onPress={() => {}} />
          <SettingRow 
            icon="🪪" 
            label="KYC & Verification" 
            onPress={() => {}} 
            rightElement={
              <View style={[styles.verifiedBadge, { marginRight: 8 }]}>
                <Text style={styles.verifiedText}>Verified ✓</Text>
              </View>
            }
          />
          <SettingRow 
            icon="🏦" 
            label="Linked Bank Account" 
            showDivider={false} 
            onPress={() => {}} 
            rightElement={<Text style={styles.inlineValue}>•••• 4521</Text>}
          />
        </View>

        {/* NOTIFICATIONS */}
        <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
        <View style={styles.cardGroup}>
          <SettingRow 
            icon="📲" 
            label="EMI Reminders" 
            rightElement={<CustomToggle value={prefs.pref_emi_reminders} onValueChange={(v) => handleToggle('pref_emi_reminders', v)} />}
          />
          <SettingRow 
            icon="⚠️" 
            label="Overdue Alerts" 
            rightElement={<CustomToggle value={prefs.pref_overdue_alerts} onValueChange={(v) => handleToggle('pref_overdue_alerts', v)} />}
          />
          <SettingRow 
            icon="💬" 
            label="Chat Notifications" 
            rightElement={<CustomToggle value={prefs.pref_chat_notifs} onValueChange={(v) => handleToggle('pref_chat_notifs', v)} />}
          />
          <SettingRow 
            icon="📊" 
            label="Weekly Portfolio Report" 
            showDivider={false} 
            rightElement={<CustomToggle value={prefs.pref_weekly_report} onValueChange={(v) => handleToggle('pref_weekly_report', v)} />}
          />
        </View>

        {/* SECURITY */}
        <Text style={styles.sectionTitle}>SECURITY</Text>
        <View style={styles.cardGroup}>
          <SettingRow 
            icon="👁️" 
            label="Biometric Login" 
            rightElement={<CustomToggle value={prefs.pref_biometric} onValueChange={(v) => handleToggle('pref_biometric', v)} />}
          />
          <SettingRow 
            icon="🔐" 
            label="Two-Factor Authentication" 
            onPress={() => {}} 
            rightElement={<Text style={[styles.inlineValue, { color: '#2D7D46' }]}>Enabled</Text>}
          />
          <SettingRow 
            icon="📱" 
            label="Active Sessions" 
            showDivider={false} 
            onPress={() => {}} 
          />
        </View>

        {/* SUPPORT */}
        <Text style={styles.sectionTitle}>SUPPORT</Text>
        <View style={styles.cardGroup}>
          <SettingRow icon="❓" label="Help & FAQ" onPress={() => {}} />
          <SettingRow icon="💬" label="Contact Support" onPress={() => {}} />
          <SettingRow icon="⭐" label="Rate VendorPASS" onPress={() => {}} />
          <SettingRow icon="📄" label="Terms & Privacy Policy" showDivider={false} onPress={() => {}} />
        </View>

        {/* Sign Out Button */}
        <Pressable 
          style={({ pressed }) => [
            styles.signOutBtn, 
            pressed && { transform: [{ scale: 0.98 }], opacity: 0.8 }
          ]}
          onPress={() => setShowSignOut(true)}
        >
          <Text style={{ fontSize: 18, marginRight: 8 }}>🚪</Text>
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>

        <Text style={styles.versionText}>VendorPASS v1.0.0</Text>
      </ScrollView>

      {/* Sign Out Bottom Sheet Modal */}
      <Modal visible={showSignOut} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowSignOut(false)} />
          <View style={styles.bottomSheet}>
            <Text style={styles.sheetTitle}>Are you sure you want to sign out?</Text>
            <View style={styles.sheetRow}>
              <Pressable style={styles.sheetBtnOutlined} onPress={() => setShowSignOut(false)}>
                <Text style={styles.sheetBtnOutlinedText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.sheetBtnFilled} onPress={handleSignOut}>
                <Text style={styles.sheetBtnFilledText}>Sign Out</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Playfair Display',
    fontSize: 24,
    color: '#1A3A4A',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#D4820A',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontFamily: 'Sora',
    fontWeight: '600',
    fontSize: 18,
    color: '#1A3A4A',
  },
  profileEmail: {
    fontFamily: 'DM Sans',
    fontSize: 13,
    color: '#808080',
    marginTop: 4,
  },
  verifiedBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  verifiedText: {
    color: '#2D7D46',
    fontSize: 10,
    fontFamily: 'Sora',
    fontWeight: '600',
  },
  editProfileText: {
    color: '#D4820A',
    fontFamily: 'Sora',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionTitle: {
    fontFamily: 'DM Sans',
    fontSize: 12,
    fontWeight: '700',
    color: '#A0A0A0',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginLeft: 8,
  },
  cardGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    marginBottom: 24,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 52,
    position: 'relative',
  },
  settingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F9F5EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingLabel: {
    fontFamily: 'Sora',
    fontWeight: '500',
    fontSize: 15,
    color: '#1A3A4A',
  },
  settingRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineValue: {
    fontFamily: 'DM Sans',
    fontSize: 14,
    color: '#808080',
    marginRight: 8,
  },
  divider: {
    position: 'absolute',
    bottom: 0,
    left: 64,
    right: 16,
    height: 1,
    backgroundColor: '#E8E0D5',
  },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  signOutBtn: {
    flexDirection: 'row',
    height: 52,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#C0392B',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  signOutText: {
    fontFamily: 'Sora',
    fontWeight: '600',
    fontSize: 16,
    color: '#C0392B',
  },
  versionText: {
    fontFamily: 'DM Sans',
    fontSize: 12,
    color: '#A0A0A0',
    textAlign: 'center',
    marginTop: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 58, 74, 0.4)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  sheetTitle: {
    fontFamily: 'Sora',
    fontWeight: '600',
    fontSize: 18,
    color: '#1A3A4A',
    marginBottom: 24,
    textAlign: 'center',
  },
  sheetRow: {
    flexDirection: 'row',
    gap: 12,
  },
  sheetBtnOutlined: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8E0D5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBtnOutlinedText: {
    fontFamily: 'Sora',
    fontWeight: '600',
    fontSize: 15,
    color: '#1A3A4A',
  },
  sheetBtnFilled: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#C0392B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBtnFilledText: {
    fontFamily: 'Sora',
    fontWeight: '600',
    fontSize: 15,
    color: '#FFFFFF',
  },
});
