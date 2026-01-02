import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Award,
  Flame,
  BookOpen,
  Target,
  Zap,
  Star,
  Clock,
  Trophy,
  Bookmark,
  TrendingUp,
  Check,
  Lock,
} from 'lucide-react-native';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  unlocked: boolean;
  progress?: number; // 0-100
  requirement?: string;
  unlockedAt?: string;
}

// Badge definitions
export const BADGES: Badge[] = [
  {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Save your first item',
    icon: 'bookmark',
    color: '#EC4899',
    bgColor: '#FCE7F3',
    unlocked: true,
    unlockedAt: '2024-01-15',
  },
  {
    id: 'novice',
    name: 'Novice',
    description: 'Reach Level 2',
    icon: 'star',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    unlocked: true,
    unlockedAt: '2024-01-16',
  },
  {
    id: 'collector',
    name: 'Collector',
    description: 'Save 10 items',
    icon: 'bookmark',
    color: '#10B981',
    bgColor: '#D1FAE5',
    unlocked: true,
    unlockedAt: '2024-01-18',
  },
  {
    id: 'adept',
    name: 'Adept',
    description: 'Reach Level 5',
    icon: 'trending-up',
    color: '#6366F1',
    bgColor: '#E0E7FF',
    unlocked: true,
    unlockedAt: '2024-01-20',
  },
  {
    id: 'knowledge_seeker',
    name: 'Knowledge Seeker',
    description: 'Process 25 items',
    icon: 'book',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    unlocked: true,
    unlockedAt: '2024-01-22',
  },
  {
    id: 'expert',
    name: 'Expert',
    description: 'Reach Level 10',
    icon: 'award',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    unlocked: true,
    unlockedAt: '2024-01-25',
  },
  {
    id: 'streak_starter',
    name: 'Streak Starter',
    description: 'Maintain a 3-day streak',
    icon: 'flame',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    unlocked: false,
    progress: 0,
    requirement: '3 day streak',
  },
  {
    id: 'streak_master',
    name: 'Streak Master',
    description: 'Maintain a 7-day streak',
    icon: 'flame',
    color: '#F97316',
    bgColor: '#FFEDD5',
    unlocked: false,
    progress: 0,
    requirement: '7 day streak',
  },
  {
    id: 'centurion',
    name: 'Centurion',
    description: 'Save 100 items',
    icon: 'target',
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    unlocked: false,
    progress: 88,
    requirement: '88/100 items',
  },
  {
    id: 'master',
    name: 'Master',
    description: 'Reach Level 20',
    icon: 'trophy',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    unlocked: false,
    progress: 25,
    requirement: 'Level 5/20',
  },
  {
    id: 'speed_reader',
    name: 'Speed Reader',
    description: 'Process 10 items in one day',
    icon: 'zap',
    color: '#10B981',
    bgColor: '#D1FAE5',
    unlocked: false,
    progress: 50,
    requirement: '5/10 today',
  },
  {
    id: 'domain_expert',
    name: 'Domain Expert',
    description: 'Reach Level 5 in any domain',
    icon: 'trending-up',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    unlocked: false,
    progress: 60,
    requirement: 'Technology Lvl 3',
  },
  {
    id: 'curator',
    name: 'Curator',
    description: 'Pin 20 items',
    icon: 'bookmark',
    color: '#EC4899',
    bgColor: '#FCE7F3',
    unlocked: false,
    progress: 35,
    requirement: '7/20 pinned',
  },
  {
    id: 'legend',
    name: 'Legend',
    description: 'Reach Level 50',
    icon: 'award',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    unlocked: false,
    progress: 10,
    requirement: 'Level 5/50',
  },
];

interface BadgeCardProps {
  badge: Badge;
  onPress?: (badge: Badge) => void;
  size?: 'small' | 'medium' | 'large';
}

