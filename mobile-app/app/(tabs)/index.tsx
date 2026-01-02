import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import storage from '../../utils/storage';
import { Inbox, Filter, ChevronDown, WifiOff, RefreshCw } from 'lucide-react-native';
import { SwipeableItemCard } from '../../components/SwipeableItemCard';
import { AnimatedXPHeader } from '../../components/AnimatedXPHeader';
// Level up celebration disabled for now
// import { LevelUpCelebration, LevelUpCelebrationRef } from '../../components/LevelUpCelebration';
import { useInboxItems, useUpdateItem, useDeleteItem } from '../../hooks/useInboxItems';
import { Item, ItemsResponse } from '../../types';
import { showSuccessToast, showXPToast, showErrorToast } from '../../components/Toast';
import HapticPatterns from '../../utils/haptics';

const DEMO_MODE_KEY = 'tavlo_demo_mode';

// Constants
const PAGE_SIZE = 20;

// Light theme colors
const COLORS = {
  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceSecondary: '#F3F4F6',
  text: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  primary: '#1F2937',
  accent: '#3B82F6',
  success: '#10B981',
  error: '#EF4444',
};

// Platform filter mapping - matches backend API slugs
const PLATFORM_FILTERS: { slug: string | null; label: string }[] = [
  { slug: null, label: 'All' },         // null = omit param, show all
  { slug: 'twitter', label: 'Twitter/X' },
  { slug: 'linkedin', label: 'LinkedIn' },
  { slug: 'youtube', label: 'YouTube' },
  { slug: 'tiktok', label: 'TikTok' },
  { slug: 'instagram', label: 'Instagram' },
  { slug: 'reddit', label: 'Reddit' },
];

