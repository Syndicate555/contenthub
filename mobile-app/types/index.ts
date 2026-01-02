// Core Item Model - matches the production API at tavlo.ca
export interface Item {
  id: string;
  url: string;
  title: string | null;
  summary: string | null;    // AI generated summary (multi-line text)
  note?: string | null;      // User note
  tags: string[];
  imageUrl: string | null;   // Thumbnail URL
  videoUrl: string | null;   // Direct video URL (e.g., LinkedIn native videos - MP4)
  documentUrl: string | null; // Document/PDF URL (e.g., LinkedIn documents)
  embedHtml: string | null;  // Embed HTML (critical for TikTok - contains data-video-id)
  type: 'learn' | 'do' | 'reference' | null;
  status: 'new' | 'reviewed' | 'pinned' | 'deleted';
  xpEarned: number;          // Computed field from API
  source: string | null;     // e.g., "twitter.com", "linkedin.com", "tiktok.com"
  author: string | null;     // e.g., "@elonmusk"
  category: string | null;   // e.g., "tech", "productivity"
  isInFocusArea: boolean;    // true if matches user's focus goals
  createdAt: string;         // ISO Date string
}

// User Stats from API
export interface UserStats {
  totalXp: number;
  currentStreak: number;
  level: number;
}

// Pagination metadata - matches production API
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

// API Response types - matches production API
export interface ItemsResponse {
  ok: boolean;
  data: Item[];
  meta: PaginationMeta;
}

// Source types for filtering
export type SourceType = 'all' | 'twitter' | 'instagram' | 'linkedin' | 'tiktok' | 'youtube' | 'reddit' | 'newsletter' | 'other';

// Status filter types
export type StatusFilter = 'all' | 'new' | 'reviewed' | 'pinned';

// Content type for filtering
export type ContentType = 'all' | 'learn' | 'do' | 'reference';