const getIcon = (iconName: string, color: string, size: number) => {
  const props = { size, color };
  switch (iconName) {
    case 'award': return <Award {...props} />;
    case 'flame': return <Flame {...props} fill={color} />;
    case 'book': return <BookOpen {...props} />;
    case 'target': return <Target {...props} />;
    case 'zap': return <Zap {...props} fill={color} />;
    case 'star': return <Star {...props} fill={color} />;
    case 'clock': return <Clock {...props} />;
    case 'trophy': return <Trophy {...props} fill={color} />;
    case 'bookmark': return <Bookmark {...props} fill={color} />;
    case 'trending-up': return <TrendingUp {...props} />;
    default: return <Award {...props} />;
  }
};

export const BadgeCard: React.FC<BadgeCardProps> = ({
  badge,
  onPress,
  size = 'medium',
}) => {
  const dimensions = {
    small: { icon: 24, iconContainer: 44 },
    medium: { icon: 28, iconContainer: 52 },
    large: { icon: 32, iconContainer: 60 },
  }[size];

  return (
    <TouchableOpacity
      style={[
        styles.badgeCard,
        !badge.unlocked && styles.badgeCardLocked,
      ]}
      onPress={() => onPress?.(badge)}
      activeOpacity={0.7}
    >
      {/* Icon Container */}
      <View
        style={[
          styles.iconContainer,
          {
            width: dimensions.iconContainer,
            height: dimensions.iconContainer,
            backgroundColor: badge.unlocked ? badge.bgColor : '#F3F4F6',
          },
        ]}
      >
        {badge.unlocked ? (
          getIcon(badge.icon, badge.color, dimensions.icon)
        ) : (
          <Lock size={dimensions.icon} color="#9CA3AF" />
        )}
      </View>

      {/* Badge Name */}
      <Text
        style={[
          styles.badgeName,
          !badge.unlocked && styles.badgeNameLocked,
        ]}
        numberOfLines={2}
      >
        {badge.name}
      </Text>

      {/* Progress or Check */}
      {badge.unlocked ? (
        <View style={styles.unlockedBadge}>
          <Check size={10} color="#10B981" />
        </View>
      ) : badge.progress !== undefined ? (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${badge.progress}%` },
              ]}
            />
          </View>
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

interface BadgeGridProps {
  badges: Badge[];
  onBadgePress?: (badge: Badge) => void;
  showLocked?: boolean;
}

export const BadgeGrid: React.FC<BadgeGridProps> = ({
  badges,
  onBadgePress,
  showLocked = true,
}) => {
  const displayBadges = showLocked
    ? badges
    : badges.filter(b => b.unlocked);

  const unlockedCount = badges.filter(b => b.unlocked).length;

  // Split badges into rows of 3 for uniform distribution
  const rows: Badge[][] = [];
  for (let i = 0; i < displayBadges.length; i += 3) {
    rows.push(displayBadges.slice(i, i + 3));
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Award size={20} color="#F59E0B" />
          <Text style={styles.headerTitle}>Badges</Text>
        </View>
        <Text style={styles.headerCount}>
          {unlockedCount} / {badges.length}
        </Text>
      </View>

      {/* Badge Grid - Row based for uniform distribution */}
      <View style={styles.gridContainer}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.gridRow}>
            {row.map(badge => (
              <View key={badge.id} style={styles.gridItem}>
                <BadgeCard
                  badge={badge}
                  onPress={onBadgePress}
                  size="small"
                />
              </View>
            ))}
            {/* Fill empty slots in last row for alignment */}
            {row.length < 3 && Array(3 - row.length).fill(0).map((_, i) => (
              <View key={`empty-${i}`} style={styles.gridItem} />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  gridContainer: {
    gap: 10,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridItem: {
    flex: 1,
    maxWidth: '32%',
    alignItems: 'center',
  },
  badgeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    width: '100%',
  },
  badgeCardLocked: {
    opacity: 0.7,
  },
  iconContainer: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  badgeName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  badgeNameLocked: {
    color: '#9CA3AF',
  },
  unlockedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    width: '100%',
    marginTop: 4,
  },
  progressBar: {
    height: 3,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
});
