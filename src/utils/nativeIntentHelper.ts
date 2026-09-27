/**
 * Universal Native Intent Helper for 'সিলেট মানব সেবা সংগঠন'
 * 
 * Provides bulletproof native SMS and Call dispatching across:
 * - Android (Chrome, Samsung Internet, WebViews, In-App Browsers)
 * - iOS (Safari, WebKit WebViews)
 * - PWAs, Desktop browsers, and iframe-embedded preview environments
 * 
 * Guarantees that:
 * 1. ZERO iframe.src assignments for custom schemes, completely eliminating net::ERR_UNKNOWN_URL_SCHEME.
 * 2. ZERO target="_blank" on custom protocols, preventing blank WebView error crashes.
 * 3. Pre-fills both target phone number and SMS template body accurately.
 * 4. Dispatches strictly via external application intent (LaunchMode.externalApplication / OS Intent Manager).
 * 5. Auto-copies SMS text to clipboard as an instant fallback.
 */

const BENGALI_TO_ENGLISH_DIGITS: Record<string, string> = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
};

/**
 * Normalizes a Bangladeshi or international phone number for dialing and SMS.
 * Converts Bengali digits to standard English ASCII numerals and ensures proper prefixes.
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return '';
  // Convert Bengali numerals (০-৯) to English ASCII (0-9)
  const converted = phone.replace(/[০-৯]/g, d => BENGALI_TO_ENGLISH_DIGITS[d] || d);
  let cleaned = converted.replace(/[^0-9+]/g, '');
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
 * - iOS format: sms:number&body=message
 * - Android / RFC 5724 format: sms:number?body=message
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
 * 2. NO iframe.src assignment is used (iframe loading of sms: always fails with ERR_UNKNOWN_URL_SCHEME).
 * 3. Bridges for Flutter InAppWebView (LaunchMode.externalApplication), Android JavascriptInterface, Capacitor, and Cordova are handled cleanly.
 * 4. Safe ephemeral anchor dispatch with target="_self" activates the OS default handler directly.
 */
export function launchNativeUri(
  uri: string,
  recipientPhone?: string,
  messageBody?: string
): boolean {
  if (typeof window === 'undefined' || !uri) return false;

  try {
    const win = window as any;

    // 1. Flutter InAppWebView external application intent bridge
    if (win.flutter_inappwebview?.callHandler) {
      win.flutter_inappwebview.callHandler('launchUrl', uri, 'externalApplication').catch(() => {});
      win.flutter_inappwebview.callHandler('openUrl', { url: uri, mode: 'externalApplication' }).catch(() => {});
      win.flutter_inappwebview.callHandler('launchExternalUrl', uri).catch(() => {});
    }

    // 2. Custom Android JavascriptInterface bridges (if app is embedded in native Android wrapper)
    if (win.AndroidBridge?.launchUrl) {
      win.AndroidBridge.launchUrl(uri);
      return true;
    }
    if (win.Android?.launchExternal) {
      win.Android.launchExternal(uri);
      return true;
    }
    if (win.Android?.sendSms && recipientPhone) {
      win.Android.sendSms(recipientPhone, messageBody || '');
      return true;
    }

    // 3. Capacitor App Plugin
    if (win.Capacitor?.Plugins?.App?.openUrl) {
      win.Capacitor.Plugins.App.openUrl({ url: uri }).catch(() => {});
    }

    // 4. Cordova InAppBrowser (_system opens system default app)
    if (win.cordova?.InAppBrowser?.open) {
      win.cordova.InAppBrowser.open(uri, '_system');
      return true;
    }

    // 5. Clean, Safe Ephemeral Anchor Dispatcher
    // Uses target="_self" and rel="external". NEVER target="_blank" and NEVER iframe.src!
    const a = document.createElement('a');
    a.href = uri;
    a.target = '_self';
    a.rel = 'external noopener noreferrer';
    a.style.display = 'none';
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
    }, 300);

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
  // Always copy text to clipboard first as instant zero-fail backup
  if (body && typeof navigator !== 'undefined') {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(body).catch(() => {
        fallbackCopyText(body);
      });
    } else {
      fallbackCopyText(body);
    }
  }

  const primaryPhone = Array.isArray(phoneOrPhones) ? phoneOrPhones[0] : phoneOrPhones;
  const uri = buildUniversalSmsUri(phoneOrPhones, body);
  return launchNativeUri(uri, primaryPhone, body);
}

/**
 * Fallback clipboard copy using temporary textarea
 */
function fallbackCopyText(text: string): boolean {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.top = '-9999px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const success = document.execCommand('copy');
    document.body.removeChild(ta);
    return success;
  } catch {
    return false;
  }
}

/**
 * Universal helper to trigger native Phone Call / Dialer.
 */
export function triggerNativeCall(phone: string): boolean {
  if (!phone) return false;
  const uri = buildUniversalTelUri(phone);
  return launchNativeUri(uri, phone);
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

  return triggerNativeSms(validPhones, body);
}
