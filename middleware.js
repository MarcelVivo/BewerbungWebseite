import { NextResponse } from 'next/server';

// Paths that do not require auth
const PUBLIC_PATHS = [
  '/login',
  '/api/login',
  '/api/logout',
  '/favicon.ico',
  '/robots.txt',
];

// Utility helpers for Edge runtime (no Buffer available)
const base64UrlEncode = (arrayBuffer) => {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const base64UrlDecodeToString = (b64url) => {
  const normalized = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

// Use Web Crypto in Edge to verify HMAC token
async function verifyToken(token, secret) {
  try {
    const [b64, sig] = token.split('.');
    if (!b64 || !sig) return null;
    const data = new TextEncoder().encode(b64);
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const expected = await crypto.subtle.sign('HMAC', key, data);
    const expectedB64 = base64UrlEncode(expected);
    if (expectedB64 !== sig) return null;
    const json = JSON.parse(base64UrlDecodeToString(b64));
    if (!json || !json.exp || Date.now() > json.exp) return null;
    return json;
  } catch {
    return null;
  }
}

export async function middleware(req) {
  // Static-only Modus: Auth-Prüfung umgehen, alle Routen erlauben
  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};
