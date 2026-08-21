-- ============================================================
-- Pipeline-Automation: gewonnen -> Kunde promoten + Projekt anlegen
--                       verloren -> Nachfass-Task fuer Marcel anlegen
-- ============================================================

-- Traceability: ein Nachfass-Task soll wissen, aus welchem Deal er
-- entstanden ist (auch noetig fuer die Idempotenz-Pruefung unten).
alter table tasks
  add column if not exists deal_id uuid references deals(id) on delete set null;

create or replace function handle_deal_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_projekt_name text;
begin
  if new.status = 'gewonnen' then
    -- Kunde befoerdern (nur falls noch nicht 'kunde')
    update kunden
      set status = 'kunde', updated_at = now()
      where id = new.kunden_id and status is distinct from 'kunde';

    -- Projekt automatisch anlegen (Idempotenz: max. 1 Projekt pro Deal)
    if not exists (select 1 from projekte where deal_id = new.id) then
      v_projekt_name := regexp_replace(new.titel, '^AILA-Anfrage\s*[·•:-]+\s*', '', 'i');
      if v_projekt_name is null or btrim(v_projekt_name) = '' then
        v_projekt_name := new.titel;
      end if;

      insert into projekte (name, kunden_id, deal_id, status)
      values (v_projekt_name, new.kunden_id, new.id, 'aktiv');
    end if;
  end if;

  if new.status = 'verloren' then
    -- Nachfass-Task fuer Marcel (kein automatischer Mail-Versand -
    -- konsistent mit dem "AI bereitet vor, Mensch entscheidet"-Prinzip
    -- dieser Session). Idempotenz: max. 1 Task pro Deal.
    if not exists (select 1 from tasks where deal_id = new.id) then
      insert into tasks (titel, beschreibung, kunden_id, deal_id, status, prioritaet, faellig_am)
      values (
        'Nachfassen: ' || new.titel,
        'Deal wurde als verloren markiert. Kurz nachfassen, ob später wieder Potenzial besteht.',
        new.kunden_id,
        new.id,
        'todo',
        'mittel',
        current_date + 30
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_deal_status_automation on deals;
create trigger trg_deal_status_automation
  after update of status on deals
  for each row
  when (old.status is distinct from new.status)
  execute function handle_deal_status_change();
