import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const SecureHybridStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (typeof window === 'undefined') {
        return null;
      }
      if (Platform.OS === 'web') {
        return AsyncStorage.getItem(key);
      }
      
      const sessionStr = await AsyncStorage.getItem(key);
      if (!sessionStr) return null;
      
      const session = JSON.parse(sessionStr);
      
      // Retrieve tokens from SecureStore
      const accessToken = await SecureStore.getItemAsync(`${key}_access`);
      const refreshToken = await SecureStore.getItemAsync(`${key}_refresh`);
      
      if (accessToken) {
        session.access_token = accessToken;
      }
      if (refreshToken) {
        session.refresh_token = refreshToken;
      }
      
      return JSON.stringify(session);
    } catch (e) {
      console.error('Error reading secure hybrid storage:', e);
      return null;
    }
  },
  
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (typeof window === 'undefined') {
        return;
      }
      if (Platform.OS === 'web') {
        return AsyncStorage.setItem(key, value);
      }
      
      const session = JSON.parse(value);
      
      // Save sensitive tokens to SecureStore
      if (session.access_token) {
        await SecureStore.setItemAsync(`${key}_access`, session.access_token);
        delete session.access_token;
      }
      if (session.refresh_token) {
        await SecureStore.setItemAsync(`${key}_refresh`, session.refresh_token);
        delete session.refresh_token;
      }
      
      // Save non-sensitive metadata to AsyncStorage
      await AsyncStorage.setItem(key, JSON.stringify(session));
    } catch (e) {
      console.error('Error writing secure hybrid storage:', e);
    }
  },
  
  removeItem: async (key: string): Promise<void> => {
    try {
      if (typeof window === 'undefined') {
        return;
      }
      if (Platform.OS === 'web') {
        return AsyncStorage.removeItem(key);
      }
      
      await SecureStore.deleteItemAsync(`${key}_access`);
      await SecureStore.deleteItemAsync(`${key}_refresh`);
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error('Error removing secure hybrid storage:', e);
    }
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SecureHybridStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
