'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export type ActiveTimer = {
  id: string;
  beschreibung: string | null;
  kategorie: string | null;
  start_zeit: string;
  projekt_id: string | null;
  kunden_id: string | null;
  projekte?: { name: string } | null;
};

// Ein "laufender Timer" ist einfach ein zeiteintraege-Datensatz mit
// end_zeit = null. Damit ist die Datenbank die einzige Quelle der
// Wahrheit fuer den Timer, egal ob er in der TopBar oder auf der
// Zeiterfassungs-Seite gestartet/gestoppt wird, und er ueberlebt
// Seitenwechsel statt bei jeder Navigation zurueckgesetzt zu werden.
export function useTimeTracking() {
  const [active, setActive] = useState<ActiveTimer | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('zeiteintraege')
      .select('id, beschreibung, kategorie, start_zeit, projekt_id, kunden_id, projekte(name)')
      .is('end_zeit', null)
      .order('start_zeit', { ascending: false })
      .limit(1)
      .maybeSingle();
    setActive((data as unknown as ActiveTimer) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const supabase = createClient();
    const channel = supabase
      .channel('zeiterfassung-active-timer')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'zeiteintraege' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  async function start(input: { beschreibung?: string; kategorie?: string; projekt_id?: string | null; kunden_id?: string | null }) {
    if (active) return;
    const supabase = createClient();
    await supabase.from('zeiteintraege').insert({
      beschreibung: input.beschreibung || null,
      kategorie: input.kategorie || null,
      projekt_id: input.projekt_id || null,
      kunden_id: input.kunden_id || null,
      start_zeit: new Date().toISOString(),
      abrechenbar: true,
    });
    await load();
  }

  async function stop() {
    if (!active) return;
    const supabase = createClient();
    const end = new Date();
    const dauer = Math.max(1, Math.round((end.getTime() - new Date(active.start_zeit).getTime()) / 60000));
    await supabase.from('zeiteintraege').update({ end_zeit: end.toISOString(), dauer_minuten: dauer }).eq('id', active.id);
    setActive(null);
  }

  return { active, loading, start, stop, reload: load };
}
