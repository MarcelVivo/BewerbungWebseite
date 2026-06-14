'use client';

import { useEffect, useState, FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  User, Lock, Bell, Shield, Save, Eye, EyeOff,
  CheckCircle2, AlertCircle, Mail, LogOut,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────

type Tab = 'profil' | 'sicherheit' | 'benachrichtigungen';

interface Profil {
  email: string;
  display_name: string;
  avatar_url?: string;
}

// ── Helpers ────────────────────────────────────────────────

function Alert({ type, msg }: { type: 'success' | 'error'; msg: string }) {
  const Icon = type === 'success' ? CheckCircle2 : AlertCircle;
  const cls  = type === 'success'
    ? 'bg-green-900/30 border-green-800/50 text-green-300'
    : 'bg-red-900/30 border-red-800/50 text-red-300';
  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm ${cls}`}>
      <Icon size={15} className="shrink-0" /> {msg}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs text-slate-400 mb-1.5">{children}</label>;
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full bg-[#2d3144] border border-[#3d4460] rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:border-ms-500 outline-none disabled:opacity-50 ${props.className || ''}`}
    />
  );
}

// ── Profil Tab ─────────────────────────────────────────────

function ProfilTab({ email }: { email: string }) {
  const supabase = createClient();
  const [name, setName]     = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    supabase.from('profiles').select('display_name').eq('id', (supabase as any).auth?.getUser?.()?.data?.user?.id || '')
      .single().then(() => {});
  }, []);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true); setMsg(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMsg({ type: 'error', text: 'Nicht angemeldet' }); setSaving(false); return; }
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      display_name: name.trim(),
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    setMsg(error
      ? { type: 'error', text: error.message }
      : { type: 'success', text: 'Name gespeichert' });
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#1e2235] border border-[#2d3144] rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4">Account-Informationen</h3>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-ms-500/20 flex items-center justify-center">
            <User size={28} className="text-ms-400" />
          </div>
          <div>
            <p className="text-white font-semibold">{name || 'Marcel Spahr'}</p>
            <p className="text-slate-400 text-sm">{email}</p>
            <p className="text-slate-600 text-xs mt-1">Supabase Auth Benutzer</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <FieldLabel>E-Mail Adresse</FieldLabel>
            <div className="relative">
              <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <Input value={email} disabled className="pl-10 cursor-not-allowed" />
            </div>
            <p className="text-slate-600 text-xs mt-1">E-Mail kann nicht geändert werden</p>
          </div>

          <div>
            <FieldLabel>Anzeigename</FieldLabel>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Marcel Spahr" />
          </div>

          {msg && <Alert type={msg.type} msg={msg.text} />}

          <button type="submit" disabled={saving || !name.trim()}
            className="flex items-center gap-2 bg-ms-500 hover:bg-ms-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors">
            <Save size={15} /> {saving ? 'Speichern…' : 'Änderungen speichern'}
          </button>
        </form>
      </div>

      <div className="bg-[#1e2235] border border-[#2d3144] rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-1">Session</h3>
        <p className="text-slate-400 text-sm mb-4">Aktuell eingeloggt als {email}</p>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = '/login';
          }}
          className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-medium transition-colors">
          <LogOut size={15} /> Abmelden
        </button>
      </div>
    </div>
  );
}

// ── Sicherheit Tab ─────────────────────────────────────────

