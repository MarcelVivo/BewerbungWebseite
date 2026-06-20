import crypto from 'crypto';
import { cookies } from 'next/headers';

function sign(payload, secret) {
  const b64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const h = crypto.createHmac('sha256', secret).update(b64).digest('base64url');
  return `${b64}.${h}`;
}

export async function POST(request) {
  const { username, password } = await request.json();
  const ADMIN_USER = process.env.ADMIN_USER || 'Recruiter';
  const ADMIN_PASS = process.env.ADMIN_PASS || 'Marcel2025!';
  const SESSION_SECRET = process.env.SESSION_SECRET || 'please-change';
  const isProd = process.env.NODE_ENV === 'production';

  let role = null;
  if (username === ADMIN_USER && password === ADMIN_PASS) role = 'owner';

  if (!role) {
    return new Response('Unauthorized', { status: 401 });
  }

  const exp = Date.now() + 1000 * 60 * 60 * 8; // 8h
  const token = sign({ u: username, r: role, exp }, SESSION_SECRET);
  const cookieStore = cookies();
  cookieStore.set('msb_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
    maxAge: 60 * 60 * 8,
  });
  return Response.json({ ok: true, user: { username, role } });
}
