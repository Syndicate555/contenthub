import React, { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { toastConfig } from '../components/Toast';
import AnimatedSplashScreen from '../components/AnimatedSplashScreen';
import { DemoProvider } from '../contexts/DemoContext';

import '../global.css';

// ============================================
// MODULE-LEVEL FLAG - persists across re-renders and remounts
// This ensures splash screen only shows ONCE per app session
// ============================================
let SPLASH_HAS_BEEN_SHOWN = false;

// Clerk publishable key from environment
const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  console.warn('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is not set. Authentication will fail.');
}

// Token cache for Clerk using SecureStore
const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

// React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

// Inner app content with auth sync
function AppContent() {
  // Sync Clerk token with API service
  const { useAuthSync } = require('../hooks/useAuth');
  useAuthSync();

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="item/[id]" 
          options={{ 
            headerShown: false,
            presentation: 'card',
            animation: 'slide_from_right',
          }} 
        />
      </Stack>
      <Toast config={toastConfig} />
    </>
  );
}

export default function RootLayout() {
  // Check module-level flag FIRST - if splash was already shown, skip it entirely
  const [showSplash, setShowSplash] = useState(() => {
    if (SPLASH_HAS_BEEN_SHOWN) {
      return false; // Don't show splash if it was already shown
    }
    return true; // Show splash for the first time
  });

  const handleSplashFinish = () => {
    SPLASH_HAS_BEEN_SHOWN = true; // Mark as shown at module level
    setShowSplash(false);
  };

  // Handle missing Clerk key
  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <View style={styles.errorContainer}>
        <ActivityIndicator size="large" color="#EF4444" />
      </View>
    );
  }

  // Show splash screen ONLY if it hasn't been shown before
  if (showSplash && !SPLASH_HAS_BEEN_SHOWN) {
    return <AnimatedSplashScreen onFinish={handleSplashFinish} />;
  }

  // Show main app
  return (
    <GestureHandlerRootView style={styles.container}>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
        <QueryClientProvider client={queryClient}>
          <DemoProvider>
            <ClerkLoaded>
              <AppContent />
            </ClerkLoaded>
          </DemoProvider>
        </QueryClientProvider>
      </ClerkProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
