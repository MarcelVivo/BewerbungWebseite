import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { name, email, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Fehlende Felder' }, { status: 400 });
    }

    const supabase = createClient();
    const { error } = await supabase.from('kontaktanfragen').insert({
      name,
      email,
      nachricht: message,
      sprache: 'de',
      status: 'neu',
    });

    if (error) {
      console.error('Supabase error:', error.message);
      return NextResponse.json({ error: 'Datenbankfehler' }, { status: 500 });
    }

    // TODO Phase 4: Resend E-Mail Benachrichtigung an kontakt@marcelspahr.ch

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Server-Fehler' }, { status: 500 });
  }
}
