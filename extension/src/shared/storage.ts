/**
 * Chrome storage utilities for the Tavlo extension
 * Manages authentication tokens and extension state
 */

const STORAGE_KEYS = {
  AUTH_TOKEN: "tavlo_auth_token",
  USER_EMAIL: "tavlo_user_email",
} as const;

/**
 * Store authentication token in Chrome sync storage
 * Syncs across devices where user is signed into Chrome
 */
export async function setToken(token: string): Promise<void> {
  await chrome.storage.sync.set({ [STORAGE_KEYS.AUTH_TOKEN]: token });
}

/**
 * Retrieve authentication token from Chrome sync storage
 * Returns null if no token is stored
 */
export async function getToken(): Promise<string | null> {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.AUTH_TOKEN);
  return result[STORAGE_KEYS.AUTH_TOKEN] || null;
}

/**
 * Clear authentication token from storage (logout)
 */
export async function clearToken(): Promise<void> {
  await chrome.storage.sync.remove(STORAGE_KEYS.AUTH_TOKEN);
}

/**
 * Store user email for display purposes
 */
export async function setUserEmail(email: string): Promise<void> {
  await chrome.storage.sync.set({ [STORAGE_KEYS.USER_EMAIL]: email });
}

/**
 * Retrieve stored user email
 */
export async function getUserEmail(): Promise<string | null> {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.USER_EMAIL);
  return result[STORAGE_KEYS.USER_EMAIL] || null;
}

/**
 * Clear all extension data (complete logout)
 */
export async function clearAllData(): Promise<void> {
  await chrome.storage.sync.clear();
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken();
  return token !== null && token.length > 0;
}
