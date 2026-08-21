-- ============================================================
-- Markiert die Seed-Agenten Nina und Sam als echte, automatisch
-- laufende Automationen (statt nur Chat-Agenten). Die Cron-Jobs
-- /api/cron/wochenbericht und /api/cron/mahnwesen suchen aktive
-- ki_agenten anhand von konfiguration->>'automation', nicht
-- anhand des Namens – so bleibt es robust, auch wenn Marcel den
-- Agenten später umbenennt.
-- ============================================================

update ki_agenten
set konfiguration = coalesce(konfiguration, '{}'::jsonb) || jsonb_build_object('automation', 'weekly_report')
where name = 'Nina – Wochenbericht' and coalesce(konfiguration->>'automation', '') = '';

update ki_agenten
set konfiguration = coalesce(konfiguration, '{}'::jsonb) || jsonb_build_object('automation', 'mahnwesen')
where name = 'Sam – Mahnwesen Bot' and coalesce(konfiguration->>'automation', '') = '';
