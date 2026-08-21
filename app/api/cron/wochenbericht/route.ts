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

  // Nur senden, wenn ein aktiver "Wochenbericht"-Agent existiert – so
  // wirkt der Pause-Schalter im Dashboard auch für diese Automation.
  const { data: agents, error: agentError } = await supabase
    .from('ki_agenten')
    .select('id, ausfuehrungen_total')
    .eq('status', 'aktiv')
    .eq('konfiguration->>automation', 'weekly_report');
  if (agentError) console.error('[cron:wochenbericht] agent query:', agentError.message);
  if (!agents || agents.length === 0) {
    return NextResponse.json({ ok: true, skipped: 'kein aktiver Wochenbericht-Agent' });
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: rechnungen },
    { data: projekte },
    { data: kunden },
    { data: deals },
    { data: tasks },
    { data: neueKiLeads },
    { data: neueAnfragen },
  ] = await Promise.all([
    supabase.from('rechnungen').select('status, gesamtbetrag, bezahlt_am'),
    supabase.from('projekte').select('status'),
    supabase.from('kunden').select('id'),
    supabase.from('deals').select('status, wert'),
    supabase.from('tasks').select('id, status, faellig_am').neq('status', 'done').lte('faellig_am', in7Days),
    supabase.from('kunden').select('id').eq('status', 'anfrage'),
    supabase.from('re_anfragen').select('id').eq('status', 'neu'),
  ]);

  const rd = rechnungen ?? [];
  const monatsumsatz = rd
    .filter((r) => r.status === 'bezahlt' && r.bezahlt_am && r.bezahlt_am >= startOfMonth)
    .reduce((sum, r) => sum + (r.gesamtbetrag || 0), 0);
  const offeneRechnungen = rd.filter((r) => ['gesendet', 'ueberfaellig'].includes(r.status));
  const offeneRechnBetrag = offeneRechnungen.reduce((sum, r) => sum + (r.gesamtbetrag || 0), 0);
  const aktiveProjekte = (projekte ?? []).filter((p) => p.status === 'aktiv').length;
  const offeneDeals = (deals ?? []).filter((d) => !['gewonnen', 'verloren'].includes(d.status));
  const pipelineWert = offeneDeals.reduce((sum, d) => sum + (d.wert || 0), 0);
  const faelligeTasks = (tasks ?? []).length;
  const leadCount = (neueKiLeads?.length ?? 0) + (neueAnfragen?.length ?? 0);

  const zeilen: Array<[string, string]> = [
    ['Umsatz diesen Monat', formatCHF(monatsumsatz)],
    ['Aktive Projekte', String(aktiveProjekte)],
    ['Kunden total', String(kunden?.length ?? 0)],
    ['Offene Rechnungen', `${offeneRechnungen.length} · ${formatCHF(offeneRechnBetrag)}`],
    ['Pipeline (offen)', `${offeneDeals.length} Deals · ${formatCHF(pipelineWert)}`],
    ['Fällige Aufgaben (7 Tage)', String(faelligeTasks)],
    ['Unbearbeitete neue Leads', String(leadCount)],
  ];

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const rows = zeilen.map(([label, value]) => `
      <tr>
        <td style="padding:8px 20px 8px 0;color:#94a3b8;font-size:13px">${label}</td>
        <td style="padding:8px 0;color:#f1f5f9;font-size:15px;font-weight:700">${value}</td>
      </tr>`).join('');

    try {
      await resend.emails.send({
        from: 'Nina – Wochenbericht <noreply@marcelspahr.ch>',
        to: 'kontakt@marcelspahr.ch',
        subject: `Wochenbericht · ${now.toLocaleDateString('de-CH', { day: 'numeric', month: 'long' })}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0f1117;color:#e2e8f0;border-radius:12px;overflow:hidden">
            <div style="background:#6366f1;padding:22px 28px">
              <h1 style="margin:0;color:#fff;font-size:19px;font-weight:700">Dein Wochenbericht</h1>
              <p style="margin:4px 0 0;color:#e0e0ff;font-size:12px">Command Center · marcelspahr.ch</p>
            </div>
            <div style="padding:24px 28px">
              <table style="width:100%;border-collapse:collapse">${rows}</table>
              <p style="margin:24px 0 0;color:#64748b;font-size:12px">Automatisch erstellt von Nina jeden Freitag. Im Dashboard pausierbar unter KI-Agenten.</p>
            </div>
          </div>`,
      });
    } catch (e) {
      console.error('[cron:wochenbericht] Resend:', e);
    }
  }

  await supabase.from('ki_agenten').update({
    letzte_ausfuehrung: now.toISOString(),
    ausfuehrungen_total: (agents[0].ausfuehrungen_total ?? 0) + 1,
  }).eq('id', agents[0].id);

  return NextResponse.json({ ok: true, stats: Object.fromEntries(zeilen) });
}
