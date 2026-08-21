'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Rechnung } from '@/lib/types';

function formatCHF(v?: number | null) {
  if (v == null) return 'Keine Angabe.';
  return v.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(iso?: string | null) {
  if (!iso) return 'Keine Angabe.';
  return new Date(iso).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const TYP_LABEL: Record<string, string> = {
  rechnung: 'Rechnung',
  angebot:  'Angebot',
  mahnung:  'Zahlungserinnerung',
};

export default function PrintPage() {
  const { id }                    = useParams<{ id: string }>();
  const [doc, setDoc]             = useState<Rechnung | null>(null);
  const [loading, setLoading]     = useState(true);
  const [notFound, setNotFound]   = useState(false);

  useEffect(() => {
    async function load() {
      const { data, error } = await createClient()
        .from('rechnungen')
        .select('*, kunden(id,kontaktperson,firmenname,email,telefon,adresse)')
        .eq('id', id)
        .single();
      if (error || !data) { setNotFound(true); }
      else { setDoc(data as Rechnung); }
      setLoading(false);
    }
    load();
  }, [id]);

  useEffect(() => {
    if (doc) {
      setTimeout(() => window.print(), 400);
    }
  }, [doc]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-400 text-sm">Die Rechnung wird geladen.</p>
      </div>
    );
  }

  if (notFound || !doc) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Rechnung nicht gefunden.</p>
      </div>
    );
  }

  const zwischensumme = doc.positionen.reduce((s, p) => s + p.total, 0);
  const mwst_betrag   = doc.mwst_betrag ?? zwischensumme * ((doc.mwst_satz ?? 8.1) / 100);
  const gesamtbetrag  = doc.gesamtbetrag ?? zwischensumme + mwst_betrag;

  const typLabel = TYP_LABEL[doc.typ] ?? doc.typ;

  return (
    <>
      <style>{`
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
          @page { margin: 15mm 20mm; size: A4; }
        }
        @media screen {
          body { background: #f3f4f6; }
        }
      `}</style>

      {/* Print Button (screen only) */}
      <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
        <button onClick={() => window.print()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg shadow-lg transition-colors">
          Als PDF speichern / Drucken
        </button>
        <button onClick={() => window.close()}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm rounded-lg shadow-lg transition-colors">
          Schliessen
        </button>
      </div>

      {/* Invoice Page */}
      <div className="min-h-screen bg-white flex justify-center py-12 px-4 print:py-0 print:px-0">
        <div className="w-full max-w-[210mm] bg-white print:max-w-none">

          {/* Header */}
          <div className="flex justify-between items-start mb-12">
            {/* Sender */}
            <div>
              <div className="text-2xl font-bold text-gray-900 tracking-tight mb-1">Marcel Spahr</div>
              <div className="text-sm text-gray-500 leading-relaxed">
                Wirtschaftsinformatiker & KI-Berater<br />
                Bern, Schweiz<br />
                kontakt@marcelspahr.ch<br />
                marcelspahr.ch
              </div>
            </div>

            {/* Document type + number */}
            <div className="text-right">
              <div className="text-3xl font-bold text-indigo-600 mb-1">{typLabel}</div>
              <div className="font-mono text-gray-700 text-sm">{doc.rechnungsnummer}</div>
            </div>
          </div>

          {/* Horizontal rule */}
          <div className="border-t-2 border-indigo-600 mb-8" />

          {/* Recipient + Meta */}
          <div className="flex justify-between items-start mb-10">
            {/* Recipient */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">An</p>
              {doc.kunden ? (
                <div className="text-sm text-gray-700 leading-relaxed font-medium">
                  {doc.kunden.firmenname && <div className="font-bold text-gray-900">{doc.kunden.firmenname}</div>}
                  <div>{doc.kunden.kontaktperson}</div>
                  {doc.kunden.email && <div className="text-gray-500">{doc.kunden.email}</div>}
                </div>
              ) : (
                <div className="text-sm text-gray-400 italic">Kein Empfänger</div>
              )}
            </div>

            {/* Meta */}
            <div className="text-right text-sm">
              <table className="ml-auto">
                <tbody>
                  <tr>
                    <td className="text-gray-400 pr-4 py-0.5">Datum</td>
                    <td className="text-gray-800 font-medium">{formatDate(doc.ausgestellt_am)}</td>
                  </tr>
                  {doc.faellig_am && (
                    <tr>
                      <td className="text-gray-400 pr-4 py-0.5">Fällig am</td>
                      <td className="text-gray-800 font-medium">{formatDate(doc.faellig_am)}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="text-gray-400 pr-4 py-0.5">Konditionen</td>
                    <td className="text-gray-800 font-medium">{doc.zahlungskonditionen}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Line items */}
          <table className="w-full mb-8 text-sm">
            <thead>
              <tr className="bg-gray-50 border-y border-gray-200">
                <th className="text-left px-4 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider">Beschreibung</th>
                <th className="text-right px-4 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider w-20">Menge</th>
                <th className="text-left px-4 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider w-28">Einheit</th>
                <th className="text-right px-4 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider w-32">Einzelpreis</th>
                <th className="text-right px-4 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider w-32">Total</th>
              </tr>
            </thead>
            <tbody>
              {doc.positionen.map((pos, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="px-4 py-3 text-gray-800">{pos.beschreibung || 'Keine Angabe.'}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{pos.menge}</td>
                  <td className="px-4 py-3 text-gray-500">{pos.einheit}</td>
                  <td className="px-4 py-3 text-right text-gray-700">CHF {formatCHF(pos.einzelpreis)}</td>
                  <td className="px-4 py-3 text-right text-gray-800 font-medium">CHF {formatCHF(pos.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-10">
            <div className="w-72">
              <div className="flex justify-between py-1.5 text-sm text-gray-500">
                <span>Zwischensumme</span>
                <span>CHF {formatCHF(zwischensumme)}</span>
              </div>
              <div className="flex justify-between py-1.5 text-sm text-gray-500">
                <span>MwSt. {doc.mwst_satz ?? 8.1}%</span>
                <span>CHF {formatCHF(mwst_betrag)}</span>
              </div>
              <div className="flex justify-between py-3 border-t-2 border-indigo-600 mt-2">
                <span className="font-bold text-gray-900">Gesamtbetrag CHF</span>
                <span className="font-bold text-indigo-600 text-lg">CHF {formatCHF(gesamtbetrag)}</span>
              </div>
            </div>
          </div>

          {/* Notes / Payment info */}
          {doc.notizen && (
            <div className="bg-gray-50 rounded-lg px-5 py-4 mb-8 text-sm text-gray-600 whitespace-pre-line border border-gray-200">
              {doc.notizen}
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-200 pt-6 text-xs text-gray-400 text-center">
            Marcel Spahr · Bern, Schweiz · kontakt@marcelspahr.ch · marcelspahr.ch
          </div>
        </div>
      </div>
    </>
  );
}
