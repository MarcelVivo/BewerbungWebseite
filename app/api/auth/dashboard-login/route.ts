import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { validatePublicPost } from '@/app/lib/security';

export async function POST(request: NextRequest) {
  const rejected = validatePublicPost(request, {
    key: 'dashboard-login',
    limit: 8,
    windowMs: 15 * 60_000,
    contentTypes: ['application/json'],
    maxBytes: 4_000,
  });
  if (rejected) return rejected;

  try {
    const { email, password } = await request.json();
    if (typeof email !== 'string' || typeof password !== 'string' || email.length > 200 || password.length > 500 || !email.includes('@') || !password) {
      return NextResponse.json({ error: 'Ungültige Anmeldedaten.' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Anmeldung ist derzeit nicht konfiguriert.' }, { status: 503 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const adminEmail = process.env.DASHBOARD_ADMIN_EMAIL?.trim().toLowerCase();
    if (adminEmail && normalizedEmail !== adminEmail) {
      return NextResponse.json(
        { error: 'Falsche E-Mail-Adresse oder falsches Passwort.' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const response = NextResponse.json({ ok: true }, {
      headers: { 'Cache-Control': 'no-store' },
    });
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: cookiesToSet => {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });

    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });
    if (error) {
      return NextResponse.json(
        { error: 'Falsche E-Mail-Adresse oder falsches Passwort.' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Die Anmeldung konnte nicht verarbeitet werden.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
