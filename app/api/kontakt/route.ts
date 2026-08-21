import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { escapeHtml, isSpamSubmission, tooLong } from '../../lib/spamGuard';
import { cleanText, validEmail, validatePublicPost } from '../../lib/security';

export async function POST(request: Request) {
  const rejected = validatePublicPost(request, {
    key: 'contact-form',
    limit: 5,
    windowMs: 10 * 60_000,
    contentTypes: ['application/json'],
    maxBytes: 12_000,
  });
  if (rejected) return rejected;

  try {
    const body = await request.json();
    const name = cleanText(body?.name, 200);
    const email = cleanText(body?.email, 200).toLowerCase();
    const message = cleanText(body?.message, 5_000);
    const { consent, hpWebsite, startedAt } = body;

    if (!name || !validEmail(email) || !message || consent !== true) {
      return NextResponse.json({ error: 'Fehlende Felder' }, { status: 400 });
    }
    if (tooLong(body?.name, 200) || tooLong(body?.email, 200) || tooLong(body?.message)) {
      return NextResponse.json({ error: 'Eingabe zu lang' }, { status: 400 });
    }
    if (isSpamSubmission(hpWebsite, startedAt)) {
      // Bots get a fake success response so they don't adapt/retry.
      return NextResponse.json({ ok: true });
    }

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeMessage = escapeHtml(message);

    // Supabase-Insert mit Service Role Key (umgeht RLS)
    let insertedId: string | undefined;
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
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

    // E-Mail-Benachrichtigungen via Resend (nur wenn API Key gesetzt ist)
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);

      // 1. Benachrichtigung an Marcel
      try {
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
                    <td style="padding:8px 0;color:#f1f5f9;font-size:13px;font-weight:600">${safeName}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#94a3b8;font-size:13px">E-Mail</td>
                    <td style="padding:8px 0;font-size:13px"><a href="mailto:${safeEmail}" style="color:#818cf8">${safeEmail}</a></td>
                  </tr>
                </table>
                <div style="background:#1e2235;border-radius:8px;padding:20px;border-left:3px solid #6366f1">
                  <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.05em">Nachricht</p>
                  <p style="margin:0;color:#e2e8f0;font-size:14px;line-height:1.7;white-space:pre-wrap">${safeMessage}</p>
                </div>
                <div style="margin-top:28px">
                  <a href="mailto:${safeEmail}?subject=Re: Ihre Anfrage auf marcelspahr.ch"
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
                <p style="margin:0;color:#475569;font-size:11px">marcelspahr.ch. Command Center. Anfrage ID: ${insertedId || 'Keine Angabe.'}</p>
              </div>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error('Resend error (Marcel):', emailErr);
      }

      // 2. Automatische Bestätigung an Kunde
      try {
        await resend.emails.send({
          from: 'Marcel Spahr <kontakt@marcelspahr.ch>',
          to:   email,
          subject: 'Vielen Dank für Ihre Anfrage. Marcel Spahr.',
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#ffffff;color:#1e293b;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
              <div style="background:#6366f1;padding:28px 32px">
                <h1 style="margin:0;color:white;font-size:22px;font-weight:700">Vielen Dank, ${safeName}!</h1>
                <p style="margin:6px 0 0;color:#c7d2fe;font-size:14px">Ihre Anfrage ist bei mir eingegangen.</p>
              </div>
              <div style="padding:32px">
                <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155">
                  Guten Tag ${safeName},
                </p>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155">
                  vielen Dank für Ihre Nachricht. Ich habe Ihre Anfrage erhalten und melde mich innerhalb von
                  <strong>2 Arbeitstagen</strong> persönlich bei Ihnen.
                </p>
                <div style="background:#f8fafc;border-radius:8px;padding:20px;border-left:3px solid #6366f1;margin:24px 0">
                  <p style="margin:0 0 8px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;font-weight:600">Ihre Nachricht</p>
                  <p style="margin:0;color:#475569;font-size:14px;line-height:1.7;white-space:pre-wrap">${safeMessage}</p>
                </div>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#334155">
                  Bei dringenden Anliegen können Sie mich direkt unter
                  <a href="mailto:kontakt@marcelspahr.ch" style="color:#6366f1;text-decoration:none;font-weight:600">kontakt@marcelspahr.ch</a>
                  erreichen.
                </p>
                <p style="margin:0;font-size:15px;line-height:1.7;color:#334155">
                  Freundliche Grüsse<br/>
                  <strong>Marcel Spahr</strong><br/>
                  <span style="color:#64748b;font-size:13px">Wirtschaftsinformatiker und KI Berater. Bern, Schweiz.</span>
                </p>
              </div>
              <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center">
                <a href="https://www.marcelspahr.ch" style="color:#6366f1;font-size:13px;text-decoration:none">www.marcelspahr.ch</a>
              </div>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error('Resend error (Kunde):', emailErr);
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Server-Fehler' }, { status: 500 });
  }
}
