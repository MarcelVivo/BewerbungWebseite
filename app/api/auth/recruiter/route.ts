import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const expected = process.env.RECRUITER_PASSWORD;

  if (!expected) {
    return NextResponse.json({ error: 'RECRUITER_PASSWORD nicht konfiguriert.' }, { status: 500 });
  }

  if (password !== expected) {
    return NextResponse.json({ error: 'Falsches Passwort.' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('recruiter_session', 'authenticated', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 7, // 7 Tage
    path:     '/',
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('recruiter_session', '', { maxAge: 0, path: '/' });
  return res;
}
