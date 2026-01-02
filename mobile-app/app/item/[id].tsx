import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Share,
  ActivityIndicator,
  Dimensions,
  Alert,
  Modal,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { WebView } from 'react-native-webview';
import { Video, ResizeMode } from 'expo-av';
import {
  ArrowLeft,
  ExternalLink,
  Share2,
  Pin,
  Trash2,
  Clock,
  Zap,
  Play,
  FileText,
  User,
  WifiOff,
  RefreshCw,
  Archive,
  X,
  ZoomIn,
  File,
} from 'lucide-react-native';
import { SourceIcon } from '../../components/SourceIcon';
import { formatRelativeTime, getSourceDisplayName } from '../../utils/helpers';
import { Item } from '../../types';
import { showSuccessToast, showXPToast, showErrorToast } from '../../components/Toast';
import { storage } from '../../utils/storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const API_BASE_URL = 'https://www.tavlo.ca';

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
  error: '#EF4444',
  purple: '#8B5CF6',
};

// ============================================
// MEDIA TYPE DETECTION HELPERS
// ============================================

type MediaType = 'tiktok' | 'instagram' | 'youtube' | 'linkedin-video' | 'linkedin-document' | 'image' | 'none';

/**
 * Detects the media type based on source, URL, and available fields
 */
const detectMediaType = (item: Item): MediaType => {
  const source = item.source?.toLowerCase() || '';
  const url = item.url?.toLowerCase() || '';

  // TikTok: Check source or URL contains tiktok
  if (source.includes('tiktok') || url.includes('tiktok.com')) {
    return 'tiktok';
  }

  // Instagram: Check source contains instagram
  if (source.includes('instagram')) {
    return 'instagram';
  }

  // YouTube: Check source or URL contains youtube/youtu.be
  if (source.includes('youtube') || url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  }

  // LinkedIn with native video (direct MP4)
  if (source.includes('linkedin') && item.videoUrl) {
    return 'linkedin-video';
  }

  // LinkedIn with document/PDF
  if (source.includes('linkedin') && item.documentUrl) {
    return 'linkedin-document';
  }

  // Generic image fallback
  if (item.imageUrl) {
    return 'image';
  }

  return 'none';
};

// ============================================
// EMBED URL EXTRACTORS
// ============================================

/**
 * Extract TikTok video ID from embedHtml field
 * Regex: data-video-id="(\d+)"
 */
const extractTikTokVideoId = (embedHtml: string | null): string | null => {
  if (!embedHtml) return null;
  const match = embedHtml.match(/data-video-id="(\d+)"/);
  return match ? match[1] : null;
};

/**
 * Get TikTok embed URL from video ID
 */
const getTikTokEmbedUrl = (videoId: string): string => {
  return `https://www.tiktok.com/embed/v2/${videoId}`;
};

/**
 * Extract Instagram post type and ID from URL
 * Format: instagram.com/{type}/{id}/...
 * Types: reel, p (post), tv
 */
const extractInstagramInfo = (url: string): { type: string; id: string } | null => {
  const patterns = [
    /instagram\.com\/(reel|p|tv)\/([A-Za-z0-9_-]+)/,
    /instagr\.am\/(reel|p|tv)\/([A-Za-z0-9_-]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return { type: match[1], id: match[2] };
    }
  }
  return null;
};

/**
 * Get Instagram embed URL
 */
const getInstagramEmbedUrl = (url: string): string | null => {
  const info = extractInstagramInfo(url);
  if (!info) return null;
  return `https://www.instagram.com/${info.type}/${info.id}/embed`;
};

/**
 * Extract YouTube video ID from URL
 * Supports: youtube.com/watch?v=, youtu.be/, youtube.com/embed/
 */
const extractYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^#&?]+)/,
    /(?:youtu\.be\/)([^#&?]+)/,
    /(?:youtube\.com\/embed\/)([^#&?]+)/,
    /(?:youtube\.com\/v\/)([^#&?]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1].length === 11) {
      return match[1];
    }
  }
  return null;
};

/**
 * Get YouTube embed URL
 */
const getYouTubeEmbedUrl = (videoId: string): string => {
  return `https://www.youtube.com/embed/${videoId}`;
};

// ============================================
// WEBVIEW HTML TEMPLATES
// ============================================

const getYouTubeHTML = (videoId: string): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { 
      width: 100%; 
      height: 100%; 
      background: #000; 
      overflow: hidden;
    }
    .container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
    iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <iframe 
      src="https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0&modestbranding=1&fs=1&controls=1&enablejsapi=1"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowfullscreen
    ></iframe>
  </div>
  <script>
    // Notify React Native when video is ready
    window.addEventListener('load', function() {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'loaded' }));
      }
    });
  </script>
</body>
</html>
  `.trim();
};

const getTikTokHTML = (videoId: string): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { 
      width: 100%; 
      height: 100%; 
      background: #000; 
      overflow: hidden;
    }
    .container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
    iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <iframe 
      src="https://www.tiktok.com/embed/v2/${videoId}"
      allowfullscreen
      scrolling="no"
      allow="encrypted-media;"
    ></iframe>
  </div>
  <script>
    window.addEventListener('load', function() {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'loaded' }));
      }
    });
  </script>
</body>
</html>
  `.trim();
};

const getInstagramHTML = (embedUrl: string): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { 
      width: 100%; 
      height: 100%; 
      background: #000; 
      overflow: auto;
    }
    .container {
      width: 100%;
      min-height: 100%;
      display: flex;
      justify-content: center;
      align-items: flex-start;
    }
    iframe {
      width: 100%;
      min-height: 100vh;
      border: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <iframe 
      src="${embedUrl}"
      allowfullscreen
      scrolling="yes"
    ></iframe>
  </div>
  <script>
    window.addEventListener('load', function() {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'loaded' }));
      }
    });
  </script>
