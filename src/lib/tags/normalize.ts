/**
 * Tag normalization utilities for standardized tagging system.
 *
 * Provides functions to normalize tag strings for consistent storage and matching.
 * Follows these rules:
 * 1. Trim whitespace
 * 2. Convert to lowercase
 * 3. Collapse multiple spaces to single space
 * 4. Remove special characters except hyphens and underscores
 * 5. Limit length to 50 characters
 */

/**
 * Normalize a tag string for matching and storage.
 *
 * @param rawTag - The raw tag string to normalize
 * @returns Normalized tag string
 *
 * @example
 * normalizeTag("  Machine Learning  ") // "machine learning"
 * normalizeTag("AI/ML") // "ai ml"
 * normalizeTag("Web3.0") // "web3 0"
 */
export function normalizeTag(rawTag: string): string {
  return rawTag
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ") // Replace special chars with space (keep hyphens, underscores, alphanumeric)
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .trim()
    .slice(0, 50); // Limit length
}

/**
 * Validate if a normalized tag is acceptable.
 *
 * Rules:
 * - Must be at least 2 characters
 * - Must contain at least one letter
 * - Cannot be only numbers
 *
 * @param normalizedTag - The normalized tag to validate
 * @returns True if tag is valid, false otherwise
 *
 * @example
 * isValidTag("ai") // true
 * isValidTag("a") // false (too short)
 * isValidTag("123") // false (no letters)
 */
export function isValidTag(normalizedTag: string): boolean {
  if (normalizedTag.length < 2) return false;
  if (!/[a-z]/.test(normalizedTag)) return false; // Must contain a letter
  if (/^\d+$/.test(normalizedTag)) return false; // Cannot be only numbers
  return true;
}

/**
 * Compare two tags for equality using case-insensitive exact match.
 *
 * @param tag1 - First tag to compare
 * @param tag2 - Second tag to compare
 * @returns True if tags are equal after normalization
 *
 * @example
 * tagsEqual("AI", "ai") // true
 * tagsEqual("Machine Learning", "machine learning") // true
 * tagsEqual("  ai  ", "ai") // true
 */
export function tagsEqual(tag1: string, tag2: string): boolean {
  return normalizeTag(tag1) === normalizeTag(tag2);
}
