import { cookies } from 'next/headers';
import { validateSameOrigin } from '../../lib/security';

export async function POST(request) {
  const rejected = validateSameOrigin(request);
  if (rejected) return rejected;
  const cookieStore = cookies();
  const isProd = process.env.NODE_ENV === 'production';
  cookieStore.set('msb_token', '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: isProd,
    path: '/',
    maxAge: 0,
  });
  return Response.json({ ok: true });
}
