import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Easing,
} from 'react-native';
import { 
  Twitter, 
  Youtube, 
  Linkedin, 
  Instagram, 
  MessageCircle,
  Music2,
  Mail,
  Globe,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Brand colors
const COLORS = {
  background: '#0F172A',
  accent: '#3B82F6',
  accentLight: '#60A5FA',
  white: '#FFFFFF',
  twitter: '#1DA1F2',
  youtube: '#FF0000',
  linkedin: '#0A66C2',
  instagram: '#E4405F',
  reddit: '#FF4500',
  tiktok: '#000000',
  newsletter: '#059669',
  web: '#8B5CF6',
};

// Platform configurations with carefully calculated positions
const PLATFORMS = [
  { Icon: Twitter, color: COLORS.twitter, delay: 0, x: -65, y: -40, rotation: -12 },
  { Icon: Linkedin, color: COLORS.linkedin, delay: 150, x: -20, y: -20, rotation: 8 },
  { Icon: Youtube, color: COLORS.youtube, delay: 300, x: 40, y: -50, rotation: -5 },
  { Icon: Instagram, color: COLORS.instagram, delay: 450, x: 75, y: -15, rotation: 10 },
  { Icon: MessageCircle, color: COLORS.reddit, delay: 600, x: -55, y: 25, rotation: 15 },
  { Icon: Mail, color: COLORS.newsletter, delay: 750, x: -5, y: 40, rotation: -8 },
  { Icon: Music2, color: COLORS.tiktok, delay: 900, x: 50, y: 20, rotation: 12 },
  { Icon: Globe, color: COLORS.web, delay: 1050, x: 20, y: 55, rotation: -10 },
];

interface Props {
  onFinish: () => void;
}

// Individual Falling Logo - optimized for smooth animation
const FallingLogo = ({ 
  Icon, 
  color, 
  delay, 
  targetX, 
  targetY,
  rotation,
}: {
  Icon: any;
  color: string;
  delay: number;
  targetX: number;
  targetY: number;
  rotation: number;
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.spring(animatedValue, {
        toValue: 1,
        tension: 35,  // Slower, more relaxed spring
        friction: 10, // More damping for smoother settle
        useNativeDriver: true,
      }).start();
    }, delay);

    return () => clearTimeout(timer);
  }, []);

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_HEIGHT * 0.4, targetY],
  });

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [targetX * 0.3, targetX],
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 1, 1],
  });

  const scale = animatedValue.interpolate({
    inputRange: [0, 0.5, 0.8, 1],
    outputRange: [0.3, 1.1, 0.95, 1],
  });

  const rotate = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [`${rotation * 2}deg`, `${rotation}deg`],
  });

  return (
    <Animated.View
      style={[
        styles.fallingLogo,
        {
          opacity,
          transform: [
            { translateX },
            { translateY },
            { scale },
            { rotate },
          ],
        },
      ]}
    >
      <View style={[styles.logoCircle, { backgroundColor: color }]}>
        <Icon size={20} color="#FFFFFF" strokeWidth={2.5} />
      </View>
    </Animated.View>
  );
};

export default function AnimatedSplashScreen({ onFinish }: Props) {
  // Single animated value for coordinated animations
  const mainProgress = useRef(new Animated.Value(0)).current;
  const tavloProgress = useRef(new Animated.Value(0)).current;
  const textProgress = useRef(new Animated.Value(0)).current;
  const taglineProgress = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;
  
  const animationStarted = useRef(false);

  useEffect(() => {
    if (animationStarted.current) return;
    animationStarted.current = true;

    // Timeline:
    // 0ms - 1800ms: Social logos fall (staggered, 150ms apart)
    // 2200ms: Tavlo logo AND "Tavlo" text appear together
    // 3200ms: Tagline appears
    // 5500ms: Start fade out
    // 6000ms: Complete

    // Tavlo logo AND text animation - appear together
    setTimeout(() => {
      Animated.spring(tavloProgress, {
        toValue: 1,
        tension: 40,
        friction: 9,
        useNativeDriver: true,
      }).start();
      
      Animated.spring(textProgress, {
        toValue: 1,
        tension: 35,
        friction: 10,
        useNativeDriver: true,
      }).start();
    }, 2200);

    // Tagline animation
    setTimeout(() => {
      Animated.timing(taglineProgress, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, 3200);

    // Fade out and finish
    setTimeout(() => {
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 500,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, 5500);
  }, []);

  // Tavlo logo animations
  const tavloTranslateY = tavloProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 0],
  });

  const tavloScale = tavloProgress.interpolate({
    inputRange: [0, 0.5, 0.8, 1],
    outputRange: [0.5, 1.15, 0.95, 1],
  });

  const tavloOpacity = tavloProgress.interpolate({
    inputRange: [0, 0.3],
    outputRange: [0, 1],
  });

  // Text animations
  const textTranslateY = textProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [40, 0],
  });

  const textOpacity = textProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const textScale = textProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 1.05, 1],
  });

  // Tagline animations
  const taglineOpacity = taglineProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const taglineTranslateY = taglineProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeOut }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      {/* Social Media Logos Area */}
      <View style={styles.logosContainer}>
        {PLATFORMS.map((platform, index) => (
          <FallingLogo
            key={index}
            Icon={platform.Icon}
            color={platform.color}
            delay={platform.delay}
            targetX={platform.x}
            targetY={platform.y}
            rotation={platform.rotation}
          />
        ))}
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Tavlo Logo */}
        <Animated.View
          style={[
            styles.tavloLogoContainer,
            {
              opacity: tavloOpacity,
              transform: [
                { translateY: tavloTranslateY },
                { scale: tavloScale },
              ],
            },
          ]}
        >
          <View style={styles.tavloLogo}>
            <Text style={styles.tavloLogoText}>T</Text>
          </View>
        </Animated.View>

        {/* Brand Name - with more spacing */}
        <Animated.View
          style={[
            styles.brandNameContainer,
            {
              opacity: textOpacity,
              transform: [
                { translateY: textTranslateY },
                { scale: textScale },
              ],
            },
          ]}
        >
          <Text style={styles.brandName}>Tavlo</Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.View
          style={[
            styles.taglineContainer,
            {
              opacity: taglineOpacity,
              transform: [{ translateY: taglineTranslateY }],
            },
          ]}
        >
          <Text style={styles.tagline}>Your personal social media collection</Text>
        </Animated.View>
      </View>

      {/* Bottom Accent Dots */}
      <View style={styles.bottomDots}>
        {[COLORS.twitter, COLORS.youtube, COLORS.accent, COLORS.instagram, COLORS.linkedin].map((color, i) => (
          <View key={i} style={[styles.dot, { backgroundColor: color }]} />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  logosContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.18,
    left: 0,
    right: 0,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallingLogo: {
    position: 'absolute',
  },
  logoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SCREEN_HEIGHT * 0.08,
  },
  tavloLogoContainer: {
    marginBottom: 32, // Increased spacing
  },
  tavloLogo: {
    width: 120,
    height: 120,
    borderRadius: 32,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  tavloLogoText: {
    fontSize: 64,
    fontWeight: '800',
    color: COLORS.background,
    letterSpacing: -2,
  },
  brandNameContainer: {
    marginBottom: 16,
  },
  brandName: {
    fontSize: 52,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -1,
    textShadowColor: 'rgba(59, 130, 246, 0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 20,
  },
  taglineContainer: {
    marginTop: 4,
  },
  tagline: {
    fontSize: 17,
    fontWeight: '500',
    color: COLORS.accentLight,
    letterSpacing: 0.3,
  },
  bottomDots: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.8,
  },
});
