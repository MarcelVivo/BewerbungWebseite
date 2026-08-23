import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PUBLIC_SITE_URL = 'https://www.marcelspahr.ch';
// Nachfassen erst nach dem im Formular gegebenen Zwei-Werktage-Versprechen,
// damit die Mail nie vor Marcels eigener Antwort ankommt.
const FOLLOW_UP_AFTER_MS = 3 * 24 * 60 * 60 * 1000;
// Ohne Obergrenze hat ein einziger Lauf (follow_up_sent_at war fuer den
// gesamten historischen Bestand NULL) hunderte "vor einigen Tagen..."-Mails
// an teils monatealte Leads verschickt - inhaltlich falsch (es waren keine
// "einigen Tage") und wirkt wie Spam. 21 Tage haelt die Zusage im Text
// wahr; MAX_PER_RUN begrenzt zusaetzlich jeden einzelnen Lauf hart, falls
// trotzdem nochmal ein groesserer Rueckstand auflaeuft.
const MAX_FOLLOW_UP_AGE_MS = 21 * 24 * 60 * 60 * 1000;
const MAX_PER_RUN = 25;

const ESCAPE_MAP: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ESCAPE_MAP[char]);
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Supabase ist nicht konfiguriert.' }, { status: 503 });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const cutoff = new Date(Date.now() - FOLLOW_UP_AFTER_MS).toISOString();
  const maxAgeCutoff = new Date(Date.now() - MAX_FOLLOW_UP_AGE_MS).toISOString();
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

  let kiCheckFollowUps = 0;
  let anfrageFollowUps = 0;

  // ── KI-Check-Leads ohne Statusänderung und ohne bisherige Nachfassung ──
  const { data: kiLeads, error: kiError } = await supabase
    .from('kunden')
    .select('id, kontaktperson, email')
    .eq('status', 'anfrage')
    .is('follow_up_sent_at', null)
    .not('email', 'is', null)
    .lt('created_at', cutoff)
    .gte('created_at', maxAgeCutoff)
    .limit(MAX_PER_RUN);
  if (kiError) {
    console.error('[cron:lead-followup] kunden query:', kiError.message);
    Sentry.captureException(kiError);
  }

  if (resend && kiLeads?.length) {
    for (const lead of kiLeads) {
      if (!lead.email) continue;
      const name = escapeHtml(lead.kontaktperson || 'Guten Tag');
      try {
        await resend.emails.send({
          from: 'Marcel Spahr <kontakt@marcelspahr.ch>',
          to: lead.email,
          subject: 'Kurze Nachfrage zu Ihrer KI-Einschätzung',
          html: `
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1e293b">
              <p style="font-size:15px;line-height:1.7">Guten Tag ${name},</p>
              <p style="font-size:15px;line-height:1.7">
                vor einigen Tagen haben Sie den KI-Check ausgefüllt und meine persönliche
                Einschätzung erhalten. Falls diese E-Mail untergegangen ist oder noch Fragen offen
                sind, melde ich mich gerne, um die nächsten Schritte für Ihr Unternehmen zu besprechen.
              </p>
              <p style="margin:24px 0">
                <a href="${PUBLIC_SITE_URL}/?lead=consultation" style="background:#c9a84c;color:#0c0a06;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">Kurzes Gespräch vereinbaren</a>
              </p>
              <p style="font-size:14px;line-height:1.7;color:#334155">
                Falls sich das Thema für Sie erledigt hat, müssen Sie nichts weiter tun. Ich melde
                mich dann nicht nochmals automatisch.
              </p>
              <p style="font-size:14px;line-height:1.7">Freundliche Grüsse<br/><strong>Marcel Spahr</strong></p>
            </div>`,
        });
        await supabase.from('kunden').update({ follow_up_sent_at: new Date().toISOString() }).eq('id', lead.id);
        kiCheckFollowUps += 1;
      } catch (e) {
        console.error('[cron:lead-followup] ki-check send:', e);
        Sentry.captureException(e);
      }
    }
  }

  // ── Projektanfragen ohne Statusänderung und ohne bisherige Nachfassung ──
  const { data: anfragen, error: anfrageError } = await supabase
    .from('re_anfragen')
    .select('id, name, email')
    .eq('status', 'neu')
    .is('follow_up_sent_at', null)
    .lt('created_at', cutoff)
    .gte('created_at', maxAgeCutoff)
    .limit(MAX_PER_RUN);
  if (anfrageError) {
    console.error('[cron:lead-followup] re_anfragen query:', anfrageError.message);
    Sentry.captureException(anfrageError);
  }

  if (resend && anfragen?.length) {
    for (const lead of anfragen) {
      if (!lead.email) continue;
      const name = escapeHtml(lead.name || 'Guten Tag');
      try {
        await resend.emails.send({
          from: 'Marcel Spahr <kontakt@marcelspahr.ch>',
          to: lead.email,
          subject: 'Kurze Nachfrage zu Ihrer Projektanfrage',
          html: `
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1e293b">
              <p style="font-size:15px;line-height:1.7">Guten Tag ${name},</p>
              <p style="font-size:15px;line-height:1.7">
                vor einigen Tagen haben Sie Ihre Projektanfrage gesendet. Falls meine Antwort nicht
                angekommen ist, melde ich mich gerne persönlich, um Ihr Vorhaben zu besprechen.
              </p>
              <p style="margin:24px 0">
                <a href="mailto:kontakt@marcelspahr.ch" style="background:#c9a84c;color:#0c0a06;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">Direkt antworten</a>
              </p>
              <p style="font-size:14px;line-height:1.7;color:#334155">
                Falls sich das Vorhaben erledigt hat, müssen Sie nichts weiter tun.
              </p>
              <p style="font-size:14px;line-height:1.7">Freundliche Grüsse<br/><strong>Marcel Spahr</strong></p>
            </div>`,
        });
        await supabase.from('re_anfragen').update({ follow_up_sent_at: new Date().toISOString() }).eq('id', lead.id);
        anfrageFollowUps += 1;
      } catch (e) {
        console.error('[cron:lead-followup] anfrage send:', e);
        Sentry.captureException(e);
      }
    }
  }

  // A run hitting the cap on either table means more are still queued up
  // and will keep hitting it again tomorrow - worth a heads-up rather than
  // silently trickling out a growing backlog indefinitely.
  if (kiCheckFollowUps >= MAX_PER_RUN || anfrageFollowUps >= MAX_PER_RUN) {
    Sentry.captureMessage('[cron:lead-followup] Hit MAX_PER_RUN cap - backlog likely still queued', {
      level: 'warning',
      extra: { kiCheckFollowUps, anfrageFollowUps, maxPerRun: MAX_PER_RUN },
    });
  }

  return NextResponse.json({ ok: true, kiCheckFollowUps, anfrageFollowUps });
}
