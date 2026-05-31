import React, { createContext, useContext, useState, useEffect } from 'react';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

export type UserRole = 'VENDOR' | 'LENDER' | 'BANK';

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  role: UserRole;
  selfie: string | null;
  businessPhoto: string | null;
  score: number;
  trustScoreData?: any;
  pref_loan_alerts: boolean;
  pref_emi_reminders: boolean;
  pref_overdue_alerts: boolean;
  pref_chat_notifs: boolean;
  pref_weekly_report: boolean;
  pref_biometric: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  selectedSignupRole: UserRole | null;
  signupProgress: number;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  selectRole: (role: UserRole) => void;
  signUp: (profile: Omit<UserProfile, 'id' | 'role' | 'score'>, password?: string) => Promise<boolean>;
  completeOtp: (otp: string) => Promise<boolean>;
  signOut: () => void;
  setSignupProgress: (progress: number) => void;
  updateRole?: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [selectedSignupRole, setSelectedSignupRole] = useState<UserRole | null>(null);
  const [signupProgress, setSignupProgress] = useState<number>(0.2); // step progress indicator
  const [tempProfile, setTempProfile] = useState<Omit<UserProfile, 'id' | 'role' | 'score'> | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;

  // Supabase auth state listener
  useEffect(() => {
    let profileSubscription: any = null;
    let isMounted = true;

    const fetchAndSubscribeProfile = async (userId: string, metadata: any) => {
      // Initial fetch from profiles table (source of truth)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('name, username, email, phone, role, selfie, business_photo, score, trust_score_data, pref_loan_alerts, pref_emi_reminders, pref_overdue_alerts, pref_chat_notifs, pref_weekly_report, pref_biometric')
        .eq('id', userId)
        .single();

      if (!isMounted) return;

      setUser(prev => ({
        id: userId,
        name: profileData?.name || metadata?.name || 'User',
        username: profileData?.username || metadata?.username || 'user',
        email: profileData?.email || metadata?.email || '',
        phone: profileData?.phone || metadata?.phone || '',
        role: (profileData?.role?.toUpperCase() || metadata?.role?.toUpperCase() || 'VENDOR') as UserRole,
        selfie: profileData?.selfie || metadata?.selfie || null,
        businessPhoto: profileData?.business_photo || metadata?.businessPhoto || null,
        score: profileData?.score ?? metadata?.score ?? (metadata?.role === 'VENDOR' ? 620 : 0),
        trustScoreData: profileData?.trust_score_data,
        pref_loan_alerts: profileData?.pref_loan_alerts ?? true,
        pref_emi_reminders: profileData?.pref_emi_reminders ?? true,
        pref_overdue_alerts: profileData?.pref_overdue_alerts ?? true,
        pref_chat_notifs: profileData?.pref_chat_notifs ?? true,
        pref_weekly_report: profileData?.pref_weekly_report ?? false,
        pref_biometric: profileData?.pref_biometric ?? true,
      }));
      setLoading(false);

      // Subscribe to profile changes (e.g. edge function or EMI repayment updating trust score)
      const channelName = `profile_updates_${userId}_${Date.now()}`;
      profileSubscription = supabase.channel(channelName)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, (payload) => {
          if (payload.new) {
            setUser(current => current ? {
              ...current,
              name: payload.new.name || current.name,
              selfie: payload.new.selfie || current.selfie,
              businessPhoto: payload.new.business_photo || current.businessPhoto,
              score: payload.new.score !== undefined ? payload.new.score : current.score,
              trustScoreData: payload.new.trust_score_data !== undefined ? payload.new.trust_score_data : current.trustScoreData,
              role: (payload.new.role?.toUpperCase() || current.role) as UserRole,
              pref_loan_alerts: payload.new.pref_loan_alerts ?? current.pref_loan_alerts,
              pref_emi_reminders: payload.new.pref_emi_reminders ?? current.pref_emi_reminders,
              pref_overdue_alerts: payload.new.pref_overdue_alerts ?? current.pref_overdue_alerts,
              pref_chat_notifs: payload.new.pref_chat_notifs ?? current.pref_chat_notifs,
              pref_weekly_report: payload.new.pref_weekly_report ?? current.pref_weekly_report,
              pref_biometric: payload.new.pref_biometric ?? current.pref_biometric,
            } : null);
          }
        })
        .subscribe();
    };

    // Get active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const metadata = { ...session.user.user_metadata, email: session.user.email };
        fetchAndSubscribeProfile(session.user.id, metadata);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const metadata = { ...session.user.user_metadata, email: session.user.email };
          fetchAndSubscribeProfile(session.user.id, metadata);
        } else {
          setUser(null);
          setLoading(false);
          if (profileSubscription) {
            supabase.removeChannel(profileSubscription);
          }
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      if (profileSubscription) {
        supabase.removeChannel(profileSubscription);
      }
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      return false;
    }

    return true;
  };

  const selectRole = (role: UserRole) => {
    setSelectedSignupRole(role);
    setSignupProgress(0.5);
  };

  const signUp = async (profile: Omit<UserProfile, 'id' | 'role' | 'score'>, password?: string): Promise<boolean> => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: profile.email,
      password: password || 'DefaultPassword123!',
      options: {
        data: {
          name: profile.name,
          username: profile.username,
          phone: profile.phone,
          role: selectedSignupRole || 'VENDOR',
          selfie: profile.selfie,
          businessPhoto: profile.businessPhoto,
          score: selectedSignupRole === 'VENDOR' ? 620 : 0,
        },
      },
    });

    if (error) {
      console.error('Supabase signUp error:', error.message);
      setLoading(false);
      return false;
    }

    setSignupProgress(1.0);
    return true;
  };

  const completeOtp = async (otp: string): Promise<boolean> => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (otp !== '123456') {
      setLoading(false);
      return false;
    }

    if (tempProfile && selectedSignupRole) {
      const { error } = await supabase.auth.signUp({
        email: tempProfile.email,
        password: tempPassword || 'DefaultPassword123!',
        options: {
          data: {
            name: tempProfile.name,
            username: tempProfile.username,
            phone: tempProfile.phone,
            role: selectedSignupRole,
            selfie: tempProfile.selfie,
            businessPhoto: tempProfile.businessPhoto,
            score: selectedSignupRole === 'VENDOR' ? 620 : 0,
          },
        },
      });

      if (error) {
        setLoading(false);
        return false;
      }
    } else {
      // Fallback guest signup
      const guestEmail = `guest_${Date.now()}@vendorpass.ai`;
      const { error } = await supabase.auth.signUp({
        email: guestEmail,
        password: 'GuestPassword123!',
        options: {
          data: {
            name: 'Guest Vendor',
            username: 'guest_vendor',
            phone: '9999999999',
            role: 'VENDOR',
            score: 620,
          },
        },
      });

      if (error) {
        setLoading(false);
        return false;
      }
    }

    setSignupProgress(1.0);
    setLoading(false);
    return true;
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setSelectedSignupRole(null);
    setTempProfile(null);
    setTempPassword(null);
    setSignupProgress(0.2);
    setLoading(false);
    router.replace('/(auth)/login');
  };

  const updateRole = (role: UserRole) => {
    if (user) {
      setUser({ ...user, role });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        selectedSignupRole,
        signupProgress,
        loading,
        signIn,
        selectRole,
        signUp,
        completeOtp,
        signOut,
        setSignupProgress,
        updateRole,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

