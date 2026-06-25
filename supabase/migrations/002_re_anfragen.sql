-- ============================================================
-- RE-Anfragen: Öffentliche Projektanfragen via Website
-- ============================================================

create table if not exists re_anfragen (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  email             text not null,
  firma             text,
  telefon           text,
  branche           text,
  projekttyp        text,
  ist_situation     text[]   default '{}',
  schmerzpunkte     text[]   default '{}',
  anforderungen     jsonb    default '[]',   -- [{text, prio: 'must'|'nice'}]
  nf_anforderungen  text[]   default '{}',
  budget            text,
  zeitrahmen        text,
  notizen           text,
  status            text     default 'neu',  -- 'neu'|'kontaktiert'|'in_bearbeitung'|'abgeschlossen'
  created_at        timestamptz default now()
);

alter table re_anfragen enable row level security;

-- Public: anyone can submit
create policy "public_insert" on re_anfragen
  for insert with check (true);

-- Authenticated (Marcel): full access
create policy "auth_full_access" on re_anfragen
  for all using (auth.role() = 'authenticated');
