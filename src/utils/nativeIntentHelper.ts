/**
 * Universal Native Intent Helper for 'সিলেট মানব সেবা সংগঠন'
 * 
 * Provides bulletproof native SMS and Call dispatching across:
 * - Android (Chrome, Samsung Internet, WebViews, In-App Browsers)
 * - iOS (Safari, WebKit WebViews)
 * - PWAs, Desktop browsers, and iframe-embedded preview environments
 * 
 * Guarantees that:
 * 1. window.location.href is NEVER navigated to custom protocols, preventing net::ERR_UNKNOWN_URL_SCHEME.
 * 2. Proper multi-recipient formatting is used for both Android and iOS.
 * 3. Native applications (SMS client, Phone dialer) are launched directly without breaking web views.
 */

/**
 * Normalizes a Bangladeshi or international phone number for dialing and SMS.
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('8801') && cleaned.length === 13) {
    cleaned = '+' + cleaned;
  } else if (cleaned.startsWith('01') && cleaned.length === 11) {
    cleaned = '0' + cleaned.substring(1);
  }
  return cleaned;
}

/**
 * Detects if the current client is iOS (iPhone/iPad/iPod or iPadOS).
 */
export function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isApple = /iPad|iPhone|iPod/.test(ua);
  const isIPadOS = navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1;
  return isApple || isIPadOS;
}

/**
 * Detects if the current client is Android.
 */
export function isAndroidDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent || '');
}

/**
 * Builds the native Universal SMS URI scheme.
 * - iOS format: sms:number1,number2&body=message
 * - Android / RFC 5724 format: sms:number1,number2?body=message
 */
export function buildUniversalSmsUri(
  phoneOrPhones: string | string[],
  body: string = ''
): string {
  const list = (Array.isArray(phoneOrPhones) ? phoneOrPhones : [phoneOrPhones])
    .map(p => sanitizePhone(p))
    .filter(Boolean);

  const isIOS = isIOSDevice();
  const joinedPhones = list.join(',');
  const encodedBody = body ? encodeURIComponent(body) : '';

  // Parameter separator: iOS requires '&body=', standard RFC 5724/Android requires '?body='
  const separator = isIOS ? '&' : '?';

  if (!encodedBody) {
    return joinedPhones ? `sms:${joinedPhones}` : 'sms:';
  }

  if (!joinedPhones) {
    return isIOS ? `sms:&body=${encodedBody}` : `sms:?body=${encodedBody}`;
  }

  return `sms:${joinedPhones}${separator}body=${encodedBody}`;
}

/**
 * Builds the native Universal Telephone Dialing URI scheme.
 * e.g. tel:01811XXXXXX or tel:+8801811XXXXXX
 */
export function buildUniversalTelUri(phone: string): string {
  const cleaned = sanitizePhone(phone);
  return `tel:${cleaned}`;
}

/**
 * Universal Native Intent Dispatcher.
 * 
 * CRITICAL SAFETY MECHANISM:
 * Standard window.location.href = "sms:..." or target="_self" navigation causes
 * Chromium WebViews and iframes to crash with net::ERR_UNKNOWN_URL_SCHEME.
 * 
 * To safely launch the device's native app without navigating the webview frame:
 * 1. We create an ephemeral anchor element with target="_blank" and rel="noopener noreferrer external".
 * 2. We programmatically dispatch a synthetic MouseEvent.
 * 3. The underlying OS (Android Intent / iOS URL Handler) intercepts the custom protocol
 *    and launches the native SMS or Phone app directly.
 * 4. The current web application frame remains completely untouched and responsive.
 */
export function launchNativeUri(uri: string): boolean {
  if (typeof window === 'undefined' || !uri) return false;

  try {
    const a = document.createElement('a');
    a.href = uri;
    // target="_blank" guarantees the current frame is not navigated
    a.target = '_blank';
    a.rel = 'noopener noreferrer external';
    a.style.display = 'none';
    a.setAttribute('aria-hidden', 'true');
    document.body.appendChild(a);

    // Synthetic click event
    const clickEvent = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true,
    });
    a.dispatchEvent(clickEvent);

    // Clean up from DOM
    setTimeout(() => {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
    }, 600);

    return true;
  } catch (err) {
    console.warn('Native URI launch via anchor click encountered error, trying safe window.open:', err);
    try {
      const win = window.open(uri, '_blank', 'noopener,noreferrer');
      if (win) {
        setTimeout(() => {
          try {
            win.close();
          } catch {}
        }, 500);
      }
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Universal helper to trigger native SMS with pre-filled message and recipient(s).
 * Safely copies text to clipboard as an instant backup and launches the native SMS app.
 */
export function triggerNativeSms(
  phoneOrPhones: string | string[],
  body: string = ''
): boolean {
  const uri = buildUniversalSmsUri(phoneOrPhones, body);

  // Copy text to clipboard as a helpful backup for the user
  if (body && typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(body).catch(() => {});
  }

  return launchNativeUri(uri);
}

/**
 * Universal helper to trigger native Phone Call / Dialer.
 */
export function triggerNativeCall(phone: string): boolean {
  if (!phone) return false;
  const uri = buildUniversalTelUri(phone);
  return launchNativeUri(uri);
}

/**
 * Universal helper to trigger native Multi-Recipient Group SMS.
 */
export function triggerNativeGroupSms(
  phones: string[],
  body: string
): boolean {
  const validPhones = phones.map(p => sanitizePhone(p)).filter(Boolean);
  if (validPhones.length === 0 && !body) return false;

  // Also copy numbers list and text to clipboard for user convenience
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    if (body) {
      navigator.clipboard.writeText(body).catch(() => {});
    }
  }

  return triggerNativeSms(validPhones, body);
}
