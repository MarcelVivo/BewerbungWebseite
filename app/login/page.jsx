"use client";
import { useState } from 'react';
import { User } from 'lucide-react';

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

  const inputCls = 'w-full rounded-lg bg-[#1c1912] border border-[#2d2820] focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c] outline-none px-3 py-2 text-[#f4edd8] placeholder-[#7a6d5a] text-sm transition-colors';

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[#0c0a06]">
      <form onSubmit={onSubmit} className="border border-[#2d2820] bg-[#1c1912] shadow-xl rounded-2xl p-8 w-full max-w-md space-y-4">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-20 h-20 rounded-full border-2 border-[#c9a84c]/40 bg-[#c9a84c]/10 flex items-center justify-center">
            <User size={40} className="text-[#c9a84c]" />
          </div>
          <div className="text-lg font-semibold text-[#f4edd8]">Marcel Spahr</div>
          <div className="text-sm text-[#a89880]">Herzlich willkommen</div>
        </div>
        <div className="space-y-1 text-center">
          <div className="text-base font-semibold text-[#f4edd8]">Geschützter Bereich</div>
          <div className="text-sm text-[#a89880]">Bitte mit den Logindaten anmelden, um Lebenslauf, Diplome und Projektdokumente einzusehen.</div>
        </div>
        <div className="space-y-3">
          <label className="block text-sm font-medium text-[#d4c4a8]">Benutzername</label>
          <input className={inputCls} value={username} onChange={(e) => setUsername(e.target.value)} required />
          <label className="block text-sm font-medium text-[#d4c4a8]">Passwort</label>
          <input type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <div className="text-[#c4897a] text-sm bg-[#c4897a]/10 rounded-lg px-3 py-2">{error}</div>}
        <button
          className="w-full rounded-lg bg-[#c9a84c] hover:bg-[#b8943a] text-[#0c0a06] py-3 font-bold shadow-lg shadow-[#c9a84c]/20 transition-all"
          type="submit"
        >
          Einloggen
        </button>
        <div className="text-xs text-[#7a6d5a] text-center">
          Falls nicht bekannt, können Zugangsdaten unter{' '}
          <a className="underline text-[#c9a84c]" href="mailto:kontakt@marcelspahr.ch">kontakt@marcelspahr.ch</a>{' '}
          angefordert werden.
        </div>
      </form>
    </main>
  );
}
