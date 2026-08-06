import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

type CheckPayload = {
  answers: Record<string, string | string[]>;
  name: string;
  email: string;
  firma: string;
  telefon?: string;
  consent: boolean;
};

function label(v: string | string[] | undefined): string {
  if (!v) return 'Keine Angabe.';
  if (Array.isArray(v)) return v.length > 0 ? v.join(', ') : 'Keine Angabe.';
  return v;
}

const QUESTION_LABELS: Record<string, string> = {
  'team-size':        'Mitarbeitende',
  'industry':         'Branche',
  'role':             'Rolle',
  'time-wasters':     'Zeitfresser',
  'time-lost':        'Stunden/Woche',
  'knowledge':        'Wissensmanagement',
  'ai-status':        'KI-Status',
  'barriers':         'Hürden',
  'expected-results': 'Erhoffte Ergebnisse',
  'top-priority':     'Top-Priorität 12 Monate',
};

type Rec = { title: string; reason: string; url: string };

const PUBLIC_SITE_URL = 'https://www.marcelspahr.ch';

function serviceUrl(slug: string) {
  return `${PUBLIC_SITE_URL}/leistungen/${slug}`;
}

function generateReport(answers: Record<string, string | string[]>) {
  const timeWasters = (answers['time-wasters'] as string[]) ?? [];
  const aiStatus    = (answers['ai-status']    as string)   ?? '';
  const barriers    = (answers['barriers']     as string[]) ?? [];
  const timeLost    = (answers['time-lost']    as string)   ?? '';
  const priority    = (answers['top-priority'] as string)   ?? '';

  // Maturity level
  const maturity = aiStatus.includes('Gar nicht') || aiStatus.includes('experimentieren')
    ? 'starter'
    : aiStatus.includes('punktuell')
      ? 'intermediate'
      : 'advanced';

  let readinessLabel: string;
  let readinessDesc: string;
  if (maturity === 'starter') {
    const urgency = timeLost.includes('20') || timeLost.includes('10') ? 'hohem' : 'moderatem';
    readinessLabel = 'Sie stehen beim Einsatz von KI am Anfang.';
    readinessDesc = `In Ihrem Unternehmen sehe ich ${urgency} Potenzial für Automatisierung. Bevor Sie ein Werkzeug auswählen, sollten Sie die wichtigsten Aufgaben und den erwarteten Nutzen festhalten.`;
  } else if (maturity === 'intermediate') {
    readinessLabel = 'Sie nutzen KI bereits für einzelne Aufgaben.';
    readinessDesc = 'Prüfen Sie jetzt, welche Anwendungen im Alltag wirklich helfen. Danach können Sie Regeln, Zuständigkeiten und den Umgang mit Daten einheitlich festlegen.';
  } else {
    readinessLabel = 'Sie setzen KI bereits regelmässig ein.';
    readinessDesc = 'Als nächsten Schritt können Sie die bestehenden Anwendungen messen und prüfen, welche davon sicher in wichtige Abläufe eingebunden werden können.';
  }

  const recs: Rec[] = [];

  if (maturity === 'starter') {
    recs.push({
      title: 'Analyse und KI Konzept',
      reason: 'Ich prüfe, welche Aufgaben zuerst angegangen werden sollten, welche Werkzeuge passen und was vorerst warten kann.',
      url: serviceUrl('analyse-konzept'),
    });
  }

  if (barriers.some(b => b.includes('skeptisch') || b.includes('anfangen'))) {
    recs.push({
      title: 'KI Einführung und Schulung',
      reason: 'In einem Workshop arbeitet Ihr Team mit eigenen Aufgaben. So wird schnell klar, wo KI hilft und welche Regeln nötig sind.',
      url: serviceUrl('automatisierung-ki-agenten'),
    });
  }

  if (timeWasters.some(t => t.includes('E-Mail') || t.includes('Kundenanfragen') || t.includes('Daten'))) {
    recs.push({
      title: 'KI Automation und KI Unterstützung',
      reason: 'Wiederkehrende E-Mails, Kundenanfragen und Dateneingaben lassen sich teilweise vorbereiten oder automatisieren. Ihr Team prüft die Ergebnisse und behält die Verantwortung.',
      url: serviceUrl('automatisierung-ki-agenten'),
    });
  }

  if (timeWasters.some(t => t.includes('Offerten') || t.includes('Dokumente') || t.includes('Daten zwischen'))) {
    recs.push({
      title: 'ERP und Geschäftsprozesse',
      reason: 'Ich würde diese Abläufe zuerst aufnehmen und die benötigte Zeit messen. Danach lässt sich entscheiden, welche Schritte digitalisiert oder automatisiert werden sollten.',
      url: serviceUrl('erp-prozesse'),
    });
  }

  if (timeWasters.some(t => t.includes('Vertrieb') || t.includes('Lead')) || priority.includes('Umsatz')) {
    recs.push({
      title: 'CRM-Lösungen',
      reason: 'Ein gemeinsamer Ort für Kontakte, Aufgaben und nächste Schritte hilft Ihrem Team, Anfragen vollständig und pünktlich zu bearbeiten.',
      url: serviceUrl('crm-loesungen'),
    });
  }

  if (maturity !== 'starter' || timeWasters.length >= 4) {
    recs.push({
      title: 'Analyse und Konzept',
      reason: 'Ich würde die Prozesse zuerst analysieren, Prioritäten setzen und die Anforderungen verständlich festhalten. Danach kann die Umsetzung geplant werden.',
      url: serviceUrl('analyse-konzept'),
    });
  }

  const seen = new Set<string>();
  const top3 = recs.filter(r => {
    if (seen.has(r.title)) return false;
    seen.add(r.title);
    return true;
  }).slice(0, 3);

  return { maturity, readinessLabel, readinessDesc, top3 };
}

