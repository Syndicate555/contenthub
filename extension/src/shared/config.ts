/**
 * Shared configuration for the Tavlo extension
 */

/**
 * Get the base URL for the Tavlo web app
 * - Development: http://localhost:3000 (or VITE_API_URL)
 * - Production: https://tavlo.ca
 */
export function getWebAppUrl(): string {
  const apiUrl =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.MODE === "production"
      ? "https://tavlo.ca"
      : "http://localhost:3000");

  return apiUrl;
}

/**
 * Get the API base URL for backend requests
 * Same as web app URL for now
 */
export function getApiBaseUrl(): string {
  return getWebAppUrl();
}
