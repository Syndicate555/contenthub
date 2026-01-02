import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { 
  Sparkles, 
  ArrowRight,
  Zap,
  Trophy,
  Brain,
  BookOpen,
  Shield,
  Globe,
  Play,
} from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import storage from '../../utils/storage';
import Animated, { 
  FadeInDown, 
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

WebBrowser.maybeCompleteAuthSession();

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// API and storage constants
const API_BASE_URL = 'https://www.tavlo.ca';
const DEMO_TOKEN_KEY = 'tavlo_demo_token';
const DEMO_EXPIRES_KEY = 'tavlo_demo_expires';
const DEMO_MODE_KEY = 'tavlo_demo_mode';

// Brand colors
const COLORS = {
  primary: '#1F2937',
  accent: '#3B82F6',
  accentLight: '#60A5FA',
  success: '#10B981',
  warning: '#F59E0B',
  purple: '#8B5CF6',
  background: '#FFFFFF',
  surface: '#F9FAFB',
  text: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#E5E7EB',
  google: '#4285F4',
};

export default function SignInScreen() {
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  // Animation values
  const pulseValue = useSharedValue(1);
  const glowValue = useSharedValue(0.3);
  
  React.useEffect(() => {
    pulseValue.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      true
    );
    glowValue.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 1500 }),
        withTiming(0.3, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));

  // Google OAuth Sign In
  const handleGoogleSignIn = useCallback(async () => {
    setGoogleLoading(true);
    try {
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL('/(tabs)', { scheme: 'frontend' }),
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      console.error('Google sign in error:', err);
      Alert.alert(
        'Sign In Failed', 
        err.message || 'Unable to sign in with Google. Please try again.'
      );
    } finally {
      setGoogleLoading(false);
    }
  }, [startOAuthFlow, router]);

  // Demo mode - call the backend API directly (self-contained)
  const handleDemoMode = async () => {
    console.log('[SignIn] ========== Demo mode button pressed ==========');
    console.log('[SignIn] Platform:', Platform.OS);
    
    if (demoLoading) {
      console.log('[SignIn] Already loading, ignoring press');
      return;
    }
    
    setDemoLoading(true);
    
    try {
      console.log('[SignIn] Calling demo session API at:', `${API_BASE_URL}/api/demo/session`);
      
      const response = await fetch(`${API_BASE_URL}/api/demo/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      console.log('[SignIn] Demo API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[SignIn] Demo API error:', errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[SignIn] Demo API success, token length:', data.token?.length);

      if (!data.ok || !data.token) {
        throw new Error('Invalid response from demo server');
      }

      // Store token using cross-platform storage
      console.log('[SignIn] Storing demo token...');
      await storage.setItem(DEMO_TOKEN_KEY, data.token);
      await storage.setItem(DEMO_MODE_KEY, 'true');
      
      if (data.expiresAt) {
        await storage.setItem(DEMO_EXPIRES_KEY, data.expiresAt);
      }

      console.log('[SignIn] Demo session created, navigating to tabs...');
      
      // Navigate to main app
      router.replace('/(tabs)');
      
    } catch (err: any) {
      console.error('[SignIn] Demo mode error:', err);
      
      // Check if it's a CORS/network error on web
      const isWebCorsError = Platform.OS === 'web' && 
        (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'));
      
      if (isWebCorsError) {
        Alert.alert(
          'Demo Mode - Web Preview',
          'Demo mode is currently available on the mobile app only due to browser security restrictions.\n\nPlease use Expo Go on your mobile device to test the demo mode, or sign in with Google to use the web version.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Demo Mode Unavailable',
          err.message || 'Unable to connect to demo server. Please try again later.'
        );
      }
    } finally {
      setDemoLoading(false);
    }
  };

  const features = [
    { icon: BookOpen, text: 'Save from any platform', color: COLORS.success },
    { icon: Trophy, text: 'Earn XP & level up', color: COLORS.warning },
    { icon: Brain, text: 'AI-powered insights', color: COLORS.purple },
    { icon: Zap, text: 'Build knowledge fast', color: COLORS.accent },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <Animated.View 
          entering={FadeInDown.duration(700).delay(100)}
          style={styles.heroSection}
        >
          {/* Logo */}
          <Animated.View style={[styles.logoWrapper, logoAnimatedStyle]}>
            <View style={styles.logoGlow} />
            <View style={styles.logo}>
              <Text style={styles.logoText}>T</Text>
            </View>
          </Animated.View>

          {/* Brand Name */}
          <Text style={styles.brandName}>Tavlo</Text>
          <Text style={styles.tagline}>Your gamified second brain</Text>
          
          {/* Stats Preview */}
          <View style={styles.statsPreview}>
            <View style={styles.statItem}>
              <Zap size={16} color={COLORS.warning} />
              <Text style={styles.statText}>10K+ saves</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Trophy size={16} color={COLORS.accent} />
              <Text style={styles.statText}>Level up daily</Text>
            </View>
          </View>
        </Animated.View>

        {/* Sign In Card */}
        <Animated.View 
          entering={FadeInUp.duration(700).delay(300)}
          style={styles.signInCard}
        >
          <Text style={styles.cardTitle}>Get Started</Text>
          <Text style={styles.cardSubtitle}>
            Sign in to sync your content across devices
          </Text>

          {/* Google Sign In Button */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            disabled={googleLoading}
            activeOpacity={0.9}
          >
            {googleLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <View style={styles.googleIconContainer}>
                  <Text style={styles.googleIconText}>G</Text>
                </View>
                <Text style={styles.googleButtonText}>Continue with Google</Text>
                <ArrowRight size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          {/* Security Note */}
          <View style={styles.securityNote}>
            <Shield size={14} color={COLORS.success} />
            <Text style={styles.securityText}>
              Secure sign-in powered by Clerk
            </Text>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Demo Mode Button */}
          <TouchableOpacity
            style={[styles.demoButton, demoLoading && styles.demoButtonLoading]}
            onPress={handleDemoMode}
            disabled={demoLoading || googleLoading}
            activeOpacity={0.8}
          >
            {demoLoading ? (
              <>
                <ActivityIndicator size="small" color={COLORS.accent} />
                <View style={styles.demoTextContainer}>
                  <Text style={styles.demoButtonText}>Setting up demo...</Text>
                  <Text style={styles.demoSubtext}>Please wait</Text>
                </View>
              </>
            ) : (
              <>
                <Play size={18} color={COLORS.accent} fill={COLORS.accent} />
                <View style={styles.demoTextContainer}>
                  <Text style={styles.demoButtonText}>Try Demo Mode</Text>
                  <Text style={styles.demoSubtext}>Explore without signing in</Text>
                </View>
                <ArrowRight size={18} color={COLORS.textTertiary} />
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Features Section */}
        <Animated.View 
          entering={FadeInUp.duration(700).delay(500)}
          style={styles.featuresSection}
        >
          <Text style={styles.featuresTitle}>Why Tavlo?</Text>
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <Animated.View 
                key={index} 
                entering={FadeInUp.duration(500).delay(600 + index * 100)}
                style={styles.featureCard}
              >
                <View style={[styles.featureIconBg, { backgroundColor: feature.color + '15' }]}>
                  <feature.icon size={20} color={feature.color} />
                </View>
                <Text style={styles.featureText}>{feature.text}</Text>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Footer */}
        <Animated.View 
          entering={FadeInUp.duration(700).delay(900)}
          style={styles.footer}
        >
          <Globe size={16} color={COLORS.textTertiary} />
          <Text style={styles.footerText}>
            Built for learners, creators, and knowledge collectors
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 48,
    marginBottom: 32,
  },
  logoWrapper: {
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: COLORS.accent,
    opacity: 0.15,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  logoText: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  brandName: {
    fontSize: 44,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 17,
    color: COLORS.textSecondary,
    marginTop: 8,
    fontWeight: '500',
  },
  statsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 30,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: COLORS.border,
  },
  signInCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 12,
  },
  googleIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.google,
  },
  googleButtonText: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 6,
  },
  securityText: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 13,
    color: COLORS.textTertiary,
    fontWeight: '500',
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  demoButtonLoading: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.accent + '30',
  },
  demoTextContainer: {
    flex: 1,
  },
  demoButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  demoSubtext: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  featuresSection: {
    marginTop: 36,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: (SCREEN_WIDTH - 60) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  featureIconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 36,
    paddingHorizontal: 20,
    gap: 8,
  },
  footerText: {
    fontSize: 13,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
});
