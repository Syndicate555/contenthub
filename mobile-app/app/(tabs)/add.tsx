import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import {
  X,
  Link2,
  FileText,
  Sparkles,
  Send,
  Check,
  Cpu,
  CheckCircle2,
  Circle,
  AlertCircle,
  Youtube,
  Twitter,
  Linkedin,
  Instagram,
  Music2,
  Globe,
  MessageCircle,
  Mail,
  AlertTriangle,
  UserPlus,
} from 'lucide-react-native';
import { useAddContent, ProcessingStep } from '../../hooks/useAddContent';
import { showSuccessToast, showErrorToast, showXPToast } from '../../components/Toast';
import { useQueryClient } from '@tanstack/react-query';
import { storage } from '../../utils/storage';

const DEMO_MODE_KEY = 'tavlo_demo_mode';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Colors
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
  pink: '#EC4899',
  gradientStart: '#8B5CF6',
  gradientEnd: '#3B82F6',
};

// Platform colors
const PLATFORM_COLORS: Record<string, string> = {
  youtube: '#FF0000',
  twitter: '#1DA1F2',
  linkedin: '#0A66C2',
  instagram: '#E4405F',
  tiktok: '#000000',
  reddit: '#FF4500',
  newsletter: '#059669',
  web: '#6B7280',
};

// Processing steps configuration
const STEPS_CONFIG: { step: ProcessingStep; label: string; description: string }[] = [
  { step: 'validating', label: 'Validating link', description: 'Checking URL and platform.' },
  { step: 'fetching', label: 'Fetching content', description: 'Pulling text, media, and metadata.' },
  { step: 'distilling', label: 'AI distilling', description: 'Summarizing key takeaways.' },
  { step: 'tagging', label: 'Tagging & routing', description: 'Applying tags, domains, and XP.' },
  { step: 'finalizing', label: 'Finalizing', description: 'Saving to Inbox and polishing UI.' },
];

// Platform icon component
const PlatformIcon = ({ platform, size = 20 }: { platform: string; size?: number }) => {
  const color = PLATFORM_COLORS[platform] || PLATFORM_COLORS.web;
  switch (platform) {
    case 'youtube':
      return <Youtube size={size} color={color} />;
    case 'twitter':
      return <Twitter size={size} color={color} />;
    case 'linkedin':
      return <Linkedin size={size} color={color} />;
    case 'instagram':
      return <Instagram size={size} color={color} />;
    case 'tiktok':
      return <Music2 size={size} color={color} />;
    case 'reddit':
      return <MessageCircle size={size} color={color} />;
    case 'newsletter':
      return <Mail size={size} color={color} />;
    default:
      return <Globe size={size} color={color} />;
  }
};

// Get platform display name
const getPlatformLabel = (platform: string): string => {
  const labels: Record<string, string> = {
    youtube: 'YouTube',
    twitter: 'Twitter',
    linkedin: 'LinkedIn',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    reddit: 'Reddit',
    newsletter: 'Newsletter',
    web: 'Webpage',
  };
  return labels[platform] || 'Webpage';
};

