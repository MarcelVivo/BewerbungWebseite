import Link from 'next/link';
import styles from './offline.module.css';

export const metadata = {
  title: 'Offline · Marcel Spahr',
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>VERBINDUNG UNTERBROCHEN</p>
        <h1>Du bist gerade offline.</h1>
        <p>
          Bereits geladene Bereiche bleiben verfügbar. Für das Live-Gespräch mit AILA
          und die sichere Übergabe einer Anfrage wird wieder eine Internetverbindung benötigt.
        </p>
        <div className={styles.actions}>
          <Link href="/">Erneut verbinden</Link>
          <a href="tel:+41795110911">Marcel anrufen</a>
        </div>
        <small>AILA setzt den Dialog fort, sobald die Verbindung wieder da ist.</small>
      </section>
    </main>
  );
}
