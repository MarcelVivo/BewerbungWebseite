import type { SupabaseClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────────────────────
// AILA intern: Werkzeuge für den persönlichen Assistenten im
// Dashboard. Nur lesende Abfragen und sichere, additive
// Schreibaktionen (keine Löschungen, kein Rechnungsversand,
// keine finanziellen Änderungen). Jede Schreibaktion bleibt
// nachvollziehbar und ist einzeln rückgängig zu machen.
// ─────────────────────────────────────────────────────────────

export const INTERNAL_TOOL_DEFINITIONS = [
  {
    type: 'function',
    name: 'list_kunden',
    description: 'Kunden/Kontakte durchsuchen. Nutze dies zuerst, um die kunden_id für andere Werkzeuge zu finden.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Suchbegriff für Name oder Firma (optional).' },
        status: { type: 'string', enum: ['lead', 'interessent', 'kunde', 'inaktiv', 'anfrage'], description: 'Nach Status filtern (optional).' },
        limit: { type: 'number', description: 'Maximale Anzahl Ergebnisse. Standard 10.' },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'pipeline_uebersicht',
    description: 'Verkaufs-Pipeline (Deals) mit Kundennamen, Wert und Status abrufen.',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['lead', 'erstgespraech', 'angebot', 'verhandlung', 'gewonnen', 'verloren'], description: 'Nach Status filtern (optional).' },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'offene_rechnungen',
    description: 'Rechnungen abrufen, die gesendet oder überfällig sind (noch nicht bezahlt).',
    parameters: { type: 'object', properties: {}, required: [], additionalProperties: false },
  },
  {
    type: 'function',
    name: 'faellige_tasks',
    description: 'Offene Aufgaben (nicht erledigt) abrufen, sortiert nach Fälligkeit.',
    parameters: {
      type: 'object',
      properties: {
        zeitraum: { type: 'string', enum: ['ueberfaellig', 'heute', 'woche', 'alle'], description: 'Standard: woche.' },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'anstehende_termine',
    description: 'Anstehende Termine/Kalendereinträge der nächsten Tage abrufen.',
    parameters: {
      type: 'object',
      properties: {
        tage: { type: 'number', description: 'Anzahl Tage ab heute. Standard 7.' },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'neue_leads',
    description: 'Unbearbeitete neue Leads abrufen: KI-Check-Anfragen (Status "anfrage") und Projektanfragen (Status "neu").',
    parameters: { type: 'object', properties: {}, required: [], additionalProperties: false },
  },
  {
    type: 'function',
    name: 'task_erstellen',
    description: 'Eine neue Aufgabe anlegen.',
    parameters: {
      type: 'object',
      properties: {
        titel: { type: 'string' },
        beschreibung: { type: 'string' },
        faellig_am: { type: 'string', description: 'Datum im Format YYYY-MM-DD.' },
        prioritaet: { type: 'string', enum: ['niedrig', 'mittel', 'hoch', 'kritisch'] },
        kunden_id: { type: 'string', description: 'UUID des Kunden, falls zutreffend. Vorher mit list_kunden ermitteln.' },
      },
      required: ['titel'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'kunde_notiz_hinzufuegen',
    description: 'Eine Notiz an einen bestehenden Kunden anhängen (wird nicht überschrieben, sondern ergänzt).',
    parameters: {
      type: 'object',
      properties: {
        kunden_id: { type: 'string', description: 'UUID des Kunden. Vorher mit list_kunden ermitteln.' },
        notiz: { type: 'string' },
      },
      required: ['kunden_id', 'notiz'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'kunde_status_aendern',
    description: 'Den Status eines Kunden ändern.',
    parameters: {
      type: 'object',
      properties: {
        kunden_id: { type: 'string' },
        status: { type: 'string', enum: ['lead', 'interessent', 'kunde', 'inaktiv'] },
      },
      required: ['kunden_id', 'status'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'termin_erstellen',
    description: 'Einen neuen Termin im Kalender anlegen.',
    parameters: {
      type: 'object',
      properties: {
        titel: { type: 'string' },
        start_zeit: { type: 'string', description: 'ISO-Zeitstempel, z. B. 2026-08-25T14:00:00.' },
        end_zeit: { type: 'string', description: 'ISO-Zeitstempel. Falls unbekannt, eine Stunde nach Start.' },
        beschreibung: { type: 'string' },
        kunden_id: { type: 'string' },
        ort: { type: 'string' },
      },
      required: ['titel', 'start_zeit'],
      additionalProperties: false,
    },
  },
] as const;

type ToolName = typeof INTERNAL_TOOL_DEFINITIONS[number]['name'];

const KUNDEN_STATUS = new Set(['lead', 'interessent', 'kunde', 'inaktiv', 'anfrage']);
const DEAL_STATUS = new Set(['lead', 'erstgespraech', 'angebot', 'verhandlung', 'gewonnen', 'verloren']);
const PRIORITAET = new Set(['niedrig', 'mittel', 'hoch', 'kritisch']);

function isoDate(daysFromNow = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString();
}

export async function runInternalTool(
  supabase: SupabaseClient,
  name: ToolName,
  rawArgs: Record<string, unknown>,
): Promise<unknown> {
  switch (name) {
    case 'list_kunden': {
      const search = typeof rawArgs.search === 'string' ? rawArgs.search.trim() : '';
      const status = typeof rawArgs.status === 'string' && KUNDEN_STATUS.has(rawArgs.status) ? rawArgs.status : undefined;
      const limit = Math.min(Number(rawArgs.limit) || 10, 25);
      let query = supabase.from('kunden').select('id, firmenname, kontaktperson, email, telefon, branche, status, created_at').order('created_at', { ascending: false }).limit(limit);
      if (status) query = query.eq('status', status);
      if (search) query = query.or(`firmenname.ilike.%${search}%,kontaktperson.ilike.%${search}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
    case 'pipeline_uebersicht': {
      const status = typeof rawArgs.status === 'string' && DEAL_STATUS.has(rawArgs.status) ? rawArgs.status : undefined;
      let query = supabase.from('deals').select('id, titel, status, wert, wahrscheinlichkeit, geplanter_abschluss, kunden:kunden_id(kontaktperson, firmenname)').order('created_at', { ascending: false }).limit(25);
      if (status) query = query.eq('status', status);
      const { data, error } = await query;
      if (error) throw error;
      const gesamtwert = (data ?? []).reduce((sum, d: any) => sum + (Number(d.wert) || 0), 0);
      return { deals: data, anzahl: data?.length ?? 0, gesamtwert_offen: gesamtwert };
    }
    case 'offene_rechnungen': {
      const { data, error } = await supabase
        .from('rechnungen')
        .select('id, rechnungsnummer, status, gesamtbetrag, faellig_am, kunden:kunden_id(kontaktperson, firmenname)')
        .in('status', ['gesendet', 'ueberfaellig'])
        .order('faellig_am', { ascending: true })
        .limit(25);
      if (error) throw error;
      const summe = (data ?? []).reduce((sum, r: any) => sum + (Number(r.gesamtbetrag) || 0), 0);
      return { rechnungen: data, anzahl: data?.length ?? 0, summe_offen: summe };
    }
    case 'faellige_tasks': {
      const zeitraum = typeof rawArgs.zeitraum === 'string' ? rawArgs.zeitraum : 'woche';
      let query = supabase.from('tasks').select('id, titel, prioritaet, faellig_am, status').neq('status', 'done').order('faellig_am', { ascending: true }).limit(30);
      if (zeitraum === 'heute') query = query.lte('faellig_am', isoDate(0).slice(0, 10));
      else if (zeitraum === 'woche') query = query.lte('faellig_am', isoDate(7).slice(0, 10));
      else if (zeitraum === 'ueberfaellig') query = query.lt('faellig_am', isoDate(0).slice(0, 10));
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
    case 'anstehende_termine': {
      const tage = Math.min(Number(rawArgs.tage) || 7, 60);
      const { data, error } = await supabase
        .from('termine')
        .select('id, titel, start_zeit, end_zeit, typ, ort, kunde_name')
        .gte('start_zeit', isoDate(0))
        .lte('start_zeit', isoDate(tage))
        .order('start_zeit', { ascending: true })
        .limit(25);
      if (error) throw error;
      return data;
    }
    case 'neue_leads': {
      const [kiCheck, projektanfragen] = await Promise.all([
        supabase.from('kunden').select('id, kontaktperson, firmenname, email, branche, created_at').eq('status', 'anfrage').order('created_at', { ascending: false }).limit(15),
        supabase.from('re_anfragen').select('id, name, firma, email, projekttyp, created_at').eq('status', 'neu').order('created_at', { ascending: false }).limit(15),
      ]);
      if (kiCheck.error) throw kiCheck.error;
      if (projektanfragen.error) throw projektanfragen.error;
      return { ki_check_leads: kiCheck.data, projektanfragen: projektanfragen.data };
    }
    case 'task_erstellen': {
      const titel = String(rawArgs.titel || '').trim().slice(0, 200);
      if (!titel) throw new Error('Titel fehlt.');
      const prioritaet = typeof rawArgs.prioritaet === 'string' && PRIORITAET.has(rawArgs.prioritaet) ? rawArgs.prioritaet : 'mittel';
      const insert: Record<string, unknown> = {
        titel,
        beschreibung: typeof rawArgs.beschreibung === 'string' ? rawArgs.beschreibung.slice(0, 2000) : null,
        prioritaet,
        status: 'todo',
      };
      if (typeof rawArgs.faellig_am === 'string' && rawArgs.faellig_am) insert.faellig_am = rawArgs.faellig_am;
      if (typeof rawArgs.kunden_id === 'string' && rawArgs.kunden_id) insert.kunden_id = rawArgs.kunden_id;
      const { data, error } = await supabase.from('tasks').insert(insert).select('id, titel').single();
      if (error) throw error;
      return { erstellt: true, task: data };
    }
    case 'kunde_notiz_hinzufuegen': {
      const kundenId = String(rawArgs.kunden_id || '');
      const notiz = String(rawArgs.notiz || '').trim().slice(0, 2000);
      if (!kundenId || !notiz) throw new Error('kunden_id und notiz sind erforderlich.');
      const { data: existing, error: readError } = await supabase.from('kunden').select('notizen').eq('id', kundenId).single();
      if (readError) throw readError;
      const timestamp = new Date().toLocaleString('de-CH', { dateStyle: 'medium', timeStyle: 'short' });
      const combined = [existing?.notizen, `[${timestamp}, AILA] ${notiz}`].filter(Boolean).join('\n');
      const { error } = await supabase.from('kunden').update({ notizen: combined }).eq('id', kundenId);
      if (error) throw error;
      return { erstellt: true };
    }
    case 'kunde_status_aendern': {
      const kundenId = String(rawArgs.kunden_id || '');
      const status = String(rawArgs.status || '');
      if (!kundenId || !KUNDEN_STATUS.has(status)) throw new Error('Ungültige kunden_id oder Status.');
      const { error } = await supabase.from('kunden').update({ status }).eq('id', kundenId);
      if (error) throw error;
      return { aktualisiert: true, status };
    }
    case 'termin_erstellen': {
      const titel = String(rawArgs.titel || '').trim().slice(0, 200);
      const startZeit = String(rawArgs.start_zeit || '');
      if (!titel || !startZeit) throw new Error('titel und start_zeit sind erforderlich.');
      const endZeit = typeof rawArgs.end_zeit === 'string' && rawArgs.end_zeit
        ? rawArgs.end_zeit
        : new Date(new Date(startZeit).getTime() + 60 * 60 * 1000).toISOString();
      const insert: Record<string, unknown> = {
        titel,
        start_zeit: startZeit,
        end_zeit: endZeit,
        typ: 'intern',
        status: 'bestaetigt',
      };
      if (typeof rawArgs.beschreibung === 'string') insert.beschreibung = rawArgs.beschreibung.slice(0, 2000);
      if (typeof rawArgs.kunden_id === 'string' && rawArgs.kunden_id) insert.kunden_id = rawArgs.kunden_id;
      if (typeof rawArgs.ort === 'string') insert.ort = rawArgs.ort.slice(0, 200);
      const { data, error } = await supabase.from('termine').insert(insert).select('id, titel, start_zeit').single();
      if (error) throw error;
      return { erstellt: true, termin: data };
    }
    default:
      throw new Error(`Unbekanntes Werkzeug: ${name}`);
  }
}
