import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import {
  User,
  Trophy,
  Flame,
  Bookmark,
  Star,
  Settings,
  ChevronRight,
  LogOut,
  TrendingUp,
  X,
} from 'lucide-react-native';
import { mockUserStats } from '../../utils/mockData';
import { calculateLevelProgress, getXpToNextLevel } from '../../utils/helpers';
import { BadgeGrid, BadgeCard, BADGES, Badge } from '../../components/BadgeSystem';
import HapticPatterns from '../../utils/haptics';

// Light theme colors
const COLORS = {
  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceSecondary: '#F3F4F6',
  text: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#E5E7EB',
  primary: '#1F2937',
  accent: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
};

export default function ProfileScreen() {
  const { signOut, isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  const stats = mockUserStats;
  const progress = calculateLevelProgress(stats.totalXp, stats.level);
  const xpToNext = getXpToNextLevel(stats.totalXp, stats.level);

  const handleSignOut = async () => {
    await HapticPatterns.warning();
    if (isSignedIn) {
      await signOut();
    }
    router.replace('/(auth)/sign-in');
  };

  const handleBadgePress = (badge: Badge) => {
    HapticPatterns.selection();
    setSelectedBadge(badge);
  };

  const quickStats = [
    { icon: Trophy, label: 'Badges Earned', value: BADGES.filter(b => b.unlocked).length.toString(), color: '#F59E0B' },
    { icon: Flame, label: 'Current Streak', value: `${stats.currentStreak} days`, color: '#EF4444' },
    { icon: Bookmark, label: 'Items Saved', value: '88', color: '#3B82F6' },
    { icon: Star, label: 'Reflections', value: '0', color: '#8B5CF6' },
  ];

  const domainProgress = [
    { name: 'Technology', level: 3, xp: 465, items: 31, progress: 86, color: '#3B82F6', isTop: true },
    { name: 'Productivity', level: 2, xp: 120, items: 8, progress: 13, color: '#F59E0B' },
    { name: 'Finance', level: 1, xp: 45, items: 3, progress: 45, color: '#10B981' },
    { name: 'Health', level: 1, xp: 30, items: 2, progress: 30, color: '#EF4444' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Level Card */}
        <View style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <View>
              <View style={styles.levelTitleRow}>
                <Star size={20} color="#FCD34D" fill="#FCD34D" />
                <Text style={styles.levelTitle}>Level {stats.level}</Text>
              </View>
              <Text style={styles.xpSubtitle}>{stats.totalXp.toLocaleString()} Total XP</Text>
            </View>
            <View style={styles.itemsProcessed}>
              <Text style={styles.itemsNumber}>88</Text>
              <Text style={styles.itemsLabel}>Items Processed</Text>
            </View>
          </View>
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressText}>{xpToNext} XP to Level {stats.level + 1}</Text>
              <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          {quickStats.map((stat, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.statCard}
              onPress={() => HapticPatterns.buttonPress()}
              activeOpacity={0.7}
            >
              <stat.icon size={22} color={stat.color} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Domain Progress */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Domain Progress</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {domainProgress.map((domain, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.domainCard}
              onPress={() => HapticPatterns.buttonPress()}
              activeOpacity={0.7}
            >
              <View style={styles.domainHeader}>
                <View style={styles.domainInfo}>
                  <View style={[styles.domainIcon, { backgroundColor: domain.color + '20' }]}>
                    <TrendingUp size={18} color={domain.color} />
                  </View>
                  <View>
                    <View style={styles.domainTitleRow}>
                      <Text style={styles.domainName}>{domain.name}</Text>
                      {domain.isTop && (
                        <View style={styles.topBadge}>
                          <Star size={10} color="#F59E0B" fill="#F59E0B" />
                          <Text style={styles.topBadgeText}>Top</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.domainItems}>{domain.items} items · {domain.xp} XP</Text>
                  </View>
                </View>
                <View style={styles.domainLevel}>
                  <Text style={[styles.levelValue, { color: domain.color }]}>Lvl {domain.level}</Text>
                </View>
              </View>
              <View style={styles.domainProgressBar}>
                <View
                  style={[
                    styles.domainProgressFill,
                    { width: `${domain.progress}%`, backgroundColor: domain.color },
                  ]}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Badges Section */}
        <View style={styles.section}>
          <View style={styles.badgesContainer}>
            <BadgeGrid 
              badges={BADGES} 
              onBadgePress={handleBadgePress}
            />
          </View>
        </View>

        {/* Profile Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.profileCard}>
            <View style={styles.profileRow}>
              <View style={styles.avatarContainer}>
                {user?.imageUrl ? (
                  <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <User size={24} color={COLORS.textTertiary} />
                  </View>
                )}
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {user?.fullName || 'Demo User'}
                </Text>
                <Text style={styles.profileEmail}>
                  {user?.primaryEmailAddress?.emailAddress || 'demo@tavlo.app'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              HapticPatterns.buttonPress();
              router.push('/settings');
            }}
          >
            <View style={styles.menuItemLeft}>
              <Settings size={20} color={COLORS.textSecondary} />
              <Text style={styles.menuItemText}>Settings</Text>
            </View>
            <ChevronRight size={20} color={COLORS.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItemDanger} 
            onPress={handleSignOut}
          >
            <LogOut size={20} color={COLORS.error} />
            <Text style={styles.menuItemTextDanger}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Badge Detail Modal */}
      <Modal
        visible={selectedBadge !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedBadge(null)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedBadge(null)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.modalClose}
              onPress={() => setSelectedBadge(null)}
            >
              <X size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
            
            {selectedBadge && (
              <>
                <BadgeCard badge={selectedBadge} size="large" />
                <Text style={styles.modalTitle}>{selectedBadge.name}</Text>
                <Text style={styles.modalDescription}>{selectedBadge.description}</Text>
                
                {selectedBadge.unlocked ? (
                  <View style={styles.unlockedInfo}>
                    <Text style={styles.unlockedText}>Unlocked</Text>
                    {selectedBadge.unlockedAt && (
                      <Text style={styles.unlockedDate}>
                        {new Date(selectedBadge.unlockedAt).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                ) : (
                  <View style={styles.lockedInfo}>
                    <Text style={styles.lockedText}>Locked</Text>
                    {selectedBadge.requirement && (
                      <Text style={styles.requirementText}>{selectedBadge.requirement}</Text>
                    )}
                    {selectedBadge.progress !== undefined && (
                      <View style={styles.modalProgress}>
                        <View style={styles.modalProgressBar}>
                          <View 
                            style={[
                              styles.modalProgressFill,
                              { width: `${selectedBadge.progress}%` }
                            ]} 
                          />
                        </View>
                        <Text style={styles.modalProgressText}>{selectedBadge.progress}%</Text>
                      </View>
                    )}
                  </View>
                )}
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  levelCard: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#1F2937',
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  levelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  xpSubtitle: {
    fontSize: 14,
    marginTop: 4,
    color: '#9CA3AF',
  },
  itemsProcessed: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#374151',
  },
  itemsNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  itemsLabel: {
    fontSize: 10,
    marginTop: 2,
    color: '#9CA3AF',
  },
  progressSection: {
    marginTop: 8,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: '#374151',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 5,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  statCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
    color: COLORS.textSecondary,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: COLORS.text,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.accent,
  },
  domainCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    backgroundColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  domainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  domainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  domainIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  domainTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  domainName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
    backgroundColor: COLORS.warningLight,
  },
  topBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#92400E',
  },
  domainItems: {
    fontSize: 12,
    marginTop: 2,
    color: COLORS.textSecondary,
  },
  domainLevel: {
    alignItems: 'flex-end',
  },
  levelValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  domainProgressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceSecondary,
  },
  domainProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  badgesContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
  },
  profileCard: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: COLORS.surface,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceSecondary,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  profileEmail: {
    fontSize: 14,
    marginTop: 2,
    color: COLORS.textSecondary,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: COLORS.surface,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  menuItemDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    backgroundColor: COLORS.errorLight,
  },
  menuItemTextDanger: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    width: '80%',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  modalClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    color: COLORS.text,
  },
  modalDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    color: COLORS.textSecondary,
  },
  unlockedInfo: {
    marginTop: 16,
    alignItems: 'center',
  },
  unlockedText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.success,
  },
  unlockedDate: {
    fontSize: 12,
    marginTop: 4,
    color: COLORS.textTertiary,
  },
  lockedInfo: {
    marginTop: 16,
    alignItems: 'center',
    width: '100%',
  },
  lockedText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textTertiary,
  },
  requirementText: {
    fontSize: 12,
    marginTop: 4,
    color: COLORS.textSecondary,
  },
  modalProgress: {
    width: '100%',
    marginTop: 12,
    alignItems: 'center',
  },
  modalProgressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceSecondary,
  },
  modalProgressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  modalProgressText: {
    fontSize: 12,
    marginTop: 4,
    color: COLORS.textSecondary,
  },
});
