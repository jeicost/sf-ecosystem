// TikTok Pixel event tracking
// All events flow through here — easy to audit, easy to disable

export type TikTokEventType =
  | 'PageView'
  | 'ViewContent'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'CompletePayment'
  | 'Contact';

interface TikTokEventData {
  content_name?: string;
  content_type?: string;
  value?: number;
  currency?: string;
  [key: string]: unknown;
}

declare global {
  interface Window {
    ttq?: {
      track: (event: TikTokEventType, data?: TikTokEventData) => void;
      page: () => void;
      [key: string]: unknown;
    };
  }
}

export function trackTikTokEvent(event: TikTokEventType, data?: TikTokEventData) {
  if (typeof window === 'undefined' || !window.ttq) {
    console.warn('[TikTok Pixel] ttq not loaded yet');
    return;
  }

  try {
    window.ttq.track(event, data);
    console.debug(`[TikTok Pixel] Tracked: ${event}`, data);
  } catch (error) {
    console.error('[TikTok Pixel] Error tracking event:', error);
  }
}