export async function POST(req: Request) {
  try {
    const { answers, name, email, firma, telefon, consent } = (await req.json()) as CheckPayload;

    if (!name?.trim() || !email?.trim() || !firma?.trim() || consent !== true) {
      return NextResponse.json({ error: 'Fehlende Felder' }, { status: 400 });
    }

    const { readinessLabel, readinessDesc, top3 } = generateReport(answers);

    // ── Supabase: Kunden-Eintrag anlegen ──────────────────────────────────
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
        );
        const notizLines = [
          `KI-Check Anfrage`,
          `Reifegrad: ${readinessLabel}`,
          answers['industry']          ? `Branche: ${label(answers['industry'])}` : null,
          answers['team-size']         ? `Teamgrösse: ${label(answers['team-size'])}` : null,
          answers['time-wasters']      ? `Zeitfresser: ${label(answers['time-wasters'])}` : null,
          answers['ai-status']         ? `KI-Status: ${label(answers['ai-status'])}` : null,
          answers['top-priority']      ? `Top-Priorität: ${label(answers['top-priority'])}` : null,
        ].filter(Boolean).join('\n');

        await supabase.from('kunden').insert({
          kontaktperson: name,
          firmenname:    firma || null,
          email:         email || null,
          telefon:       telefon || null,
          branche:       (answers['industry'] as string) || null,
          status:        'anfrage',
          notizen:       notizLines,
        });
      } catch (dbErr) {
        console.error('[ki-check] Supabase insert:', dbErr);
      }
    }

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);

      // 1. Lead notification to Marcel
      const answerRows = Object.entries(QUESTION_LABELS)
        .map(([id, lbl]) => `
          <tr>
            <td style="padding:5px 16px 5px 0;color:#94a3b8;font-size:12px;white-space:nowrap;vertical-align:top">${lbl}</td>
            <td style="padding:5px 0;color:#e2e8f0;font-size:13px">${label(answers[id])}</td>
          </tr>`)
        .join('');

      resend.emails.send({
        from:    'noreply@marcelspahr.ch',
        to:      'kontakt@marcelspahr.ch',
        replyTo: email,
        subject: `🎯 KI-Check Lead: ${firma} (${name})`,
        html: `
          <div style="font-family:sans-serif;max-width:640px;margin:0 auto;background:#0f1117;color:#e2e8f0;border-radius:12px;overflow:hidden">
            <div style="background:#c9a84c;padding:22px 32px">
              <h1 style="margin:0;color:#0c0a06;font-size:20px;font-weight:700">Neuer KI-Readiness-Check Lead</h1>
              <p style="margin:4px 0 0;color:#7a5c00;font-size:13px">marcelspahr.ch · KI-Check</p>
            </div>
            <div style="padding:28px 32px">
              <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
                <tr><td style="padding:5px 0;color:#94a3b8;font-size:13px;width:110px">Name</td><td style="color:#f1f5f9;font-size:13px;font-weight:600">${name}</td></tr>
                <tr><td style="padding:5px 0;color:#94a3b8;font-size:13px">E-Mail</td><td><a href="mailto:${email}" style="color:#c9a84c;font-size:13px">${email}</a></td></tr>
                <tr><td style="padding:5px 0;color:#94a3b8;font-size:13px">Firma</td><td style="color:#f1f5f9;font-size:13px">${firma}</td></tr>
                ${telefon ? `<tr><td style="padding:5px 0;color:#94a3b8;font-size:13px">Telefon</td><td style="color:#f1f5f9;font-size:13px">${telefon}</td></tr>` : ''}
              </table>
              <div style="background:#1e2235;border-radius:8px;padding:14px 18px;margin-bottom:20px;border-left:3px solid #c9a84c">
                <p style="margin:0 0 3px;color:#c9a84c;font-size:10px;text-transform:uppercase;letter-spacing:0.08em;font-weight:700">${readinessLabel}</p>
                <p style="margin:0;color:#e2e8f0;font-size:13px;line-height:1.6">${readinessDesc}</p>
              </div>
              <p style="margin:0 0 10px;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;font-weight:600">Alle Antworten</p>
              <table style="width:100%;border-collapse:collapse">${answerRows}</table>
              <div style="margin-top:24px">
                <a href="mailto:${email}?subject=Ihre persönliche KI Einschätzung. Marcel Spahr."
                   style="background:#c9a84c;color:#0c0a06;padding:11px 22px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:700;display:inline-block">
                  Direkt antworten
                </a>
              </div>
            </div>
          </div>`,
      }).catch(e => console.error('[ki-check] Resend Marcel:', e));

      // 2. Personalized report to user
      const recHtml = top3.map(r => `
        <div style="background:#f8fafc;border-radius:8px;padding:16px 20px;margin-bottom:12px;border-left:3px solid #c9a84c">
          <p style="margin:0 0 4px;font-weight:700;color:#1e293b;font-size:14px">${r.title}</p>
          <p style="margin:0 0 8px;color:#475569;font-size:13px;line-height:1.6">${r.reason}</p>
          <a href="${r.url}" target="_blank" rel="noopener noreferrer" style="color:#b8943a;font-size:13px;text-decoration:none;font-weight:600;display:inline-block">Mehr erfahren →</a>
        </div>`).join('');

      resend.emails.send({
        from:    'Marcel Spahr <kontakt@marcelspahr.ch>',
        to:      email,
        subject: `Ihre persönliche KI Einschätzung. ${readinessLabel}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#ffffff;color:#1e293b;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
            <div style="background:#0c0a06;padding:28px 32px">
              <h1 style="margin:0;color:#c9a84c;font-size:22px;font-weight:700">Meine Einschätzung zu Ihrem KI Einsatz.</h1>
              <p style="margin:6px 0 0;color:#7a6d5a;font-size:13px">Persönlich geprüft von Marcel Spahr. marcelspahr.ch.</p>
            </div>
            <div style="padding:32px">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155">Guten Tag ${name},</p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#334155">
                vielen Dank für Ihre Antworten. Ich habe Ihre Angaben geprüft und daraus diese
                Einschätzung erstellt. Sie berücksichtigt Ihre heutige Situation und die Ziele,
                die Sie für Ihr Unternehmen genannt haben.
              </p>
              <div style="background:#0c0a06;border-radius:10px;padding:20px 24px;margin-bottom:28px">
                <p style="margin:0 0 4px;color:#c9a84c;font-size:10px;text-transform:uppercase;letter-spacing:0.08em;font-weight:700">Ihr KI-Reifegrad</p>
                <p style="margin:0 0 8px;color:#f4edd8;font-size:18px;font-weight:700">${readinessLabel}</p>
                <p style="margin:0;color:#a89880;font-size:13px;line-height:1.6">${readinessDesc}</p>
              </div>
              <p style="margin:0 0 14px;font-size:15px;color:#1e293b;font-weight:600">Meine konkreten Empfehlungen für Sie:</p>
              ${recHtml}
              <div style="background:#fffbeb;border-radius:10px;padding:18px 22px;margin:24px 0;border:1px solid #fde68a">
                <p style="margin:0 0 6px;color:#92400e;font-size:13px;font-weight:700">Worauf ich bei der Umsetzung achte.</p>
                <p style="margin:0;color:#78350f;font-size:13px;line-height:1.7">
                  Ich setze KI nur dort ein, wo der Nutzen nachvollziehbar ist. Ihr Team prüft
                  wichtige Ergebnisse und bleibt für Entscheidungen verantwortlich.
                </p>
              </div>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#334155">
                Wenn Sie die Einschätzung besprechen möchten, können wir ein <strong>kostenloses Gespräch von 30 Minuten</strong>
                vereinbaren. Dabei klären wir, welche Aufgabe zuerst geprüft werden sollte.
              </p>
              <div style="text-align:center;margin:28px 0">
                <a href="${PUBLIC_SITE_URL}/?lead=consultation" target="_blank" rel="noopener noreferrer"
                   style="background:#c9a84c;color:#0c0a06;padding:14px 32px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:700;display:inline-block">
                  Kostenloses Erstgespräch vereinbaren
                </a>
              </div>
              <p style="margin:24px 0 0;font-size:14px;line-height:1.7;color:#334155">
                Freundliche Grüsse<br/>
                <strong>Marcel Spahr</strong><br/>
                <span style="color:#64748b;font-size:13px">Wirtschaftsinformatiker und KI Berater. Bern, Schweiz.</span><br/>
                <span style="color:#64748b;font-size:13px">+41 79 511 09 11. kontakt@marcelspahr.ch.</span>
              </p>
            </div>
            <div style="padding:14px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center">
              <a href="${PUBLIC_SITE_URL}" target="_blank" rel="noopener noreferrer" style="color:#c9a84c;font-size:13px;text-decoration:none;font-weight:600">www.marcelspahr.ch</a>
              <a href="${PUBLIC_SITE_URL}/datenschutz" target="_blank" rel="noopener noreferrer" style="color:#94a3b8;font-size:12px;text-decoration:none">Datenschutz</a>
            </div>
          </div>`,
      }).catch(e => console.error('[ki-check] Resend User:', e));
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[ki-check]', err);
    return NextResponse.json({ error: 'Server-Fehler' }, { status: 500 });
  }
}
