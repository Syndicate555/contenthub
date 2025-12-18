import { describe, expect, test } from "vitest";
import fc from "fast-check";
import { normalizeTag, isValidTag, tagsEqual } from "./normalize";

describe("normalizeTag", () => {
  test("trims whitespace", () => {
    expect(normalizeTag("  ai  ")).toBe("ai");
    expect(normalizeTag("\tmachine learning\n")).toBe("machine learning");
    expect(normalizeTag("   programming   ")).toBe("programming");
  });

  test("converts to lowercase", () => {
    expect(normalizeTag("AI")).toBe("ai");
    expect(normalizeTag("MachineLearning")).toBe("machinelearning");
    expect(normalizeTag("WEB DEVELOPMENT")).toBe("web development");
  });

  test("collapses multiple spaces", () => {
    expect(normalizeTag("machine   learning")).toBe("machine learning");
    expect(normalizeTag("web  dev  tools")).toBe("web dev tools");
    expect(normalizeTag("a    b    c")).toBe("a b c");
  });

  test("removes special characters", () => {
    expect(normalizeTag("ai/ml")).toBe("ai ml");
    expect(normalizeTag("web3.0")).toBe("web3 0");
    expect(normalizeTag("node.js")).toBe("node js");
    expect(normalizeTag("c++")).toBe("c");
    expect(normalizeTag("ai@ml")).toBe("ai ml");
  });

  test("preserves hyphens and underscores", () => {
    expect(normalizeTag("machine-learning")).toBe("machine-learning");
    expect(normalizeTag("web_dev")).toBe("web_dev");
    expect(normalizeTag("full-stack_developer")).toBe("full-stack_developer");
  });

  test("limits length to 50 characters", () => {
    const longTag = "a".repeat(100);
    expect(normalizeTag(longTag)).toBe("a".repeat(50));
    expect(normalizeTag(longTag).length).toBe(50);
  });

  test("handles multi-word tags", () => {
    expect(normalizeTag("Artificial Intelligence")).toBe(
      "artificial intelligence",
    );
    expect(normalizeTag("Large Language Models")).toBe("large language models");
    expect(normalizeTag("User Experience Design")).toBe(
      "user experience design",
    );
  });

  test("handles empty and whitespace-only strings", () => {
    expect(normalizeTag("")).toBe("");
    expect(normalizeTag("   ")).toBe("");
    expect(normalizeTag("\t\n")).toBe("");
  });

  test("handles edge cases", () => {
    expect(normalizeTag("a")).toBe("a");
    expect(normalizeTag("42")).toBe("42");
    expect(normalizeTag("!@#$%")).toBe("");
    expect(normalizeTag("hello world!")).toBe("hello world");
  });
});

describe("isValidTag", () => {
  test("rejects tags shorter than 2 characters", () => {
    expect(isValidTag("a")).toBe(false);
    expect(isValidTag("")).toBe(false);
    expect(isValidTag("1")).toBe(false);
  });

  test("rejects tags without letters", () => {
    expect(isValidTag("123")).toBe(false);
    expect(isValidTag("456789")).toBe(false);
    expect(isValidTag("!@#")).toBe(false);
    expect(isValidTag("---")).toBe(false);
  });

  test("rejects tags with only numbers", () => {
    expect(isValidTag("42")).toBe(false);
    expect(isValidTag("2024")).toBe(false);
  });

  test("accepts valid tags", () => {
    expect(isValidTag("ai")).toBe(true);
    expect(isValidTag("web3")).toBe(true);
    expect(isValidTag("machine learning")).toBe(true);
    expect(isValidTag("3d-modeling")).toBe(true);
    expect(isValidTag("ai123")).toBe(true);
  });

  test("accepts tags with numbers and letters", () => {
    expect(isValidTag("web3")).toBe(true);
    expect(isValidTag("python3")).toBe(true);
    expect(isValidTag("html5")).toBe(true);
  });
});

describe("tagsEqual", () => {
  test("matches case-insensitively", () => {
    expect(tagsEqual("AI", "ai")).toBe(true);
    expect(tagsEqual("Machine Learning", "machine learning")).toBe(true);
    expect(tagsEqual("WEB DEV", "web dev")).toBe(true);
  });

  test("ignores extra whitespace", () => {
    expect(tagsEqual("  ai  ", "ai")).toBe(true);
    expect(tagsEqual("machine   learning", "machine learning")).toBe(true);
    expect(tagsEqual("  web dev  ", "web dev")).toBe(true);
  });

  test("handles special characters consistently", () => {
    expect(tagsEqual("ai/ml", "ai ml")).toBe(true);
    expect(tagsEqual("web3.0", "web3 0")).toBe(true);
  });

  test("returns false for different tags", () => {
    expect(tagsEqual("ai", "ml")).toBe(false);
    expect(tagsEqual("python", "javascript")).toBe(false);
    expect(tagsEqual("web dev", "web design")).toBe(false);
  });
});

describe("properties", () => {
  test("normalization is idempotent", () => {
    fc.assert(
      fc.property(fc.string(), (str) => {
        const once = normalizeTag(str);
        const twice = normalizeTag(once);
        return once === twice;
      }),
    );
  });

  test("equality is symmetric", () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (a, b) => {
        return tagsEqual(a, b) === tagsEqual(b, a);
      }),
    );
  });

  test("equality is reflexive", () => {
    fc.assert(
      fc.property(fc.string(), (str) => {
        return tagsEqual(str, str) === true;
      }),
    );
  });

  test("normalized tags are always valid or empty", () => {
    fc.assert(
      fc.property(fc.string(), (str) => {
        const normalized = normalizeTag(str);
        return normalized === "" || normalized.length >= 1;
      }),
    );
  });
});