export default function InboxScreen() {
  const router = useRouter();
  const { refresh } = useLocalSearchParams<{ refresh?: string }>();
  const { isLoaded, isSignedIn } = useAuth();
  
  // State
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null); // null = All
  const [showFilters, setShowFilters] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const lastRefreshRef = useRef<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Hooks for API calls - these get fresh tokens each time
  const { fetchItems } = useInboxItems();
  const { updateItem } = useUpdateItem();
  const { deleteItem } = useDeleteItem();

  // Check if demo mode is active
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const demoMode = await storage.getItem(DEMO_MODE_KEY);
        const isDemo = demoMode === 'true';
        setIsDemoMode(isDemo);
        
        // Ready if demo mode or clerk is loaded and signed in
        const ready = isDemo || (isLoaded && isSignedIn);
        setIsAuthReady(ready);
        console.log('[Inbox] Auth check - demo:', isDemo, 'clerkLoaded:', isLoaded, 'signedIn:', isSignedIn, 'ready:', ready);
      } catch (err) {
        console.error('[Inbox] Error checking auth:', err);
        setIsAuthReady(isLoaded && isSignedIn);
      }
    };
    checkAuth();
  }, [isLoaded, isSignedIn]);

  // Default stats (gamification data comes from items)
  const stats = useMemo(() => {
    const totalXp = items.reduce((sum, item) => sum + (item.xpEarned || 0), 0);
    return {
      totalXp,
      currentStreak: 0,
      level: Math.floor(totalXp / 100) + 1,
    };
  }, [items]);

  // Load initial data when auth is ready or platform filter changes
  useEffect(() => {
    if (isAuthReady) {
      loadItems();
    }
  }, [isAuthReady, selectedPlatform]);

  // Refresh when coming back from Add Content screen
  useEffect(() => {
    if (refresh && refresh !== lastRefreshRef.current && isAuthReady) {
      console.log('[Inbox] Refresh triggered from Add Content');
      lastRefreshRef.current = refresh;
      loadItems(1, false);
    }
  }, [refresh, isAuthReady]);

  // Auto-refresh when screen gains focus (e.g., coming back from item details)
  useFocusEffect(
    useCallback(() => {
      // Only reload if we have items (not initial load)
      if (isAuthReady && items.length > 0) {
        console.log('[Inbox] Screen focused, refreshing data');
        loadItems(1, false);
      }
    }, [isAuthReady, items.length])
  );

  // Load items from API
  const loadItems = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (!isAuthReady) {
      console.log('[Inbox] Not ready to fetch - auth not ready');
      return;
    }

    if (pageNum === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);

    try {
      console.log('[Inbox] Fetching items, page:', pageNum, 'platform:', selectedPlatform || 'all');
      
      const response = await fetchItems({
        status: 'new',
        platform: selectedPlatform, // null = all, or specific platform slug
        page: pageNum,
        limit: PAGE_SIZE,
      });

      console.log('[Inbox] Received response:', {
        itemCount: response.data?.length,
        total: response.meta?.total,
        hasMore: response.meta?.hasMore,
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
      console.error('[Inbox] Error loading items:', err.message);
      setError(err.message);
      
      if (err.message.includes('not authenticated') || err.message.includes('Session expired')) {
        // Redirect to sign in
        router.replace('/(auth)/sign-in');
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [isAuthReady, fetchItems, selectedPlatform, router]);

  // Load more for infinite scroll
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || isLoading) return;
    await loadItems(page + 1, true);
  }, [page, isLoadingMore, hasMore, isLoading, loadItems]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await HapticPatterns.refresh();
    await loadItems(1, false);
    setRefreshing(false);
  }, [loadItems]);

  // Level up handler - disabled for now
  // const handleLevelUp = useCallback((newLevel: number) => {
  //   levelUpRef.current?.celebrate(newLevel);
  // }, []);

  // Item press handler
  const handleItemPress = useCallback((item: Item) => {
    HapticPatterns.buttonPress();
    router.push(`/item/${item.id}`);
  }, [router]);

  // Archive handler
  const handleArchive = useCallback(async (item: Item) => {
    try {
      // Optimistically update UI
      setItems(prev => prev.filter(i => i.id !== item.id));
      setTotalCount(prev => prev - 1);
      
      await HapticPatterns.success();
      showSuccessToast('Item archived!');
      showXPToast(item.xpEarned || 10);
      
      // Update via API
      await updateItem(item.id, { status: 'reviewed' });
    } catch (error: any) {
      showErrorToast('Failed to archive: ' + error.message);
      // Revert on error
      loadItems(1, false);
    }
  }, [updateItem, loadItems]);

  // Pin handler
  const handlePin = useCallback(async (item: Item) => {
    try {
      await HapticPatterns.buttonPress();
      
      // Update local state
      setItems(prev => prev.map(i => 
        i.id === item.id ? { ...i, status: 'pinned' as const } : i
      ));
      
      showSuccessToast('Item pinned!');
      await updateItem(item.id, { status: 'pinned' });
    } catch (error: any) {
      showErrorToast('Failed to pin: ' + error.message);
    }
  }, [updateItem]);

  // Delete handler
  const handleDelete = useCallback((item: Item) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await HapticPatterns.warning();
              setItems(prev => prev.filter(i => i.id !== item.id));
              setTotalCount(prev => prev - 1);
              showSuccessToast('Item deleted');
              await deleteItem(item.id);
            } catch (error: any) {
              showErrorToast('Failed to delete: ' + error.message);
              loadItems(1, false);
            }
          },
        },
      ]
    );
  }, [deleteItem, loadItems]);

  // Render item
  const renderItem = useCallback(({ item }: { item: Item }) => (
    <SwipeableItemCard
      item={item}
      onPress={handleItemPress}
      onArchive={handleArchive}
      onPin={handlePin}
      onDelete={handleDelete}
    />
  ), [handleItemPress, handleArchive, handlePin, handleDelete]);

  // Key extractor
  const keyExtractor = useCallback((item: Item) => item.id, []);

  // Footer for loading more
  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return <View style={{ height: 100 }} />;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.accent} />
        <Text style={styles.footerText}>Loading more...</Text>
      </View>
    );
  }, [isLoadingMore]);

  // Header component
  const ListHeaderComponent = useMemo(() => (
    <View>
      {/* Animated XP Header - level up disabled */}
      <AnimatedXPHeader 
        stats={stats} 
        onPress={() => router.push('/(tabs)/profile')}
      />

      {/* Inbox Title & Filters */}
      <View style={styles.titleSection}>
        <View style={styles.titleRow}>
          <View style={styles.titleContainer}>
            <Inbox size={24} color={COLORS.text} />
            <Text style={styles.title}>Inbox</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{totalCount}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {
              HapticPatterns.selection();
              setShowFilters(!showFilters);
            }}
          >
            <Filter size={18} color={COLORS.textSecondary} />
            <ChevronDown
              size={16}
              color={COLORS.textSecondary}
              style={showFilters ? { transform: [{ rotate: '180deg' }] } : undefined}
            />
          </TouchableOpacity>
        </View>

        {/* Swipe hint */}
        <Text style={styles.swipeHintGlobal}>
          Swipe cards left to archive, right for more options
        </Text>

        {/* Platform Filters */}
        {showFilters && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersScroll}
            contentContainerStyle={styles.filtersContent}
          >
            {PLATFORM_FILTERS.map(filter => {
              const isActive = selectedPlatform === filter.slug;
              return (
                <TouchableOpacity
                  key={filter.slug || 'all'}
                  style={[
                    styles.filterChip,
                    isActive && styles.filterChipActive,
                  ]}
                  onPress={() => {
                    HapticPatterns.selection();
                    // Set platform: null for "All", or the slug for specific platform
                    setSelectedPlatform(filter.slug);
                    // Reset pagination when filter changes
                    setPage(1);
                    setItems([]);
                    setHasMore(true);
                  }}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isActive && styles.filterChipTextActive,
                    ]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>
    </View>
  ), [stats, totalCount, showFilters, selectedPlatform, router]);

  // Empty/Error component
  const ListEmptyComponent = useMemo(() => {
    // Loading state
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.emptySubtitle}>Loading your saved content...</Text>
        </View>
      );
    }
    
    // Not authenticated
    if (!isSignedIn) {
      return (
        <View style={styles.emptyContainer}>
          <WifiOff size={48} color={COLORS.error} />
          <Text style={styles.emptyTitle}>Not Signed In</Text>
          <Text style={styles.emptySubtitle}>
            Please sign in to view your saved content
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.replace('/(auth)/sign-in')}
          >
            <Text style={styles.retryButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    // Error state
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <WifiOff size={48} color={COLORS.error} />
          <Text style={styles.emptyTitle}>Connection Error</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadItems(1, false)}
          >
            <RefreshCw size={18} color={COLORS.surface} />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    // Empty state
    return (
      <View style={styles.emptyContainer}>
        <Inbox size={48} color={COLORS.textTertiary} />
        <Text style={styles.emptyTitle}>No items in your inbox</Text>
        <Text style={styles.emptySubtitle}>
          Save content from the web to see it here
        </Text>
      </View>
    );
  }, [isLoading, isSignedIn, error, loadItems, router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <FlashList
          data={items}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          estimatedItemSize={280}
          ListHeaderComponent={ListHeaderComponent}
          ListEmptyComponent={ListEmptyComponent}
          ListFooterComponent={renderFooter}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor={COLORS.accent}
            />
          }
          removeClippedSubviews={true}
          drawDistance={300}
        />
        
        {/* Level Up Celebration - disabled for now */}
        {/* <LevelUpCelebration ref={levelUpRef} /> */}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  titleSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.success,
  },
  countText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  swipeHintGlobal: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
    color: COLORS.textTertiary,
  },
  filtersScroll: {
    marginTop: 12,
  },
  filtersContent: {
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    color: COLORS.text,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    color: COLORS.textTertiary,
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
});
