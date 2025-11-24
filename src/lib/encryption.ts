/**
 * Token encryption utilities for secure storage of OAuth tokens
 * Uses AES-256-GCM encryption with a secret key from environment
 */

import * as crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits
const ENCODING = "hex" as const;

/**
 * Get the encryption key from environment
 * Key must be 32 bytes (256 bits) for AES-256
 */
function getEncryptionKey(): Buffer {
  const key = process.env.TOKEN_ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY environment variable is required for token encryption. " +
      "Generate one with: openssl rand -hex 32"
    );
  }

  // If key is in hex format (64 characters for 32 bytes)
  if (key.length === 64) {
    return Buffer.from(key, "hex");
  }

  // If key is raw 32 bytes
  if (key.length === 32) {
    return Buffer.from(key, "utf8");
  }

  throw new Error(
    "TOKEN_ENCRYPTION_KEY must be either 64 hex characters or 32 raw characters"
  );
}

/**
 * Encrypt a token string
 * Returns a string in format: iv:encrypted:tag
 */
export function encryptToken(plaintext: string): string {
  if (!plaintext) {
    throw new Error("Cannot encrypt empty token");
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", ENCODING);
  encrypted += cipher.final(ENCODING);

  const tag = cipher.getAuthTag();

  // Combine iv, encrypted data, and auth tag
  return `${iv.toString(ENCODING)}:${encrypted}:${tag.toString(ENCODING)}`;
}

/**
 * Decrypt a token string
 * Expects format: iv:encrypted:tag
 */
export function decryptToken(encryptedToken: string): string {
  if (!encryptedToken) {
    throw new Error("Cannot decrypt empty token");
  }

  const parts = encryptedToken.split(":");

  if (parts.length !== 3) {
    throw new Error("Invalid encrypted token format");
  }

  const [ivHex, encrypted, tagHex] = parts;

  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, ENCODING);
  const tag = Buffer.from(tagHex, ENCODING);

  if (iv.length !== IV_LENGTH) {
    throw new Error("Invalid IV length");
  }

  if (tag.length !== TAG_LENGTH) {
    throw new Error("Invalid auth tag length");
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, ENCODING, "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Check if a string appears to be an encrypted token
 * (Has the correct format: iv:data:tag in hex)
 */
export function isEncryptedToken(value: string): boolean {
  if (!value) return false;

  const parts = value.split(":");
  if (parts.length !== 3) return false;

  const [iv, , tag] = parts;

  // IV should be 32 hex chars (16 bytes)
  // Tag should be 32 hex chars (16 bytes)
  return iv.length === 32 && tag.length === 32;
}

/**
 * Generate a new encryption key for TOKEN_ENCRYPTION_KEY
 * Run this once to generate a key: npx tsx -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString("hex");
}
