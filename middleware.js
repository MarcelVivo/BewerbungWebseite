import { NextResponse } from 'next/server';

// Paths that do not require auth
const PUBLIC_PATHS = [
  '/login',
  '/api/login',
  '/api/logout',
  '/favicon.ico',
  '/robots.txt',
];

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
    const expectedB64 = Buffer.from(new Uint8Array(expected)).toString('base64url');
    if (expectedB64 !== sig) return null;
    const json = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8'));
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
  // Allow explicitly public paths
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

