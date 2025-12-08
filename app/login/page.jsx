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
    <main className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="card bg-white p-6 w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-4">Anmeldung</h1>
        <label className="block mb-2 text-sm">Benutzername</label>
        <input className="input mb-4 w-full" value={username} onChange={(e)=>setUsername(e.target.value)} required />
        <label className="block mb-2 text-sm">Passwort</label>
        <input type="password" className="input mb-4 w-full" value={password} onChange={(e)=>setPassword(e.target.value)} required />
        {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
        <button className="btn btn-primary w-full" type="submit">Login</button>
      </form>
    </main>
  );
}

