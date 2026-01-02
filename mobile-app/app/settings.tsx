import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Settings as SettingsIcon,
  ChevronLeft,
  DollarSign,
  Briefcase,
  Activity,
  Heart,
  Zap,
  Palette,
  Brain,
  Laptop,
  MessageSquare,
  HelpCircle,
  Check,
  Info,
  Send,
  X,
} from 'lucide-react-native';
import HapticPatterns from '../utils/haptics';
import { showSuccessToast, showErrorToast } from '../components/Toast';

// Constants
const FOCUS_AREAS_STORAGE_KEY = 'tavlo_focus_areas';
const MAX_FOCUS_AREAS = 3;

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
  accentLight: '#EFF6FF',
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
};

// Focus Areas Data
const FOCUS_AREAS = [
  {
    id: 'finance',
    name: 'Finance',
    description: 'Investing, budgeting, wealth building, and financial literacy',
    icon: DollarSign,
    color: '#F59E0B',
    bgColor: '#FEF3C7',
  },
  {
    id: 'career',
    name: 'Career',
    description: 'Job skills, networking, professional development, and workplace success',
    icon: Briefcase,
    color: '#92400E',
    bgColor: '#FEF3C7',
  },
  {
    id: 'health',
    name: 'Health',
    description: 'Fitness, nutrition, mental health, and overall wellness',
    icon: Activity,
    color: '#10B981',
    bgColor: '#D1FAE5',
  },
  {
    id: 'philosophy',
    name: 'Philosophy',
    description: 'Wisdom, ethics, mindset, and life principles',
    icon: Brain,
    color: '#EC4899',
    bgColor: '#FCE7F3',
  },
  {
    id: 'relationships',
    name: 'Relationships',
    description: 'Social skills, communication, dating, and family dynamics',
    icon: Heart,
    color: '#EF4444',
    bgColor: '#FEE2E2',
  },
  {
    id: 'productivity',
    name: 'Productivity',
    description: 'Systems, habits, time management, and efficiency',
    icon: Zap,
    color: '#F59E0B',
    bgColor: '#FEF3C7',
  },
  {
    id: 'creativity',
    name: 'Creativity',
    description: 'Art, writing, design, and creative expression',
    icon: Palette,
    color: '#F97316',
    bgColor: '#FFEDD5',
  },
  {
    id: 'technology',
    name: 'Technology',
    description: 'Programming, AI, tools, and tech innovation',
    icon: Laptop,
    color: '#3B82F6',
    bgColor: '#DBEAFE',
  },
];

// Feedback Types
const FEEDBACK_TYPES = [
  { value: 'feedback', label: 'Feedback' },
  { value: 'bug', label: 'Bug Report' },
  { value: 'feature', label: 'Feature Request' },
];

// Feedback Areas
const FEEDBACK_AREAS = [
  { value: 'inbox', label: 'Inbox' },
  { value: 'library', label: 'Library' },
  { value: 'search', label: 'Search' },
  { value: 'add', label: 'Add Content' },
  { value: 'profile', label: 'Profile' },
  { value: 'other', label: 'Other' },
];

