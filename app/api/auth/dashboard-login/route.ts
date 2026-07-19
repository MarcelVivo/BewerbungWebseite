import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (typeof email !== 'string' || typeof password !== 'string' || !email.includes('@') || !password) {
      return NextResponse.json({ error: 'Ungültige Anmeldedaten.' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Anmeldung ist derzeit nicht konfiguriert.' }, { status: 503 });
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
      email: email.trim().toLowerCase(),
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

