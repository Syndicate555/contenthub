/**
 * TypeScript type definitions for the Tavlo extension
 * Mirrors types from the main Tavlo application
 */

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Request body for creating a new item
 */
export type CreateItemInput = {
  url: string;
  note?: string;
};

/**
 * Success response from /api/items POST
 */
export type CreateItemSuccessResponse = {
  ok: true;
  data: Item;
  newBadges?: Badge[];
};

/**
 * Error response from API
 */
export type ErrorResponse = {
  ok: false;
  error: string;
  details?: unknown;
};

/**
 * Combined API response type
 */
export type ApiResponse<T> =
  | { ok: true; data: T; newBadges?: Badge[] }
  | ErrorResponse;

// ============================================================================
// Domain Models
// ============================================================================

/**
 * Item categories
 */
export type Category =
  | "tech"
  | "business"
  | "design"
  | "productivity"
  | "learning"
  | "lifestyle"
  | "entertainment"
  | "news"
  | "other"
  | "finance"
  | "philosophy"
  | "economics"
  | "fashion"
  | "travel";

/**
 * Item status values
 */
export type ItemStatus = "new" | "reviewed" | "pinned" | "deleted";

/**
 * Content types
 */
export type ContentType =
  | "article"
  | "video"
  | "social"
  | "document"
  | "image"
  | "other";

/**
 * Domain (platform) information
 */
export type Domain = {
  id: string;
  name: string;
  displayName: string | null;
  icon: string | null;
  color: string | null;
};

/**
 * Tag information
 */
export type Tag = {
  id: string;
  displayName: string;
};

/**
 * Item (saved link/content)
 */
export type Item = {
  id: string;
  url: string;
  title: string | null;
  summary: string | null;
  author: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  documentUrl: string | null;
  embedHtml: string | null;
  category: Category | null;
  type: ContentType;
  tags: string[]; // Legacy field
  note: string | null;
  source: string | null;
  status: ItemStatus;
  domainId: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  domain: Domain | null;
  itemTags?: { tag: Tag }[];
};

/**
 * Badge (gamification)
 */
export type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  level: number;
  earnedAt?: string;
};

// ============================================================================
// Extension State Types
// ============================================================================

/**
 * Extension authentication state
 */
export type AuthState = {
  isAuthenticated: boolean;
  token: string | null;
  userEmail: string | null;
};

/**
 * Current screen in the popup
 */
export type PopupScreen = "login" | "save" | "success" | "error";

/**
 * Extension popup state
 */
export type ExtensionState = {
  screen: PopupScreen;
  currentUrl: string | null;
  currentTitle: string | null;
  isLoading: boolean;
  error: string | null;
  lastSavedItem: Item | null;
  earnedBadges: Badge[];
};

/**
 * Result from save operation
 */
export type SaveResult = {
  success: boolean;
  item?: Item;
  badges?: Badge[];
  error?: string;
};

/**
 * Platform detection result
 */
export type PlatformInfo = {
  name: string;
  displayName: string;
  icon: string | null;
  color: string | null;
};
