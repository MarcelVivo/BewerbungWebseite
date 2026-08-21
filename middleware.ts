import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { verifyRecruiterSession } from './lib/recruiterSession';

// ============================================================
// Auth-Middleware – drei Zonen:
//   1. /dashboard/*  → Supabase Session (Email + Passwort)
//   2. /recruiter/*  → Cookie Auth (RECRUITER_PASSWORD)
//   3. Alles andere  → Bestehender HMAC-Token (msb_token)
// ============================================================

const ALWAYS_ALLOW_PREFIXES = ['/_next', '/static', '/favicon', '/robots'];
const ALWAYS_ALLOW_ASSETS   = ['/assets/portrait'];
const PUBLIC_PATHS           = ['/', '/login', '/api/login', '/api/logout'];
const API_PUBLIC_PREFIXES    = ['/api/auth', '/api/kalender/buchen', '/api/kontakt'];
const PROTECTED_DOCUMENTS = new Set([
  'LebenslaufMarcelSpahrNeu1.pdf',
  'ArbeitszeugnisSwisscomMarcelSpahr2025.pdf',
  'ArbeitszeugnisRothMalerei.pdf',
  'FaehigkeitszeugnisWerbetechniker.pdf',
  'FaehigkeitszeugnisMaler.pdf',
  'SAFeZertifikatMarcelSpahr.pdf',
  'SCRUMZertifikat.pdf',
  'CambridgeEnglischA2ZertifikatMarcelSpahr.pdf',
  'IREB_Zertifikat_Spahr_Marcel.pdf',
  'Illustrator&PhotoshopGrundkurs.pdf',
  'IllustratorWorkshop.pdf',
  'PhotoshopAufbaukurs.pdf',
]);

function isProtectedPublicDocument(pathname: string) {
  if (pathname.startsWith('/uploads/')) return true;
  if (pathname.startsWith('/dist/assets/') && pathname.toLowerCase().endsWith('.pdf')) return true;
  if (!pathname.startsWith('/assets/')) return false;
  const filename = pathname.slice('/assets/'.length);
  return PROTECTED_DOCUMENTS.has(filename);
}

// ── Hilfsfunktionen für den alten HMAC-Token ──────────────

function base64UrlDecodeToString(b64url: string): string {
  return new TextDecoder().decode(base64UrlDecode(b64url));
}

function base64UrlDecode(b64url: string): ArrayBuffer {
  const normalized = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes.buffer;
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
      ['verify']
    );
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      base64UrlDecode(sig),
      new TextEncoder().encode(b64),
    );
    if (!valid) return false;
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

  const adminEmail = process.env.DASHBOARD_ADMIN_EMAIL?.trim().toLowerCase();
  if (adminEmail && user.email?.toLowerCase() !== adminEmail) {
    return NextResponse.redirect(new URL('/dashboard/login?error=forbidden', req.url));
  }

  return response;
}

// ── Zone 2: Recruiter – Cookie Auth ──────────────────────

async function handleRecruiterAuth(req: NextRequest): Promise<NextResponse> {
  const session = req.cookies.get('recruiter_session')?.value;
  const secret = process.env.RECRUITER_SESSION_SECRET || process.env.SESSION_SECRET || '';
  if (session && await verifyRecruiterSession(session, secret)) return NextResponse.next();
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

  if (isProtectedPublicDocument(pathname)) {
    const oldToken = req.cookies.get('msb_token')?.value || '';
    const oldSecret = process.env.SESSION_SECRET || '';
    const recruiterToken = req.cookies.get('recruiter_session')?.value || '';
    const recruiterSecret = process.env.RECRUITER_SESSION_SECRET || process.env.SESSION_SECRET || '';
    const [oldValid, recruiterValid] = await Promise.all([
      oldSecret.length >= 32 ? verifyOldToken(oldToken, oldSecret) : Promise.resolve(false),
      verifyRecruiterSession(recruiterToken, recruiterSecret),
    ]);
    if (oldValid || recruiterValid) {
      const response = NextResponse.next();
      response.headers.set('Cache-Control', 'private, no-store, max-age=0');
      response.headers.set('X-Robots-Tag', 'noindex, noarchive, nosnippet');
      return response;
    }
    const login = new URL('/recruiter/login', req.url);
    login.searchParams.set('next', pathname);
    return NextResponse.redirect(login);
  }

  if (pathname.startsWith('/assets/') || pathname.startsWith('/dist/assets/')) {
    return NextResponse.next();
  }

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
    return await handleRecruiterAuth(req);
  }

  // Nur ausdrücklich öffentliche Seiten umgehen die HMAC-Prüfung.
  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();
  return handleOldAuth(req);
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/recruiter/:path*',
    '/bewerbungsprofil',
    '/expertise',
    '/api/projects/:path*',
    '/api/upload',
    '/api/session',
    '/assets/:path*',
    '/dist/assets/:path*',
    '/uploads/:path*',
  ],
};
