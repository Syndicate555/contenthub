import * as Haptics from 'expo-haptics';

// Haptic feedback patterns for different actions
export const HapticPatterns = {
  // Light feedback for selections and toggles
  selection: () => Haptics.selectionAsync(),
  
  // Light impact for button presses
  buttonPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  
  // Medium impact for important actions
  action: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  
  // Heavy impact for significant changes
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  
  // Success notification
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  
  // Warning notification
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  
  // Error notification
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  
  // XP earned pattern - quick double tap
  xpEarned: async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 100);
  },
  
  // Level up celebration - escalating pattern
  levelUp: async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 200);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 400);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 600);
  },
  
  // Streak maintained - warm vibration
  streak: async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 100);
  },
  
  // Badge unlocked - celebration pattern
  badgeUnlocked: async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 150);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 300);
  },
  
  // Item archived/processed
  archive: async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },
  
  // Item saved
  save: async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 100);
  },
  
  // Delete action
  delete: async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },
  
  // Swipe feedback
  swipe: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  
  // Pull to refresh
  refresh: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
};

export default HapticPatterns;
