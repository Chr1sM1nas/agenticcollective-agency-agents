type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

export function trackEvent(event: string, payload: AnalyticsPayload = {}): void {
  if (typeof window === 'undefined') return;

  const normalizedPayload = {
    ...payload,
    timestamp: new Date().toISOString(),
  };

  // Safe no-op style analytics sink for local/dev. Replace with Segment/GA/Amplitude later.
  window.dispatchEvent(new CustomEvent('fanzone:analytics', { detail: { event, payload: normalizedPayload } }));

  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isLocalhost) {
    // eslint-disable-next-line no-console
    console.info('[analytics]', event, normalizedPayload);
  }
}