function SicherheitTab() {
  const supabase = createClient();
  const [current, setCurrent]     = useState('');
  const [pw, setPw]               = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [show, setShow]           = useState(false);
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handlePasswordChange(e: FormEvent) {
    e.preventDefault();
    if (pw.length < 8) { setMsg({ type: 'error', text: 'Passwort muss mindestens 8 Zeichen haben' }); return; }
    if (pw !== pwConfirm) { setMsg({ type: 'error', text: 'Passwörter stimmen nicht überein' }); return; }
    setSaving(true); setMsg(null);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setSaving(false);
    if (error) {
      setMsg({ type: 'error', text: error.message });
    } else {
      setMsg({ type: 'success', text: 'Passwort erfolgreich geändert' });
      setPw(''); setPwConfirm(''); setCurrent('');
    }
  }

  const strength = pw.length === 0 ? 0 : pw.length < 8 ? 1 : pw.length < 12 ? 2 : 3;
  const strengthLabel = ['', 'Schwach', 'Mittel', 'Stark'][strength];
  const strengthCls   = ['', 'bg-red-500', 'bg-yellow-500', 'bg-green-500'][strength];

  return (
    <div className="space-y-6">
      <div className="bg-[#1e2235] border border-[#2d3144] rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4">Passwort ändern</h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <FieldLabel>Neues Passwort</FieldLabel>
            <div className="relative">
              <Input
                type={show ? 'text' : 'password'}
                value={pw}
                onChange={e => setPw(e.target.value)}
                placeholder="Mindestens 8 Zeichen"
                className="pr-11"
              />
              <button type="button" onClick={() => setShow(!show)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {pw.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[1,2,3].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? strengthCls : 'bg-[#2d3144]'}`} />
                  ))}
                </div>
                <p className="text-xs text-slate-500">{strengthLabel}</p>
              </div>
            )}
          </div>

          <div>
            <FieldLabel>Passwort bestätigen</FieldLabel>
            <div className="relative">
              <Input
                type={show ? 'text' : 'password'}
                value={pwConfirm}
                onChange={e => setPwConfirm(e.target.value)}
                placeholder="Passwort wiederholen"
              />
              {pwConfirm.length > 0 && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {pw === pwConfirm
                    ? <CheckCircle2 size={15} className="text-green-400" />
                    : <AlertCircle size={15} className="text-red-400" />}
                </div>
              )}
            </div>
          </div>

          {msg && <Alert type={msg.type} msg={msg.text} />}

          <button type="submit" disabled={saving || !pw || pw !== pwConfirm}
            className="flex items-center gap-2 bg-ms-500 hover:bg-ms-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors">
            <Lock size={15} /> {saving ? 'Wird geändert…' : 'Passwort ändern'}
          </button>
        </form>
      </div>

      <div className="bg-[#1e2235] border border-[#2d3144] rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-2">Sicherheitshinweise</h3>
        <ul className="space-y-2 text-slate-400 text-sm">
          {[
            'Verwende ein starkes, einzigartiges Passwort',
            'Teile dein Passwort niemals mit anderen',
            'Aktiviere 2FA in den Supabase-Einstellungen für mehr Sicherheit',
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2">
              <Shield size={13} className="text-ms-400 mt-0.5 shrink-0" /> {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── Benachrichtigungen Tab ─────────────────────────────────

function BenachrichtigungenTab() {
  const [prefs, setPrefs] = useState({
    neue_anfragen:   true,
    faellige_rechnungen: true,
    task_reminder:   false,
    wochenbericht:   false,
  });
  const [saved, setSaved] = useState(false);

  function toggle(k: keyof typeof prefs) {
    setPrefs(p => ({ ...p, [k]: !p[k] }));
    setSaved(false);
  }

  function save() {
    localStorage.setItem('notif_prefs', JSON.stringify(prefs));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  useEffect(() => {
    try {
      const stored = localStorage.getItem('notif_prefs');
      if (stored) setPrefs(JSON.parse(stored));
    } catch {}
  }, []);

  const items: { key: keyof typeof prefs; label: string; sub: string }[] = [
    { key: 'neue_anfragen',       label: 'Neue Recruiter-Anfragen',   sub: 'Wenn jemand über das Portfolio Kontakt aufnimmt' },
    { key: 'faellige_rechnungen', label: 'Überfällige Rechnungen',    sub: 'Erinnerung bei offenen Zahlungen' },
    { key: 'task_reminder',       label: 'Task-Erinnerungen',         sub: 'Bei fälligen Aufgaben' },
    { key: 'wochenbericht',       label: 'Wöchentlicher Bericht',     sub: 'Zusammenfassung der Wochenaktivität' },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-[#1e2235] border border-[#2d3144] rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-1">Benachrichtigungen</h3>
        <p className="text-slate-400 text-sm mb-5">Einstellungen werden lokal gespeichert</p>
        <div className="space-y-4">
          {items.map(item => (
            <div key={item.key} className="flex items-start justify-between gap-4">
              <div>
                <p className="text-white text-sm font-medium">{item.label}</p>
                <p className="text-slate-500 text-xs mt-0.5">{item.sub}</p>
              </div>
              <button
                onClick={() => toggle(item.key)}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 mt-0.5 ${
                  prefs[item.key] ? 'bg-ms-500' : 'bg-[#2d3144]'
                }`}>
                <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  prefs[item.key] ? 'translate-x-5' : ''
                }`} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button onClick={save}
            className="flex items-center gap-2 bg-ms-500 hover:bg-ms-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
            <Save size={15} /> Speichern
          </button>
          {saved && <span className="text-green-400 text-sm flex items-center gap-1.5"><CheckCircle2 size={14} /> Gespeichert</span>}
        </div>
      </div>

      <div className="bg-yellow-900/20 border border-yellow-800/30 rounded-2xl p-4">
        <p className="text-yellow-300/80 text-sm">
          E-Mail-Benachrichtigungen erfordern eine zusätzliche Integration (z.B. Resend oder SendGrid).
          Aktuell werden Einstellungen nur lokal gespeichert.
        </p>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────

const TABS: { key: Tab; label: string; Icon: React.ElementType }[] = [
  { key: 'profil',              label: 'Profil',              Icon: User },
  { key: 'sicherheit',          label: 'Sicherheit',          Icon: Lock },
  { key: 'benachrichtigungen',  label: 'Benachrichtigungen',  Icon: Bell },
];

export default function EinstellungenPage() {
  const supabase = createClient();
  const [tab, setTab]   = useState<Tab>('profil');
  const [email, setEmail] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setEmail(user.email || '');
    });
  }, []);

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Einstellungen</h1>
        <p className="text-slate-400 text-sm mt-0.5">Account, Sicherheit und Präferenzen</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#1e2235] border border-[#2d3144] rounded-xl p-1 w-fit">
        {TABS.map(t => {
          const Icon = t.Icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.key
                  ? 'bg-ms-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}>
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'profil'             && <ProfilTab email={email} />}
      {tab === 'sicherheit'         && <SicherheitTab />}
      {tab === 'benachrichtigungen' && <BenachrichtigungenTab />}
    </div>
  );
}
