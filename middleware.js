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
  const { pathname } = req.nextUrl;

  // Always allow Next.js internals
  if (pathname.startsWith('/_next')) return NextResponse.next();
  // Allow static assets for layout (CSS/JS), but block sensitive PDFs until login
  if (pathname.startsWith('/static')) return NextResponse.next();
  // Allow explicitly public paths (login + auth endpoints)
  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();

  const token = req.cookies.get('msb_token')?.value || '';
  const secret = process.env.SESSION_SECRET || 'please-change';
  const payload = await verifyToken(token, secret);

  if (payload) return NextResponse.next();

  // Redirect to /login and preserve the original destination as query
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('next', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: '/:path*',
};
