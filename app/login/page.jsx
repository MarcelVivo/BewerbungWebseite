"use client";
import { useState } from 'react';

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) throw new Error(await res.text());
      const next = new URLSearchParams(window.location.search).get('next') || '/';
      window.location.href = next;
    } catch (err) {
      setError('Ungültige Anmeldedaten');
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-ms-50">
      <form onSubmit={onSubmit} className="bg-white/95 border border-sky-100 shadow-lg rounded-2xl p-8 w-full max-w-md space-y-4">
        <div className="flex flex-col items-center text-center space-y-3">
          <img src="/assets/portrait.jpg" alt="Marcel Spahr" className="w-24 h-24 rounded-full object-cover ring-soft" />
          <div className="text-lg font-semibold text-slate-900">Marcel Spahr</div>
          <div className="text-sm text-slate-600">Herzlich willkommen auf meiner persönlichen Bewerbungsseite</div>
        </div>
        <div className="space-y-1 text-center">
          <div className="text-base font-semibold text-slate-900">Geschützter Bewerbungsbereich</div>
          <div className="text-sm text-slate-600">Bitte mit den Login Daten anmelden, um meinen Lebenslauf, Diplome und Projektdokumente einzusehen.</div>
          <div className="text-xs text-slate-500">(Der Zugang dauert nur wenige Sekunden.)</div>
        </div>
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">Benutzername</label>
          <input className="w-full rounded-lg border border-slate-300 focus:border-ms-600 focus:ring-ms-600 px-3 py-2" value={username} onChange={(e)=>setUsername(e.target.value)} required />
          <label className="block text-sm font-medium text-slate-700">Passwort</label>
          <input type="password" className="w-full rounded-lg border border-slate-300 focus:border-ms-600 focus:ring-ms-600 px-3 py-2" value={password} onChange={(e)=>setPassword(e.target.value)} required />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button
          className="w-full rounded-lg bg-ms-600 hover:bg-ms-700 text-white py-3 font-semibold shadow-md shadow-sky-200 text-center"
          type="submit"
          style={{ backgroundColor: '#0284c7' }}
        >
          Bewerbungsunterlagen öffnen
        </button>
        <div className="text-xs text-slate-500 text-center">Falls nicht bekannt, können Benutzername und Passwort unter <a className="underline text-ms-700" href="mailto:kontakt@marcelspahr.ch">kontakt@marcelspahr.ch</a> angefordert werden</div>
      </form>
    </main>
  );
}
