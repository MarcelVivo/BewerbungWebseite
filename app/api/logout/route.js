import { cookies } from 'next/headers';

export async function POST() {
  (await cookies()).set('msb_token', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: 0,
  });
  return Response.json({ ok: true });
}

