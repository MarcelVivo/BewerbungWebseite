import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = cookies();
  const isProd = process.env.NODE_ENV === 'production';
  cookieStore.set('msb_token', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
    maxAge: 0,
  });
  return Response.json({ ok: true });
}
