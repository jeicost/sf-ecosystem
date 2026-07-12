// Meta Pixel event tracking
// All events flow through here — easy to audit, easy to disable

export type PixelEventType =
  | 'PageView'
  | 'ViewContent'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'Purchase'
  | 'Contact';

interface PixelEventData {
  content_name?: string;
  content_type?: string;
  value?: number;
  currency?: string;
  [key: string]: unknown;
}

declare global {
  interface Window {
    fbq?: (action: string, event: PixelEventType, data?: PixelEventData) => void;
  }
}

export function trackPixelEvent(event: PixelEventType, data?: PixelEventData) {
  if (typeof window === 'undefined' || !window.fbq) {
    console.warn('[Meta Pixel] fbq not loaded yet');
    return;
  }

  try {
    window.fbq('track', event, data);
    console.debug(`[Meta Pixel] Tracked: ${event}`, data);
  } catch (error) {
    console.error('[Meta Pixel] Error tracking event:', error);
  }
}
