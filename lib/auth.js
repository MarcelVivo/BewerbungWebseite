import crypto from 'crypto';
import { cookies } from 'next/headers';

function decodeToken(token, secret) {
  try {
    const [b64, sig] = token.split('.');
    if (!b64 || !sig) return null;
    const expected = crypto.createHmac('sha256', secret).update(b64).digest('base64url');
    if (expected !== sig) return null;
    const payload = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8'));
    if (!payload?.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getSessionFromCookies() {
  const token = cookies().get('msb_token')?.value || '';
  const secret = process.env.SESSION_SECRET || 'please-change';
  const payload = decodeToken(token, secret);
  if (!payload) return null;
  return {
    user: { username: payload.u, role: payload.r },
    exp: payload.exp,
  };
}

export function requireOwner() {
  const session = getSessionFromCookies();
  if (!session || session.user?.role !== 'owner') return null;
  return session;
}
