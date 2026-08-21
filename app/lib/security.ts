import { NextResponse } from 'next/server';

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

type PublicPostOptions = RateLimitOptions & {
  contentTypes: string[];
  maxBytes: number;
};

type RateBucket = { count: number; resetAt: number };

const buckets = new Map<string, RateBucket>();
const MAX_BUCKETS = 10_000;

function clientAddress(request: Request) {
  const direct = request.headers.get('x-real-ip')?.trim();
  const vercel = request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim();
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return direct || vercel || forwarded || 'unknown';
}

function pruneBuckets(now: number) {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  if (buckets.size >= MAX_BUCKETS) buckets.clear();
}

export function rateLimit(request: Request, options: RateLimitOptions) {
  const now = Date.now();
  pruneBuckets(now);
  const id = `${options.key}:${clientAddress(request)}`;
  const previous = buckets.get(id);
  const bucket = !previous || previous.resetAt <= now
    ? { count: 0, resetAt: now + options.windowMs }
    : previous;

  bucket.count += 1;
  buckets.set(id, bucket);

  if (bucket.count <= options.limit) return null;

  const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  return NextResponse.json(
    { error: 'Zu viele Anfragen. Bitte kurz warten.' },
    {
      status: 429,
      headers: {
        'Cache-Control': 'no-store',
        'Retry-After': String(retryAfter),
      },
    },
  );
}

export function validatePublicPost(request: Request, options: PublicPostOptions) {
  const originError = validateSameOrigin(request);
  if (originError) return originError;

  const contentType = (request.headers.get('content-type') || '').split(';', 1)[0].trim().toLowerCase();
  if (!options.contentTypes.includes(contentType)) {
    return NextResponse.json(
      { error: 'Nicht unterstützter Inhaltstyp.' },
      { status: 415, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const declaredLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > options.maxBytes) {
    return NextResponse.json(
      { error: 'Anfrage zu gross.' },
      { status: 413, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  return rateLimit(request, options);
}

export function validateSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const fetchSite = request.headers.get('sec-fetch-site');
  const requestOrigin = new URL(request.url).origin;
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const host = forwardedHost || request.headers.get('host')?.trim();
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const protocol = forwardedProto || new URL(request.url).protocol.replace(':', '');
  let configuredOrigin: string | null = null;
  try {
    configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL
      ? new URL(process.env.NEXT_PUBLIC_SITE_URL).origin
      : null;
  } catch {
    configuredOrigin = null;
  }
  const expectedOrigins = new Set([
    requestOrigin,
    host ? `${protocol}://${host}` : null,
    configuredOrigin,
  ].filter((value): value is string => Boolean(value)));

  if (origin ? !expectedOrigins.has(origin) : fetchSite !== 'same-origin') {
    return NextResponse.json(
      { error: 'Ungültige Herkunft.' },
      { status: 403, headers: { 'Cache-Control': 'no-store' } },
    );
  }
  return null;
}

export function jsonNoStore(body: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set('Cache-Control', 'no-store');
  return NextResponse.json(body, { ...init, headers });
}

export function cleanText(value: unknown, max: number) {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max)
    : '';
}

export function validEmail(value: string) {
  return value.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