export default function SettingsScreen() {
  const router = useRouter();
  
  // Focus Areas State
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Feedback State
  const [feedbackTab, setFeedbackTab] = useState<'feedback' | 'support'>('feedback');
  const [feedbackType, setFeedbackType] = useState('');
  const [feedbackArea, setFeedbackArea] = useState('');
  const [feedbackDetails, setFeedbackDetails] = useState('');
  const [allowFollowUp, setAllowFollowUp] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load saved focus areas on mount
  React.useEffect(() => {
    loadSavedFocusAreas();
  }, []);

  const loadSavedFocusAreas = async () => {
    try {
      const saved = await AsyncStorage.getItem(FOCUS_AREAS_STORAGE_KEY);
      if (saved) {
        setSelectedAreas(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load focus areas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveFocusAreas = async (areas: string[]) => {
    try {
      await AsyncStorage.setItem(FOCUS_AREAS_STORAGE_KEY, JSON.stringify(areas));
    } catch (error) {
      console.error('Failed to save focus areas:', error);
    }
  };

  const handleFocusAreaPress = useCallback((areaId: string) => {
    HapticPatterns.selection();
    
    setSelectedAreas(prev => {
      let newAreas: string[];
      
      if (prev.includes(areaId)) {
        // Remove if already selected
        newAreas = prev.filter(id => id !== areaId);
      } else if (prev.length < MAX_FOCUS_AREAS) {
        // Add if under limit
        newAreas = [...prev, areaId];
      } else {
        // At limit, show alert
        Alert.alert(
          'Maximum Reached',
          `You can only select up to ${MAX_FOCUS_AREAS} focus areas. Remove one to add another.`,
          [{ text: 'OK' }]
        );
        return prev;
      }
      
      // Save to storage
      saveFocusAreas(newAreas);
      return newAreas;
    });
  }, []);

  const getSelectionOrder = (areaId: string): number | null => {
    const index = selectedAreas.indexOf(areaId);
    return index >= 0 ? index + 1 : null;
  };

  const handleSubmitFeedback = useCallback(async () => {
    if (!feedbackDetails.trim()) {
      Alert.alert('Missing Details', 'Please provide details about your feedback.');
      return;
    }
    
    setIsSubmitting(true);
    HapticPatterns.buttonPress();
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      showSuccessToast('Feedback submitted! Thank you.');
      
      // Reset form
      setFeedbackType('');
      setFeedbackArea('');
      setFeedbackDetails('');
    }, 1000);
  }, [feedbackDetails]);

  const renderFocusAreaCard = (area: typeof FOCUS_AREAS[0]) => {
    const isSelected = selectedAreas.includes(area.id);
    const order = getSelectionOrder(area.id);
    const Icon = area.icon;
    
    return (
      <TouchableOpacity
        key={area.id}
        style={[
          styles.focusCard,
          isSelected && { borderColor: COLORS.accent, borderWidth: 2 },
        ]}
        onPress={() => handleFocusAreaPress(area.id)}
        activeOpacity={0.7}
      >
        {/* Selection Badge */}
        {order !== null && (
          <View style={styles.selectionBadge}>
            <Text style={styles.selectionBadgeText}>{order}</Text>
          </View>
        )}
        
        {/* Icon */}
        <View style={[styles.focusIconContainer, { backgroundColor: area.bgColor }]}>
          <Icon size={24} color={area.color} />
        </View>
        
        {/* Content */}
        <Text style={styles.focusName}>{area.name}</Text>
        <Text style={styles.focusDescription} numberOfLines={2}>
          {area.description}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              HapticPatterns.buttonPress();
              router.back();
            }}
          >
            <ChevronLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <SettingsIcon size={24} color={COLORS.text} />
            <Text style={styles.headerTitle}>Settings</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ============ FOCUS AREAS SECTION ============ */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Brain size={20} color={COLORS.text} />
                <Text style={styles.sectionTitle}>Focus Areas</Text>
              </View>
              <Text style={styles.selectedCount}>
                {selectedAreas.length}/{MAX_FOCUS_AREAS} selected
              </Text>
            </View>
            
            <Text style={styles.sectionDescription}>
              Select up to 3 domains to focus on. This helps personalize your quests and recommendations. You'll earn bonus XP for content in your focus areas!
            </Text>
            
            {/* Focus Areas Grid */}
            <View style={styles.focusGrid}>
              {FOCUS_AREAS.map(renderFocusAreaCard)}
            </View>
            
            {/* Selected Focus Areas Pills */}
            {selectedAreas.length > 0 && (
              <View style={styles.selectedSection}>
                <Text style={styles.selectedLabel}>Your Current Focus</Text>
                <View style={styles.selectedPills}>
                  {selectedAreas.map(areaId => {
                    const area = FOCUS_AREAS.find(a => a.id === areaId);
                    if (!area) return null;
                    const Icon = area.icon;
                    return (
                      <View 
                        key={areaId} 
                        style={[styles.selectedPill, { backgroundColor: area.bgColor }]}
                      >
                        <Icon size={14} color={area.color} />
                        <Text style={[styles.selectedPillText, { color: area.color }]}>
                          {area.name}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </View>

          {/* ============ FEEDBACK SECTION ============ */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <MessageSquare size={20} color={COLORS.text} />
                <Text style={styles.sectionTitle}>Feedback & Support</Text>
              </View>
            </View>
            
            <Text style={styles.sectionDescription}>
              Tell us what to improve or report an issue. We read everything.
            </Text>

            {/* Feedback/Support Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  feedbackTab === 'feedback' && styles.tabActive,
                ]}
                onPress={() => {
                  HapticPatterns.selection();
                  setFeedbackTab('feedback');
                }}
              >
                <Text style={[
                  styles.tabText,
                  feedbackTab === 'feedback' && styles.tabTextActive,
                ]}>
                  Feedback
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tab,
                  feedbackTab === 'support' && styles.tabActive,
                ]}
                onPress={() => {
                  HapticPatterns.selection();
                  setFeedbackTab('support');
                }}
              >
                <Text style={[
                  styles.tabText,
                  feedbackTab === 'support' && styles.tabTextActive,
                ]}>
                  Support
                </Text>
              </TouchableOpacity>
            </View>

            {/* Feedback Form */}
            <View style={styles.feedbackForm}>
              {/* Type Dropdown */}
              <View style={styles.formRow}>
                <Text style={styles.inputLabel}>Type</Text>
                <View style={styles.chipRow}>
                  {FEEDBACK_TYPES.map(type => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.chip,
                        feedbackType === type.value && styles.chipSelected,
                      ]}
                      onPress={() => {
                        HapticPatterns.selection();
                        setFeedbackType(type.value);
                      }}
                    >
                      <Text style={[
                        styles.chipText,
                        feedbackType === type.value && styles.chipTextSelected,
                      ]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Area Dropdown */}
              <View style={styles.formRow}>
                <Text style={styles.inputLabel}>Area</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipRow}
                >
                  {FEEDBACK_AREAS.map(area => (
                    <TouchableOpacity
                      key={area.value}
                      style={[
                        styles.chip,
                        feedbackArea === area.value && styles.chipSelected,
                      ]}
                      onPress={() => {
                        HapticPatterns.selection();
                        setFeedbackArea(area.value);
                      }}
                    >
                      <Text style={[
                        styles.chipText,
                        feedbackArea === area.value && styles.chipTextSelected,
                      ]}>
                        {area.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Follow-up Checkbox */}
              <TouchableOpacity 
                style={styles.checkboxRow}
                onPress={() => {
                  HapticPatterns.selection();
                  setAllowFollowUp(!allowFollowUp);
                }}
              >
                <View style={[
                  styles.checkbox,
                  allowFollowUp && styles.checkboxChecked,
                ]}>
                  {allowFollowUp && <Check size={14} color={COLORS.surface} />}
                </View>
                <Text style={styles.checkboxLabel}>I'm okay with follow-up</Text>
              </TouchableOpacity>

              {/* Details Text Area */}
              <View style={styles.formRow}>
                <Text style={styles.inputLabel}>Details</Text>
                <TextInput
                  style={styles.textArea}
                  multiline
                  numberOfLines={4}
                  placeholder={feedbackTab === 'feedback' 
                    ? "Tell us the idea, why it matters, or what feels rough..."
                    : "What happened? Expected vs. actual. Any steps to reproduce?"
                  }
                  placeholderTextColor={COLORS.textTertiary}
                  value={feedbackDetails}
                  onChangeText={setFeedbackDetails}
                  textAlignVertical="top"
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  isSubmitting && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmitFeedback}
                disabled={isSubmitting}
              >
                <Send size={18} color={COLORS.surface} />
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </Text>
              </TouchableOpacity>

              {/* Privacy Note */}
              <Text style={styles.privacyNote}>
                We include route and device info to debug faster. No private data is sent.
              </Text>
            </View>

            {/* Tips Box */}
            <View style={styles.tipsBox}>
              <View style={styles.tipsHeader}>
                <Info size={16} color={COLORS.accent} />
                <Text style={styles.tipsTitle}>What helps most?</Text>
              </View>
              <View style={styles.tipsList}>
                <Text style={styles.tipItem}>• Where were you in the app (Inbox, Library, Add)?</Text>
                <Text style={styles.tipItem}>• What did you expect vs. what happened?</Text>
                <Text style={styles.tipItem}>• Screenshots make bugs 10x easier.</Text>
                <Text style={styles.tipItem}>• Severity: blocking, major, or minor?</Text>
              </View>
              <View style={styles.tipsFooter}>
                <Text style={styles.tipsFooterText}>
                  We read every submission. Early beta feedback directly shapes Tavlo.
                </Text>
              </View>
            </View>
          </View>

          {/* Bottom Spacing */}
          <View style={{ height: 100 }} />
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
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  selectedCount: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.accent,
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  // Focus Areas Grid
  focusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  focusCard: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  selectionBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  selectionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.surface,
  },
  focusIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  focusName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  focusDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  // Selected Section
  selectedSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  selectedLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  selectedPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  selectedPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Feedback Section
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.text,
    fontWeight: '600',
  },
  feedbackForm: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formRow: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
  },
  chipTextSelected: {
    color: COLORS.surface,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  checkboxLabel: {
    fontSize: 14,
    color: COLORS.text,
  },
  textArea: {
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    gap: 8,
    marginBottom: 12,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.surface,
  },
  privacyNote: {
    fontSize: 11,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
  // Tips Box
  tipsBox: {
    backgroundColor: COLORS.accentLight,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
  },
  tipsList: {
    gap: 6,
    marginBottom: 12,
  },
  tipItem: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  tipsFooter: {
    backgroundColor: '#BFDBFE',
    borderRadius: 8,
    padding: 10,
  },
  tipsFooterText: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '500',
    textAlign: 'center',
  },
});
