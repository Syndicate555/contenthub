import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Cross-platform secure storage utility
 * Uses SecureStore on native (iOS/Android) and localStorage on web
 */

const isWeb = Platform.OS === 'web';

export const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (isWeb) {
        // Use localStorage on web
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
        return null;
      } else {
        // Use SecureStore on native
        return await SecureStore.getItemAsync(key);
      }
    } catch (error) {
      console.error(`[Storage] Error getting item ${key}:`, error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (isWeb) {
        // Use localStorage on web
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      } else {
        // Use SecureStore on native
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error(`[Storage] Error setting item ${key}:`, error);
    }
  },

  async deleteItem(key: string): Promise<void> {
    try {
      if (isWeb) {
        // Use localStorage on web
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
      } else {
        // Use SecureStore on native
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error(`[Storage] Error deleting item ${key}:`, error);
    }
  },
};

export default storage;
