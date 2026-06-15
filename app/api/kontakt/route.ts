import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

export async function POST(request: Request) {
  try {
    const { name, email, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Fehlende Felder' }, { status: 400 });
    }

    // Supabase-Insert versuchen — schlägt fehl wenn Tabelle/RLS fehlt, aber Form bleibt nutzbar
    let insertedId: string | undefined;
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('kontaktanfragen').insert({
        name,
        email,
        nachricht: message,
        sprache: 'de',
        status: 'neu',
      }).select('id').single();

      if (error) {
        console.error('[kontakt] Supabase error:', error.code, error.message);
      } else {
        insertedId = data?.id;
      }
    } catch (dbErr) {
      console.error('[kontakt] DB exception:', dbErr);
    }

    // E-Mail-Benachrichtigung via Resend (nur wenn API Key gesetzt ist)
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: 'noreply@marcelspahr.ch',
          to:   'kontakt@marcelspahr.ch',
          replyTo: email,
          subject: `📬 Neue Kontaktanfrage von ${name}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0f1117;color:#e2e8f0;border-radius:12px;overflow:hidden">
              <div style="background:#6366f1;padding:24px 32px">
                <h1 style="margin:0;color:white;font-size:20px">Neue Kontaktanfrage</h1>
                <p style="margin:4px 0 0;color:#c7d2fe;font-size:14px">marcelspahr.ch · Kontaktformular</p>
              </div>
              <div style="padding:32px">
                <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
                  <tr>
                    <td style="padding:8px 0;color:#94a3b8;font-size:13px;width:100px">Name</td>
                    <td style="padding:8px 0;color:#f1f5f9;font-size:13px;font-weight:600">${name}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#94a3b8;font-size:13px">E-Mail</td>
                    <td style="padding:8px 0;font-size:13px"><a href="mailto:${email}" style="color:#818cf8">${email}</a></td>
                  </tr>
                </table>
                <div style="background:#1e2235;border-radius:8px;padding:20px;border-left:3px solid #6366f1">
                  <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.05em">Nachricht</p>
                  <p style="margin:0;color:#e2e8f0;font-size:14px;line-height:1.7;white-space:pre-wrap">${message}</p>
                </div>
                <div style="margin-top:28px">
                  <a href="mailto:${email}?subject=Re: Ihre Anfrage auf marcelspahr.ch"
                     style="background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;display:inline-block">
                    Direkt antworten
                  </a>
                  <a href="https://www.marcelspahr.ch/dashboard/kontakt"
                     style="color:#818cf8;padding:12px 16px;font-size:14px;text-decoration:none;display:inline-block">
                    Im Dashboard öffnen →
                  </a>
                </div>
              </div>
              <div style="padding:16px 32px;background:#1a1d27;border-top:1px solid #2d3144">
                <p style="margin:0;color:#475569;font-size:11px">marcelspahr.ch · Command Center · Anfrage-ID: ${insertedId || '–'}</p>
              </div>
            </div>
          `,
        });
      } catch (emailErr) {
        // E-Mail-Fehler nicht an Client zurückgeben — Anfrage ist trotzdem gespeichert
        console.error('Resend error:', emailErr);
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Server-Fehler' }, { status: 500 });
  }
}
