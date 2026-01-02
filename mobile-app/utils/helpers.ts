// Format relative time
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Normalize source to handle both slugs (e.g., "twitter") and domains (e.g., "twitter.com")
const normalizeSource = (source: string): string => {
  const s = source.toLowerCase().trim();
  // Handle X/Twitter
  if (s === 'twitter' || s === 'x' || s.includes('x.com') || s.includes('twitter.com')) return 'twitter';
  if (s === 'linkedin' || s.includes('linkedin.com')) return 'linkedin';
  if (s === 'instagram' || s.includes('instagram.com')) return 'instagram';
  if (s === 'tiktok' || s.includes('tiktok.com')) return 'tiktok';
  if (s === 'youtube' || s.includes('youtube.com')) return 'youtube';
  if (s === 'reddit' || s.includes('reddit.com')) return 'reddit';
  if (s === 'newsletter' || s === 'substack' || s.includes('substack.com')) return 'newsletter';
  return 'other';
};

// Get source icon name based on source URL or slug
export const getSourceIconName = (source: string): string => {
  return normalizeSource(source);
};

// Get source display name
export const getSourceDisplayName = (source: string): string => {
  const normalized = normalizeSource(source);
  const displayNames: Record<string, string> = {
    twitter: 'Twitter',
    linkedin: 'LinkedIn',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    youtube: 'YouTube',
    reddit: 'Reddit',
    newsletter: 'Newsletter',
    other: 'Article',
  };
  return displayNames[normalized] || 'Article';
};

// Get source brand color
export const getSourceColor = (source: string): string => {
  const normalized = normalizeSource(source);
  const colors: Record<string, string> = {
    twitter: '#1DA1F2',
    linkedin: '#0A66C2',
    instagram: '#E4405F',
    tiktok: '#000000',
    youtube: '#FF0000',
    reddit: '#FF4500',
    newsletter: '#059669',
    other: '#6B7280',
  };
  return colors[normalized] || '#6B7280';
};

// Truncate text
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
};

// Calculate level progress percentage
export const calculateLevelProgress = (totalXp: number, level: number): number => {
  const xpPerLevel = 250; // Assuming 250 XP per level
  const currentLevelXp = totalXp % xpPerLevel;
  return (currentLevelXp / xpPerLevel) * 100;
};

// Get XP needed for next level
export const getXpToNextLevel = (totalXp: number, level: number): number => {
  const xpPerLevel = 250;
  const nextLevelXp = level * xpPerLevel;
  return nextLevelXp - totalXp;
};
