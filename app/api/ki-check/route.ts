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
  if (!v) return '–';
  if (Array.isArray(v)) return v.length > 0 ? v.join(', ') : '–';
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
    readinessLabel = 'KI-Einsteiger mit Potenzial';
    readinessDesc = `Ihr Unternehmen steht am Anfang der KI-Reise – mit ${urgency} Automatisierungspotenzial. Genau der richtige Moment, strukturiert und ohne Umwege einzusteigen.`;
  } else if (maturity === 'intermediate') {
    readinessLabel = 'KI-Anwender auf Wachstumskurs';
    readinessDesc = 'Sie nutzen KI bereits punktuell – jetzt geht es darum, aus einzelnen Insellösungen eine kohärente Strategie zu machen, die wirklich skaliert.';
  } else {
    readinessLabel = 'KI-Pionier';
    readinessDesc = 'Ihr Unternehmen ist bereits fortgeschritten. Der nächste Schritt: KI noch tiefer in Kernprozesse integrieren, Prozesse messen und skalieren.';
  }

  const recs: Rec[] = [];

  if (maturity === 'starter') {
    recs.push({
      title: 'KI-Beratung für KMU',
      reason: 'Ihr persönlicher KI-Fahrplan: Welche Tools passen wirklich zu Ihnen, welche Schritte bringen sofort Ergebnisse – und was können Sie später angehen.',
      url: 'https://www.marcelspahr.ch/leistungen/ki-beratung-kmu',
    });
  }

  if (barriers.some(b => b.includes('skeptisch') || b.includes('anfangen'))) {
    recs.push({
      title: 'Workshops & Schulungen',
      reason: 'Ein massgeschneiderter Workshop holt Ihr Team ab und macht KI greifbar – mit echten Aufgaben aus Ihrem Alltag, nicht mit abstrakten Beispielen.',
      url: 'https://www.marcelspahr.ch/leistungen/workshops',
    });
  }

  if (timeWasters.some(t => t.includes('E-Mail') || t.includes('Kundenanfragen') || t.includes('Daten'))) {
    recs.push({
      title: 'KI-Agenten & Automatisierung',
      reason: 'Genau für diese Aufgaben lassen sich KI-Agenten bauen, die 24/7 für Sie arbeiten – ohne zusätzliche Mitarbeitende.',
      url: 'https://www.marcelspahr.ch/leistungen/ki-agenten',
    });
  }

  if (timeWasters.some(t => t.includes('Offerten') || t.includes('Dokumente') || t.includes('Daten zwischen'))) {
    recs.push({
      title: 'Prozessoptimierung (BPMN)',
      reason: 'Diese Abläufe können digitalisiert und automatisiert werden – mit messbarer Zeitersparnis und klarer Vorher/Nachher-Kalkulation.',
      url: 'https://www.marcelspahr.ch/leistungen/prozessoptimierung',
    });
  }

  if (timeWasters.some(t => t.includes('Vertrieb') || t.includes('Lead')) || priority.includes('Umsatz')) {
    recs.push({
      title: 'Digital Marketing & Social Media',
      reason: 'KI-unterstützte Content-Strategie und LinkedIn-Aufbau für mehr Sichtbarkeit, mehr qualifizierte Leads – ohne bezahltes Advertising.',
      url: 'https://www.marcelspahr.ch/leistungen/digital-marketing',
    });
  }

  if (maturity !== 'starter' || timeWasters.length >= 4) {
    recs.push({
      title: 'Business Analyse & Requirements',
      reason: 'Prozesse systematisch analysieren, Prioritäten setzen und Lösungen sauber spezifizieren – bevor etwas gebaut wird.',
      url: 'https://www.marcelspahr.ch/leistungen/business-analyse',
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
                <a href="mailto:${email}?subject=Ihr persönlicher KI-Fahrplan – Marcel Spahr"
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
          <a href="${r.url}" style="color:#b8943a;font-size:13px;text-decoration:none;font-weight:600">Mehr erfahren →</a>
        </div>`).join('');

      resend.emails.send({
        from:    'Marcel Spahr <kontakt@marcelspahr.ch>',
        to:      email,
        subject: `Ihr persönlicher KI-Fahrplan – ${readinessLabel}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#ffffff;color:#1e293b;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
            <div style="background:#0c0a06;padding:28px 32px">
              <h1 style="margin:0;color:#c9a84c;font-size:22px;font-weight:700">Ihr persönlicher KI-Fahrplan</h1>
              <p style="margin:6px 0 0;color:#7a6d5a;font-size:13px">Erstellt von Marcel Spahr · marcelspahr.ch</p>
            </div>
            <div style="padding:32px">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155">Guten Tag ${name},</p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#334155">
                vielen Dank für Ihren KI-Check. Ich habe Ihre Antworten ausgewertet und Ihren
                persönlichen Fahrplan zusammengestellt – basierend auf dem, wo Ihr Unternehmen
                heute steht und was Sie erreichen möchten.
              </p>
              <div style="background:#0c0a06;border-radius:10px;padding:20px 24px;margin-bottom:28px">
                <p style="margin:0 0 4px;color:#c9a84c;font-size:10px;text-transform:uppercase;letter-spacing:0.08em;font-weight:700">Ihr KI-Reifegrad</p>
                <p style="margin:0 0 8px;color:#f4edd8;font-size:18px;font-weight:700">${readinessLabel}</p>
                <p style="margin:0;color:#a89880;font-size:13px;line-height:1.6">${readinessDesc}</p>
              </div>
              <p style="margin:0 0 14px;font-size:15px;color:#1e293b;font-weight:600">Meine konkreten Empfehlungen für Sie:</p>
              ${recHtml}
              <div style="background:#fffbeb;border-radius:10px;padding:18px 22px;margin:24px 0;border:1px solid #fde68a">
                <p style="margin:0 0 6px;color:#92400e;font-size:13px;font-weight:700">Mein Versprechen an Sie</p>
                <p style="margin:0;color:#78350f;font-size:13px;line-height:1.7">
                  KI ersetzt Menschen nicht – sie macht gute Menschen noch besser. Ich zeige Ihnen,
                  wie Sie KI als Verstärker Ihrer Erfahrung nutzen, nicht als Ersatz dafür.
                  Der Mensch bleibt der Dirigent.
                </p>
              </div>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#334155">
                Als nächsten Schritt empfehle ich ein <strong>kostenloses 30-minütiges Erstgespräch</strong>,
                in dem wir gemeinsam schauen, welcher Hebel bei Ihnen am meisten bringt – konkret,
                ohne Buzzwords.
              </p>
              <div style="text-align:center;margin:28px 0">
                <a href="mailto:kontakt@marcelspahr.ch?subject=Erstgespräch nach KI-Check – ${encodeURIComponent(firma)}"
                   style="background:#c9a84c;color:#0c0a06;padding:14px 32px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:700;display:inline-block">
                  Kostenloses Erstgespräch vereinbaren
                </a>
              </div>
              <p style="margin:24px 0 0;font-size:14px;line-height:1.7;color:#334155">
                Freundliche Grüsse<br/>
                <strong>Marcel Spahr</strong><br/>
                <span style="color:#64748b;font-size:13px">KI-Berater & Wirtschaftsinformatiker · Bern, Schweiz</span><br/>
                <span style="color:#64748b;font-size:13px">+41 79 511 09 11 · kontakt@marcelspahr.ch</span>
              </p>
            </div>
            <div style="padding:14px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center">
              <a href="https://www.marcelspahr.ch" style="color:#c9a84c;font-size:13px;text-decoration:none;font-weight:600">www.marcelspahr.ch</a>
              <a href="https://www.marcelspahr.ch/datenschutz" style="color:#94a3b8;font-size:12px;text-decoration:none">Datenschutz</a>
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
