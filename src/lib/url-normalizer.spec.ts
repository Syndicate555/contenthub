import { describe, expect, test } from "vitest";
import { normalizeUrl, isValidUrl } from "./url-normalizer";

describe("normalizeUrl", () => {
  describe("Twitter/X normalization", () => {
    test("removes /photo/1 suffix", () => {
      const input =
        "https://x.com/DeepPhilo_HQ/status/2005561677954310370/photo/1";
      const expected =
        "https://twitter.com/DeepPhilo_HQ/status/2005561677954310370";
      expect(normalizeUrl(input)).toBe(expected);
    });

    test("removes /photo/2 suffix", () => {
      const input = "https://twitter.com/user/status/123456/photo/2";
      const expected = "https://twitter.com/user/status/123456";
      expect(normalizeUrl(input)).toBe(expected);
    });

    test("removes /photo/3 suffix", () => {
      const input = "https://x.com/user/status/789/photo/3";
      const expected = "https://twitter.com/user/status/789";
      expect(normalizeUrl(input)).toBe(expected);
    });

    test("removes /photo/4 suffix", () => {
      const input = "https://twitter.com/user/status/999/photo/4";
      const expected = "https://twitter.com/user/status/999";
      expect(normalizeUrl(input)).toBe(expected);
    });

    test("removes /video/1 suffix", () => {
      const input = "https://twitter.com/user/status/123456/video/1";
      const expected = "https://twitter.com/user/status/123456";
      expect(normalizeUrl(input)).toBe(expected);
    });

    test("removes /analytics suffix", () => {
      const input = "https://twitter.com/user/status/123456/analytics";
      const expected = "https://twitter.com/user/status/123456";
      expect(normalizeUrl(input)).toBe(expected);
    });

    test("normalizes x.com to twitter.com", () => {
      const input = "https://x.com/user/status/123456";
      const expected = "https://twitter.com/user/status/123456";
      expect(normalizeUrl(input)).toBe(expected);
    });

    test("removes query parameters", () => {
      const input = "https://twitter.com/user/status/123456?s=20&t=abc123";
      const expected = "https://twitter.com/user/status/123456";
      expect(normalizeUrl(input)).toBe(expected);
    });

    test("removes hash fragments", () => {
      const input = "https://twitter.com/user/status/123456#replies";
      const expected = "https://twitter.com/user/status/123456";
      expect(normalizeUrl(input)).toBe(expected);
    });

    test("handles combination: x.com + /photo/1 + query params", () => {
      const input = "https://x.com/user/status/123456/photo/1?s=20&t=abc";
      const expected = "https://twitter.com/user/status/123456";
      expect(normalizeUrl(input)).toBe(expected);
    });

    test("preserves base tweet URL", () => {
      const input =
        "https://twitter.com/DeepPhilo_HQ/status/2005561677954310370";
      const expected =
        "https://twitter.com/DeepPhilo_HQ/status/2005561677954310370";
      expect(normalizeUrl(input)).toBe(expected);
    });
  });

  describe("Instagram normalization", () => {
    test("normalizes post URL", () => {
      const input = "https://www.instagram.com/p/ABC123/";
      const expected = "https://instagram.com/p/ABC123/";
      expect(normalizeUrl(input)).toBe(expected);
    });

    test("normalizes reel URL", () => {
      const input = "https://www.instagram.com/reel/XYZ789/";
      const expected = "https://instagram.com/reel/XYZ789/";
      expect(normalizeUrl(input)).toBe(expected);
    });

    test("removes /embed/ suffix", () => {
      const input = "https://www.instagram.com/p/ABC123/embed/";
      const expected = "https://instagram.com/p/ABC123/";
      expect(normalizeUrl(input)).toBe(expected);
    });

    test("normalizes mobile URL", () => {
      const input = "https://m.instagram.com/p/ABC123/";
      const expected = "https://instagram.com/p/ABC123/";
      expect(normalizeUrl(input)).toBe(expected);
    });

    test("removes query parameters", () => {
      const input = "https://instagram.com/p/ABC123/?utm_source=ig_web";
      const expected = "https://instagram.com/p/ABC123/";
      expect(normalizeUrl(input)).toBe(expected);
    });
  });

  describe("Reddit normalization", () => {
    test("removes context parameter", () => {
      const input = "https://www.reddit.com/r/foo/comments/abc123/?context=3";
      const expected = "https://reddit.com/r/foo/comments/abc123/";
      expect(normalizeUrl(input)).toBe(expected);
    });

    test("normalizes old.reddit.com", () => {
      const input = "https://old.reddit.com/r/foo/comments/abc123/";
      const expected = "https://reddit.com/r/foo/comments/abc123/";
      expect(normalizeUrl(input)).toBe(expected);
    });

    test("normalizes www.reddit.com", () => {
      const input = "https://www.reddit.com/r/foo/comments/abc123/";
      const expected = "https://reddit.com/r/foo/comments/abc123/";
      expect(normalizeUrl(input)).toBe(expected);
    });

    test("removes tracking parameters", () => {
      const input =
        "https://reddit.com/r/foo/comments/abc/?utm_source=share&share_id=xyz";
      const expected = "https://reddit.com/r/foo/comments/abc/";
      expect(normalizeUrl(input)).toBe(expected);
    });
  });

  describe("YouTube normalization", () => {
    test("normalizes youtu.be short URL", () => {
      const input = "https://youtu.be/dQw4w9WgXcQ";
      const expected = "https://youtube.com/watch?v=dQw4w9WgXcQ";
      expect(normalizeUrl(input)).toBe(expected);
    });

    test("normalizes shorts URL", () => {
      const input = "https://youtube.com/shorts/abc123";
      const expected = "https://youtube.com/watch?v=abc123";
      expect(normalizeUrl(input)).toBe(expected);
    });

    test("preserves timestamp parameter", () => {
      const input = "https://youtube.com/watch?v=abc123&t=42s";
      const expected = "https://youtube.com/watch?v=abc123&t=42s";
      expect(normalizeUrl(input)).toBe(expected);
    });

    test("removes tracking parameters but keeps video ID", () => {
      const input =
        "https://youtube.com/watch?v=abc123&si=tracking&feature=share";
      const expected = "https://youtube.com/watch?v=abc123";
      expect(normalizeUrl(input)).toBe(expected);
    });

    test("preserves timestamp while removing tracking", () => {
      const input =
        "https://youtube.com/watch?v=abc&t=10s&si=track&list=playlist";
      const expected = "https://youtube.com/watch?v=abc&t=10s";
      expect(normalizeUrl(input)).toBe(expected);
    });
  });

  describe("TikTok normalization", () => {
    test("normalizes video URL", () => {
      const input = "https://www.tiktok.com/@user/video/1234567890";
      const expected = "https://tiktok.com/@user/video/1234567890";
      expect(normalizeUrl(input)).toBe(expected);
    });

    test("removes query parameters", () => {
      const input =
        "https://tiktok.com/@user/video/123?is_from_webapp=1&sender_device=pc";
      const expected = "https://tiktok.com/@user/video/123";
      expect(normalizeUrl(input)).toBe(expected);
    });

    test("removes /embed suffix", () => {
      const input = "https://www.tiktok.com/@user/video/123/embed/";
      const expected = "https://tiktok.com/@user/video/123";
      expect(normalizeUrl(input)).toBe(expected);
    });
  });

  describe("LinkedIn normalization", () => {
    test("normalizes www.linkedin.com", () => {
      const input = "https://www.linkedin.com/posts/activity-123";
      const expected = "https://linkedin.com/posts/activity-123";
      expect(normalizeUrl(input)).toBe(expected);
    });

    test("removes tracking parameters", () => {
      const input =
        "https://linkedin.com/posts/abc?utm_source=share&trk=public_post";
      const expected = "https://linkedin.com/posts/abc";
      expect(normalizeUrl(input)).toBe(expected);
    });
  });

  describe("Generic URL normalization", () => {
    test("removes common tracking parameters", () => {
      const input =
        "https://example.com/article?utm_source=twitter&utm_medium=social&fbclid=123";
      const expected = "https://example.com/article";
      expect(normalizeUrl(input)).toBe(expected);
    });

    test("removes www prefix", () => {
      const input = "https://www.example.com/article";
      const expected = "https://example.com/article";
      expect(normalizeUrl(input)).toBe(expected);
    });

    test("removes hash fragments", () => {
      const input = "https://example.com/article#comments";
      const expected = "https://example.com/article";
      expect(normalizeUrl(input)).toBe(expected);
    });

    test("handles combination of normalizations", () => {
      const input =
        "https://www.example.com/article?utm_source=fb&ref=share#section";
      const expected = "https://example.com/article";
      expect(normalizeUrl(input)).toBe(expected);
    });
  });

  describe("Edge cases", () => {
    test("returns original URL if parsing fails", () => {
      const invalidUrl = "not-a-valid-url";
      expect(normalizeUrl(invalidUrl)).toBe(invalidUrl);
    });

    test("handles URL with port", () => {
      const input = "https://localhost:3000/article?utm_source=test";
      const expected = "https://localhost:3000/article";
      expect(normalizeUrl(input)).toBe(expected);
    });

    test("handles URL with authentication", () => {
      const input = "https://user:pass@example.com/article?ref=123";
      const expected = "https://user:pass@example.com/article";
      expect(normalizeUrl(input)).toBe(expected);
    });

    test("handles already normalized URL (idempotent)", () => {
      const url = "https://twitter.com/user/status/123";
      expect(normalizeUrl(normalizeUrl(url))).toBe(url);
    });
  });

  describe("Real-world examples from user report", () => {
    test("normalizes exact user-reported problematic URL", () => {
      const input =
        "https://x.com/DeepPhilo_HQ/status/2005561677954310370/photo/1";
      const expected =
        "https://twitter.com/DeepPhilo_HQ/status/2005561677954310370";
      const result = normalizeUrl(input);

      expect(result).toBe(expected);
      // Ensure the normalized URL doesn't contain /photo/1
      expect(result).not.toContain("/photo/");
      // Ensure it's normalized to twitter.com for API compatibility
      expect(result).toContain("twitter.com");
    });

    test("preserves correct base tweet URL from user report", () => {
      const input = "https://x.com/DeepPhilo_HQ/status/2005561677954310370";
      const expected =
        "https://twitter.com/DeepPhilo_HQ/status/2005561677954310370";
      expect(normalizeUrl(input)).toBe(expected);
    });
  });
});

describe("isValidUrl", () => {
  test("returns true for valid HTTP URL", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
  });

  test("returns true for valid HTTPS URL", () => {
    expect(isValidUrl("https://example.com/path")).toBe(true);
  });

  test("returns false for invalid URL", () => {
    expect(isValidUrl("not-a-url")).toBe(false);
  });

  test("returns false for empty string", () => {
    expect(isValidUrl("")).toBe(false);
  });

  test("returns true for localhost", () => {
    expect(isValidUrl("http://localhost:3000")).toBe(true);
  });
});
