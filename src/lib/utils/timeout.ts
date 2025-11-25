/**
 * Wraps a promise with a timeout and optional fallback value
 * Prevents long-running external requests from blocking the application
 *
 * @param promise - The promise to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @param fallback - Optional fallback value to return on timeout
 * @returns The promise result or fallback value
 * @throws Error if promise times out and no fallback is provided
 *
 * @example
 * ```ts
 * // With fallback
 * const metadata = await withTimeout(
 *   fetch(url),
 *   5000,
 *   { title: url, description: '' }
 * );
 *
 * // Without fallback (throws on timeout)
 * const data = await withTimeout(
 *   fetch(url),
 *   5000
 * );
 * ```
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallback?: T
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error(`Request timeout after ${timeoutMs}ms`)),
      timeoutMs
    )
  );

  try {
    return await Promise.race([promise, timeoutPromise]);
  } catch (error) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw error;
  }
}

/**
 * Wraps a fetch request with both AbortSignal timeout and Promise timeout
 * Provides double protection against hanging requests
 *
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param timeoutMs - Timeout in milliseconds (default: 5000)
 * @returns Fetch response
 *
 * @example
 * ```ts
 * const response = await fetchWithTimeout('https://example.com/api', {
 *   method: 'POST',
 *   body: JSON.stringify(data)
 * }, 3000);
 * ```
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 5000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Fetch timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
}
