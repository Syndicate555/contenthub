import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';

export default function Index() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/sign-in');
      }
    }
  }, [isLoaded, isSignedIn]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#3B82F6" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
