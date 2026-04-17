type GtagFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
    dataLayer?: unknown[];
  }
}

export const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function track(event: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  if (!window.gtag) return;
  window.gtag('event', event, params ?? {});
}

export function pageview(url: string) {
  if (typeof window === 'undefined' || !window.gtag || !GA_ID) return;
  window.gtag('config', GA_ID, { page_path: url });
}
