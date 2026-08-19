'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronRight, Sparkles } from 'lucide-react';
import styles from './button-designs.module.css';

const DESIGNS = [
  { id: 'outline', number: '01', name: 'Präzise Kontur', note: 'Technisch, ruhig, hochwertig', label: 'Projekt besprechen', Icon: ArrowUpRight },
  { id: 'solid', number: '02', name: 'Goldfläche', note: 'Stark, direkt, verkaufsorientiert', label: 'Projekt starten', Icon: ArrowRight },
  { id: 'edge', number: '03', name: 'Lichtkante', note: 'Digital, subtil, räumlich', label: 'System entdecken', Icon: Sparkles },
  { id: 'split', number: '04', name: 'Split Action', note: 'Strukturiert, funktional, klar', label: 'Mehr erfahren', Icon: ArrowRight },
  { id: 'signal', number: '05', name: 'Signal', note: 'Lebendig, systemisch, prägnant', label: 'Verfügbarkeit prüfen', Icon: ChevronRight },
  { id: 'editorial', number: '06', name: 'Editorial Line', note: 'Reduziert, elegant, persönlich', label: 'Zusammenarbeit ansehen', Icon: ArrowUpRight },
] as const;

export default function ButtonDesignGallery() {
  const [selectedId, setSelectedId] = useState<(typeof DESIGNS)[number]['id']>('outline');
  const [saved, setSaved] = useState(false);
  const selected = DESIGNS.find((design) => design.id === selectedId) ?? DESIGNS[0];

  const selectDesign = (id: (typeof DESIGNS)[number]['id']) => {
    setSelectedId(id);
    setSaved(false);
  };

  const saveSelection = () => {
    window.localStorage.setItem('ms-selected-button-design', selected.id);
    setSaved(true);
  };

  return (
    <main className={styles.page}>
      <div className={styles.ambient} aria-hidden="true" />
      <header className={styles.header}>
        <Link href="/" className={styles.backLink}><ArrowLeft size={16} />Zur Website</Link>
        <span>MS / DESIGN LAB</span>
      </header>

      <section className={styles.intro}>
        <p>BUTTON STUDIE · MARCELSPAHR.CH</p>
        <h1>Welche Richtung<br />passt zur Website?</h1>
        <div>
          <span>Wähle eine Variante aus.</span>
          <span>Hover- und Auswahlzustände sind bereits aktiv.</span>
        </div>
      </section>

      <section className={styles.gallery} aria-label="Sechs Button-Designs">
        {DESIGNS.map(({ id, number, name, note, label, Icon }) => {
          const isSelected = selectedId === id;
          return (
            <article key={id} className={`${styles.design} ${isSelected ? styles.designSelected : ''}`}>
              <header>
                <span>{number}</span>
                <div><h2>{name}</h2><p>{note}</p></div>
                {isSelected && <i aria-label="Ausgewählt"><Check size={15} /></i>}
              </header>
              <button
                type="button"
                className={`${styles.sample} ${styles[`sample_${id}`]}`}
                aria-pressed={isSelected}
                onClick={() => selectDesign(id)}
              >
                {id === 'signal' && <b aria-hidden="true" />}
                <span>{label}</span>
                {id === 'split' ? <i><Icon size={17} /></i> : <Icon size={17} />}
              </button>
            </article>
          );
        })}
      </section>

      <footer className={styles.selectionBar}>
        <div><small>AUSGEWÄHLT</small><strong>{selected.number} · {selected.name}</strong></div>
        <button type="button" onClick={saveSelection}>{saved ? <><Check size={17} />Auswahl gespeichert</> : 'Diese Variante wählen'}</button>
      </footer>
    </main>
  );
}
