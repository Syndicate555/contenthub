// Analytics stub - Phase 3 will integrate with PostHog/GA

export function trackEvent(eventName, properties = {}) {
  console.log(`[Analytics] ${eventName}`, properties);
  
  // Stub for future implementation
  // window.posthog?.capture(eventName, properties);
  // window.gtag?.('event', eventName, properties);
}

export function trackPageView(page) {
  trackEvent('page_view', { page });
}

export function trackSectionView(section) {
  trackEvent('section_view', { section });
}
