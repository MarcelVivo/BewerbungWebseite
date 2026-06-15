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

  const inputCls = 'w-full rounded-lg bg-[#1c1912] border border-[#2d2820] focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c] outline-none px-4 py-3 text-[#f4edd8] placeholder-[#7a6d5a] text-sm transition-colors';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input name="name"    type="text"  required placeholder="Name"      className={inputCls} />
      <input name="email"   type="email" required placeholder="E-Mail"    className={inputCls} />
      <textarea name="message" required rows={5} placeholder="Nachricht" className={`${inputCls} resize-none`} />
      {status === 'success' && (
        <p className="text-sm text-[#8fb58a] bg-[#8fb58a]/10 rounded-lg px-4 py-3">Vielen Dank! Ich melde mich bald.</p>
      )}
      {status === 'error' && (
        <p className="text-sm text-[#c4897a] bg-[#c4897a]/10 rounded-lg px-4 py-3">Fehler beim Senden. Bitte versuche es erneut.</p>
      )}
      <button
        type="submit"
        disabled={status === 'sending'}
        className="w-full py-3 rounded-xl bg-[#c9a84c] hover:bg-[#b8943a] disabled:opacity-60 text-[#0c0a06] font-bold transition-all shadow-lg shadow-[#c9a84c]/20"
      >
        {status === 'sending' ? 'Wird gesendet…' : 'Nachricht senden'}
      </button>
    </form>
  );
}
