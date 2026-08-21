import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { formatCHF } from '@/lib/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Supabase ist nicht konfiguriert.' }, { status: 503 });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  // Nur aktiv, wenn ein aktiver "Mahnwesen"-Agent existiert – der
  // Pause-Schalter im Dashboard stoppt damit auch diese Automation.
  const { data: agents, error: agentError } = await supabase
    .from('ki_agenten')
    .select('id, ausfuehrungen_total')
    .eq('status', 'aktiv')
    .eq('konfiguration->>automation', 'mahnwesen');
  if (agentError) console.error('[cron:mahnwesen] agent query:', agentError.message);
  if (!agents || agents.length === 0) {
    return NextResponse.json({ ok: true, skipped: 'kein aktiver Mahnwesen-Agent' });
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data: faellig, error } = await supabase
    .from('rechnungen')
    .select('id, rechnungsnummer, gesamtbetrag, faellig_am, status, kunden:kunden_id(kontaktperson, firmenname, email)')
    .in('status', ['gesendet', 'ueberfaellig'])
    .lt('faellig_am', today)
    .is('mahnung_1_gesendet_am', null);
  if (error) {
    console.error('[cron:mahnwesen] query:', error.message);
    return NextResponse.json({ error: 'Abfrage fehlgeschlagen.' }, { status: 500 });
  }

  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  let gemahnt = 0;
  let internMarkiert = 0;

  for (const rechnung of faellig ?? []) {
    const kunde = (rechnung as any).kunden;
    const email = kunde?.email as string | undefined;
    const name = kunde?.kontaktperson || kunde?.firmenname || 'Guten Tag';

    if (resend && email) {
      try {
        await resend.emails.send({
          from: 'Marcel Spahr <kontakt@marcelspahr.ch>',
          to: email,
          subject: `Zahlungserinnerung: Rechnung ${rechnung.rechnungsnummer}`,
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1e293b">
              <p style="font-size:15px;line-height:1.7">Guten Tag ${name},</p>
              <p style="font-size:15px;line-height:1.7">
                eine freundliche Erinnerung: Rechnung <strong>${rechnung.rechnungsnummer}</strong> über
                <strong>${formatCHF(rechnung.gesamtbetrag || 0)}</strong> war am ${new Date(rechnung.faellig_am).toLocaleDateString('de-CH')}
                fällig und ist laut unseren Unterlagen noch offen.
              </p>
              <p style="font-size:15px;line-height:1.7">
                Falls die Zahlung bereits unterwegs ist, betrachten Sie diese Erinnerung als
                gegenstandslos. Bei Fragen erreichen Sie mich jederzeit unter
                <a href="mailto:kontakt@marcelspahr.ch">kontakt@marcelspahr.ch</a>.
              </p>
              <p style="font-size:15px;line-height:1.7">Freundliche Grüsse<br/><strong>Marcel Spahr</strong></p>
            </div>`,
        });
        gemahnt += 1;
      } catch (e) {
        console.error('[cron:mahnwesen] Resend:', e);
      }
    } else {
      internMarkiert += 1;
    }

    await supabase.from('rechnungen').update({
      status: 'ueberfaellig',
      mahnung_1_gesendet_am: new Date().toISOString(),
    }).eq('id', rechnung.id);
  }

  await supabase.from('ki_agenten').update({
    letzte_ausfuehrung: new Date().toISOString(),
    ausfuehrungen_total: (agents[0].ausfuehrungen_total ?? 0) + 1,
  }).eq('id', agents[0].id);

  return NextResponse.json({ ok: true, geprueft: faellig?.length ?? 0, gemahnt, ohneEmail: internMarkiert });
}
