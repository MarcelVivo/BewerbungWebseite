import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

type Anforderung = { text: string; prio: 'must' | 'nice' };

type Payload = {
  name: string;
  email: string;
  firma?: string;
  telefon?: string;
  branche: string;
  projekttyp: string;
  istSituation: string[];
  schmerzpunkte: string[];
  anforderungen: Anforderung[];
  nfAnforderungen: string[];
  budget: string;
  zeitrahmen: string;
  notizen: string;
};

function pill(items: string[], color = '#1e2235', text = '#e2e8f0') {
  return items.map(i =>
    `<span style="display:inline-block;padding:3px 10px;margin:2px;border-radius:20px;background:${color};color:${text};font-size:12px">${i}</span>`
  ).join('');
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Payload;
    const { name, email, firma, telefon, branche, projekttyp,
            istSituation, schmerzpunkte, anforderungen, nfAnforderungen,
            budget, zeitrahmen, notizen } = body;

    if (!name?.trim() || !email?.trim() || !branche || !projekttyp) {
      return NextResponse.json({ error: 'Fehlende Pflichtfelder' }, { status: 400 });
    }

    const must = anforderungen.filter(a => a.prio === 'must');
    const nice = anforderungen.filter(a => a.prio === 'nice');

    // ── Supabase: Anfrage speichern ──────────────────────────────
    let insertedId: string | undefined;
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const sb = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
        );
        const { data, error } = await sb.from('re_anfragen').insert({
          name,
          email,
          firma:            firma || null,
          telefon:          telefon || null,
          branche,
          projekttyp,
          ist_situation:    istSituation,
          schmerzpunkte,
          anforderungen,
          nf_anforderungen: nfAnforderungen,
          budget:           budget || null,
          zeitrahmen:       zeitrahmen || null,
          notizen:          notizen || null,
          status:           'neu',
        }).select('id').single();

        if (error) console.error('[re-anfrage] Supabase:', error.message);
        else insertedId = data?.id;
      } catch (e) {
        console.error('[re-anfrage] DB exception:', e);
      }
    }

    // ── Emails via Resend ────────────────────────────────────────
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);

      // 1. Benachrichtigung an Marcel
      const mustHtml = must.length
        ? must.map(a => `<li style="padding:3px 0;color:#86efac;font-size:13px">✓ ${a.text}</li>`).join('')
        : '<li style="color:#64748b;font-size:13px">–</li>';
      const niceHtml = nice.length
        ? nice.map(a => `<li style="padding:3px 0;color:#fde68a;font-size:13px">◇ ${a.text}</li>`).join('')
        : '';
      const nfHtml = nfAnforderungen.length
        ? nfAnforderungen.map(n => `<li style="padding:2px 0;color:#a5b4fc;font-size:13px">– ${n}</li>`).join('')
        : '';

      resend.emails.send({
        from:    'noreply@marcelspahr.ch',
        to:      'kontakt@marcelspahr.ch',
        replyTo: email,
        subject: `📋 Neue RE-Anfrage: ${projekttyp} – ${firma || name}`,
        html: `
          <div style="font-family:sans-serif;max-width:660px;margin:0 auto;background:#0f1117;color:#e2e8f0;border-radius:12px;overflow:hidden">
            <div style="background:#c9a84c;padding:22px 32px">
              <h1 style="margin:0;color:#0c0a06;font-size:20px;font-weight:700">Neue Projektanfrage via RE-Tool</h1>
              <p style="margin:4px 0 0;color:#7a5c00;font-size:13px">marcelspahr.ch · Projektanfrage</p>
            </div>
            <div style="padding:28px 32px">

              <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
                <tr><td style="padding:5px 0;color:#94a3b8;font-size:13px;width:110px">Name</td><td style="color:#f1f5f9;font-size:13px;font-weight:600">${name}</td></tr>
                <tr><td style="padding:5px 0;color:#94a3b8;font-size:13px">E-Mail</td><td><a href="mailto:${email}" style="color:#c9a84c;font-size:13px">${email}</a></td></tr>
                ${firma ? `<tr><td style="padding:5px 0;color:#94a3b8;font-size:13px">Firma</td><td style="color:#f1f5f9;font-size:13px">${firma}</td></tr>` : ''}
                ${telefon ? `<tr><td style="padding:5px 0;color:#94a3b8;font-size:13px">Telefon</td><td style="color:#f1f5f9;font-size:13px">${telefon}</td></tr>` : ''}
                <tr><td style="padding:5px 0;color:#94a3b8;font-size:13px">Branche</td><td style="color:#f1f5f9;font-size:13px">${branche}</td></tr>
                <tr><td style="padding:5px 0;color:#94a3b8;font-size:13px">Projekttyp</td><td style="color:#f1f5f9;font-size:13px">${projekttyp}</td></tr>
                ${budget ? `<tr><td style="padding:5px 0;color:#94a3b8;font-size:13px">Budget</td><td style="color:#f1f5f9;font-size:13px">${budget}</td></tr>` : ''}
                ${zeitrahmen ? `<tr><td style="padding:5px 0;color:#94a3b8;font-size:13px">Zeitrahmen</td><td style="color:#f1f5f9;font-size:13px">${zeitrahmen}</td></tr>` : ''}
              </table>

              ${istSituation.length ? `<p style="margin:0 0 6px;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:.05em;font-weight:600">Ist-Situation</p><div style="margin-bottom:16px">${pill(istSituation)}</div>` : ''}
              ${schmerzpunkte.length ? `<p style="margin:0 0 6px;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:.05em;font-weight:600">Schmerzpunkte</p><div style="margin-bottom:16px">${pill(schmerzpunkte, '#3b1a1a', '#fca5a5')}</div>` : ''}

              <p style="margin:0 0 8px;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:.05em;font-weight:600">Must-have Anforderungen</p>
              <ul style="margin:0 0 16px;padding-left:16px">${mustHtml}</ul>
              ${niceHtml ? `<p style="margin:0 0 8px;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:.05em;font-weight:600">Nice-to-have</p><ul style="margin:0 0 16px;padding-left:16px">${niceHtml}</ul>` : ''}
              ${nfHtml ? `<p style="margin:0 0 8px;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:.05em;font-weight:600">Nicht-funktionale Anforderungen</p><ul style="margin:0 0 16px;padding-left:16px">${nfHtml}</ul>` : ''}
              ${notizen ? `<div style="background:#1e2235;border-radius:8px;padding:14px 18px;margin-bottom:16px;border-left:3px solid #c9a84c"><p style="margin:0 0 6px;color:#c9a84c;font-size:11px;text-transform:uppercase;font-weight:700">Notizen</p><p style="margin:0;color:#e2e8f0;font-size:13px;line-height:1.6;white-space:pre-wrap">${notizen}</p></div>` : ''}

              <div style="margin-top:24px;display:flex;gap:12px">
                <a href="mailto:${email}?subject=Ihre Projektanfrage – Marcel Spahr"
                   style="background:#c9a84c;color:#0c0a06;padding:11px 22px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:700;display:inline-block">
                  Direkt antworten
                </a>
                <a href="https://www.marcelspahr.ch/dashboard/re-interview"
                   style="color:#c9a84c;padding:11px 16px;font-size:14px;text-decoration:none;display:inline-block">
                  Im Dashboard öffnen →
                </a>
              </div>
            </div>
            <div style="padding:14px 32px;background:#1a1d27;border-top:1px solid #2d3144">
              <p style="margin:0;color:#475569;font-size:11px">Anfrage-ID: ${insertedId || '–'} · marcelspahr.ch RE-Tool</p>
            </div>
          </div>`,
      }).catch(e => console.error('[re-anfrage] Resend Marcel:', e));

      // 2. Bestätigung an Kunden
      const mustListHtml = must.length
        ? `<ul style="margin:8px 0 0;padding-left:20px">${must.map(a => `<li style="padding:3px 0;color:#166534;font-size:13px">${a.text}</li>`).join('')}</ul>`
        : '';
      const niceListHtml = nice.length
        ? `<p style="margin:16px 0 4px;color:#334155;font-size:13px;font-weight:600">Nice-to-have:</p><ul style="margin:4px 0 0;padding-left:20px">${nice.map(a => `<li style="padding:3px 0;color:#713f12;font-size:13px">${a.text}</li>`).join('')}</ul>`
        : '';

      resend.emails.send({
        from:    'Marcel Spahr <kontakt@marcelspahr.ch>',
        to:      email,
        subject: `Ihre Projektanfrage ist eingegangen – ${projekttyp}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#ffffff;color:#1e293b;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
            <div style="background:#0c0a06;padding:28px 32px">
              <h1 style="margin:0;color:#c9a84c;font-size:22px;font-weight:700">Ihre Anfrage ist bei mir!</h1>
              <p style="margin:6px 0 0;color:#7a6d5a;font-size:13px">Marcel Spahr · marcelspahr.ch</p>
            </div>
            <div style="padding:32px">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155">Guten Tag ${name},</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155">
                vielen Dank für Ihre Projektanfrage! Ich habe alle Ihre Angaben erhalten und melde
                mich <strong>innerhalb von 24 Stunden</strong> persönlich bei Ihnen.
              </p>

              <div style="background:#f0fdf4;border-radius:10px;padding:20px 24px;margin-bottom:20px;border:1px solid #bbf7d0">
                <p style="margin:0 0 4px;color:#166534;font-size:11px;text-transform:uppercase;letter-spacing:.06em;font-weight:700">Ihr Projekt</p>
                <p style="margin:0 0 2px;color:#14532d;font-size:16px;font-weight:700">${projekttyp}</p>
                <p style="margin:0;color:#166534;font-size:13px">Branche: ${branche}${budget ? ` · Budget: ${budget}` : ''}${zeitrahmen ? ` · Zeitrahmen: ${zeitrahmen}` : ''}</p>
              </div>

              ${must.length ? `
              <div style="background:#f8fafc;border-radius:8px;padding:16px 20px;margin-bottom:16px;border-left:3px solid #c9a84c">
                <p style="margin:0 0 4px;color:#92400e;font-size:11px;text-transform:uppercase;letter-spacing:.06em;font-weight:700">Ihre Must-have Anforderungen</p>
                ${mustListHtml}
                ${niceListHtml}
              </div>` : ''}

              <div style="background:#fffbeb;border-radius:10px;padding:18px 22px;margin:24px 0;border:1px solid #fde68a">
                <p style="margin:0 0 6px;color:#92400e;font-size:13px;font-weight:700">Was als Nächstes passiert</p>
                <ol style="margin:0;padding-left:20px;color:#78350f;font-size:13px;line-height:2">
                  <li>Ich sichte Ihre Anforderungen sorgfältig</li>
                  <li>Ich melde mich innerhalb 24h bei Ihnen (per E-Mail oder Telefon)</li>
                  <li>Gemeinsam besprechen wir Ihr Projekt und die nächsten Schritte</li>
                </ol>
              </div>

              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#334155">
                Bei Fragen erreichen Sie mich jederzeit unter
                <a href="mailto:kontakt@marcelspahr.ch" style="color:#b8943a;text-decoration:none;font-weight:600">kontakt@marcelspahr.ch</a>
                oder <a href="tel:+41795110911" style="color:#b8943a;text-decoration:none;font-weight:600">+41 79 511 09 11</a>.
              </p>

              <p style="margin:0;font-size:15px;line-height:1.7;color:#334155">
                Freundliche Grüsse<br/>
                <strong>Marcel Spahr</strong><br/>
                <span style="color:#64748b;font-size:13px">KI-Berater & Wirtschaftsinformatiker · Bern, Schweiz</span>
              </p>
            </div>
            <div style="padding:14px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center">
              <a href="https://www.marcelspahr.ch" style="color:#b8943a;font-size:13px;text-decoration:none">www.marcelspahr.ch</a>
            </div>
          </div>`,
      }).catch(e => console.error('[re-anfrage] Resend Kunde:', e));
    }

    return NextResponse.json({ ok: true, id: insertedId });
  } catch (err) {
    console.error('[re-anfrage]', err);
    return NextResponse.json({ error: 'Server-Fehler' }, { status: 500 });
  }
}
