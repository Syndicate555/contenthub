import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { BookOpen, Wrench, Bookmark, Clock, Zap, Check, Trash2, Pin, Archive, Play } from 'lucide-react-native';
import { Item } from '../types';
import { SourceIcon } from './SourceIcon';
import { formatRelativeTime, truncateText, getSourceDisplayName } from '../utils/helpers';

// Light theme colors
const COLORS = {
  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceSecondary: '#F3F4F6',
  text: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#E5E7EB',
  card: '#FFFFFF',
  cardBorder: '#F3F4F6',
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
};

interface SwipeableItemCardProps {
  item: Item;
  onPress?: (item: Item) => void;
  onArchive?: (item: Item) => void;
  onPin?: (item: Item) => void;
  onDelete?: (item: Item) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ACTION_WIDTH = 80;

export const SwipeableItemCard: React.FC<SwipeableItemCardProps> = ({
  item,
  onPress,
  onArchive,
  onPin,
  onDelete,
}) => {
  const swipeableRef = useRef<Swipeable>(null);

  const closeSwipeable = () => {
    swipeableRef.current?.close();
  };

  const handleArchive = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    closeSwipeable();
    onArchive?.(item);
  }, [item, onArchive]);

  const handlePin = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    closeSwipeable();
    onPin?.(item);
  }, [item, onPin]);

  const handleDelete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    closeSwipeable();
    onDelete?.(item);
  }, [item, onDelete]);

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const translateX = dragX.interpolate({
      inputRange: [-ACTION_WIDTH * 3, 0],
      outputRange: [0, ACTION_WIDTH * 3],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.rightActionsContainer, { transform: [{ translateX }] }]}>
        <TouchableOpacity
          style={[styles.actionButton, styles.archiveAction]}
          onPress={handleArchive}
        >
          <Check size={24} color="#FFFFFF" />
          <Text style={styles.actionText}>Done</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.pinAction]}
          onPress={handlePin}
        >
          <Pin size={24} color="#FFFFFF" />
          <Text style={styles.actionText}>Pin</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteAction]}
          onPress={handleDelete}
        >
          <Trash2 size={24} color="#FFFFFF" />
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderLeftActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const translateX = dragX.interpolate({
      inputRange: [0, ACTION_WIDTH],
      outputRange: [-ACTION_WIDTH, 0],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.leftActionsContainer, { transform: [{ translateX }] }]}>
        <TouchableOpacity
          style={[styles.actionButton, styles.quickArchiveAction]}
          onPress={handleArchive}
        >
          <Archive size={28} color="#FFFFFF" />
          <Text style={styles.actionText}>Archive</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const getTypeIcon = () => {
    switch (item.type) {
      case 'learn':
        return <BookOpen size={12} color="#3b82f6" />;
      case 'do':
        return <Wrench size={12} color="#10B981" />;
      case 'reference':
        return <Bookmark size={12} color="#8B5CF6" />;
      default:
        return null;
    }
  };

  const getTypeBadgeStyle = () => {
    switch (item.type) {
      case 'learn':
        return { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' };
      case 'do':
        return { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' };
      case 'reference':
        return { backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' };
      default:
        return { backgroundColor: COLORS.surfaceSecondary, borderColor: COLORS.border };
    }
  };

  const hasImage = item.imageUrl && item.imageUrl.length > 0;
  const isReviewed = item.status === 'reviewed';
  const isPinned = item.status === 'pinned';
  
  // Check if this is a video platform (TikTok, YouTube, Instagram, etc.)
  const source = item.source?.toLowerCase() || '';
  const url = item.url?.toLowerCase() || '';
  const isVideoSource = 
    source.includes('tiktok') || 
    source.includes('youtube') || 
    source.includes('instagram') ||
    url.includes('tiktok.com') ||
    url.includes('youtube.com') ||
    url.includes('youtu.be') ||
    url.includes('instagram.com');

  // Show media section if has image OR is a video source
  const showMediaSection = hasImage || isVideoSource;

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      friction={2}
      leftThreshold={40}
      rightThreshold={40}
      overshootLeft={false}
      overshootRight={false}
      onSwipeableOpen={(direction) => {
        if (direction === 'left') {
          handleArchive();
        }
      }}
    >
      <TouchableOpacity
        style={[
          styles.card,
          isReviewed && { opacity: 0.8, borderColor: COLORS.successLight },
          isPinned && { borderColor: '#FCD34D', borderWidth: 2 },
        ]}
        onPress={() => onPress?.(item)}
        activeOpacity={0.7}
      >
        {isPinned && (
          <View style={styles.pinnedBanner}>
            <Pin size={12} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.pinnedText}>Pinned</Text>
          </View>
        )}

        <View style={styles.header}>
          <View style={styles.sourceContainer}>
            <SourceIcon source={item.source || 'other'} size={24} />
            {item.type && (
              <View style={[styles.typeBadge, getTypeBadgeStyle()]}>
                {getTypeIcon()}
                <Text style={styles.typeText}>{item.type}</Text>
              </View>
            )}
            {item.status === 'new' && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NEW</Text>
              </View>
            )}
            {isReviewed && (
              <View style={styles.reviewedBadge}>
                <Check size={10} color={COLORS.success} />
              </View>
            )}
          </View>
          <View style={styles.timeContainer}>
            <Clock size={12} color={COLORS.textTertiary} />
            <Text style={styles.timeText}>{formatRelativeTime(item.createdAt)}</Text>
          </View>
        </View>

        {showMediaSection && (
          <View style={styles.imageContainer}>
            {hasImage ? (
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              /* Video placeholder when no thumbnail */
              <View style={styles.videoPlaceholder}>
                <View style={styles.videoPlaceholderBg} />
                <View style={styles.videoPlaceholderContent}>
                  <View style={styles.videoPlaceholderIconContainer}>
                    <SourceIcon source={item.source || 'other'} size={32} />
                  </View>
                  <Text style={styles.videoPlaceholderText}>
                    {getSourceDisplayName(item.source || 'Video')}
                  </Text>
                </View>
                <View style={styles.playButtonOverlay}>
                  <View style={styles.playButtonCircle}>
                    <Play size={24} color="#FFFFFF" fill="#FFFFFF" />
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        <View style={styles.content}>
          <Text style={[styles.title, isReviewed && { color: COLORS.textSecondary }]} numberOfLines={2}>
            {item.title || 'Untitled'}
          </Text>
          {(item.summary || item.url) && (
            <Text style={styles.summary} numberOfLines={3}>
              {truncateText(item.summary || item.url, 150)}
            </Text>
          )}
        </View>

        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {item.tags.length > 3 && (
              <Text style={styles.moreTagsText}>+{item.tags.length - 3} more</Text>
            )}
          </View>
        )}

        {item.xpEarned > 0 && (
          <View style={styles.xpContainer}>
            <Zap size={14} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.xpText}>+{item.xpEarned} XP earned</Text>
          </View>
        )}

        {item.status === 'new' && (
          <Text style={styles.swipeHint}>← Swipe to archive</Text>
        )}
      </TouchableOpacity>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    backgroundColor: COLORS.card,
    borderColor: COLORS.cardBorder,
  },
  pinnedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  pinnedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
    color: COLORS.text,
  },
  newBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: COLORS.success,
  },
  newBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reviewedBadge: {
    padding: 4,
    borderRadius: 10,
    backgroundColor: COLORS.successLight,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  imageContainer: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: COLORS.surfaceSecondary,
  },
  // Video placeholder styles
  videoPlaceholder: {
    width: '100%',
    height: 180,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholderBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a1a2e',
  },
  videoPlaceholderContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  videoPlaceholderIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  videoPlaceholderText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  playButtonCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  content: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 6,
    color: COLORS.text,
  },
  summary: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceSecondary,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  moreTagsText: {
    fontSize: 11,
    alignSelf: 'center',
    color: COLORS.textTertiary,
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.warningLight,
  },
  xpText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  swipeHint: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: 8,
    fontStyle: 'italic',
    color: COLORS.textTertiary,
  },
  rightActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 12,
  },
  leftActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
    marginBottom: 12,
  },
  actionButton: {
    width: ACTION_WIDTH,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  archiveAction: {
    backgroundColor: '#10B981',
  },
  pinAction: {
    backgroundColor: '#F59E0B',
  },
  deleteAction: {
    backgroundColor: '#EF4444',
  },
  quickArchiveAction: {
    backgroundColor: '#10B981',
    width: ACTION_WIDTH,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
});
