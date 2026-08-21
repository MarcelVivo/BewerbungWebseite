import { NextRequest, NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'node:crypto';
import { createRecruiterSession } from '@/lib/recruiterSession';
import { validatePublicPost } from '@/app/lib/security';

const SESSION_SECONDS = 60 * 60 * 8;

function secureEqual(value: unknown, expected: string) {
  const left = createHash('sha256').update(typeof value === 'string' ? value : '').digest();
  const right = createHash('sha256').update(expected).digest();
  return timingSafeEqual(left, right);
}

export async function POST(req: NextRequest) {
  const rejected = validatePublicPost(req, {
    key: 'recruiter-login',
    limit: 5,
    windowMs: 15 * 60_000,
    contentTypes: ['application/json'],
    maxBytes: 2_000,
  });
  if (rejected) return rejected;

  const { password } = await req.json().catch(() => ({}));
  const expected = process.env.RECRUITER_PASSWORD;
  const secret = process.env.RECRUITER_SESSION_SECRET || process.env.SESSION_SECRET;

  if (!expected || !secret || secret.length < 32) {
    console.error('Recruiter login is missing secure server configuration.');
    return NextResponse.json({ error: 'Anmeldung ist derzeit nicht verfügbar.' }, { status: 503 });
  }

  if (!secureEqual(password, expected)) {
    return NextResponse.json(
      { error: 'Ungültige Anmeldedaten.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('recruiter_session', await createRecruiterSession(secret, SESSION_SECONDS * 1000), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_SECONDS,
    path: '/',
  });
  res.headers.set('Cache-Control', 'no-store');
  return res;
}

export async function DELETE(req: NextRequest) {
  const rejected = validatePublicPost(req, {
    key: 'recruiter-logout',
    limit: 10,
    windowMs: 60_000,
    contentTypes: ['application/json'],
    maxBytes: 500,
  });
  if (rejected) return rejected;
  const res = NextResponse.json({ ok: true });
  res.cookies.set('recruiter_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });
  res.headers.set('Cache-Control', 'no-store');
  return res;
}
