// Gemeinsame Helix-Geometrie für die 3D-Gehirn-Szene (BrainBackground.tsx)
// und alle DOM-Elemente, die räumlich auf derselben Helix montiert werden
// müssen (z. B. die Neural-Glass-Panel-Kartengruppe in page.tsx).
//
// Es gibt keine Kurven-/Spline-Bibliothek im Projekt — die Helix ist eine
// einfache Kreis-Helix um die Y-Achse: Winkel × Radius, linearer Y-Versatz
// pro "Stopp" (Intro-Text, Leistungskarte oder Platzhalterkarte). Diese
// Datei bündelt exakt die Formeln, die zuvor identisch (und dupliziert) in
// BrainBackground.tsx standen, damit es nur noch EINE Quelle dafür gibt.

export const HELIX_STEP = 4.2;
export const TEXT_START_Y = -5;
export const CAMERA_TARGET_START = 0;
export const STOP_END_PADDING = 2.1;

export interface HelixVector3 {
  x: number;
  y: number;
  z: number;
}

/** Kamera-Gesamtstrecke (Weltraum-Y-Einheiten) für eine gegebene Anzahl Stopps. */
export function computeCameraTravel(totalWorldStops: number): number {
  const cameraTargetEnd = TEXT_START_Y - (totalWorldStops - 1) * HELIX_STEP - STOP_END_PADDING;
  return CAMERA_TARGET_START - cameraTargetEnd;
}

/** Y-Position eines Helix-Stopps (Text, Karte, Platzhalter) im Weltraum. */
export function helixStopY(worldIndex: number): number {
  return TEXT_START_Y - worldIndex * HELIX_STEP;
}

/** Winkel (Radiant) eines Helix-Stopps um die Y-Achse. */
export function helixAngleForWorldIndex(worldIndex: number, cameraTravel: number): number {
  const stopY = helixStopY(worldIndex);
  return (Math.PI * 2 * (CAMERA_TARGET_START - stopY)) / cameraTravel;
}

/** Weltposition eines Helix-Stopps bei gegebenem Radius (z. B. Karten- oder Text-Radius). */
export function helixPositionForWorldIndex(worldIndex: number, cameraTravel: number, radius: number): HelixVector3 {
  const angle = helixAngleForWorldIndex(worldIndex, cameraTravel);
  return { x: Math.sin(angle) * radius, y: helixStopY(worldIndex), z: Math.cos(angle) * radius };
}

/** Tangente der Helix-Kreisbahn an einem Stopp (Bewegungsrichtung entlang der Bahn). */
export function helixTangentForWorldIndex(worldIndex: number, cameraTravel: number): HelixVector3 {
  const angle = helixAngleForWorldIndex(worldIndex, cameraTravel);
  return { x: Math.cos(angle), y: 0, z: -Math.sin(angle) };
}

/** Radiale Richtung von einem Stopp nach innen, zur Achse/zum Goldstrang hin. */
export function helixRadialDirectionForWorldIndex(worldIndex: number, cameraTravel: number): HelixVector3 {
  const angle = helixAngleForWorldIndex(worldIndex, cameraTravel);
  return { x: -Math.sin(angle), y: 0, z: -Math.cos(angle) };
}

/** Kamera-Orbitwinkel und Blickpunkt-Y für einen gegebenen Scroll-Fortschritt (0..1). */
export function cameraOrbitForScrollProgress(scrollProgress: number, cameraTravel: number) {
  const sf = Math.max(0, Math.min(1, scrollProgress));
  return {
    sf,
    orbit: sf * Math.PI * 2,
    lookY: CAMERA_TARGET_START - sf * cameraTravel,
  };
}
