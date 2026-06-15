'use client';

import { useState, FormEvent } from 'react';

export default function ContactFormClient() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    const form = e.currentTarget;
    const body = {
      name:    (form.elements.namedItem('name')    as HTMLInputElement).value,
      email:   (form.elements.namedItem('email')   as HTMLInputElement).value,
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
    };
    try {
      const res = await fetch('/api/kontakt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      setStatus(res.ok ? 'success' : 'error');
      if (res.ok) form.reset();
    } catch {
      setStatus('error');
    }
  }

  const inputCls = 'w-full rounded-lg bg-[#1a1d27] border border-[#2d3144] focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] outline-none px-4 py-3 text-white placeholder-slate-500 text-sm transition-colors';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input name="name"    type="text"  required placeholder="Name"      className={inputCls} />
      <input name="email"   type="email" required placeholder="E-Mail"    className={inputCls} />
      <textarea name="message" required rows={5} placeholder="Nachricht" className={`${inputCls} resize-none`} />
      {status === 'success' && (
        <p className="text-sm text-green-400 bg-green-400/10 rounded-lg px-4 py-3">Vielen Dank! Ich melde mich bald.</p>
      )}
      {status === 'error' && (
        <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-4 py-3">Fehler beim Senden. Bitte versuche es erneut.</p>
      )}
      <button
        type="submit"
        disabled={status === 'sending'}
        className="w-full py-3 rounded-xl bg-[#6366f1] hover:bg-[#5254cc] disabled:opacity-60 text-white font-semibold transition-all shadow-lg shadow-[#6366f1]/20"
      >
        {status === 'sending' ? 'Wird gesendet…' : 'Nachricht senden'}
      </button>
    </form>
  );
}
