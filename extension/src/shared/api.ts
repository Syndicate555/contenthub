/**
 * API client for the Tavlo extension
 * Handles all communication with the Tavlo backend
 */

import type {
  CreateItemInput,
  ApiResponse,
  Item,
  SaveResult,
} from "./types";
import { getApiBaseUrl } from "./config";

// API base URL - uses environment or defaults
// In production, use tavlo.ca; in development, use localhost
const API_BASE_URL = getApiBaseUrl();

// API endpoint for extension - uses Bearer token authentication
const ITEMS_ENDPOINT = `${API_BASE_URL}/api/items/extension`;

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Make an authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit & { token?: string },
): Promise<ApiResponse<T>> {
  const { token, ...fetchOptions } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...fetchOptions.headers,
  };

  // Add authorization header if token provided
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(endpoint, {
      ...fetchOptions,
      headers,
      credentials: "include", // Include cookies (not strictly needed with Bearer token)
    });

    const data = await response.json();

    // Handle non-2xx responses
    if (!response.ok) {
      throw new ApiError(
        data.error || "Request failed",
        response.status,
        data.details,
      );
    }

    return data;
  } catch (error) {
    // Network errors or JSON parse errors
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      error instanceof Error ? error.message : "Network request failed",
    );
  }
}

/**
 * Validate authentication token
 * Makes a test request to check if token is valid
 */
export async function validateToken(token: string): Promise<boolean> {
  try {
    // Make a simple GET request to verify token
    // Extension endpoint doesn't support GET, so we check the response
    const response = await fetch(`${API_BASE_URL}/api/items`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    // 200 = valid token, 401 = invalid/expired
    return response.status === 200;
  } catch (error) {
    // Network errors should not invalidate the token
    console.warn("Token validation failed due to network error:", error);
    return true; // Assume token is valid if we can't reach the server
  }
}

/**
 * Save an item to Tavlo
 */
export async function saveItem(
  url: string,
  note: string | undefined,
  token: string,
): Promise<SaveResult> {
  try {
    const input: CreateItemInput = {
      url,
      note,
    };

    const response = await apiRequest<Item>(ITEMS_ENDPOINT, {
      method: "POST",
      token,
      body: JSON.stringify(input),
    });

    if (response.ok) {
      return {
        success: true,
        item: response.data,
        badges: response.newBadges,
      };
    } else {
      return {
        success: false,
        error: response.error,
      };
    }
  } catch (error) {
    let errorMessage = "Failed to save item";

    if (error instanceof ApiError) {
      // Handle specific error cases
      if (error.statusCode === 401) {
        errorMessage = "Session expired. Please log in again.";
      } else if (error.statusCode === 429) {
        errorMessage = "Too many saves. Please try again in a few minutes.";
      } else if (error.statusCode === 403) {
        errorMessage = error.message; // Demo mode or other permission issue
      } else {
        errorMessage = error.message;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get current user info (for displaying in extension)
 * Note: This will be implemented in a future phase
 */
export async function getCurrentUser(token: string) {
  // TODO: Implement /api/user endpoint
  // For now, return minimal info
  return {
    id: "user",
    email: null,
  };
}
