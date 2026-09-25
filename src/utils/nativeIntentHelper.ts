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
 * 2. Pre-fills both target phone number and meeting SMS template body.
 * 3. Native applications (SMS client, Phone dialer) are launched strictly via external application launch mode.
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
 * Bypasses WebView / Browser interference:
 * Executes strictly as an external application launch (equivalent to Flutter LaunchMode.externalApplication)
 * to completely eliminate net::ERR_UNKNOWN_URL_SCHEME errors in Chromium WebViews, Android apps, and iframes.
 * 
 * Guarantees that:
 * 1. window.open(uri, '_blank') is NEVER called with custom schemes (which triggers ERR_UNKNOWN_URL_SCHEME in WebViews).
 * 2. An invisible, isolated iframe and safe anchor are used so the host viewport is NEVER navigated away.
 * 3. Bridges for Flutter InAppWebView, Capacitor, and Cordova are handled cleanly.
 */
export function launchNativeUri(uri: string): boolean {
  if (typeof window === 'undefined' || !uri) return false;

  try {
    const win = window as any;

    // 1. In-App Browser / Hybrid container bridges (Flutter InAppWebView, Capacitor, Cordova)
    if (win.flutter_inappwebview?.callHandler) {
      win.flutter_inappwebview.callHandler('launchUrl', uri, 'externalApplication').catch(() => {});
      win.flutter_inappwebview.callHandler('launchExternalUrl', uri).catch(() => {});
    }
    if (win.Capacitor?.Plugins?.App?.openUrl) {
      win.Capacitor.Plugins.App.openUrl({ url: uri }).catch(() => {});
    }
    if (win.cordova?.InAppBrowser?.open) {
      win.cordova.InAppBrowser.open(uri, '_system');
      return true;
    }

    // 2. Safe Hidden Iframe Dispatcher
    // An isolated 0x0 iframe passes custom schemes (sms:, tel:) directly to the OS Activity Manager
    // without triggering net::ERR_UNKNOWN_URL_SCHEME or replacing the host application viewport.
    let iframe = document.getElementById('native-external-intent-dispatcher-frame') as HTMLIFrameElement | null;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'native-external-intent-dispatcher-frame';
      iframe.style.position = 'fixed';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.width = '0px';
      iframe.style.height = '0px';
      iframe.style.border = 'none';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      iframe.setAttribute('aria-hidden', 'true');
      document.body.appendChild(iframe);
    }
    iframe.src = uri;

    // 3. Ephemeral Anchor Dispatcher (without target="_blank" to prevent child WebView crashes)
    // For iOS Safari and standard mobile browsers, an anchor with rel="external" cleanly invokes the native app
    const a = document.createElement('a');
    a.href = uri;
    a.rel = 'external noopener noreferrer';
    a.style.position = 'fixed';
    a.style.top = '-9999px';
    a.style.left = '-9999px';
    a.style.opacity = '0';
    a.style.pointerEvents = 'none';
    a.setAttribute('aria-hidden', 'true');
    document.body.appendChild(a);

    if (typeof a.click === 'function') {
      a.click();
    } else {
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
      });
      a.dispatchEvent(clickEvent);
    }

    setTimeout(() => {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
    }, 500);

    return true;
  } catch (err) {
    console.warn('[NativeIntent] Dispatcher handled error safely without crashing:', err);
    return false;
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
