import type { ExtractedContent } from "./extractor";
import type { SummarizerOutput } from "@/types";

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  reason?: string;
}

/**
 * Validates extracted content to ensure it has meaningful data
 * before saving to database and awarding XP
 */
export function validateExtractedContent(
  extracted: ExtractedContent,
): ValidationResult {
  // Check for missing or empty content
  if (!extracted.content || extracted.content.trim().length === 0) {
    return {
      isValid: false,
      error: "Content extraction failed",
      reason: "No content could be extracted from this URL",
    };
  }

  // Check for fallback/error messages in content
  const errorPhrases = [
    "content could not be extracted",
    "tweet content could not be extracted",
    "instagram content could not be extracted",
    "failed to extract",
    "unable to extract",
  ];

  const contentLower = extracted.content.toLowerCase();
  if (errorPhrases.some((phrase) => contentLower.includes(phrase))) {
    return {
      isValid: false,
      error: "Content extraction failed",
      reason: "The content could not be extracted from this URL",
    };
  }

  // Check for "Unknown" author (indicates extraction failure)
  if (extracted.author === "Unknown") {
    return {
      isValid: false,
      error: "Content extraction failed",
      reason: "Unable to identify the author of this content",
    };
  }

  // Check minimum content length (must be at least 20 characters of real content)
  if (extracted.content.trim().length < 20) {
    return {
      isValid: false,
      error: "Insufficient content",
      reason: "The extracted content is too short to be meaningful",
    };
  }

  return { isValid: true };
}

/**
 * Validates summarized content to ensure it contains meaningful data
 */
export function validateSummarizedContent(
  summarized: SummarizerOutput,
): ValidationResult {
  // Check for fallback summaries
  const fallbackPhrases = [
    "content could not be extracted",
    "summarization failed",
    "summary unavailable",
    "image could not be analyzed",
  ];

  const summaryText = summarized.summary.join(" ").toLowerCase();
  if (fallbackPhrases.some((phrase) => summaryText.includes(phrase))) {
    return {
      isValid: false,
      error: "Content processing failed",
      reason: "Unable to generate a meaningful summary for this content",
    };
  }

  // Check for processing failure tags
  const failureTags = ["llm_failed", "processing_failed", "extraction_failed"];
  if (summarized.tags.some((tag) => failureTags.includes(tag))) {
    return {
      isValid: false,
      error: "Content processing failed",
      reason: "The content could not be processed successfully",
    };
  }

  // Check if summary is just a single generic bullet
  if (summarized.summary.length === 1 && summarized.summary[0].length < 30) {
    return {
      isValid: false,
      error: "Insufficient content",
      reason: "The processed content is too minimal to be useful",
    };
  }

  return { isValid: true };
}

/**
 * Validates the complete item data before saving to database
 */
export function validateItemData(
  extracted: ExtractedContent,
  summarized: SummarizerOutput,
): ValidationResult {
  // First validate extracted content
  const extractedValidation = validateExtractedContent(extracted);
  if (!extractedValidation.isValid) {
    return extractedValidation;
  }

  // Then validate summarized content
  const summarizedValidation = validateSummarizedContent(summarized);
  if (!summarizedValidation.isValid) {
    return summarizedValidation;
  }

  return { isValid: true };
}
