-- ============================================================
-- marcelspahr.ch – Initiale Datenbankstruktur
-- Erstellt: Juni 2026
-- ============================================================

-- PROFILE / BENUTZER
create table if not exists profiles (
  id          uuid references auth.users primary key,
  full_name   text,
  email       text,
  role        text default 'admin', -- 'admin' | 'mitarbeiter' | 'partner'
  avatar_url  text,
  created_at  timestamptz default now()
);

-- KUNDEN / KONTAKTE
create table if not exists kunden (
  id              uuid primary key default gen_random_uuid(),
  firmenname      text,
  kontaktperson   text not null,
  email           text,
  telefon         text,
  branche         text,
  status          text default 'lead', -- 'lead'|'interessent'|'kunde'|'inaktiv'
  adresse         text,
  notizen         text,
  erstellt_von    uuid references profiles(id),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- PIPELINE / DEALS
create table if not exists deals (
  id                  uuid primary key default gen_random_uuid(),
  titel               text not null,
  kunden_id           uuid references kunden(id) on delete set null,
  status              text default 'lead', -- 'lead'|'erstgespraech'|'angebot'|'verhandlung'|'gewonnen'|'verloren'
  wert                numeric(10,2),
  wahrscheinlichkeit  integer default 50 check (wahrscheinlichkeit between 0 and 100),
  geplanter_abschluss date,
  notizen             text,
  erstellt_von        uuid references profiles(id),
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- PROJEKTE
create table if not exists projekte (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  kunden_id     uuid references kunden(id) on delete set null,
  deal_id       uuid references deals(id) on delete set null,
  status        text default 'aktiv', -- 'aktiv'|'pausiert'|'abgeschlossen'|'abgebrochen'
  start_datum   date,
  end_datum     date,
  budget        numeric(10,2),
  beschreibung  text,
  farbe         text default '#6366f1',
  erstellt_von  uuid references profiles(id),
  created_at    timestamptz default now()
);

-- TASKS / AUFGABEN (Kanban)
create table if not exists tasks (
  id              uuid primary key default gen_random_uuid(),
  titel           text not null,
  beschreibung    text,
  projekt_id      uuid references projekte(id) on delete cascade,
  kunden_id       uuid references kunden(id) on delete set null,
  zugewiesen_an   uuid references profiles(id),
  status          text default 'todo', -- 'todo'|'in_progress'|'review'|'done'
  prioritaet      text default 'mittel', -- 'niedrig'|'mittel'|'hoch'|'kritisch'
  faellig_am      date,
  position        integer default 0,
  created_at      timestamptz default now()
);

-- RECHNUNGEN
create table if not exists rechnungen (
  id                        uuid primary key default gen_random_uuid(),
  rechnungsnummer           text unique not null,
  kunden_id                 uuid references kunden(id) on delete set null,
  projekt_id                uuid references projekte(id) on delete set null,
  typ                       text default 'rechnung', -- 'angebot'|'rechnung'|'mahnung'
  status                    text default 'entwurf', -- 'entwurf'|'gesendet'|'bezahlt'|'ueberfaellig'|'storniert'
  ausgestellt_am            date default current_date,
  faellig_am                date,
  bezahlt_am                date,
  positionen                jsonb not null default '[]',
  zwischensumme             numeric(10,2),
  mwst_betrag               numeric(10,2),
  gesamtbetrag              numeric(10,2),
  mwst_satz                 numeric(4,2) default 8.1,
  notizen                   text,
  zahlungskonditionen       text default '30 Tage netto',
  mahnung_1_gesendet_am     timestamptz,
  erstellt_von              uuid references profiles(id),
  created_at                timestamptz default now()
);

-- VERTRÄGE
create table if not exists vertraege (
  id              uuid primary key default gen_random_uuid(),
  titel           text not null,
  kunden_id       uuid references kunden(id) on delete set null,
  projekt_id      uuid references projekte(id) on delete set null,
  template_typ    text, -- 'beratung'|'workshop'|'umsetzung'|'custom'
  inhalt          text,
  status          text default 'entwurf', -- 'entwurf'|'gesendet'|'unterzeichnet'|'abgelaufen'
  gueltig_bis     date,
  unterzeichnet_am timestamptz,
  created_at      timestamptz default now()
);

-- ZEITERFASSUNG
create table if not exists zeiteintraege (
  id              uuid primary key default gen_random_uuid(),
  projekt_id      uuid references projekte(id) on delete set null,
  kunden_id       uuid references kunden(id) on delete set null,
  benutzer_id     uuid references profiles(id),
  beschreibung    text,
  kategorie       text, -- 'beratung'|'entwicklung'|'meeting'|'admin'|'marketing'
  start_zeit      timestamptz not null,
  end_zeit        timestamptz,
  dauer_minuten   integer,
  abrechenbar     boolean default true,
  created_at      timestamptz default now()
);

-- TERMINE / KALENDER
create table if not exists termine (
  id                    uuid primary key default gen_random_uuid(),
  titel                 text not null,
  beschreibung          text,
  kunden_id             uuid references kunden(id) on delete set null,
  projekt_id            uuid references projekte(id) on delete set null,
  start_zeit            timestamptz not null,
  end_zeit              timestamptz not null,
  ort                   text,
  zoom_link             text,
  typ                   text default 'meeting', -- 'meeting'|'workshop'|'call'|'intern'|'buchung'
  status                text default 'bestaetigt',
  kunde_email           text,
  kunde_name            text,
  erinnerung_gesendet   boolean default false,
  created_at            timestamptz default now()
);

-- OUTREACH TRACKING
create table if not exists outreach (
  id              uuid primary key default gen_random_uuid(),
  kunden_id       uuid references kunden(id) on delete cascade,
  kanal           text, -- 'linkedin'|'email'|'telefon'|'event'
  kontakt_typ     text, -- 'erstkontakt'|'follow_up'|'angebot'|'abschluss'
  notiz           text,
  ergebnis        text, -- 'kein_interesse'|'interessiert'|'termin'|'angebot'
  naechste_aktion date,
  erstellt_von    uuid references profiles(id),
  created_at      timestamptz default now()
);

-- KI AGENTEN
create table if not exists ki_agenten (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  beschreibung          text,
  typ                   text, -- 'analyse'|'content'|'admin'|'sales'|'support'
  status                text default 'aktiv', -- 'aktiv'|'pausiert'|'entwurf'
  webhook_url           text,
  konfiguration         jsonb,
  letzte_ausfuehrung    timestamptz,
  ausfuehrungen_total   integer default 0,
  avatar_emoji          text default '🤖',
  created_at            timestamptz default now()
);

-- DOKUMENTE
create table if not exists dokumente (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  typ             text, -- 'vorlage'|'angebot'|'rechnung'|'vertrag'|'sonstiges'
  kunden_id       uuid references kunden(id) on delete set null,
  projekt_id      uuid references projekte(id) on delete set null,
  storage_path    text,
  groesse_bytes   integer,
  created_at      timestamptz default now()
);

-- KONTAKTFORMULAR (Public – kein Auth benötigt)
create table if not exists kontaktanfragen (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  nachricht   text,
  sprache     text default 'de',
  status      text default 'neu', -- 'neu'|'gelesen'|'beantwortet'
  created_at  timestamptz default now()
);

-- RECRUITER ANFRAGEN
create table if not exists recruiter_anfragen (
  id              uuid primary key default gen_random_uuid(),
  recruiter_name  text not null,
  firma           text,
  email           text not null,
  stellen_typ     text, -- 'festanstellung'|'freelance'|'projekt'
  pensum          text,
  nachricht       text,
  status          text default 'neu', -- 'neu'|'gelesen'|'interessant'|'abgelehnt'
  created_at      timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table profiles           enable row level security;
alter table kunden             enable row level security;
alter table deals              enable row level security;
alter table projekte           enable row level security;
alter table tasks              enable row level security;
alter table rechnungen         enable row level security;
alter table vertraege          enable row level security;
alter table zeiteintraege      enable row level security;
alter table termine            enable row level security;
alter table outreach           enable row level security;
alter table ki_agenten         enable row level security;
alter table dokumente          enable row level security;
alter table kontaktanfragen    enable row level security;
alter table recruiter_anfragen enable row level security;

-- Authenticated users: full access to all business tables
drop policy if exists "auth_full_access" on profiles;
drop policy if exists "auth_full_access" on kunden;
drop policy if exists "auth_full_access" on deals;
drop policy if exists "auth_full_access" on projekte;
drop policy if exists "auth_full_access" on tasks;
drop policy if exists "auth_full_access" on rechnungen;
drop policy if exists "auth_full_access" on vertraege;
drop policy if exists "auth_full_access" on zeiteintraege;
drop policy if exists "auth_full_access" on outreach;
drop policy if exists "auth_full_access" on ki_agenten;
drop policy if exists "auth_full_access" on dokumente;
drop policy if exists "auth_full_access" on recruiter_anfragen;
drop policy if exists "auth_read_write"  on termine;
drop policy if exists "public_insert"    on termine;
drop policy if exists "public_insert"    on kontaktanfragen;
drop policy if exists "auth_read"        on kontaktanfragen;

create policy "auth_full_access" on profiles           for all using (auth.role() = 'authenticated');
create policy "auth_full_access" on kunden             for all using (auth.role() = 'authenticated');
create policy "auth_full_access" on deals              for all using (auth.role() = 'authenticated');
create policy "auth_full_access" on projekte           for all using (auth.role() = 'authenticated');
create policy "auth_full_access" on tasks              for all using (auth.role() = 'authenticated');
create policy "auth_full_access" on rechnungen         for all using (auth.role() = 'authenticated');
create policy "auth_full_access" on vertraege          for all using (auth.role() = 'authenticated');
create policy "auth_full_access" on zeiteintraege      for all using (auth.role() = 'authenticated');
create policy "auth_full_access" on outreach           for all using (auth.role() = 'authenticated');
create policy "auth_full_access" on ki_agenten         for all using (auth.role() = 'authenticated');
create policy "auth_full_access" on dokumente          for all using (auth.role() = 'authenticated');
create policy "auth_full_access" on recruiter_anfragen for all using (auth.role() = 'authenticated');

-- Kalender: Authenticated users + public booking (INSERT without auth)
create policy "auth_read_write" on termine
  for all using (auth.role() = 'authenticated');

create policy "public_insert" on termine
  for insert with check (typ = 'buchung');

-- Kontaktformular: public INSERT
create policy "public_insert" on kontaktanfragen
  for insert with check (true);

create policy "auth_read" on kontaktanfragen
  for select using (auth.role() = 'authenticated');

-- ============================================================
-- TRIGGER: updated_at automatisch setzen
-- ============================================================

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_kunden_updated_at on kunden;
create trigger trg_kunden_updated_at
  before update on kunden
  for each row execute function update_updated_at();

drop trigger if exists trg_deals_updated_at on deals;
create trigger trg_deals_updated_at
  before update on deals
  for each row execute function update_updated_at();

-- ============================================================
-- SEED: Beispiel KI-Agenten
-- ============================================================

insert into ki_agenten (name, beschreibung, typ, status, avatar_emoji)
select * from (values
  ('Max – KI-Analyse Assistent',  'Potenzialanalyse für Neukunden und Leads',                  'analyse', 'aktiv',   '🔍'),
  ('Clara – Angebots-Generator',  'Aus Briefing automatisch ein PDF-Angebot erstellen',         'content', 'aktiv',   '📝'),
  ('Leo – E-Mail Outreach',       'Personalisierte Outreach-Sequenzen vorbereiten',             'sales',   'pausiert','📧'),
  ('Nina – Wochenbericht',        'Jeden Freitag KPI-Summary per E-Mail senden',               'admin',   'aktiv',   '📊'),
  ('Sam – Mahnwesen Bot',         'Überfällige Rechnungen überwachen und Mahnungen auslösen',  'admin',   'aktiv',   '🔔')
) as v(name, beschreibung, typ, status, avatar_emoji)
where not exists (select 1 from ki_agenten limit 1);
