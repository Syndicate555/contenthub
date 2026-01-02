import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
} from 'react-native';
import { TrendingUp, Zap, Flame, Star, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { UserStats } from '../types';
import { calculateLevelProgress, getXpToNextLevel } from '../utils/helpers';

interface AnimatedXPHeaderProps {
  stats: UserStats;
  onLevelUp?: (newLevel: number) => void;
  onPress?: () => void;
}

export const AnimatedXPHeader: React.FC<AnimatedXPHeaderProps> = ({
  stats,
  onLevelUp,
  onPress,
}) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const xpPulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const [displayedXP, setDisplayedXP] = useState(stats.totalXp);
  const [previousLevel, setPreviousLevel] = useState(stats.level);

  const progress = calculateLevelProgress(stats.totalXp, stats.level);
  const xpToNext = getXpToNextLevel(stats.totalXp, stats.level);

  // Animate progress bar on mount and when stats change
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  // Animate XP count up
  useEffect(() => {
    if (stats.totalXp !== displayedXP) {
      // XP changed - animate
      const diff = stats.totalXp - displayedXP;
      const steps = 20;
      const stepValue = diff / steps;
      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;
        setDisplayedXP(prev => Math.round(prev + stepValue));
        
        if (currentStep >= steps) {
          clearInterval(interval);
          setDisplayedXP(stats.totalXp);
        }
      }, 30);

      // Pulse animation
      Animated.sequence([
        Animated.timing(xpPulseAnim, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(xpPulseAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      return () => clearInterval(interval);
    }
  }, [stats.totalXp]);

  // Level up detection
  useEffect(() => {
    if (stats.level > previousLevel) {
      // Level up!
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onLevelUp?.(stats.level);
      
      // Glow animation
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }),
      ]).start();
    }
    setPreviousLevel(stats.level);
  }, [stats.level]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Glow overlay for level up */}
      <Animated.View
        style={[
          styles.glowOverlay,
          { opacity: glowOpacity },
        ]}
      />

      {/* Main Card */}
      <View style={styles.levelCard}>
        {/* Level Badge */}
        <View style={styles.levelBadge}>
          <Star size={14} color="#FCD34D" fill="#FCD34D" />
          <Text style={styles.levelBadgeText}>LVL</Text>
        </View>

        {/* Level Info */}
        <View style={styles.levelInfo}>
          <View style={styles.levelRow}>
            <Text style={styles.levelNumber}>{stats.level}</Text>
            <Animated.View style={{ transform: [{ scale: xpPulseAnim }] }}>
              <View style={styles.xpBadge}>
                <Zap size={14} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.xpText}>{displayedXP.toLocaleString()}</Text>
              </View>
            </Animated.View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  { width: progressWidth },
                ]}
              />
              <View style={styles.progressShine} />
            </View>
            <Text style={styles.progressText}>
              {xpToNext} XP to Level {stats.level + 1}
            </Text>
          </View>
        </View>

        {/* Streak Badge */}
        <View style={styles.streakContainer}>
          <View style={[
            styles.streakBadge,
            stats.currentStreak > 0 ? styles.streakActive : styles.streakInactive,
          ]}>
            <Flame
              size={18}
              color={stats.currentStreak > 0 ? '#EF4444' : '#9CA3AF'}
              fill={stats.currentStreak > 0 ? '#EF4444' : 'transparent'}
            />
            <Text style={[
              styles.streakText,
              stats.currentStreak > 0 ? styles.streakTextActive : styles.streakTextInactive,
            ]}>
              {stats.currentStreak}
            </Text>
          </View>
          <Text style={styles.streakLabel}>Streak</Text>
        </View>

        {/* Arrow */}
        <ChevronRight size={20} color="#6B7280" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FCD34D',
    borderRadius: 16,
  },
  levelCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  levelBadge: {
    backgroundColor: '#374151',
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    marginTop: 2,
  },
  levelInfo: {
    flex: 1,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  levelNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  xpText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  progressContainer: {
    gap: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  streakContainer: {
    alignItems: 'center',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  streakActive: {
    backgroundColor: '#FEE2E2',
  },
  streakInactive: {
    backgroundColor: '#374151',
  },
  streakText: {
    fontSize: 16,
    fontWeight: '700',
  },
  streakTextActive: {
    color: '#EF4444',
  },
  streakTextInactive: {
    color: '#9CA3AF',
  },
  streakLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
});
