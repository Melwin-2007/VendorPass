import React, { createContext, useContext, useState, useEffect } from 'react';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

export type UserRole = 'VENDOR' | 'LENDER' | 'BANK';

export interface UserProfile {
  name: string;
  username: string;
  email: string;
  phone: string;
  role: UserRole;
  selfie: string | null;
  businessPhoto: string | null;
  score: number;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  selectedSignupRole: UserRole | null;
  signupProgress: number;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  selectRole: (role: UserRole) => void;
  signUp: (profile: Omit<UserProfile, 'role' | 'score'>, password?: string) => Promise<boolean>;
  completeOtp: (otp: string) => Promise<boolean>;
  signOut: () => void;
  setSignupProgress: (progress: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [selectedSignupRole, setSelectedSignupRole] = useState<UserRole | null>(null);
  const [signupProgress, setSignupProgress] = useState<number>(0.2); // step progress indicator
  const [tempProfile, setTempProfile] = useState<Omit<UserProfile, 'role' | 'score'> | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;

  // Supabase auth state listener
  useEffect(() => {
    // Get active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const metadata = session.user.user_metadata;
        setUser({
          name: metadata?.name || session.user.email?.split('@')[0] || 'User',
          username: metadata?.username || 'user',
          email: session.user.email || '',
          phone: metadata?.phone || '',
          role: (metadata?.role as UserRole) || 'VENDOR',
          selfie: metadata?.selfie || null,
          businessPhoto: metadata?.businessPhoto || null,
          score: metadata?.score || (metadata?.role === 'VENDOR' ? 620 : 0),
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const metadata = session.user.user_metadata;
          setUser({
            name: metadata?.name || session.user.email?.split('@')[0] || 'User',
            username: metadata?.username || 'user',
            email: session.user.email || '',
            phone: metadata?.phone || '',
            role: (metadata?.role as UserRole) || 'VENDOR',
            selfie: metadata?.selfie || null,
            businessPhoto: metadata?.businessPhoto || null,
            score: metadata?.score || (metadata?.role === 'VENDOR' ? 620 : 0),
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
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

    setLoading(false);
    return true;
  };

  const selectRole = (role: UserRole) => {
    setSelectedSignupRole(role);
    setSignupProgress(0.5);
  };

  const signUp = async (profile: Omit<UserProfile, 'role' | 'score'>, password?: string): Promise<boolean> => {
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
    setLoading(false);
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

