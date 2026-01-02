import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Image,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  Search as SearchIcon, 
  X, 
  Clock, 
  ArrowLeft,
  User,
  Sparkles,
  Zap,
  Pin,
} from 'lucide-react-native';
import { SourceIcon } from '../../components/SourceIcon';
import { Item } from '../../types';
import { useDiscovery, useSearch, useRecentSearches, SearchFilters } from '../../hooks/useSearch';
import HapticPatterns from '../../utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

// Platform icon background colors
const PLATFORM_COLORS: Record<string, string> = {
  'twitter.com': '#1DA1F2',
  'twitter': '#1DA1F2',
  'linkedin.com': '#0A66C2',
  'linkedin': '#0A66C2',
  'youtube.com': '#FF0000',
  'youtube': '#FF0000',
  'tiktok.com': '#000000',
  'tiktok': '#000000',
  'instagram.com': '#E4405F',
  'instagram': '#E4405F',
  'reddit.com': '#FF4500',
  'reddit': '#FF4500',
  'newsletter': '#059669',
  'substack.com': '#FF6719',
  'medium.com': '#000000',
};

// ==================== Search Result Item Card ====================

const SearchResultCard = ({ 
  item, 
  searchQuery,
  onPress 
}: { 
  item: Item; 
  searchQuery?: string;
  onPress: (item: Item) => void;
}) => {
  // Highlight search term in text
  const highlightText = (text: string | null, query?: string) => {
    if (!text || !query || query.length < 2) {
      return <Text style={styles.resultTitle} numberOfLines={2}>{text || 'Untitled'}</Text>;
    }
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <Text style={styles.resultTitle} numberOfLines={2}>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() 
            ? <Text key={i} style={styles.highlightedText}>{part}</Text>
            : part
        )}
      </Text>
    );
  };

  return (
    <TouchableOpacity 
      style={styles.resultCard} 
      activeOpacity={0.7}
      onPress={() => onPress(item)}
    >
      {/* Thumbnail */}
      {item.imageUrl ? (
        <Image 
          source={{ uri: item.imageUrl }} 
          style={styles.resultImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.resultImage, styles.resultImagePlaceholder]}>
          <SourceIcon source={item.source || 'other'} size={24} />
        </View>
      )}
      
      {/* Content */}
      <View style={styles.resultContent}>
        <View style={styles.resultHeader}>
          <SourceIcon source={item.source || 'other'} size={16} />
          {item.status === 'pinned' && (
            <Pin size={12} color={COLORS.warning} fill={COLORS.warning} />
          )}
          {item.xpEarned > 0 && (
            <View style={styles.xpBadge}>
              <Zap size={10} color={COLORS.warning} fill={COLORS.warning} />
              <Text style={styles.xpText}>+{item.xpEarned}</Text>
            </View>
          )}
        </View>
        
        {highlightText(item.title, searchQuery)}
        
        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <View style={styles.resultTags}>
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
};

