'use client';

import { useState, FormEvent } from 'react';
import { useLanguage } from './LanguageContext';
import { T } from '../lib/translations';

export default function ContactFormClient() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const { lang } = useLanguage();
  const t = T[lang].form;

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
      <input name="name"    type="text"  required placeholder={t.name}    className={inputCls} />
      <input name="email"   type="email" required placeholder={t.email}   className={inputCls} />
      <textarea name="message" required rows={5} placeholder={t.message} className={`${inputCls} resize-none`} />
      {status === 'success' && (
        <p className="text-sm text-[#4d7fbf] bg-[#4d7fbf]/10 rounded-lg px-4 py-3">{t.success}</p>
      )}
      {status === 'error' && (
        <p className="text-sm text-[#a6425c] bg-[#a6425c]/10 rounded-lg px-4 py-3">{t.error}</p>
      )}
    </form>
  );
}
