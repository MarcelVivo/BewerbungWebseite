// Referenz-Viewport für die 3D-Hero-/Spiral-Szene (BrainBackground.tsx)
// und ihre DOM-Overlays (page.tsx).
//
// Ein breites Desktop-Layout (Gehirne nebeneinander, einzeilige
// Ueberschrift, Buttons in einer Reihe) lässt sich nicht verlustfrei in
// ein schmales Hochformat-Handy umbrechen, ohne entweder die äusseren
// Gehirne anzuschneiden oder Text/Buttons kleiner werden zu lassen.
// Deshalb wird auf schmalen Hochformat-Bildschirmen NICHT umgebrochen,
// sondern exakt dieselbe Referenz-Breite/-Höhe wie an einem typischen
// Desktop-Fenster für Kamera- und Layout-Berechnungen verwendet und das
// Ergebnis anschliessend gleichmässig per CSS-Transform auf die echte
// Bildschirmbreite herunterskaliert — Grössenverhältnisse zwischen den
// 3 Gehirnen, Typografie und Buttons bleiben dadurch exakt wie am
// Desktop erhalten.
export const REF_WIDTH = 1512;
export const REF_HEIGHT = 826;

export interface EffectiveViewport {
  width: number;
  height: number;
  scale: number;
}

/**
 * Ab einer echten Fensterbreite unter 900px (derselbe Schwellenwert wie die
 * bestehende `.spiral-section`-Mobile-Media-Query) wird die feste
 * Referenzgrösse verwendet — das deckt sowohl Hochformat- als auch
 * Querformat-Handys ab. Ab 900px (Desktop, Tablet, Laptop) bleibt alles
 * unverändert (scale=1, echte Fenstergrösse), damit die bestehende
 * Desktop-Darstellung unangetastet bleibt.
 */
export function getEffectiveViewport(innerWidth: number, innerHeight: number): EffectiveViewport {
  if (innerWidth >= 900) {
    return { width: innerWidth, height: innerHeight, scale: 1 };
  }
  return { width: REF_WIDTH, height: REF_HEIGHT, scale: innerWidth / REF_WIDTH };
}
