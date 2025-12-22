import { z } from "zod";

// Category enum
export const categoryEnum = z.enum([
  "tech",
  "business",
  "design",
  "productivity",
  "learning",
  "lifestyle",
  "entertainment",
  "news",
  "other",
  "finance",
  "philosophy",
  "economics",
  "fashion",
  "travel",
]);

// Create item schema
export const createItemSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  note: z.string().max(500).optional(),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;

// Update item schema
export const updateItemSchema = z.object({
  status: z.enum(["new", "reviewed", "pinned", "deleted"]).optional(),
  tags: z.array(z.string()).optional(),
  note: z.string().max(500).optional(),
  category: categoryEnum.optional(),
});

export type UpdateItemInput = z.infer<typeof updateItemSchema>;

// Query params schema with pagination
export const itemsQuerySchema = z.object({
  q: z.string().optional(),
  status: z.enum(["new", "reviewed", "pinned", "deleted", "all"]).optional(),
  tag: z.union([z.string(), z.array(z.string())]).optional(),
  category: z.union([categoryEnum, z.array(categoryEnum)]).optional(),
  platform: z.union([z.string(), z.array(z.string())]).optional(),
  author: z.union([z.string(), z.array(z.string())]).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(16),
});

export type ItemsQueryParams = z.infer<typeof itemsQuerySchema>;

// Quick add schema (includes bearer token validation)
export const quickAddSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  note: z.string().max(500).optional(),
});
