import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  Library as LibraryIcon, 
  Grid3x3, 
  List, 
  Search,
  Filter,
  Pin,
  Check,
  BookOpen,
  Wrench,
  Bookmark,
  X,
  WifiOff,
  RefreshCw,
  ArrowLeft,
  Folder,
  Zap,
  // Category icons
  Cpu,
  Briefcase,
  Palette,
  Heart,
  DollarSign,
  GraduationCap,
  Music,
  Gamepad2,
  Utensils,
  Globe,
  Film,
  BookMarked,
  Lightbulb,
  TrendingUp,
  Users,
  Code,
  Camera,
  Plane,
  Home,
  ShoppingBag,
} from 'lucide-react-native';
import { SourceIcon } from '../../components/SourceIcon';
import { formatRelativeTime, truncateText } from '../../utils/helpers';
import { Item } from '../../types';
import { useCategories, useLibraryItems, CategoryData } from '../../hooks/useLibrary';
import HapticPatterns from '../../utils/haptics';

// Constants
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_ITEM_WIDTH = (SCREEN_WIDTH - 48) / 2;
const PAGE_SIZE = 50;

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
  purple: '#8B5CF6',
  error: '#EF4444',
};

// Default category thumbnail images - fallback when no thumbnails from API
const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  // Provided images by user
  learning: 'https://customer-assets.emergentagent.com/job_70e4ec98-8560-4d91-94b5-e027a4acf1f3/artifacts/vzyti51r_learning.jpg',
  lifestyle: 'https://customer-assets.emergentagent.com/job_70e4ec98-8560-4d91-94b5-e027a4acf1f3/artifacts/9rim0ujx_lifestyle.jpg',
  other: 'https://customer-assets.emergentagent.com/job_70e4ec98-8560-4d91-94b5-e027a4acf1f3/artifacts/nd76wdd3_other.jpg',
  productivity: 'https://customer-assets.emergentagent.com/job_70e4ec98-8560-4d91-94b5-e027a4acf1f3/artifacts/dxoj165i_productivity.jpg',
  // Additional category defaults using Unsplash images
  technology: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop',
  tech: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop',
  business: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
  design: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop',
  health: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
  finance: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop',
  education: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop',
  entertainment: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop',
  sports: 'https://images.unsplash.com/photo-1461896836934- voices-from-the-stands?w=400&h=300&fit=crop',
  travel: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop',
  food: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop',
  music: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=300&fit=crop',
  art: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&h=300&fit=crop',
  science: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=400&h=300&fit=crop',
  news: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=400&h=300&fit=crop',
  social: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop',
};

// Get default image for a category
const getDefaultCategoryImage = (categorySlug: string): string => {
  const slug = categorySlug.toLowerCase();
  
  // Direct match
  if (DEFAULT_CATEGORY_IMAGES[slug]) {
    return DEFAULT_CATEGORY_IMAGES[slug];
  }
  
  // Partial match check
  for (const [key, url] of Object.entries(DEFAULT_CATEGORY_IMAGES)) {
    if (slug.includes(key) || key.includes(slug)) {
      return url;
    }
  }
  
  // Return "other" as fallback
  return DEFAULT_CATEGORY_IMAGES.other;
};

// Icon mapping for category icons
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  cpu: Cpu,
  briefcase: Briefcase,
  palette: Palette,
  heart: Heart,
  dollar: DollarSign,
  graduation: GraduationCap,
  music: Music,
  gamepad: Gamepad2,
  utensils: Utensils,
  globe: Globe,
  film: Film,
  book: BookMarked,
  lightbulb: Lightbulb,
  trending: TrendingUp,
  users: Users,
  code: Code,
  camera: Camera,
  plane: Plane,
  home: Home,
  shopping: ShoppingBag,
  folder: Folder,
};

// Get icon component from icon string
const getCategoryIcon = (iconName: string | undefined, size: number = 24, color: string = COLORS.accent) => {
  if (!iconName) {
    return <Folder size={size} color={color} />;
  }
  const IconComponent = ICON_MAP[iconName.toLowerCase()] || Folder;
  return <IconComponent size={size} color={color} />;
};

