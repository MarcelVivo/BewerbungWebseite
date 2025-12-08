"use client";
import { useEffect, useRef, useState } from 'react';

function useReveal(ref, opts = {}) {
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('reveal-visible'); io.unobserve(e.target); } });
    }, { root: null, threshold: 0.08, rootMargin: opts.rootMargin || '0px 0px -10% 0px' });
    io.observe(el); return () => io.disconnect();
  }, [ref, opts.rootMargin]);
}

function Reveal({ as: Tag = 'div', children, className = '' }) {
  const r = useRef(null); useReveal(r);
  return <Tag ref={r} className={`reveal ${className}`}>{children}</Tag>;
}

export default function HomePage() {
  const [items, setItems] = useState([]);
  const [avatar, setAvatar] = useState('/assets/portrait.jpg');

  useEffect(() => {
    fetch('/assets/projects.json').then(r => r.json()).then((j) => setItems(Array.isArray(j) ? j : (j.items || []))).catch(()=>{});
  }, []);

  function logout() {
    fetch('/api/logout', { method: 'POST' }).finally(() => { window.location.href = '/login'; });
  }

  return (
    <>
      <header className="nav-blue sticky top-0 z-10">
        <div className="container-narrow px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="brand-name text-xl font-semibold text-slate-900">Marcel Spahr</div>
            <span className="hidden sm:inline text-slate-700 label-pill">Wirtschaftsinformatiker</span>
          </div>
          <nav className="flex items-center gap-2">
            <a className="px-3 py-1.5 rounded-lg text-sm hover:bg-ms-100" href="#dokumente">Dokumente</a>
            <button className="ml-2 px-3 py-1.5 rounded-lg text-sm bg-ms-100 hover:bg-ms-200" onClick={logout}>Logout</button>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero border-b border-sky-100">
          <div className="container-narrow px-4 py-10 grid md:grid-cols-2 gap-8 items-start">
            <Reveal>
              <div>
                <div className="flex items-center gap-6 sticky top-16">
                  <img src={avatar} alt="Foto von Marcel Spahr" className="w-28 h-28 md:w-36 md:h-36 rounded-full object-cover ring-soft bg-white" />
                  <div>
                    <h1 className="brand-name text-3xl md:text-4xl font-semibold text-slate-900">Marcel Spahr</h1>
                    <div className="mt-2 label-pill inline-flex">Wirtschaftsinformatiker</div>
                  </div>
                </div>
                <p className="mt-6 text-slate-700 leading-relaxed max-w-2xl reveal">Kreativer Wirtschaftsinformatiker mit technischem Verständnis, Empathie und digitalem Gespür.</p>
                <p className="mt-3 text-slate-700 leading-relaxed max-w-2xl reveal">Ich verbinde technisches Know-how mit kreativen Ideen und gestalte individuelle Kundenerlebnisse – effizient, kundenorientiert und wirtschaftlich sinnvoll.</p>
              </div>
            </Reveal>
            <Reveal>
              <aside className="card p-5 bg-white/90 sticky top-24">
                <h3 className="text-sm tracking-widest font-bold text-slate-700 mb-3">Kontakt</h3>
                <ul className="text-slate-700 space-y-2">
                  <li>Bern, Schweiz</li>
                  <li>+41 79 511 09 11</li>
                  <li><a className="link-blue" href="mailto:marcelspahr@me.com">marcelspahr@me.com</a></li>
                  <li><a className="link-blue" href="https://www.linkedin.com/in/marcelspahr" target="_blank" rel="noreferrer">LinkedIn</a></li>
                </ul>
              </aside>
            </Reveal>
          </div>
        </section>

        <section id="dokumente" className="container-narrow px-4 py-10">
          <Reveal>
            <h2 className="text-2xl font-semibold mb-6">Dokumente & Zertifikate</h2>
          </Reveal>
          <div className="grid md:grid-cols-2 gap-4">
            {items.map((i) => (
              <Reveal key={i.url} className="">
                <div className="card p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-900">{prettyTitle(i)}</div>
                    {i.description && <div className="text-sm text-slate-600 mt-1">{i.description}</div>}
                  </div>
                  {i.url && (
                    <a className="btn btn-soft" href={i.url} download>
                      Download
                    </a>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

function prettyTitle(i) {
  const base = (i.title && i.title.trim()) || (i.url ? (i.url.split('/').pop() || '') : '');
  let s = base.replace(/\.[^.]+$/, '');
  s = s.replace(/^\s*\d+[\s_\-]*/,'');
  s = s.replace(/[\-_]+/g,' ');
  s = s.replace(/([a-z])([A-Z])/g, '$1 $2');
  const t = s.toLowerCase();
  if (/lebenslauf|cv/.test(t)) return 'Lebenslauf';
  if (/diplom|diploma/.test(t)) return 'Diplom';
  if (/certificate|zerti|zertifikat/.test(t)) return 'Zertifikat';
  if (/arbeitszeugnis|zeugnis/.test(t)) return 'Arbeitszeugnis';
  return s.trim() || (i.type || 'Dokument');
}

