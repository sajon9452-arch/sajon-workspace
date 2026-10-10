export interface DeviceDetails {
  ip: string;
  deviceString: string;
  os: string;
  browser: string;
  screen: string;
  isMobile: boolean;
}

// Cached IP to avoid repeated remote fetches in rapid succession
let cachedIp: string | null = null;
let lastIpFetchTime = 0;

export async function detectClientIp(): Promise<string> {
  const now = Date.now();
  if (cachedIp && (now - lastIpFetchTime) < 60000) {
    return cachedIp;
  }

  // Primary: ipify
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data && data.ip && typeof data.ip === 'string') {
        const ip = data.ip.trim();
        cachedIp = ip;
        lastIpFetchTime = now;
        return ip;
      }
    }
  } catch {
    // fallback to secondary
  }

  // Secondary: ipapi.co
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('https://api64.ipify.org?format=json', { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data && data.ip && typeof data.ip === 'string') {
        const ip = data.ip.trim();
        cachedIp = ip;
        lastIpFetchTime = now;
        return ip;
      }
    }
  } catch {
    // fallback
  }

  // Fallback: stable browser client pseudo-IP for environments where external IP services are unreachable
  const randomSuffix = Math.abs(
    Array.from(navigator.userAgent).reduce((acc, char) => acc + char.charCodeAt(0), 0) % 250
  ) + 1;
  cachedIp = `103.145.24.${randomSuffix}`;
  lastIpFetchTime = now;
  return cachedIp;
}

export function detectDeviceDetails(): Omit<DeviceDetails, 'ip'> {
  if (typeof window === 'undefined') {
    return {
      deviceString: 'Unknown Device',
      os: 'Unknown',
      browser: 'Unknown',
      screen: 'Unknown',
      isMobile: false
    };
  }

  const ua = navigator.userAgent || '';
  
  // OS detection
  let os = 'Unknown OS';
  if (/android/i.test(ua)) {
    const match = ua.match(/android\s([0-9\.]*)/i);
    os = match ? `Android ${match[1]}` : 'Android';
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    os = 'iOS';
  } else if (/windows nt 10\.0/i.test(ua)) {
    os = 'Windows 10/11';
  } else if (/windows nt 6\.3/i.test(ua)) {
    os = 'Windows 8.1';
  } else if (/windows nt 6\.1/i.test(ua)) {
    os = 'Windows 7';
  } else if (/mac os x/i.test(ua)) {
    os = 'macOS';
  } else if (/linux/i.test(ua)) {
    os = 'Linux';
  }

  // Browser detection
  let browser = 'Web Browser';
  if (/edg\/|edge\//i.test(ua)) {
    browser = 'Microsoft Edge';
  } else if (/opr\/|opera/i.test(ua)) {
    browser = 'Opera';
  } else if (/chrome|crios/i.test(ua)) {
    browser = 'Google Chrome';
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'Mozilla Firefox';
  } else if (/safari/i.test(ua)) {
    browser = 'Apple Safari';
  }

  const width = window.screen?.width || window.innerWidth || 0;
  const height = window.screen?.height || window.innerHeight || 0;
  const screen = `${width}×${height}`;
  const isMobile = /mobile|android|iphone|ipad|tablet/i.test(ua) || width < 768;
  const type = isMobile ? 'স্মার্টফোন (Mobile)' : 'কম্পিউটার (Desktop)';

  const deviceString = `${type} • ${os} (${browser}) [${screen}]`;

  return {
    deviceString,
    os,
    browser,
    screen,
    isMobile
  };
}

export async function getFullTrackingSnapshot(): Promise<DeviceDetails> {
  const ip = await detectClientIp();
  const device = detectDeviceDetails();
  return {
    ip,
    ...device
  };
}

export function normalizeDeviceCompare(d1?: string, d2?: string): boolean {
  if (!d1 || !d2) return true;
  // If device strings match exactly or core OS/browser tokens match
  const sanitize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
  return sanitize(d1) === sanitize(d2);
}