</body>
</html>
  `.trim();
};

// ============================================
// IMAGE MODAL COMPONENT
// ============================================

const ImageModal = ({ 
  visible, 
  imageUrl, 
  onClose 
}: { 
  visible: boolean; 
  imageUrl: string | null; 
  onClose: () => void;
}) => {
  if (!imageUrl) return null;
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.95)" barStyle="light-content" />
      <TouchableOpacity 
        style={styles.imageModalContainer} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableOpacity style={styles.imageModalClose} onPress={onClose}>
          <X size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Image
          source={{ uri: imageUrl }}
          style={styles.fullScreenImage}
          resizeMode="contain"
        />
        <View style={styles.imageModalCloseBottom}>
          <Text style={styles.imageModalCloseText}>Tap anywhere to close</Text>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// ============================================
// VIDEO MODAL COMPONENT
// ============================================

interface VideoModalProps {
  visible: boolean;
  item: Item | null;
  mediaType: MediaType;
  onClose: () => void;
}

const VideoModal = ({ visible, item, mediaType, onClose }: VideoModalProps) => {
  const [loading, setLoading] = useState(true);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Check if we're on web platform - WebView doesn't work on web
  const isWeb = Platform.OS === 'web';
  
  useEffect(() => {
    if (visible && !isWeb) {
      setLoading(true);
      // Fallback timeout - hide loading after 4 seconds
      loadingTimeoutRef.current = setTimeout(() => {
        setLoading(false);
      }, 4000);
    }
    
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [visible, isWeb]);
  
  if (!item) return null;

  const handleLoadEnd = () => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    setLoading(false);
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'loaded') {
        handleLoadEnd();
      }
    } catch (e) {
      // Ignore parse errors
    }
  };

  // Handle opening URL in browser
  const handleOpenInBrowser = () => {
    Linking.openURL(item.url);
    onClose();
  };

  // Determine WebView source based on media type
  let webViewSource: { html: string } | { uri: string } | null = null;

  switch (mediaType) {
    case 'youtube': {
      const videoId = extractYouTubeVideoId(item.url);
      if (videoId) {
        webViewSource = { html: getYouTubeHTML(videoId) };
      }
      break;
    }
    case 'tiktok': {
      const videoId = extractTikTokVideoId(item.embedHtml);
      if (videoId) {
        webViewSource = { html: getTikTokHTML(videoId) };
      }
      break;
    }
    case 'instagram': {
      const embedUrl = getInstagramEmbedUrl(item.url);
      if (embedUrl) {
        webViewSource = { html: getInstagramHTML(embedUrl) };
      }
      break;
    }
  }

  // For web platform, show a message to open in browser instead
  if (isWeb) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        onRequestClose={onClose}
        transparent
      >
        <View style={styles.webFallbackContainer}>
          <View style={styles.webFallbackContent}>
            <View style={styles.webFallbackIcon}>
              <Play size={48} color={COLORS.accent} />
            </View>
            <Text style={styles.webFallbackTitle}>Video Playback</Text>
            <Text style={styles.webFallbackText}>
              Video playback is best experienced in the native app or browser.
            </Text>
            <TouchableOpacity 
              style={styles.webFallbackButton}
              onPress={handleOpenInBrowser}
            >
              <ExternalLink size={20} color="#FFFFFF" />
              <Text style={styles.webFallbackButtonText}>Open in Browser</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.webFallbackCloseButton}
              onPress={onClose}
            >
              <Text style={styles.webFallbackCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  if (!webViewSource) return null;
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      supportedOrientations={['portrait', 'landscape']}
    >
      <StatusBar backgroundColor="#000000" barStyle="light-content" />
      <View style={styles.videoModalContainer}>
        <View style={styles.videoModalHeader}>
          <TouchableOpacity style={styles.videoModalClose} onPress={onClose}>
            <ArrowLeft size={24} color="#FFFFFF" />
            <Text style={styles.videoModalCloseText}>Close</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.videoModalExternal}
            onPress={() => Linking.openURL(item.url)}
          >
            <ExternalLink size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.videoModalContent}>
          <WebView
            source={webViewSource}
            style={styles.videoModalWebView}
            onLoadEnd={handleLoadEnd}
            onMessage={handleMessage}
            allowsInlineMediaPlayback
            allowsFullscreenVideo
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            scrollEnabled={mediaType === 'instagram' || mediaType === 'tiktok'}
            originWhitelist={['*']}
            mixedContentMode="compatibility"
            userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
          />
          
          {loading && (
            <View style={styles.videoModalLoadingOverlay}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.videoModalLoadingText}>Loading video...</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

// ============================================
// NATIVE VIDEO PLAYER (for LinkedIn MP4)
// ============================================

interface NativeVideoPlayerProps {
  videoUrl: string;
  posterUrl?: string | null;
  onClose: () => void;
  visible: boolean;
}

const NativeVideoPlayer = ({ videoUrl, posterUrl, onClose, visible }: NativeVideoPlayerProps) => {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<any>({});

  useEffect(() => {
    if (visible && videoRef.current) {
      videoRef.current.playAsync();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      supportedOrientations={['portrait', 'landscape']}
    >
      <StatusBar backgroundColor="#000000" barStyle="light-content" />
      <View style={styles.videoModalContainer}>
        <View style={styles.videoModalHeader}>
          <TouchableOpacity style={styles.videoModalClose} onPress={onClose}>
            <ArrowLeft size={24} color="#FFFFFF" />
            <Text style={styles.videoModalCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.videoModalContent}>
          <Video
            ref={videoRef}
            source={{ uri: videoUrl }}
            posterSource={posterUrl ? { uri: posterUrl } : undefined}
            style={styles.nativeVideo}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping={false}
            onPlaybackStatusUpdate={(status) => setStatus(status)}
          />
        </View>
      </View>
    </Modal>
  );
};

// ============================================
// SUMMARY BULLETS COMPONENT
// ============================================

const SummaryBullets = ({ summary }: { summary: string }) => {
  // Split summary by newlines and filter empty lines
  const bullets = summary.split('\n').filter(line => line.trim().length > 0);
  
  if (bullets.length <= 1) {
    // If no newlines, just render as paragraph
    return <Text style={styles.summaryText}>{summary}</Text>;
  }

  return (
    <View style={styles.bulletContainer}>
      {bullets.map((bullet, index) => (
        <View key={index} style={styles.bulletRow}>
          <Text style={styles.bulletPoint}>•</Text>
          <Text style={styles.bulletText}>{bullet.replace(/^[-•*]\s*/, '').trim()}</Text>
        </View>
      ))}
    </View>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  
  // State
  const [item, setItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showNativeVideoModal, setShowNativeVideoModal] = useState(false);

  /**
   * CRITICAL: Token priority order:
   * 1. If user is signed in with Clerk → ALWAYS use Clerk token (real user data)
   * 2. If user is NOT signed in AND demo mode is active → use demo token
   * 
   * This ensures real authenticated users NEVER see demo data
   */
  const getAuthToken = useCallback(async (): Promise<string | null> => {
    // PRIORITY 1: Clerk authenticated user - ALWAYS use Clerk token
    if (isLoaded && isSignedIn) {
      console.log('[ItemDetail] User is signed in with Clerk - using Clerk token');
      return await getToken();
    }
    
    // PRIORITY 2: Not signed in - check for demo mode
    const isDemoMode = await storage.getItem('tavlo_demo_mode');
    if (isDemoMode === 'true') {
      console.log('[ItemDetail] Not signed in, using Demo mode token');
      const demoToken = await storage.getItem('tavlo_demo_token');
      return demoToken;
    }
    
    console.log('[ItemDetail] No authentication available');
    return null;
  }, [getToken, isLoaded, isSignedIn]);

  // Fetch item details
  useEffect(() => {
    if (hasFetched || !isLoaded || !id) {
      return;
    }

    const fetchItem = async () => {
      setHasFetched(true);
      setIsLoading(true);
      setError(null);

      try {
        console.log('[ItemDetail] Fetching item:', id);
        const token = await getAuthToken();
        
        if (!token) {
          setError('Please sign in to view this item');
          setIsLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/items/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        console.log('[ItemDetail] Response status:', response.status);

        if (response.status === 401) {
          throw new Error('Session expired. Please sign in again.');
        }

        if (response.status === 404) {
          throw new Error('Item not found');
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[ItemDetail] API Error:', errorText);
          throw new Error(`Failed to load item (${response.status})`);
        }

        const json = await response.json();
        console.log('[ItemDetail] Item fetched successfully');
        
        const itemData = json.data || json;
        setItem(itemData);
        
      } catch (err: any) {
        console.error('[ItemDetail] Fetch failed:', err.message);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItem();
  }, [id, isLoaded, hasFetched, getAuthToken]);

  // Manual refetch function
  const refetchItem = useCallback(() => {
    setHasFetched(false);
  }, []);

  // Update item status
  const updateItemStatus = useCallback(async (newStatus: 'reviewed' | 'pinned' | 'deleted') => {
    if (!item) return false;

    setIsUpdating(true);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Failed to get token');

      const response = await fetch(`${API_BASE_URL}/api/items/${item.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update item');
      }

      const updatedItem = await response.json();
      setItem(updatedItem.data || updatedItem);
      
      // Invalidate queries to refresh lists
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
      queryClient.invalidateQueries({ queryKey: ['library'] });
      
      return true;
    } catch (err: any) {
      console.error('[ItemDetail] Update failed:', err.message);
      showErrorToast('Failed to update', err.message);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [item, getAuthToken, queryClient]);

  // Handlers
  const handleBack = () => {
    router.back();
  };

  const handleOpenInBrowser = async () => {
    if (item?.url) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Linking.openURL(item.url);
    }
  };

  const handleShare = async () => {
    if (item) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      try {
        await Share.share({
          message: `${item.title || 'Check this out'}\n\n${item.summary || ''}\n\n${item.url}`,
          title: item.title || 'Shared from Tavlo',
        });
      } catch (error) {
        console.error('Share error:', error);
      }
    }
  };

  const handleArchive = async () => {
    if (!item || item.status === 'reviewed') return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const success = await updateItemStatus('reviewed');
    if (success) {
      showXPToast(item.xpEarned || 10, 'Archived');
      showSuccessToast('Item archived!', 'Moved to Library');
    }
  };

  const handlePin = async () => {
    if (!item) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newStatus = item.status === 'pinned' ? 'reviewed' : 'pinned';
    const success = await updateItemStatus(newStatus);
    if (success) {
      showSuccessToast(
        newStatus === 'pinned' ? 'Item pinned!' : 'Item unpinned',
        newStatus === 'pinned' ? 'Find it quickly in your Library' : ''
      );
    }
  };

  const handleDelete = () => {
    if (!item) return;

    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            const success = await updateItemStatus('deleted');
            if (success) {
              showSuccessToast('Item deleted', 'Removed from your library');
              router.back();
            }
          },
        },
      ]
    );
  };

  // Handle document view (LinkedIn PDFs)
  const handleViewDocument = () => {
    if (item?.documentUrl) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Linking.openURL(item.documentUrl);
    }
  };

  // Handle media press based on type
  const handleMediaPress = (mediaType: MediaType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    switch (mediaType) {
      case 'youtube':
      case 'tiktok':
      case 'instagram':
        setShowVideoModal(true);
        break;
      case 'linkedin-video':
        setShowNativeVideoModal(true);
        break;
      case 'image':
        setShowImageModal(true);
        break;
      case 'linkedin-document':
        handleViewDocument();
        break;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
            <ArrowLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Loading item...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !item) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
            <ArrowLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <WifiOff size={48} color={COLORS.error} />
          <Text style={styles.errorTitle}>{error === 'Item not found' ? 'Item Not Found' : 'Error'}</Text>
          <Text style={styles.errorText}>{error || 'Item not found'}</Text>
          <View style={styles.errorButtons}>
            <TouchableOpacity style={styles.retryButton} onPress={refetchItem}>
              <RefreshCw size={18} color={COLORS.surface} />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backButtonError} onPress={handleBack}>
              <Text style={styles.backButtonErrorText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Detect media type
  const mediaType = detectMediaType(item);
  const hasMedia = mediaType !== 'none';
  const isVideoType = ['youtube', 'tiktok', 'instagram', 'linkedin-video'].includes(mediaType);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Image Modal */}
      <ImageModal
        visible={showImageModal}
        imageUrl={item.imageUrl}
        onClose={() => setShowImageModal(false)}
      />
      
      {/* Video Modal (YouTube, TikTok, Instagram) */}
      <VideoModal
        visible={showVideoModal}
        item={item}
        mediaType={mediaType}
        onClose={() => setShowVideoModal(false)}
      />

      {/* Native Video Player (LinkedIn MP4) */}
      {item.videoUrl && (
        <NativeVideoPlayer
          visible={showNativeVideoModal}
          videoUrl={item.videoUrl}
          posterUrl={item.imageUrl}
          onClose={() => setShowNativeVideoModal(false)}
        />
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
            <Share2 size={22} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleOpenInBrowser}>
            <ExternalLink size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Source & Meta Header */}
        <View style={styles.metaSection}>
          <View style={styles.sourceRow}>
            <SourceIcon source={item.source || 'other'} size={36} />
            <View style={styles.sourceInfo}>
              <Text style={styles.sourceName} numberOfLines={1}>
                {getSourceDisplayName(item.source || 'other')}
              </Text>
              <View style={styles.metaRow}>
                <Clock size={12} color={COLORS.textTertiary} />
                <Text style={styles.timeText}>{formatRelativeTime(item.createdAt)}</Text>
                {item.author && (
                  <>
                    <User size={12} color={COLORS.textTertiary} style={{ marginLeft: 8 }} />
                    <Text style={styles.authorText} numberOfLines={1}>{item.author}</Text>
                  </>
                )}
              </View>
            </View>
          </View>
          
          {item.xpEarned > 0 && (
            <View style={styles.xpBadge}>
              <Zap size={14} color={COLORS.warning} fill={COLORS.warning} />
              <Text style={styles.xpBadgeText}>+{item.xpEarned} XP</Text>
            </View>
          )}
        </View>

        {/* Status Badge */}
        {item.status === 'pinned' && (
          <View style={styles.pinnedBanner}>
            <Pin size={14} color={COLORS.warning} fill={COLORS.warning} />
            <Text style={styles.pinnedText}>Pinned Item</Text>
          </View>
        )}

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>{item.title || 'Untitled'}</Text>

        {/* Media Section */}
        {hasMedia && (
          <TouchableOpacity
            style={styles.mediaContainer}
            onPress={() => handleMediaPress(mediaType)}
            activeOpacity={0.8}
          >
            {/* Show thumbnail image if available, otherwise show placeholder */}
            {item.imageUrl ? (
              <Image 
                source={{ uri: item.imageUrl }} 
                style={styles.mediaImage} 
                resizeMode="cover" 
              />
            ) : isVideoType ? (
              /* Video placeholder when no thumbnail */
              <View style={styles.videoPlaceholder}>
                <View style={styles.videoPlaceholderGradient} />
                <View style={styles.videoPlaceholderIcon}>
                  <SourceIcon source={item.source || 'other'} size={40} />
                </View>
                <Text style={styles.videoPlaceholderText}>
                  {getSourceDisplayName(item.source || 'Video')}
                </Text>
              </View>
            ) : null}
            
            {/* Video play overlay */}
            {isVideoType && (
              <View style={styles.playOverlay}>
                <View style={styles.playButton}>
                  <Play size={32} color="#FFFFFF" fill="#FFFFFF" />
                </View>
                <Text style={styles.playText}>Tap to play</Text>
              </View>
            )}
            
            {/* Document overlay for LinkedIn documents */}
            {mediaType === 'linkedin-document' && (
              <View style={styles.documentOverlay}>
                <File size={40} color="#FFFFFF" />
                <Text style={styles.documentText}>View Document</Text>
              </View>
            )}
            
            {/* Image zoom hint */}
            {mediaType === 'image' && (
              <View style={styles.zoomHint}>
                <ZoomIn size={16} color="#FFFFFF" />
                <Text style={styles.zoomHintText}>Tap to zoom</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* AI Summary Section */}
        {item.summary && (
          <View style={styles.summarySection}>
            <View style={styles.sectionHeader}>
              <FileText size={18} color={COLORS.accent} />
              <Text style={styles.sectionTitle}>AI Summary</Text>
            </View>
            <SummaryBullets summary={item.summary} />
          </View>
        )}

        {/* User Note */}
        {item.note && (
          <View style={styles.noteSection}>
            <Text style={styles.noteLabel}>📝 Your Note</Text>
            <Text style={styles.noteText}>{item.note}</Text>
          </View>
        )}

        {/* Category */}
        {item.category && (
          <View style={styles.categorySection}>
            <Text style={styles.categoryLabel}>Category</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          </View>
        )}

        {/* Tags - Horizontal scrollable */}
        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={styles.tagsLabel}>Tags</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tagsScrollContent}
            >
              {item.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          {item.status === 'new' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryAction]}
              onPress={handleArchive}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Archive size={20} color="#FFFFFF" />
                  <Text style={styles.primaryActionText}>Archive (+{item.xpEarned || 10} XP)</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <View style={styles.secondaryActions}>
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                item.status === 'pinned' && styles.secondaryButtonActive,
              ]}
              onPress={handlePin}
              disabled={isUpdating}
            >
              <Pin
                size={20}
                color={item.status === 'pinned' ? COLORS.warning : COLORS.textSecondary}
                fill={item.status === 'pinned' ? COLORS.warning : 'transparent'}
              />
              <Text
                style={[
                  styles.secondaryButtonText,
                  item.status === 'pinned' && styles.secondaryButtonTextActive,
                ]}
              >
                {item.status === 'pinned' ? 'Pinned' : 'Pin'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={handleOpenInBrowser}>
              <ExternalLink size={20} color={COLORS.textSecondary} />
              <Text style={styles.secondaryButtonText}>Open</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, styles.deleteButton]}
              onPress={handleDelete}
              disabled={isUpdating}
            >
              <Trash2 size={20} color={COLORS.error} />
              <Text style={[styles.secondaryButtonText, styles.deleteButtonText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* View Original Footer */}
        <TouchableOpacity style={styles.viewOriginalButton} onPress={handleOpenInBrowser}>
          <ExternalLink size={18} color={COLORS.accent} />
          <Text style={styles.viewOriginalText}>View Original</Text>
        </TouchableOpacity>

        {/* Original URL */}
        <TouchableOpacity style={styles.urlSection} onPress={handleOpenInBrowser}>
          <Text style={styles.urlLabel}>Source URL</Text>
          <Text style={styles.urlText} numberOfLines={2}>{item.url}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  errorText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  errorButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  backButtonError: {
    backgroundColor: COLORS.surfaceSecondary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backButtonErrorText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  metaSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sourceInfo: {
    gap: 4,
    flex: 1,
  },
  sourceName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 13,
    color: COLORS.textTertiary,
  },
  authorText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    maxWidth: 120,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  xpBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  pinnedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    marginBottom: 12,
  },
  pinnedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 32,
    marginBottom: 16,
  },
  mediaContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
    backgroundColor: COLORS.surfaceSecondary,
    minHeight: 200,
  },
  mediaImage: {
    width: '100%',
    height: 220,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  documentOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  zoomHint: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  zoomHintText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  // Image Modal Styles
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalClose: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  imageModalCloseBottom: {
    position: 'absolute',
    bottom: 60,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  imageModalCloseText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  // Video Modal Styles
  videoModalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  videoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: '#000000',
    zIndex: 10,
  },
  videoModalClose: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  videoModalCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  videoModalExternal: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoModalContent: {
    flex: 1,
    position: 'relative',
  },
  videoModalLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 2,
  },
  videoModalLoadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 12,
  },
  videoModalWebView: {
    flex: 1,
    backgroundColor: '#000',
  },
  nativeVideo: {
    flex: 1,
    backgroundColor: '#000',
  },
  // Summary Section
  summarySection: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  summaryText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  bulletContainer: {
    gap: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletPoint: {
    fontSize: 15,
    color: COLORS.accent,
    marginRight: 8,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  // Note Section
  noteSection: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  noteLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 6,
  },
  noteText: {
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20,
  },
  // Category Section
  categorySection: {
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: COLORS.purple + '15',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.purple,
  },
  // Tags Section
  tagsSection: {
    marginBottom: 24,
  },
  tagsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10,
  },
  tagsScrollContent: {
    gap: 8,
    paddingRight: 16,
  },
  tag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: '500',
  },
  // Actions Section
  actionsSection: {
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryAction: {
    backgroundColor: COLORS.success,
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  secondaryButtonTextActive: {
    color: '#92400E',
  },
  deleteButton: {
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  deleteButtonText: {
    color: COLORS.error,
  },
  // View Original Button
  viewOriginalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent + '10',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  viewOriginalText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.accent,
  },
  // URL Section
  urlSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  urlLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textTertiary,
    marginBottom: 4,
  },
  urlText: {
    fontSize: 13,
    color: COLORS.accent,
    lineHeight: 18,
  },
  // Web Fallback Modal Styles
  webFallbackContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  webFallbackContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    maxWidth: 340,
    width: '100%',
  },
  webFallbackIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.accent + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  webFallbackTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  webFallbackText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  webFallbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    width: '100%',
    marginBottom: 12,
  },
  webFallbackButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  webFallbackCloseButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  webFallbackCloseText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  // Video Placeholder (no thumbnail)
  videoPlaceholder: {
    width: '100%',
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholderGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a1a1a',
  },
  videoPlaceholderIcon: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  videoPlaceholderText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
});
