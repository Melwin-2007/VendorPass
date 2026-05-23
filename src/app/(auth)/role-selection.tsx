import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, Platform, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';
import { useAuth, UserRole } from '@/context/auth';
import { SymbolView } from '@/components/symbol-view';
import { LinearGradient } from 'expo-linear-gradient';

export default function RoleSelectionScreen() {
  const { selectRole, selectedSignupRole } = useAuth();
  
  // Default to VENDOR if none is selected to match the mockup's initial state
  const [selected, setSelected] = useState<UserRole>(selectedSignupRole || 'VENDOR');

  const handleContinue = () => {
    if (selected) {
      selectRole(selected);
      router.push('/(auth)/signup');
    }
  };

  const rolesList: {
    id: UserRole;
    title: string;
    description: string;
    icon: string;
    iconColor: string;
    iconBg: string;
    accentColor: string;
  }[] = [
    {
      id: 'VENDOR',
      title: 'Vendor',
      description: 'Apply for credit, manage daily sales, and grow your retail business.',
      icon: 'storefront',
      iconColor: '#895100',
      iconBg: 'rgba(212, 130, 10, 0.10)',
      accentColor: '#d4820a',
    },
    {
      id: 'LENDER',
      title: 'Lender',
      description: 'Provide working capital to trusted micro-merchants with AI insights.',
      icon: 'account_balance_wallet',
      iconColor: '#446274',
      iconBg: 'rgba(199, 231, 252, 0.20)',
      accentColor: '#c7e7fc',
    },
    {
      id: 'BANK',
      title: 'Bank',
      description: 'Access institutional dashboard for policy and credit line management.',
      icon: 'account_balance',
      iconColor: '#835500',
      iconBg: 'rgba(204, 134, 0, 0.10)',
      accentColor: '#cc8600',
    },
  ];

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' && (
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400&family=Playfair+Display:wght@700;900&family=Sora:wght@400;600;700;800&family=JetBrains+Mono:wght@600&display=swap');
          
          .glass-header {
            background: rgba(253, 249, 243, 0.8) !important;
            backdrop-filter: blur(8px) !important;
            -webkit-backdrop-filter: blur(8px) !important;
          }
          .glass-footer {
            background: rgba(253, 249, 243, 0.9) !important;
            backdrop-filter: blur(8px) !important;
            -webkit-backdrop-filter: blur(8px) !important;
          }
        `}} />
      )}

      {/* Top App Bar */}
      <View style={styles.header}>
        <View style={styles.headerContainer}>
          <Pressable 
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(auth)/login');
              }
            }} 
            style={({ pressed }) => [
              styles.backButton,
              { transform: [{ scale: pressed ? 0.95 : 1.0 }] }
            ]}
            aria-label="Go back"
          >
            <SymbolView name="arrow_back" size={24} tintColor="#895100" />
          </Pressable>
          <Text style={styles.headerTitle}>Create Account</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Instruction */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Join VendorPASS</Text>
          <Text style={styles.heroSubtitle}>
            Select your primary role to customize your fintech experience.
          </Text>
        </View>

        {/* Role Selection Cards */}
        <View style={styles.cardsContainer}>
          {rolesList.map((item) => {
            const isSelected = selected === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setSelected(item.id)}
                style={({ pressed }) => [
                  styles.roleCard,
                  isSelected ? styles.activeCard : styles.inactiveCard,
                  { transform: [{ scale: pressed ? 0.99 : 1.0 }] }
                ]}
              >
                {/* Accent Bar */}
                <View 
                  style={[
                    styles.accentBar, 
                    { 
                      backgroundColor: item.accentColor,
                      opacity: isSelected ? 1 : 0 
                    }
                  ]} 
                />

                {/* Role Icon Container */}
                <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>
                  <SymbolView name={item.icon} size={32} tintColor={item.iconColor} />
                </View>

                {/* Details Container */}
                <View style={styles.detailsContainer}>
                  <Text style={styles.roleTitle}>{item.title}</Text>
                  <Text style={styles.roleDesc}>{item.description}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Illustration / Mood Image */}
        <View style={styles.imageCard}>
          <Image 
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgWi_KfyTe7kVTSNj0yY0duSr4t09nUDKDOhbALZoLEcyKzwRjpuZkrf0WunuXtfejYYGhKy_JJUQ_JTLS7A59aCFEXd3NZa3dgZb94Ue7VMdgjmJDU4xIlIGyQMvt-ZE3o9aleEuJrOhJgzG-m01_Fu7RzLTkrDMQMRft1vswLVYRCBy9fF3mO0XBMRRMDD_sr9lwwQTVnSqVKQAGMeyowy107hafY_xfrwcCyQiXU0fPw-TSUpzTTT33gJSwvM5bbLAjT6CuG9ic' }}
            style={styles.moodImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', '#fdf9f3']}
            style={styles.imageOverlay}
          />
        </View>
      </ScrollView>

      {/* Fixed Bottom Action Area */}
      <View style={styles.footer}>
        <View style={styles.footerContainer}>
          <Pressable 
            onPress={handleContinue}
            style={({ pressed }) => [
              styles.continueBtn,
              { transform: [{ scale: pressed ? 0.98 : 1.0 }] }
            ]}
          >
            <LinearGradient
              colors={['#D4820A', '#F5A623']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientButton}
            >
              <Text style={styles.continueText}>Continue</Text>
              <SymbolView name="arrow_forward" size={20} tintColor="#ffffff" />
            </LinearGradient>
          </Pressable>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Pressable onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.loginLink}>Log In</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf9f3',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: 'rgba(253, 249, 243, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D5',
    zIndex: 50,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      },
    }),
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    height: '100%',
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    borderRadius: 9999,
  },
  headerTitle: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '700',
    color: '#895100',
    fontFamily: Platform.OS === 'web' ? 'Playfair Display' : 'serif',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingTop: 88, // 64 (header height) + 24 spacing
    paddingBottom: 160, // Space for the fixed bottom action area
    paddingHorizontal: 24,
    maxWidth: 528, // max-w-lg (512px) + safe margin padding
    width: '100%',
    alignSelf: 'center',
  },
  heroSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: '#1c1c18',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: '#534435',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  cardsContainer: {
    gap: 16,
  },
  roleCard: {
    position: 'relative',
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  activeCard: {
    borderWidth: 2,
    borderColor: '#895100',
    backgroundColor: '#ffffff',
  },
  inactiveCard: {
    borderWidth: 2,
    borderColor: '#E8E0D5',
    backgroundColor: '#FFFFFF',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsContainer: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: '#1c1c18',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
    marginBottom: 4,
  },
  roleDesc: {
    fontSize: 13,
    lineHeight: 18,
    color: '#534435',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  imageCard: {
    marginTop: 48,
    borderRadius: 20,
    height: 192,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  moodImage: {
    width: '100%',
    height: '100%',
    opacity: 0.85, // combines grayscale[20%] sepia[10%] brightness-90 feel
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 96,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: 'rgba(253, 249, 243, 0.9)',
    borderTopWidth: 1,
    borderTopColor: '#E8E0D5',
    zIndex: 50,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      },
    }),
  },
  footerContainer: {
    maxWidth: 512, // matches max-w-lg exactly
    width: '100%',
    alignSelf: 'center',
  },
  continueBtn: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 20px rgba(212,130,10,0.35)',
      },
      ios: {
        shadowColor: '#D4820A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  gradientButton: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueText: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  loginText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#534435',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  loginLink: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: '#895100',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
});
