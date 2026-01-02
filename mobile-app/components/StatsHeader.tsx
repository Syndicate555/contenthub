import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Flame, Zap, TrendingUp } from 'lucide-react-native';
import { UserStats } from '../types';
import { calculateLevelProgress, getXpToNextLevel } from '../utils/helpers';

interface StatsHeaderProps {
  stats: UserStats;
}

export const StatsHeader: React.FC<StatsHeaderProps> = ({ stats }) => {
  const progress = calculateLevelProgress(stats.totalXp, stats.level);
  const xpToNext = getXpToNextLevel(stats.totalXp, stats.level);

  return (
    <View style={styles.container}>
      {/* Level Progress Card */}
      <View style={styles.levelCard}>
        <View style={styles.levelHeader}>
          <View>
            <Text style={styles.levelTitle}>Level {stats.level}</Text>
            <Text style={styles.xpText}>{stats.totalXp.toLocaleString()} Total XP</Text>
          </View>
          <View style={styles.levelBadge}>
            <TrendingUp size={16} color="#fff" />
          </View>
        </View>
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{xpToNext} XP to Level {stats.level + 1}</Text>
        </View>
      </View>

      {/* Quick Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: '#FEE2E2' }]}>
            <Flame size={18} color="#EF4444" />
          </View>
          <View>
            <Text style={styles.statValue}>{stats.currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
            <Zap size={18} color="#F59E0B" fill="#F59E0B" />
          </View>
          <View>
            <Text style={styles.statValue}>{stats.totalXp.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  levelCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  levelTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  xpText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  levelBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    gap: 6,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  divider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
});
