import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Modal } from 'react-native';
// TEMPORARILY DISABLED FOR EXPO GO COMPATIBILITY
// import ConfettiCannon from 'react-native-confetti-cannon';
import * as Haptics from 'expo-haptics';
import { Star, Trophy, TrendingUp } from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface LevelUpCelebrationRef {
  celebrate: (newLevel: number) => void;
}

interface LevelUpCelebrationProps {
  onComplete?: () => void;
}

export const LevelUpCelebration = forwardRef<LevelUpCelebrationRef, LevelUpCelebrationProps>(
  ({ onComplete }, ref) => {
    // TEMPORARILY DISABLED FOR EXPO GO COMPATIBILITY
    // const confettiRef = useRef<ConfettiCannon>(null);
    const [visible, setVisible] = React.useState(false);
    const [level, setLevel] = React.useState(1);

    useImperativeHandle(ref, () => ({
      celebrate: (newLevel: number) => {
        setLevel(newLevel);
        setVisible(true);

        // Trigger confetti - DISABLED FOR EXPO GO
        // setTimeout(() => {
        //   confettiRef.current?.start();
        // }, 100);

        // Haptic celebration
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }, 200);
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }, 400);

        // Auto-dismiss after animation
        setTimeout(() => {
          setVisible(false);
          onComplete?.();
        }, 3500);
      },
    }));

    if (!visible) return null;

    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          {/* Confetti - DISABLED FOR EXPO GO COMPATIBILITY */}
          {/* <ConfettiCannon
            ref={confettiRef}
            count={150}
            origin={{ x: SCREEN_WIDTH / 2, y: -20 }}
            fadeOut
            explosionSpeed={400}
            fallSpeed={2500}
            colors={['#FCD34D', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899']}
          /> */}

          {/* Celebration Card */}
          <View style={styles.card}>
            {/* Trophy Icon */}
            <View style={styles.trophyContainer}>
              <View style={styles.trophyGlow} />
              <View style={styles.trophyBadge}>
                <Trophy size={40} color="#F59E0B" fill="#F59E0B" />
              </View>
            </View>

            {/* Level Up Text */}
            <Text style={styles.levelUpText}>LEVEL UP!</Text>

            {/* New Level */}
            <View style={styles.levelContainer}>
              <View style={styles.levelBadge}>
                <Star size={16} color="#FCD34D" fill="#FCD34D" />
                <Text style={styles.levelNumber}>{level}</Text>
              </View>
            </View>

            {/* Subtitle */}
            <Text style={styles.subtitle}>
              You're making incredible progress!
            </Text>

            {/* Stats Unlocked */}
            <View style={styles.unlockContainer}>
              <TrendingUp size={16} color="#10B981" />
              <Text style={styles.unlockText}>
                +50 XP bonus earned
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: SCREEN_WIDTH - 64,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  trophyContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  trophyGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FEF3C7',
    top: -10,
    left: -10,
  },
  trophyBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FCD34D',
  },
  levelUpText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: 2,
    marginBottom: 12,
  },
  levelContainer: {
    marginBottom: 16,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
  },
  levelNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  unlockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  unlockText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
});
