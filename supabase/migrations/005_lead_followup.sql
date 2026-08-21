-- ============================================================
-- Lead-Nachfassung: verhindert doppelte automatische Follow-up-Mails
-- ============================================================

alter table kunden
  add column if not exists follow_up_sent_at timestamptz;

alter table re_anfragen
  add column if not exists follow_up_sent_at timestamptz;