// Category colors for visual variety
const CATEGORY_COLORS = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#10B981', // Green
  '#F59E0B', // Orange
  '#EF4444', // Red
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
];

// ==================== Category Folder Card ====================

const CategoryFolderCard = memo(({ 
  category, 
  index,
  onPress 
}: { 
  category: CategoryData; 
  index: number;
  onPress: (category: CategoryData) => void;
}) => {
  const bgColor = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Get thumbnail: use API thumbnail OR default image based on category slug
  const apiThumbnail = category.thumbnails?.[0];
  const defaultThumbnail = getDefaultCategoryImage(category.category);
  const thumbnail = apiThumbnail || defaultThumbnail;

  // Log for debugging
  useEffect(() => {
    console.log(`[CategoryCard] ${category.label}: API=${!!apiThumbnail}, Default=${defaultThumbnail?.substring(0, 50)}...`);
  }, [category.label, apiThumbnail, defaultThumbnail]);

  return (
    <TouchableOpacity
      style={styles.folderCard}
      activeOpacity={0.8}
      onPress={() => onPress(category)}
    >
      {/* Thumbnail Container */}
      <View style={[styles.folderThumbnail, { backgroundColor: bgColor + '20' }]}>
        {/* Background color/icon fallback - always visible behind image */}
        {(!imageLoaded || imageError) && (
          <View style={[styles.folderIconContainer, { backgroundColor: bgColor + '30' }]}>
            {getCategoryIcon(category.icon, 40, bgColor)}
          </View>
        )}
        
        {/* Image overlay - loads on top */}
        {!imageError && thumbnail && (
          <Image
            source={{ uri: thumbnail }}
            style={[styles.folderImage, { position: 'absolute', top: 0, left: 0 }]}
            resizeMode="cover"
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              console.log(`[CategoryCard] Image error for ${category.label}:`, e.nativeEvent.error);
              setImageError(true);
            }}
          />
        )}
        
        {/* Icon overlay badge */}
        <View style={[styles.folderIconBadge, { backgroundColor: bgColor }]}>
          {getCategoryIcon(category.icon, 18, '#FFFFFF')}
        </View>
      </View>

      {/* Label & Count */}
      <View style={styles.folderInfo}>
        <Text style={styles.folderLabel} numberOfLines={1}>{category.label}</Text>
        <Text style={styles.folderCount}>{category.count} items</Text>
      </View>
    </TouchableOpacity>
  );
});

// ==================== Item List Card ====================