// ==================== Main Component ====================

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<SearchFilters>({});
  const [refreshing, setRefreshing] = useState(false);

  // Hooks
  const discovery = useDiscovery();
  const search = useSearch();
  const recentSearches = useRecentSearches();

  // Perform search with filters
  const performSearch = useCallback(async (filters: SearchFilters) => {
    HapticPatterns.buttonPress();
    setActiveFilters(filters);
    
    // Save text query to recent searches
    if (filters.q && filters.q.trim()) {
      await recentSearches.addSearch(filters.q.trim());
    }
    
    await search.search(filters);
  }, [search, recentSearches]);

  // Handle text search submit
  const handleSearchSubmit = useCallback(() => {
    if (query.trim()) {
      performSearch({ ...activeFilters, q: query.trim() });
    }
  }, [query, activeFilters, performSearch]);

  // Handle platform selection (Browse by Platform)
  const handlePlatformSelect = useCallback((platform: string) => {
    // Navigate to Item List filtered by platform={platform_name}
    performSearch({ platform });
  }, [performSearch]);

  // Handle author selection (Top Authors)
  const handleAuthorSelect = useCallback((author: string) => {
    // Navigate to Item List filtered by author={author_name}
    performSearch({ author });
  }, [performSearch]);

  // Handle recent search
  const handleRecentSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    performSearch({ q: searchQuery });
  }, [performSearch]);

  // Clear search and go back to discovery
  const clearSearch = useCallback(() => {
    HapticPatterns.selection();
    setQuery('');
    setActiveFilters({});
    search.clearSearch();
  }, [search]);

  // Item press handler
  const handleItemPress = useCallback((item: Item) => {
    HapticPatterns.buttonPress();
    router.push(`/item/${item.id}`);
  }, [router]);

  // Refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await discovery.refetch();
    setRefreshing(false);
  }, [discovery]);

  // Build active filter label
  const getActiveFilterLabel = useMemo(() => {
    const parts: string[] = [];
    if (activeFilters.q) parts.push(`"${activeFilters.q}"`);
    if (activeFilters.platform) {
      parts.push(`from ${activeFilters.platform}`);
    }
    if (activeFilters.author) parts.push(`by ${activeFilters.author}`);
    return parts.join(' ') || 'All results';
  }, [activeFilters]);

  // Render search results
  const renderItem = useCallback(({ item }: { item: Item }) => (
    <SearchResultCard 
      item={item} 
      searchQuery={activeFilters.q}
      onPress={handleItemPress} 
    />
  ), [handleItemPress, activeFilters.q]);

  const keyExtractor = useCallback((item: Item) => item.id, []);

  // ==================== Results View ====================

  if (search.hasSearched) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Results Header */}
        <View style={styles.resultsHeader}>
          <TouchableOpacity style={styles.backButton} onPress={clearSearch}>
            <ArrowLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.resultsHeaderContent}>
            <Text style={styles.resultsTitle}>Search Results</Text>
            <Text style={styles.resultsSubtitle} numberOfLines={1}>
              {getActiveFilterLabel} • {search.totalResults} results
            </Text>
          </View>
        </View>

        {/* Search Bar in Results View */}
        <View style={styles.resultsSearchBar}>
          <SearchIcon size={18} color={COLORS.textTertiary} />
          <TextInput
            style={styles.resultsSearchInput}
            placeholder="Refine your search..."
            placeholderTextColor={COLORS.textTertiary}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <X size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Results List */}
        {search.isSearching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.accent} />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : search.results.length === 0 ? (
          <View style={styles.emptyContainer}>
            <SearchIcon size={48} color={COLORS.textTertiary} />
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptySubtitle}>
              Try different keywords or filters
            </Text>
            <TouchableOpacity style={styles.clearButton} onPress={clearSearch}>
              <Text style={styles.clearButtonText}>Clear Search</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlashList
            data={search.results}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            estimatedItemSize={100}
            contentContainerStyle={styles.resultsList}
            onEndReached={search.loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              search.hasMore ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color={COLORS.accent} />
                </View>
              ) : <View style={{ height: 100 }} />
            }
          />
        )}
      </SafeAreaView>
    );
  }

  // ==================== Discovery View (Default) ====================

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accent}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Search</Text>
          <Text style={styles.headerSubtitle}>Discover your saved content</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchIcon size={20} color={COLORS.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search your library..."
            placeholderTextColor={COLORS.textTertiary}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <X size={20} color={COLORS.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Recent Searches */}
        {recentSearches.searches.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Clock size={18} color={COLORS.textSecondary} />
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              <TouchableOpacity onPress={recentSearches.clearAll}>
                <Text style={styles.clearLink}>Clear</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.chipsRow}>
              {recentSearches.searches.slice(0, 5).map((searchQuery, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.recentChip}
                  onPress={() => handleRecentSearch(searchQuery)}
                >
                  <Text style={styles.recentChipText}>{searchQuery}</Text>
                  <TouchableOpacity
                    onPress={() => recentSearches.removeSearch(searchQuery)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <X size={14} color={COLORS.textTertiary} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Browse by Platform - Horizontal scrollable chips */}
        {discovery.isLoading ? (
          <View style={styles.loadingSection}>
            <ActivityIndicator size="small" color={COLORS.accent} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : discovery.platforms.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Sparkles size={18} color={COLORS.purple} />
              <Text style={styles.sectionTitle}>Browse by Platform</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.platformScroll}
            >
              {discovery.platforms.map((platform, index) => {
                const platformKey = platform.platform.toLowerCase();
                const bgColor = PLATFORM_COLORS[platformKey] || COLORS.accent;
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.platformCard}
                    onPress={() => handlePlatformSelect(platform.platform)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.platformIcon, { backgroundColor: bgColor + '15' }]}>
                      <SourceIcon source={platform.platform} size={28} />
                    </View>
                    <Text style={styles.platformLabel} numberOfLines={1}>
                      {platform.label || platform.platform}
                    </Text>
                    <Text style={styles.platformCount}>{platform.count} items</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Top Authors - List/Grid of authors */}
        {discovery.authors.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <User size={18} color={COLORS.success} />
              <Text style={styles.sectionTitle}>Top Authors</Text>
            </View>
            <View style={styles.authorList}>
              {discovery.authors.slice(0, 8).map((author, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.authorChip}
                  onPress={() => handleAuthorSelect(author.author)}
                  activeOpacity={0.7}
                >
                  <View style={styles.authorAvatar}>
                    <User size={16} color={COLORS.textSecondary} />
                  </View>
                  <Text style={styles.authorName} numberOfLines={1}>{author.author}</Text>
                  <View style={styles.authorCountBadge}>
                    <Text style={styles.authorCount}>{author.count}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{discovery.totalItems}</Text>
            <Text style={styles.statLabel}>Total Items</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{discovery.categories.length}</Text>
            <Text style={styles.statLabel}>Categories</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{discovery.platforms.length}</Text>
            <Text style={styles.statLabel}>Sources</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ==================== Styles ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  section: {
    marginTop: 28,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
  },
  clearLink: {
    fontSize: 14,
    color: COLORS.accent,
    fontWeight: '500',
  },
  loadingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  // Recent Searches
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingLeft: 14,
    paddingRight: 10,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  recentChipText: {
    fontSize: 14,
    color: COLORS.text,
  },
  // Platforms - Horizontal scroll
  platformScroll: {
    gap: 12,
    paddingRight: 20,
  },
  platformCard: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    width: 95,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  platformIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  platformLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  platformCount: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  // Top Authors
  authorList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  authorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingLeft: 10,
    paddingRight: 12,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  authorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    maxWidth: 100,
  },
  authorCountBadge: {
    backgroundColor: COLORS.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  authorCount: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  // Stats
  statsSection: {
    flexDirection: 'row',
    marginTop: 32,
    marginHorizontal: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.accent,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  // Results View
  resultsHeader: {
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
  resultsHeaderContent: {
    flex: 1,
    marginRight: 44,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  resultsSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  resultsSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSecondary,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 10,
  },
  resultsSearchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  resultsList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  clearButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.accent,
    borderRadius: 10,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  // Result Card
  resultCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginVertical: 6,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  resultImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceSecondary,
  },
  resultImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultContent: {
    flex: 1,
    marginLeft: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
    marginLeft: 'auto',
  },
  xpText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 6,
  },
  highlightedText: {
    backgroundColor: '#FEF08A',
    color: COLORS.text,
    fontWeight: '700',
  },
  resultTags: {
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
});
