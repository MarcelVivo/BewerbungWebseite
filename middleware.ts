import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// ============================================================
// Auth-Middleware – drei Zonen:
//   1. /dashboard/*  → Supabase Session (Email + Passwort)
//   2. /recruiter/*  → Cookie Auth (RECRUITER_PASSWORD)
//   3. Alles andere  → Bestehender HMAC-Token (msb_token)
// ============================================================

const ALWAYS_ALLOW_PREFIXES = ['/_next', '/static', '/favicon', '/robots'];
const ALWAYS_ALLOW_ASSETS   = ['/assets/portrait'];
const OLD_PUBLIC_PATHS       = ['/', '/login', '/api/login', '/api/logout'];
const API_PUBLIC_PREFIXES    = ['/api/auth', '/api/kalender/buchen', '/api/kontakt'];

// ── Hilfsfunktionen für den alten HMAC-Token ──────────────

function base64UrlEncode(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = '';
  bytes.forEach((b) => { s += String.fromCharCode(b); });
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecodeToString(b64url: string): string {
  const normalized = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function verifyOldToken(token: string, secret: string): Promise<boolean> {
  try {
    const [b64, sig] = token.split('.');
    if (!b64 || !sig) return false;
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const expected = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(b64));
    if (base64UrlEncode(expected) !== sig) return false;
    const json = JSON.parse(base64UrlDecodeToString(b64));
    if (!json?.exp || Date.now() > json.exp) return false;
    return true;
  } catch {
    return false;
  }
}

// ── Zone 1: Dashboard – Supabase Auth ────────────────────

async function handleDashboardAuth(req: NextRequest): Promise<NextResponse> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    const url = new URL('/dashboard/login', req.url);
    url.searchParams.set('error', 'not_configured');
    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({ request: req });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
        response = NextResponse.next({ request: req });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const url = new URL('/dashboard/login', req.url);
    url.searchParams.set('next', req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

// ── Zone 2: Recruiter – Cookie Auth ──────────────────────

function handleRecruiterAuth(req: NextRequest): NextResponse {
  const session = req.cookies.get('recruiter_session')?.value;
  if (session === 'authenticated') return NextResponse.next();
  return NextResponse.redirect(new URL('/recruiter/login', req.url));
}

// ── Zone 3: Bestehende Seiten – HMAC Token ───────────────

async function handleOldAuth(req: NextRequest): Promise<NextResponse> {
  const token  = req.cookies.get('msb_token')?.value || '';
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    return NextResponse.redirect(new URL('/login?error=not_configured', req.url));
  }
  const valid  = await verifyOldToken(token, secret);

  if (valid) return NextResponse.next();

  const url = new URL('/login', req.url);
  url.searchParams.set('next', req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

// ── Haupt-Middleware ──────────────────────────────────────

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Immer erlaubt: Next.js internals + statische Assets
  if (ALWAYS_ALLOW_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (ALWAYS_ALLOW_ASSETS.some((p) => pathname.startsWith(p)))   return NextResponse.next();
  if (API_PUBLIC_PREFIXES.some((p) => pathname.startsWith(p)))    return NextResponse.next();

  // Zone 1: /dashboard/*
  if (pathname.startsWith('/dashboard')) {
    if (pathname === '/dashboard/login') return NextResponse.next();
    return handleDashboardAuth(req);
  }

  // Zone 2: /recruiter/*
  if (pathname.startsWith('/recruiter')) {
    if (pathname === '/recruiter/login') return NextResponse.next();
    return handleRecruiterAuth(req);
  }

  // Zone 3: Bestehende Seiten (alte Cookie-Auth)
  if (OLD_PUBLIC_PATHS.includes(pathname)) return NextResponse.next();
  return handleOldAuth(req);
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/recruiter/:path*',
    '/expertise',
    '/api/projects/:path*',
    '/api/upload',
    '/api/session',
  ],
};
