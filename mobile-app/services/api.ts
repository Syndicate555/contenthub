import { Item, ItemsResponse, UserStats } from '../types';

// Production backend URL - MUST use www subdomain for API routes to work
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://www.tavlo.ca';

// API endpoints - matching production backend
const API_ENDPOINTS = {
  items: '/api/items',
};

// Token storage - will be set by the auth context
let authToken: string | null = null;

// Set auth token (called from auth context after Clerk authentication)
export function setAuthToken(token: string | null) {
  authToken = token;
  console.log('[API] Token set:', token ? `${token.substring(0, 20)}...` : 'null');
}

// Get current auth token
export function getAuthToken(): string | null {
  return authToken;
}

// Build headers with auth
function buildHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  return headers;
}

// Generic fetch wrapper with error handling
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BACKEND_URL}${endpoint}`;
  const headers = buildHeaders();

  console.log(`[API] ${options.method || 'GET'} ${url}`);
  console.log(`[API] Auth token present: ${!!authToken}`);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    console.log(`[API] Response status: ${response.status}`);

    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = `API Error: ${response.status}`;
      try {
        const errorData = await response.json();
        console.log('[API] Error response data:', errorData);
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (parseError) {
        console.log('[API] Could not parse error response as JSON');
      }
      
      // Handle 401 Unauthorized
      if (response.status === 401) {
        console.log('[API] Unauthorized - token may be invalid');
        throw new Error('UNAUTHORIZED');
      }
      
      // Handle 404 Not Found
      if (response.status === 404) {
        console.log('[API] Endpoint not found');
        throw new Error('NOT_FOUND');
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('[API] Response data received');
    return data;
  } catch (error) {
    console.error('[API] Fetch error:', error);
    throw error;
  }
}

// ==================== Items API ====================

export interface GetItemsParams {
  page?: number;
  limit?: number;
  status?: 'all' | 'new' | 'reviewed' | 'pinned' | 'deleted';
  source?: string;
  q?: string; // Search query
}

export async function getItems(params: GetItemsParams = {}): Promise<ItemsResponse> {
  const { page = 1, limit = 20, status = 'new', source, q } = params;
  
  const queryParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    status,
  });
  
  if (source && source !== 'all') {
    queryParams.append('source', source);
  }
  
  if (q) {
    queryParams.append('q', q);
  }

  return fetchAPI<ItemsResponse>(`${API_ENDPOINTS.items}?${queryParams}`);
}

export interface CreateItemPayload {
  url: string;
  note?: string;
}

export async function createItem(payload: CreateItemPayload): Promise<Item> {
  return fetchAPI<Item>(API_ENDPOINTS.items, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface UpdateItemPayload {
  status?: 'new' | 'reviewed' | 'pinned' | 'deleted';
  note?: string;
}

export async function updateItem(id: string, payload: UpdateItemPayload): Promise<Item> {
  return fetchAPI<Item>(`${API_ENDPOINTS.items}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteItem(id: string): Promise<void> {
  await fetchAPI<void>(`${API_ENDPOINTS.items}/${id}`, {
    method: 'DELETE',
  });
}

// ==================== User Stats API ====================
// Note: This endpoint may not exist on production - returns mock data as fallback

export async function getUserStats(): Promise<UserStats> {
  // Return default stats since the endpoint doesn't exist on production
  // The gamification data comes from the items themselves
  console.log('[API] getUserStats - returning default stats (endpoint not available)');
  return {
    totalXp: 0,
    currentStreak: 0,
    level: 1,
  };
}

// ==================== Export all ====================

export const api = {
  items: {
    get: getItems,
    create: createItem,
    update: updateItem,
    delete: deleteItem,
  },
  user: {
    getStats: getUserStats,
  },
};
