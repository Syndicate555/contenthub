// ContentHub Types

export type ItemStatus = "new" | "reviewed" | "pinned" | "deleted";

export type ItemType = "learn" | "do" | "reference";

export type ItemCategory =
  | "tech"
  | "business"
  | "design"
  | "productivity"
  | "learning"
  | "lifestyle"
  | "entertainment"
  | "news"
  | "other";

export const ITEM_CATEGORIES: {
  value: ItemCategory;
  label: string;
  icon: string;
}[] = [
  { value: "tech", label: "Technology", icon: "Cpu" },
  { value: "business", label: "Business", icon: "Briefcase" },
  { value: "design", label: "Design", icon: "Palette" },
  { value: "productivity", label: "Productivity", icon: "Zap" },
  { value: "learning", label: "Learning", icon: "GraduationCap" },
  { value: "lifestyle", label: "Lifestyle", icon: "Heart" },
  { value: "entertainment", label: "Entertainment", icon: "Film" },
  { value: "news", label: "News", icon: "Newspaper" },
  { value: "other", label: "Other", icon: "Folder" },
];

export interface CreateItemInput {
  url: string;
  note?: string;
}

export interface UpdateItemInput {
  status?: ItemStatus;
  tags?: string[];
  note?: string;
  category?: ItemCategory;
}

export interface ItemsQueryParams {
  q?: string;
  status?: ItemStatus | "all";
  tag?: string;
  category?: ItemCategory;
  platform?: string;
  page?: number;
  limit?: number;
}

export interface SummarizerOutput {
  title: string;
  summary: string[];
  tags: string[];
  type: ItemType;
  category: ItemCategory;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  meta?: PaginationMeta;
}

export interface CategoryCount {
  category: ItemCategory;
  count: number;
  thumbnails: string[];
}