const ItemListCard = memo(({ item, onPress }: { item: Item; onPress: (item: Item) => void }) => {
  return (
    <TouchableOpacity 
      style={styles.itemCard} 
      activeOpacity={0.7}
      onPress={() => onPress(item)}
    >
      {/* Thumbnail */}
      {item.imageUrl ? (
        <Image 
          source={{ uri: item.imageUrl }} 
          style={styles.itemImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
          <SourceIcon source={item.source || 'other'} size={24} />
        </View>
      )}
      
      {/* Content */}
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <View style={styles.itemMeta}>
            <SourceIcon source={item.source || 'other'} size={16} />
            {item.status === 'pinned' && (
              <Pin size={12} color={COLORS.warning} fill={COLORS.warning} />
            )}
          </View>
          {item.xpEarned > 0 && (
            <View style={styles.xpBadge}>
              <Zap size={10} color={COLORS.warning} fill={COLORS.warning} />
              <Text style={styles.xpText}>+{item.xpEarned}</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.itemTitle} numberOfLines={2}>
          {item.title || 'Untitled'}
        </Text>
        
        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <View style={styles.itemTags}>
            {item.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tagPill}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

// ==================== Main Component ====================

export default function LibraryScreen() {
  const router = useRouter();
  
  // UI State
  const [viewMode, setViewMode] = useState<'folders' | 'items'>('folders');
  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Item list state (for drill-down view)
  const [items, setItems] = useState<Item[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Hooks
  const { categories, totalItems, isLoading: categoriesLoading, refetch: refetchCategories, isReady } = useCategories();
  const { fetchItems } = useLibraryItems();

  // Load items when a category is selected (drill-down)
  const loadCategoryItems = useCallback(async (category: string, pageNum: number = 1, append: boolean = false) => {
    if (!isReady) return;

    if (pageNum === 1) {
      setIsLoadingItems(true);
    }
    setItemsError(null);

    try {
      console.log('[Library] Fetching items for category:', category, 'page:', pageNum);
      
      const response = await fetchItems({
        category,
        page: pageNum,
        limit: PAGE_SIZE,
      });

      if (append && pageNum > 1) {
        setItems(prev => [...prev, ...(response.data || [])]);
      } else {
        setItems(response.data || []);
      }
      
      setTotalCount(response.meta?.total || response.data?.length || 0);
      setHasMore(response.meta?.hasMore ?? false);
      setPage(pageNum);
      
    } catch (err: any) {
      console.error('[Library] Error loading category items:', err.message);
      setItemsError(err.message);
    } finally {
      setIsLoadingItems(false);
    }
  }, [isReady, fetchItems]);

  // Handle category folder press (drill-down)
  const handleCategoryPress = useCallback((category: CategoryData) => {
    HapticPatterns.buttonPress();
    setSelectedCategory(category);
    setViewMode('items');
    setItems([]);
    setPage(1);
    setHasMore(true);
    loadCategoryItems(category.category, 1);
  }, [loadCategoryItems]);

  // Handle back to folders view
  const handleBackToFolders = useCallback(() => {
    HapticPatterns.selection();
    setSelectedCategory(null);
    setViewMode('folders');
    setItems([]);
    setSearchQuery('');
  }, []);

  // Handle item press
  const handleItemPress = useCallback((item: Item) => {
    HapticPatterns.buttonPress();
    router.push(`/item/${item.id}`);
  }, [router]);

  // Load more items
  const loadMore = useCallback(async () => {
    if (isLoadingItems || !hasMore || !selectedCategory) return;
    await loadCategoryItems(selectedCategory.category, page + 1, true);
  }, [page, isLoadingItems, hasMore, selectedCategory, loadCategoryItems]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await HapticPatterns.refresh();
    
    if (viewMode === 'folders') {
      await refetchCategories();
    } else if (selectedCategory) {
      await loadCategoryItems(selectedCategory.category, 1);
    }
    
    setRefreshing(false);
  }, [viewMode, selectedCategory, refetchCategories, loadCategoryItems]);

  // Filter categories by search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const query = searchQuery.toLowerCase();
    return categories.filter(cat => 
      cat.label.toLowerCase().includes(query) ||
      cat.category.toLowerCase().includes(query)
    );
  }, [categories, searchQuery]);

  // ==================== Render Functions ====================

  // Render category folder
  const renderCategoryFolder = useCallback(({ item, index }: { item: CategoryData; index: number }) => (
    <CategoryFolderCard 
      category={item} 
      index={index}
      onPress={handleCategoryPress} 
    />
  ), [handleCategoryPress]);

  // Render item card
  const renderItem = useCallback(({ item }: { item: Item }) => (
    <ItemListCard item={item} onPress={handleItemPress} />
  ), [handleItemPress]);

  const keyExtractor = useCallback((item: any) => item.id || item.category, []);

  // Footer component - ONLY show when loading more (not initial load)
  const renderFooter = useCallback(() => {
    // For folders view, just add bottom padding
    if (viewMode === 'folders') {
      return <View style={{ height: 100 }} />;
    }
    
    // For items view - only show footer loader when loading MORE items (not initial)
    if (isLoadingItems && items.length > 0) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={COLORS.accent} />
          <Text style={styles.footerText}>Loading more...</Text>
        </View>
      );
    }
    
    return <View style={{ height: 100 }} />;
  }, [isLoadingItems, viewMode, items.length]);

  // Empty component - ONLY show when not loading and no items
  const renderEmpty = useCallback(() => {
    // Folders loading state
    if (viewMode === 'folders' && categoriesLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.emptySubtitle}>Loading your library...</Text>
        </View>
      );
    }

    // Items loading state - SINGLE loading spinner
    if (viewMode === 'items' && isLoadingItems && items.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.emptySubtitle}>Loading items...</Text>
        </View>
      );
    }

    // Error state
    if (itemsError) {
      return (
        <View style={styles.emptyContainer}>
          <WifiOff size={48} color={COLORS.error} />
          <Text style={styles.emptyTitle}>Connection Error</Text>
          <Text style={styles.emptySubtitle}>{itemsError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => selectedCategory && loadCategoryItems(selectedCategory.category, 1)}
          >
            <RefreshCw size={18} color={COLORS.surface} />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Empty state (no data, not loading)
    if (!isLoadingItems) {
      return (
        <View style={styles.emptyContainer}>
          <LibraryIcon size={48} color={COLORS.textTertiary} />
          <Text style={styles.emptyTitle}>No items found</Text>
          <Text style={styles.emptySubtitle}>
            {viewMode === 'folders' ? 'No categories available' : 'No items in this category'}
          </Text>
        </View>
      );
    }

    return null;
  }, [viewMode, categoriesLoading, isLoadingItems, itemsError, selectedCategory, loadCategoryItems, items.length]);

  // ==================== Folders View Header ====================

  const FoldersHeader = useMemo(() => (
    <View>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <LibraryIcon size={24} color={COLORS.text} />
          <Text style={styles.title}>Library</Text>
        </View>
        <Text style={styles.subtitle}>{totalItems} total items</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={18} color={COLORS.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search categories..."
          placeholderTextColor={COLORS.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={18} color={COLORS.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Section Label */}
      <View style={styles.sectionHeader}>
        <Folder size={18} color={COLORS.accent} />
        <Text style={styles.sectionTitle}>Browse by Category</Text>
        <Text style={styles.sectionCount}>{filteredCategories.length} folders</Text>
      </View>
    </View>
  ), [totalItems, searchQuery, filteredCategories.length]);

  // ==================== Items View Header ====================

  const ItemsHeader = useMemo(() => (
    <View>
      {/* Back Header */}
      <View style={styles.itemsHeader}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackToFolders}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.itemsHeaderContent}>
          <Text style={styles.itemsTitle} numberOfLines={1}>
            {selectedCategory?.label || 'Category'}
          </Text>
          <Text style={styles.itemsSubtitle}>
            {totalCount} items
          </Text>
        </View>
      </View>
    </View>
  ), [selectedCategory, totalCount, handleBackToFolders]);

  // ==================== Main Render ====================

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {viewMode === 'folders' ? (
        // Folders Grid View
        <FlashList
          data={filteredCategories}
          renderItem={renderCategoryFolder}
          keyExtractor={keyExtractor}
          estimatedItemSize={160}
          numColumns={2}
          ListHeaderComponent={FoldersHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor={COLORS.accent}
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        // Items List View (Drill-down)
        <FlashList
          data={items}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          estimatedItemSize={100}
          ListHeaderComponent={ItemsHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor={COLORS.accent}
            />
          }
          contentContainerStyle={styles.itemsListContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// ==================== Styles ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginLeft: 34,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  sectionCount: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 100,
  },
  // Folder Card Styles
  folderCard: {
    flex: 1,
    margin: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  folderThumbnail: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  folderImage: {
    width: '100%',
    height: '100%',
  },
  folderIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  folderIconBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  folderInfo: {
    padding: 14,
  },
  folderLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  folderCount: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  // Items Header Styles
  itemsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemsHeaderContent: {
    flex: 1,
    marginRight: 44,
  },
  itemsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  itemsSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  itemsListContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  // Item Card Styles
  itemCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginVertical: 6,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceSecondary,
  },
  itemImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
    marginLeft: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  xpText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 6,
  },
  itemTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: '500',
  },
  // Footer and empty states
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
    marginBottom: 80,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textTertiary,
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
    gap: 8,
  },
  retryButtonText: {
    color: COLORS.surface,
    fontSize: 15,
    fontWeight: '600',
  },
});
