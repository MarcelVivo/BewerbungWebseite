import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { escapeHtml, isSpamSubmission, tooLong } from '@/app/lib/spamGuard';
import { validatePublicPost } from '@/app/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ConversationMessage = { role: 'user' | 'assistant'; content: string };

function text(value: unknown, max = 500) {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, max);
}

function list(value: unknown, maxItems = 12) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((entry) => text(entry, 300)).filter(Boolean))).slice(0, maxItems);
}

function htmlList(items: string[], empty = 'Keine Angabe.') {
  if (items.length === 0) return `<p style="margin:0;color:#64748b;font-size:13px">${empty}</p>`;
  return `<ul style="margin:6px 0 0;padding-left:18px;color:#e2e8f0;font-size:13px;line-height:1.65">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

export async function POST(request: NextRequest) {
  const rejected = validatePublicPost(request, {
    key: 'aila-lead',
    limit: 5,
    windowMs: 10 * 60_000,
    contentTypes: ['application/json'],
    maxBytes: 64_000,
  });
  if (rejected) return rejected;

  try {
    const body = await request.json();
    const name = text(body?.contact?.name, 200);
    const email = text(body?.contact?.email, 200).toLowerCase();
    const phone = text(body?.contact?.phone, 80);
    const company = text(body?.contact?.company, 200);
    const directRequest = text(body?.directRequest, 1600);
    const language = body?.lang === 'en' ? 'en' : 'de';
    const rawConversationHasUser = Array.isArray(body?.conversation) && body.conversation.some((message: unknown) => {
      if (!message || typeof message !== 'object') return false;
      const entry = message as Record<string, unknown>;
      return entry.role === 'user' && Boolean(text(entry.content, 1600));
    });
    const rawConversationSummary = text(body?.lead?.conversationSummary || body?.conversationSummary, 1200);
    const hasConversationContext = rawConversationHasUser || Boolean(rawConversationSummary);

    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^[+()\d\s.\-/]{6,40}$/.test(phone) || body?.consent !== true) {
      return NextResponse.json({ error: 'Fehlende oder ungültige Pflichtfelder' }, { status: 400 });
    }
    if (tooLong(body?.conversationSummary, 1200) || tooLong(body?.directRequest, 1600)) {
      return NextResponse.json({ error: 'Eingabe zu lang' }, { status: 400 });
    }
    if (!hasConversationContext && directRequest.length < 10) {
      return NextResponse.json({ error: 'Ein konkretes Anliegen ist erforderlich' }, { status: 400 });
    }
    if (isSpamSubmission(body?.hpWebsite, body?.startedAt)) {
      return NextResponse.json({ ok: true });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const resendKey = process.env.RESEND_API_KEY;
    if (!supabaseUrl || !serviceKey || !resendKey) {
      console.error('[aila-lead] Missing Supabase or Resend configuration');
      // A lost lead is a lost sale, not just a bug - flagged as its own
      // level so it stands out from routine caught exceptions in Sentry.
      Sentry.captureMessage('[aila-lead] Missing Supabase or Resend configuration', 'fatal');
      return NextResponse.json({ error: 'Kontaktübergabe ist nicht vollständig konfiguriert' }, { status: 503 });
    }

    const lead = body?.lead && typeof body.lead === 'object' ? body.lead as Record<string, unknown> : {};
    const recommendation = body?.recommendation && typeof body.recommendation === 'object'
      ? body.recommendation as Record<string, unknown>
      : {};
    const goals = list(lead.goals);
    const problems = list(lead.problems);
    const notWanted = list(lead.notWanted);
    const existingSystems = list(lead.existingSystems);
    const recommendedServices = list(lead.recommendedServices);
    const deliberatelyLater = list(recommendation.notRecommended, 6);
    const industry = text(lead.industry, 200);
    const location = text(lead.location, 200);
    const leadTemperature = ['unknown', 'cold', 'warm', 'hot'].includes(String(lead.leadTemperature))
      ? String(lead.leadTemperature)
      : 'unknown';
    const conversationSummary = text(lead.conversationSummary || body?.conversationSummary, 1200);
    const conversation: ConversationMessage[] = Array.isArray(body?.conversation)
      ? body.conversation
          .filter((message: unknown): message is Record<string, unknown> => Boolean(message) && typeof message === 'object')
          .map((message: Record<string, unknown>) => ({
            role: message.role === 'assistant' ? 'assistant' as const : 'user' as const,
            content: text(message.content, 1600),
          }))
          .filter((message: ConversationMessage) => message.content)
          .slice(-12)
      : [];

    const section = (label: string, values: string[]) => values.length ? `${label}:\n- ${values.join('\n- ')}` : `${label}: Keine Angabe.`;
    const transcript = conversation.length
      ? conversation.map((message) => `${message.role === 'assistant' ? 'AILA' : 'Kunde'}: ${message.content}`).join('\n\n')
      : 'Kein Gesprächsprotokoll verfügbar.';
    const crmNotes = (hasConversationContext
      ? [
          'AILA-GESPRÄCH',
          conversationSummary ? `Zusammenfassung: ${conversationSummary}` : null,
          industry ? `Branche: ${industry}` : null,
          location ? `Standort: ${location}` : null,
          section('Ziele / gewünscht', goals),
          section('Probleme', problems),
          section('Nicht gewünscht / ausgeschlossen', notWanted),
          section('Bestehende Systeme', existingSystems),
          section('Empfohlene Leistungen', recommendedServices),
          section('Bewusst später / nicht priorisiert', deliberatelyLater),
          `Lead-Einstufung: ${leadTemperature}`,
          `Kontakt: ${name} · ${email} · ${phone}`,
          '',
          'GESPRÄCHSPROTOKOLL',
          transcript,
        ]
      : [
          'DIREKTE ANFRAGE',
          `Anliegen: ${directRequest}`,
          industry ? `Branche: ${industry}` : null,
          location ? `Standort: ${location}` : null,
          `Kontakt: ${name} · ${email} · ${phone}`,
        ])
      .filter((entry): entry is string => entry !== null)
      .join('\n\n')
      .slice(0, 30000);

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: requestRow, error: requestError } = await supabase.from('kontaktanfragen').insert({
      name,
      email,
      nachricht: crmNotes,
      sprache: language,
      status: 'neu',
    }).select('id').single();
    if (requestError) throw new Error(`Kontaktanfrage: ${requestError.message}`);

    const { data: existingCustomer, error: existingError } = await supabase
      .from('kunden')
      .select('id,notizen')
      .eq('email', email)
      .limit(1)
      .maybeSingle();
    if (existingError) throw new Error(`Kundensuche: ${existingError.message}`);

    let customerId = existingCustomer?.id as string | undefined;
    if (customerId) {
      const notes = [existingCustomer?.notizen, crmNotes].filter(Boolean).join('\n\n––––––––––\n\n').slice(0, 50000);
      const { error } = await supabase.from('kunden').update({
        kontaktperson: name,
        firmenname: company || null,
        telefon: phone,
        branche: industry || null,
        status: 'lead',
        notizen: notes,
        updated_at: new Date().toISOString(),
      }).eq('id', customerId);
      if (error) throw new Error(`Kundenaktualisierung: ${error.message}`);
    } else {
      const { data, error } = await supabase.from('kunden').insert({
        kontaktperson: name,
        firmenname: company || null,
        email,
        telefon: phone,
        branche: industry || null,
        status: 'lead',
        notizen: crmNotes,
      }).select('id').single();
      if (error) throw new Error(`Kundenerstellung: ${error.message}`);
      customerId = data?.id;
    }

    const probability = leadTemperature === 'hot' ? 70 : leadTemperature === 'warm' ? 50 : 30;
    const { data: dealRow, error: dealError } = await supabase.from('deals').insert({
      titel: `AILA-Anfrage · ${company || name}`,
      kunden_id: customerId || null,
      status: 'lead',
      wahrscheinlichkeit: probability,
      notizen: crmNotes,
    }).select('id').single();
    if (dealError) throw new Error(`Pipeline-Lead: ${dealError.message}`);

    const safe = {
      name: escapeHtml(name), email: escapeHtml(email), phone: escapeHtml(phone), company: escapeHtml(company),
      industry: escapeHtml(industry), location: escapeHtml(location), summary: escapeHtml(conversationSummary), request: escapeHtml(directRequest),
    };
    const resend = new Resend(resendKey);
    const adminMail = await resend.emails.send({
      from: 'AILA <noreply@marcelspahr.ch>',
      to: 'kontakt@marcelspahr.ch',
      replyTo: email,
      subject: `Neue AILA-Anfrage · ${company || name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;background:#0d0e0c;color:#e9e8df;border:1px solid #443919">
          <div style="padding:26px 30px;border-bottom:1px solid #443919;background:#17150f">
            <p style="margin:0 0 8px;color:#e7c56a;font-size:12px;letter-spacing:.14em;font-weight:700">${hasConversationContext ? 'AILA · QUALIFIZIERTER KONTAKT' : 'DIREKTE ANFRAGE'}</p>
            <h1 style="margin:0;font-size:24px">${safe.company || safe.name}</h1>
          </div>
          <div style="padding:28px 30px">
            <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px">
              <tr><td style="padding:6px 0;color:#8f948c;width:120px">Name</td><td>${safe.name}</td></tr>
              <tr><td style="padding:6px 0;color:#8f948c">E-Mail</td><td><a href="mailto:${safe.email}" style="color:#e7c56a">${safe.email}</a></td></tr>
              <tr><td style="padding:6px 0;color:#8f948c">Telefon</td><td><a href="tel:${safe.phone}" style="color:#e7c56a">${safe.phone}</a></td></tr>
              ${safe.company ? `<tr><td style="padding:6px 0;color:#8f948c">Unternehmen</td><td>${safe.company}</td></tr>` : ''}
              ${safe.industry ? `<tr><td style="padding:6px 0;color:#8f948c">Branche</td><td>${safe.industry}</td></tr>` : ''}
              ${safe.location ? `<tr><td style="padding:6px 0;color:#8f948c">Standort</td><td>${safe.location}</td></tr>` : ''}
            </table>
            ${safe.request ? `<div style="padding:16px 18px;margin-bottom:22px;background:#17150f;border-left:3px solid #e7c56a"><strong style="color:#e7c56a;font-size:12px">ANLIEGEN</strong><p style="margin:8px 0 0;line-height:1.6">${safe.request}</p></div>` : ''}
            ${safe.summary ? `<div style="padding:16px 18px;margin-bottom:22px;background:#17150f;border-left:3px solid #e7c56a"><strong style="color:#e7c56a;font-size:12px">AILA-ZUSAMMENFASSUNG</strong><p style="margin:8px 0 0;line-height:1.6">${safe.summary}</p></div>` : ''}
            ${hasConversationContext ? `
              <h2 style="font-size:14px;color:#e7c56a;margin:20px 0 4px">Gewünscht / Ziele</h2>${htmlList(goals)}
              <h2 style="font-size:14px;color:#e7c56a;margin:20px 0 4px">Probleme</h2>${htmlList(problems)}
              <h2 style="font-size:14px;color:#e7c56a;margin:20px 0 4px">Nicht gewünscht / ausgeschlossen</h2>${htmlList(notWanted)}
              <h2 style="font-size:14px;color:#e7c56a;margin:20px 0 4px">Empfohlene Leistungen</h2>${htmlList(recommendedServices)}
            ` : ''}
            <div style="margin-top:28px">
              <a href="mailto:${safe.email}?subject=Ihre Anfrage bei Marcel Spahr" style="display:inline-block;padding:12px 20px;background:#e7c56a;color:#0d0e0c;text-decoration:none;font-weight:700">Direkt antworten</a>
              <a href="https://www.marcelspahr.ch/dashboard/kontakt" style="display:inline-block;padding:12px 16px;color:#e7c56a;text-decoration:none">Im CRM öffnen →</a>
            </div>
          </div>
          <div style="padding:14px 30px;border-top:1px solid #443919;color:#777c75;font-size:11px">Kontakt ${requestRow?.id || ''} · Kunde ${customerId || ''} · Deal ${dealRow?.id || ''}</div>
        </div>`,
    });
    if (adminMail.error) throw new Error(`E-Mail: ${adminMail.error.message}`);

    const customerMail = await resend.emails.send({
      from: 'Marcel Spahr <kontakt@marcelspahr.ch>',
      to: email,
      subject: hasConversationContext
        ? language === 'en' ? 'Your conversation with AILA has reached me.' : 'Dein Gespräch mit AILA ist bei mir angekommen.'
        : language === 'en' ? 'Your enquiry has reached me.' : 'Deine Anfrage ist bei mir angekommen.',
      html: language === 'en'
        ? `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#20231f"><h1>Thank you, ${safe.name}.</h1><p>${hasConversationContext ? 'Your details and the context from your conversation with AILA' : 'Your contact details and enquiry'} have reached me. I will review everything personally and contact you within two business days.</p><p>Kind regards<br><strong>Marcel Spahr</strong></p></div>`
        : `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#20231f"><h1>Danke, ${safe.name}.</h1><p>${hasConversationContext ? 'Deine Kontaktdaten und der Kontext aus deinem Gespräch mit AILA' : 'Deine Kontaktdaten und dein Anliegen'} sind bei mir angekommen. Ich prüfe alles persönlich und melde mich innerhalb von zwei Arbeitstagen.</p><p>Freundliche Grüsse<br><strong>Marcel Spahr</strong></p></div>`,
    });
    if (customerMail.error) {
      console.error('[aila-lead] Customer confirmation:', customerMail.error.message);
      Sentry.captureMessage('[aila-lead] Customer confirmation email failed', { level: 'warning', extra: { message: customerMail.error.message } });
    }

    return NextResponse.json({ ok: true, requestId: requestRow?.id, customerId, dealId: dealRow?.id });
  } catch (error) {
    console.error('[aila-lead]', error instanceof Error ? error.message : 'Unknown error');
    Sentry.captureException(error, { level: 'fatal' });
    return NextResponse.json({ error: 'Die Kontaktübergabe konnte nicht abgeschlossen werden.' }, { status: 500 });
  }
}
