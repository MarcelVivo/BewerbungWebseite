export type KundenStatus    = 'anfrage' | 'lead' | 'interessent' | 'kunde' | 'inaktiv';
export type RechnungStatus  = 'entwurf' | 'gesendet' | 'bezahlt' | 'ueberfaellig' | 'storniert';
export type RechnungTyp     = 'angebot' | 'rechnung' | 'mahnung';
export type DealStatus      = 'lead' | 'erstgespraech' | 'angebot' | 'verhandlung' | 'gewonnen' | 'verloren';
export type ProjektStatus   = 'aktiv' | 'pausiert' | 'abgeschlossen' | 'abgebrochen';
export type TaskStatus      = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPrioritaet  = 'niedrig' | 'mittel' | 'hoch' | 'kritisch';

export interface Kunde {
  id: string;
  firmenname?: string;
  kontaktperson: string;
  email?: string;
  telefon?: string;
  branche?: string;
  status: KundenStatus;
  adresse?: string;
  notizen?: string;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  titel: string;
  kunden_id?: string;
  status: DealStatus;
  wert?: number;
  wahrscheinlichkeit: number;
  geplanter_abschluss?: string;
  notizen?: string;
  created_at: string;
  kunden?: Pick<Kunde, 'id' | 'kontaktperson' | 'firmenname'>;
}

export interface Projekt {
  id: string;
  name: string;
  kunden_id?: string;
  deal_id?: string;
  status: ProjektStatus;
  start_datum?: string;
  end_datum?: string;
  budget?: number;
  beschreibung?: string;
  farbe: string;
  created_at: string;
  kunden?: Pick<Kunde, 'id' | 'kontaktperson' | 'firmenname'>;
}

export interface RechnungPosition {
  beschreibung: string;
  menge: number;
  einheit: string;
  einzelpreis: number;
  total: number;
}

export interface Rechnung {
  id: string;
  rechnungsnummer: string;
  kunden_id?: string;
  projekt_id?: string;
  typ: RechnungTyp;
  status: RechnungStatus;
  ausgestellt_am: string;
  faellig_am?: string;
  bezahlt_am?: string;
  positionen: RechnungPosition[];
  zwischensumme?: number;
  mwst_betrag?: number;
  gesamtbetrag?: number;
  mwst_satz: number;
  notizen?: string;
  zahlungskonditionen: string;
  created_at: string;
  kunden?: Pick<Kunde, 'id' | 'kontaktperson' | 'firmenname' | 'email'>;
}

export interface Task {
  id: string;
  titel: string;
  beschreibung?: string;
  projekt_id?: string;
  kunden_id?: string;
  status: TaskStatus;
  prioritaet: TaskPrioritaet;
  faellig_am?: string;
  position: number;
  created_at: string;
}

export type ZeitKategorie = 'beratung' | 'entwicklung' | 'meeting' | 'admin' | 'marketing';
export type TerminTyp     = 'meeting' | 'workshop' | 'call' | 'intern' | 'buchung';
export type KiAgentenTyp  = 'analyse' | 'content' | 'admin' | 'sales' | 'support';

export interface Zeiteintrag {
  id: string;
  projekt_id?: string;
  kunden_id?: string;
  benutzer_id?: string;
  beschreibung?: string;
  kategorie?: ZeitKategorie;
  start_zeit: string;
  end_zeit?: string;
  dauer_minuten?: number;
  abrechenbar: boolean;
  created_at: string;
  projekte?: Pick<Projekt, 'id' | 'name' | 'farbe'>;
  kunden?: Pick<Kunde, 'id' | 'kontaktperson' | 'firmenname'>;
}

export interface Termin {
  id: string;
  titel: string;
  beschreibung?: string;
  kunden_id?: string;
  projekt_id?: string;
  start_zeit: string;
  end_zeit: string;
  ort?: string;
  zoom_link?: string;
  typ: TerminTyp;
  status: string;
  kunde_email?: string;
  kunde_name?: string;
  created_at: string;
  kunden?: Pick<Kunde, 'id' | 'kontaktperson' | 'firmenname'>;
}

export interface KiAgent {
  id: string;
  name: string;
  beschreibung?: string;
  typ?: KiAgentenTyp;
  status: 'aktiv' | 'pausiert' | 'entwurf';
  webhook_url?: string;
  konfiguration?: Record<string, any>;
  letzte_ausfuehrung?: string;
  ausfuehrungen_total: number;
  avatar_emoji: string;
  created_at: string;
}
