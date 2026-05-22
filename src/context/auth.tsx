import React, { createContext, useContext, useState, useEffect } from 'react';
import { router } from 'expo-router';

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
  signUp: (profile: Omit<UserProfile, 'role' | 'score'>) => Promise<boolean>;
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
  const [loading, setLoading] = useState(false);

  const isAuthenticated = !!user;

  // Mock initial load/splash transition helper
  useEffect(() => {
    // Check if there is any cached user (mocked)
  }, []);

  const signIn = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Simple validation
    if (!email || !password) {
      setLoading(false);
      return false;
    }

    // Default mock user
    const mockUser: UserProfile = {
      name: 'Ramesh Kumar',
      username: 'ramesh_kirana',
      email: email,
      phone: '9876543210',
      role: 'VENDOR',
      selfie: null,
      businessPhoto: null,
      score: 742, // TrustScore
    };

    setUser(mockUser);
    setLoading(false);
    return true;
  };

  const selectRole = (role: UserRole) => {
    setSelectedSignupRole(role);
    setSignupProgress(0.5);
  };

  const signUp = async (profile: Omit<UserProfile, 'role' | 'score'>): Promise<boolean> => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setTempProfile(profile);
    setSignupProgress(0.8);
    setLoading(false);
    return true;
  };

  const completeOtp = async (otp: string): Promise<boolean> => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));

    if (otp !== '123456') {
      // Mock valid OTP is 123456
      setLoading(false);
      return false;
    }

    if (tempProfile && selectedSignupRole) {
      const newUser: UserProfile = {
        ...tempProfile,
        role: selectedSignupRole,
        score: selectedSignupRole === 'VENDOR' ? 620 : 0, // Starts at 620 for vendor
      };
      setUser(newUser);
    } else {
      // Fallback
      setUser({
        name: 'Guest Vendor',
        username: 'guest_vendor',
        email: 'guest@vendorpass.ai',
        phone: '9999999999',
        role: 'VENDOR',
        selfie: null,
        businessPhoto: null,
        score: 620,
      });
    }

    setSignupProgress(1.0);
    setLoading(false);
    return true;
  };

  const signOut = () => {
    setUser(null);
    setSelectedSignupRole(null);
    setTempProfile(null);
    setSignupProgress(0.2);
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