export default function AddScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isSignedIn, isLoaded: clerkLoaded } = useAuth();
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [detectedPlatform, setDetectedPlatform] = useState<string>('web');
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  // Animation values
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const { 
    submitContent, 
    reset, 
    detectPlatform,
    isSubmitting, 
    processingState, 
    error, 
    result,
    isReady 
  } = useAddContent();

  // Check if user is in demo mode (not signed in with Clerk but using demo token)
  useEffect(() => {
    const checkDemoMode = async () => {
      if (clerkLoaded && !isSignedIn) {
        const demoModeFlag = await storage.getItem(DEMO_MODE_KEY);
        setIsDemoMode(demoModeFlag === 'true');
      } else {
        setIsDemoMode(false);
      }
    };
    checkDemoMode();
  }, [clerkLoaded, isSignedIn]);

  // Detect platform when URL changes
  useEffect(() => {
    if (url.trim()) {
      const platform = detectPlatform(url.trim());
      setDetectedPlatform(platform);
    } else {
      setDetectedPlatform('web');
    }
  }, [url, detectPlatform]);

  // Animate progress bar
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: processingState.progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [processingState.progress]);

  // URL validation
  const isValidUrl = useCallback((text: string): boolean => {
    try {
      new URL(text);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!url.trim()) {
      showErrorToast('Please enter a URL');
      return;
    }

    if (!isValidUrl(url.trim())) {
      showErrorToast('Please enter a valid URL starting with http:// or https://');
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const response = await submitContent({
      url: url.trim(),
      note: note.trim() || undefined,
    });

    if (response) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Show XP toast
      const xpEarned = response.data?.xpEarned || 10;
      showXPToast(xpEarned);
      
      // Show success toast
      setTimeout(() => {
        showSuccessToast('Content saved!');
      }, 500);

      // Check for badges
      if (response.newBadges && response.newBadges.length > 0) {
        setTimeout(() => {
          showSuccessToast(`Badge earned: ${response.newBadges![0].name}`);
        }, 1000);
      }

      // Invalidate all related queries to trigger refresh
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
      queryClient.invalidateQueries({ queryKey: ['library'] });

      // Clear form and navigate to inbox with refresh parameter
      setTimeout(() => {
        setUrl('');
        setNote('');
        reset();
        // Use replace with a timestamp to force inbox to refresh
        router.replace({
          pathname: '/(tabs)',
          params: { refresh: Date.now().toString() },
        });
      }, 1500);
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [url, note, submitContent, reset, router, queryClient, isValidUrl]);

  // Handle close
  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    reset();
    router.back();
  }, [isSubmitting, reset, router]);

  // Get step status
  const getStepStatus = (stepKey: ProcessingStep): 'pending' | 'active' | 'complete' | 'error' => {
    const stepIndex = STEPS_CONFIG.findIndex(s => s.step === stepKey);
    const currentIndex = STEPS_CONFIG.findIndex(s => s.step === processingState.step);
    
    if (processingState.step === 'error') return 'error';
    if (processingState.step === 'success') return 'complete';
    if (stepIndex < currentIndex) return 'complete';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  // Render step icon
  const renderStepIcon = (status: 'pending' | 'active' | 'complete' | 'error') => {
    switch (status) {
      case 'complete':
        return <CheckCircle2 size={18} color={COLORS.success} fill={COLORS.success} />;
      case 'active':
        return <ActivityIndicator size={16} color={COLORS.accent} />;
      case 'error':
        return <AlertCircle size={18} color={COLORS.error} />;
      default:
        return <Circle size={18} color={COLORS.textTertiary} />;
    }
  };

  const canSubmit = url.trim().length > 0 && !isSubmitting && isReady;
  const showProcessing = isSubmitting || processingState.step === 'success';

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            disabled={isSubmitting}
          >
            <X size={24} color={isSubmitting ? COLORS.textTertiary : COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Content</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.heroGradient}>
              <Text style={styles.heroLabel}>ADD ANY LINK</Text>
              <Text style={styles.heroTitle}>Drop a link,{"\n"}we distill the signal.</Text>
              <Text style={styles.heroSubtitle}>
                Automatic extraction, AI summarization, tagging, and inbox routing.
              </Text>
              <View style={styles.heroBadges}>
                <View style={[styles.heroBadge, { backgroundColor: '#EFF6FF' }]}>
                  <Sparkles size={14} color={COLORS.accent} />
                  <Text style={[styles.heroBadgeText, { color: COLORS.accent }]}>AI Powered</Text>
                </View>
                <View style={[styles.heroBadge, { backgroundColor: '#ECFDF5' }]}>
                  <Check size={14} color={COLORS.success} />
                  <Text style={[styles.heroBadgeText, { color: COLORS.success }]}>Auto-tagged</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Input Card */}
          <View style={styles.inputCard}>
            <View style={styles.inputHeader}>
              <Link2 size={20} color={COLORS.accent} />
              <Text style={styles.inputTitle}>Add Content</Text>
            </View>

            {/* URL Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>URL</Text>
              <View style={[
                styles.urlInputContainer,
                url && !isValidUrl(url) && styles.urlInputError,
                isSubmitting && styles.inputDisabled,
              ]}>
                <TextInput
                  style={styles.urlInput}
                  placeholder="https://twitter.com/..."
                  placeholderTextColor={COLORS.textTertiary}
                  value={url}
                  onChangeText={setUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  editable={!isSubmitting}
                />
              </View>
              <Text style={styles.inputHelper}>
                Paste a link from Twitter, Instagram, LinkedIn, TikTok, or any webpage
              </Text>
            </View>

            {/* Note Input */}
            <View style={styles.inputGroup}>
              <View style={styles.noteHeader}>
                <FileText size={16} color={COLORS.textSecondary} />
                <Text style={styles.inputLabel}>Note (optional)</Text>
              </View>
              <TextInput
                style={[styles.noteInput, isSubmitting && styles.inputDisabled]}
                placeholder="Why did you save this? Any personal context..."
                placeholderTextColor={COLORS.textTertiary}
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                editable={!isSubmitting}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                !canSubmit && styles.submitButtonDisabled,
                isSubmitting && styles.submitButtonProcessing,
              ]}
              onPress={handleSubmit}
              disabled={!canSubmit}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.submitButtonText}>Working magic...</Text>
                </>
              ) : processingState.step === 'success' ? (
                <>
                  <CheckCircle2 size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Saved!</Text>
                </>
              ) : (
                <>
                  <Send size={18} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Save & Process</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Processing Card - Shows during submission */}
          {showProcessing && (
            <View style={styles.processingCard}>
              <View style={styles.processingHeader}>
                <Sparkles size={18} color={COLORS.purple} />
                <Text style={styles.processingTitle}>Processing your link</Text>
                {url && (
                  <View style={styles.platformBadge}>
                    <PlatformIcon platform={detectedPlatform} size={14} />
                    <Text style={styles.platformBadgeText}>{getPlatformLabel(detectedPlatform)}</Text>
                  </View>
                )}
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarContainer}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>

              {/* Processing Steps Grid */}
              <View style={styles.stepsGrid}>
                {STEPS_CONFIG.map((step) => {
                  const status = getStepStatus(step.step);
                  return (
                    <View key={step.step} style={styles.stepCard}>
                      <View style={styles.stepIconContainer}>
                        {renderStepIcon(status)}
                      </View>
                      <Text style={[
                        styles.stepLabel,
                        status === 'complete' && styles.stepLabelComplete,
                        status === 'active' && styles.stepLabelActive,
                      ]}>
                        {step.label}
                      </Text>
                      <Text style={styles.stepDescription}>{step.description}</Text>
                    </View>
                  );
                })}
              </View>

              {/* Footer message */}
              <View style={styles.processingFooter}>
                <Text style={styles.processingFooterText}>
                  ✨ Making it tidy so future-you smiles.
                </Text>
                {processingState.step !== 'success' && processingState.step !== 'error' && (
                  <Text style={styles.aiWorkingText}>AI working...</Text>
                )}
              </View>
            </View>
          )}

          {/* Error Display */}
          {error && !isSubmitting && (
            <View style={styles.errorCard}>
              <AlertCircle size={20} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  reset();
                }}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* How It Works - Only show when not processing */}
          {!showProcessing && (
            <View style={styles.howItWorks}>
              <View style={styles.sectionHeader}>
                <Sparkles size={18} color={COLORS.purple} />
                <Text style={styles.sectionTitle}>How this works</Text>
              </View>

              {[
                { icon: Cpu, title: 'Smart extraction', description: 'We fetch text, media, and metadata from the link so you don\'t have to copy-paste.', color: COLORS.accent },
                { icon: Sparkles, title: 'AI enrichment', description: 'Summaries, tags, categories, and XP are generated to keep your inbox organized.', color: COLORS.pink },
                { icon: Check, title: 'Ready to act', description: 'Content drops into your Inbox with focus areas, badges, and actions ready to go.', color: COLORS.success },
              ].map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <View style={[styles.featureNumber, { backgroundColor: feature.color }]}>
                    <Text style={styles.featureNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
                  </View>
                </View>
              ))}

              {/* Tags */}
              <View style={styles.tagRow}>
                {[
                  { label: 'Summaries', bg: '#EFF6FF', color: COLORS.accent },
                  { label: 'Tags', bg: '#FEF3C7', color: '#D97706' },
                  { label: 'Domains', bg: '#F3E8FF', color: COLORS.purple },
                  { label: 'XP', bg: '#FEE2E2', color: COLORS.error },
                ].map((tag, index) => (
                  <View key={index} style={[styles.tagChip, { backgroundColor: tag.bg }]}>
                    <Text style={[styles.tagChipText, { color: tag.color }]}>{tag.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  // Hero
  heroSection: {
    marginBottom: 16,
  },
  heroGradient: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 32,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  heroBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  heroBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Input Card
  inputCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  inputTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  urlInputContainer: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceSecondary,
  },
  urlInputError: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  inputDisabled: {
    opacity: 0.6,
  },
  urlInput: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.text,
  },
  inputHelper: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 6,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceSecondary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 80,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonProcessing: {
    backgroundColor: COLORS.purple,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Processing Card
  processingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  processingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  processingTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSecondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  platformBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: COLORS.accent,
    // Gradient effect simulated with backgroundColor
  },
  stepsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  stepCard: {
    width: (SCREEN_WIDTH - 72) / 2,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepIconContainer: {
    marginBottom: 8,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  stepLabelComplete: {
    color: COLORS.success,
  },
  stepLabelActive: {
    color: COLORS.accent,
  },
  stepDescription: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 14,
  },
  processingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  processingFooterText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  aiWorkingText: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '500',
  },
  // Error
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.error,
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.error,
    borderRadius: 6,
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // How It Works
  howItWorks: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 14,
  },
  featureNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
