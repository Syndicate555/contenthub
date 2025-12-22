import { describe, expect, test } from "vitest";
import { extractYoutubeVideoId } from "./extractor";

describe("extractYoutubeVideoId", () => {
  const validVideoId = "dQw4w9WgXcQ";

  // REGRESSION TESTS - Ensure existing formats still work
  describe("standard YouTube formats", () => {
    test("extracts ID from standard watch URL", () => {
      expect(
        extractYoutubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
      ).toBe(validVideoId);
    });

    test("extracts ID from standard watch URL without www", () => {
      expect(
        extractYoutubeVideoId("https://youtube.com/watch?v=dQw4w9WgXcQ"),
      ).toBe(validVideoId);
    });

    test("extracts ID from youtu.be short URL", () => {
      expect(extractYoutubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe(
        validVideoId,
      );
    });

    test("extracts ID from embed URL", () => {
      expect(
        extractYoutubeVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ"),
      ).toBe(validVideoId);
    });

    test("extracts ID from /v/ URL", () => {
      expect(
        extractYoutubeVideoId("https://www.youtube.com/v/dQw4w9WgXcQ"),
      ).toBe(validVideoId);
    });

    test("extracts ID from URL with query params", () => {
      expect(
        extractYoutubeVideoId(
          "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s",
        ),
      ).toBe(validVideoId);
    });

    test("extracts ID from URL with multiple query params", () => {
      expect(
        extractYoutubeVideoId(
          "https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ&list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf",
        ),
      ).toBe(validVideoId);
    });

    test("extracts ID from URL with hash fragment", () => {
      expect(
        extractYoutubeVideoId(
          "https://www.youtube.com/watch?v=dQw4w9WgXcQ#t=5",
        ),
      ).toBe(validVideoId);
    });
  });

  // NEW SHORTS TESTS
  describe("YouTube Shorts formats", () => {
    test("extracts ID from Shorts URL", () => {
      expect(
        extractYoutubeVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ"),
      ).toBe(validVideoId);
    });

    test("extracts ID from Shorts URL without www", () => {
      expect(
        extractYoutubeVideoId("https://youtube.com/shorts/dQw4w9WgXcQ"),
      ).toBe(validVideoId);
    });

    test("extracts ID from Shorts URL with query params", () => {
      expect(
        extractYoutubeVideoId(
          "https://www.youtube.com/shorts/dQw4w9WgXcQ?feature=share",
        ),
      ).toBe(validVideoId);
    });

    test("extracts ID from Shorts URL with hash", () => {
      expect(
        extractYoutubeVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ#t=5"),
      ).toBe(validVideoId);
    });

    test("extracts ID from Shorts URL with trailing slash", () => {
      expect(
        extractYoutubeVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ/"),
      ).toBe(validVideoId);
    });
  });

  // EDGE CASES
  describe("edge cases and invalid inputs", () => {
    test("returns null for Shorts URL with invalid ID length (too short)", () => {
      expect(
        extractYoutubeVideoId("https://www.youtube.com/shorts/short"),
      ).toBe(null);
    });

    test("returns null for Shorts URL with invalid ID length (too long)", () => {
      expect(
        extractYoutubeVideoId(
          "https://www.youtube.com/shorts/thisIsWayTooLong",
        ),
      ).toBe(null);
    });

    test("returns null for watch URL with invalid ID length", () => {
      expect(
        extractYoutubeVideoId("https://www.youtube.com/watch?v=short"),
      ).toBe(null);
    });

    test("returns null for empty string", () => {
      expect(extractYoutubeVideoId("")).toBe(null);
    });

    test("returns null for malformed URL", () => {
      expect(extractYoutubeVideoId("not-a-url")).toBe(null);
    });

    test("returns null for YouTube URL without video ID", () => {
      expect(extractYoutubeVideoId("https://www.youtube.com/")).toBe(null);
    });

    test("returns null for YouTube watch URL without v parameter", () => {
      expect(extractYoutubeVideoId("https://www.youtube.com/watch")).toBe(null);
    });
  });
});
