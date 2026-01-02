import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { BookOpen, Wrench, Bookmark, Clock, Zap } from 'lucide-react-native';
import { Item } from '../types';
import { SourceIcon } from './SourceIcon';
import { formatRelativeTime, truncateText } from '../utils/helpers';

interface ItemCardProps {
  item: Item;
  onPress?: (item: Item) => void;
  onLongPress?: (item: Item) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onPress, onLongPress }) => {
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
        return { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' };
    }
  };

  const hasImage = item.imageUrl && item.imageUrl.length > 0;

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => onPress?.(item)}
      onLongPress={() => onLongPress?.(item)}
      activeOpacity={0.7}
      delayLongPress={500}
    >
      {/* Header with source and time */}
      <View style={styles.header}>
        <View style={styles.sourceContainer}>
          <SourceIcon source={item.source} size={24} />
          <View style={[styles.typeBadge, getTypeBadgeStyle()]}>
            {getTypeIcon()}
            <Text style={styles.typeText}>{item.type}</Text>
          </View>
          {item.status === 'new' && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
        </View>
        <View style={styles.timeContainer}>
          <Clock size={12} color="#9CA3AF" />
          <Text style={styles.timeText}>{formatRelativeTime(item.createdAt)}</Text>
        </View>
      </View>

      {/* Image (if present) */}
      {hasImage && (
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: item.imageUrl }} 
            style={styles.image}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.summary} numberOfLines={3}>
          {truncateText(item.summary, 150)}
        </Text>
      </View>

      {/* Tags */}
      {item.tags.length > 0 && (
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

      {/* XP Badge */}
      {item.xpEarned > 0 && (
        <View style={styles.xpContainer}>
          <Zap size={14} color="#F59E0B" fill="#F59E0B" />
          <Text style={styles.xpText}>+{item.xpEarned} XP earned</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
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
    borderColor: '#F3F4F6',
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
    color: '#374151',
  },
  newBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  newBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  imageContainer: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: '#F3F4F6',
  },
  content: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 22,
    marginBottom: 6,
  },
  summary: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  moreTagsText: {
    fontSize: 11,
    color: '#9CA3AF',
    alignSelf: 'center',
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  xpText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
});
