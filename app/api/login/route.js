import crypto from 'crypto';
import { cookies } from 'next/headers';

function sign(payload, secret) {
  const b64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const h = crypto.createHmac('sha256', secret).update(b64).digest('base64url');
  return `${b64}.${h}`;
}

function secureEqual(value, expected) {
  const left = crypto.createHash('sha256').update(String(value)).digest();
  const right = crypto.createHash('sha256').update(String(expected)).digest();
  return crypto.timingSafeEqual(left, right);
}

export async function POST(request) {
  const ADMIN_USER = process.env.ADMIN_USER;
  const ADMIN_PASS = process.env.ADMIN_PASS;
  const SESSION_SECRET = process.env.SESSION_SECRET;

  if (!ADMIN_USER || !ADMIN_PASS || !SESSION_SECRET || SESSION_SECRET.length < 32) {
    console.error('Expertise login is missing secure server configuration.');
    return Response.json(
      { error: 'Anmeldung derzeit nicht verfügbar.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  let credentials;
  try {
    credentials = await request.json();
  } catch {
    return Response.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  const username = typeof credentials?.username === 'string' ? credentials.username : '';
  const password = typeof credentials?.password === 'string' ? credentials.password : '';
  const usernameMatches = secureEqual(username, ADMIN_USER);
  const passwordMatches = secureEqual(password, ADMIN_PASS);
  const authenticated = usernameMatches && passwordMatches;

  if (!authenticated) {
    return Response.json(
      { error: 'Ungültige Anmeldedaten.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const role = 'owner';
  const exp = Date.now() + 1000 * 60 * 60 * 8;
  const token = sign({ u: username, r: role, exp }, SESSION_SECRET);
  cookies().set('msb_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  });

  return Response.json(
    { ok: true, user: { username, role } },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
