'use client';

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  Bot, BarChart3, Workflow, FolderKanban,
  GraduationCap, Globe, Lightbulb,
  ChevronRight, ChevronDown, ExternalLink, Maximize2, Star, X,
  CheckCircle, Zap, Users, Award,
  MessageSquare, Search, Compass, Wrench, Heart, ClipboardList,
} from 'lucide-react';
import HomeNavBar from './HomeNavBar';
import BrainBackground from './BrainBackground';
import { buildFlapWord, setFlapWordMode, type FlapLetter } from './lib/splitFlap';
import { useLanguage } from './LanguageContext';
import { T } from '../lib/translations';
import { HELIX_STEP, computeCameraTravel, helixAngleForWorldIndex, helixPositionForWorldIndex } from './lib/helixGeometry';
import { getEffectiveViewport, REF_WIDTH, REF_HEIGHT } from './lib/viewport';
import { Chakra_Petch } from 'next/font/google';

const chakraPetch = Chakra_Petch({ subsets: ['latin'], weight: '700', display: 'swap' });

// Radius, den die reale 3D-Leistungskarte ("Karte 01") in BrainBackground.tsx
// hatte, bevor sie durch dieses DOM-Kartenpanel ersetzt wurde — dieselbe
// Weltkoordinate, kein neuer/geschätzter Wert.
const CARD_GROUP_RADIUS = 1.68;

// Radius der WebGL-Intro-Textebene für worldIndex 0 in BrainBackground.tsx
// (buildIntroSprite: textRadius=2.65) — dieselbe Weltkoordinate, damit die
// DOM-Ersatzdarstellung exakt an derselben Helix-Position sitzt.
const INTRO_TEXT_RADIUS = 2.65;

export const dynamic = 'force-static';

// ── Static meta (icons + slugs/urls, language-independent) ───

const SERVICE_META = [
  { icon: Lightbulb,     slug: 'corporate-design' },
  { icon: Globe,         slug: '2d-3d-websites' },
  { icon: BarChart3,     slug: 'crm-loesungen' },
  { icon: Workflow,      slug: 'erp-prozesse' },
  { icon: FolderKanban,  slug: 'datenbanken-schnittstellen' },
  { icon: Bot,           slug: 'automatisierung-ki-agenten' },
  { icon: BarChart3,     slug: 'analyse-konzept' },
  { icon: FolderKanban,  slug: 'go-live-umsetzung' },
  { icon: GraduationCap, slug: 'wartung-weiterentwicklung' },
];

const PORTFOLIO_META = [
  { slug: 'covid-certificate',         color: '#4d7fbf' },
  { slug: 'digitalisierung-swisscom',  color: '#244d82' },
  { slug: 'olivias-olivenpaste',       color: '#a6425c' },
  { slug: 'requirements-engineering',  color: '#8ebef2' },
];

const USP_ICONS = [Zap, Users, CheckCircle, Award];
const PROCESS_ICONS = [MessageSquare, Search, Compass, Wrench, Heart];
const CAMERA_ONLY_WORLD = true;
const INTRO_SEQUENCE = [
  'Deine Idee.',
  'Deine Herausforderung.',
  'Deine Vision.',
  'Deine Lösung.',
  'Deine Erfolgsgeschichte.',
];

// ── Neural Glass Panels: eigenes, reduziertes Knoten-Icon statt generischer
// Stock-Icons — vier leicht unterschiedliche Netzwerk-Topologien, gezeichnet
// mit currentColor, damit die bestehende Accent-Farbe pro Karte greift. ───
const NEURAL_ICON_VARIANTS: { nodes: [number, number][]; edges: [number, number][] }[] = [
  { nodes: [[5, 18], [12, 6], [19, 17], [12, 12]], edges: [[0, 3], [1, 3], [2, 3], [0, 1]] },
  { nodes: [[4, 8], [12, 4], [20, 9], [16, 19], [7, 18]], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [1, 4]] },
  { nodes: [[6, 5], [18, 6], [20, 17], [9, 20], [4, 13]], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]] },
  { nodes: [[12, 4], [20, 10], [17, 19], [7, 19], [4, 10]], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [0, 2], [0, 3]] },
];

function NeuralNodeIcon({ variant = 0 }: { variant?: number }) {
  const v = NEURAL_ICON_VARIANTS[variant % NEURAL_ICON_VARIANTS.length];
  return (
    <svg viewBox="0 0 24 24" width={15} height={15} className="ngp-icon" aria-hidden="true">
      {v.edges.map(([a, b], idx) => {
        const [x1, y1] = v.nodes[a];
        const [x2, y2] = v.nodes[b];
        return <line key={idx} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth={1} strokeOpacity={0.85} />;
      })}
      {v.nodes.map(([x, y], idx) => (
        <circle key={idx} cx={x} cy={y} r={idx === v.nodes.length - 1 ? 2.1 : 1.4} fill="currentColor" />
      ))}
    </svg>
  );
}

const DETAIL_EDGE_FIBERS = [
  { kind: 'core', base: 'M54,-20 C42,50 67,112 48,180 C29,256 79,344 45,438 C11,536 88,652 40,770 C8,850 70,940 43,1020', alt: 'M54,-20 C48,47 59,116 52,182 C41,252 70,351 42,442 C20,540 78,648 46,774 C23,852 62,943 43,1020' },
  { kind: 'core', base: 'M41,40 C58,100 33,171 53,238 C76,318 28,405 58,500 C91,606 22,724 64,836 C79,878 71,925 59,960', alt: 'M41,40 C51,103 39,168 49,242 C62,321 36,409 54,503 C76,608 33,721 60,839 C69,882 65,922 59,960' },
  { kind: 'core', base: 'M69,118 C48,183 78,246 55,318 C25,402 86,495 49,596 C15,692 82,806 45,914 C34,949 37,988 52,1020', alt: 'M69,118 C57,180 70,250 59,320 C42,399 76,501 46,600 C27,696 72,801 50,917 C45,952 43,987 52,1020' },
  { kind: 'core', base: 'M32,-10 C49,47 28,112 45,170 C66,239 24,321 52,410 C83,510 20,625 60,735 C87,801 68,858 43,890', alt: 'M32,-10 C43,50 34,108 41,174 C54,244 31,325 48,414 C69,514 32,621 56,739 C72,803 61,857 43,890' },
  { kind: 'core', base: 'M57,205 C78,275 31,356 61,446 C94,548 23,667 67,786 C91,854 78,929 51,1000', alt: 'M57,205 C69,278 40,352 57,450 C78,553 35,663 63,790 C79,858 70,925 51,1000' },
  { kind: 'core', base: 'M47,72 C31,128 65,187 43,249 C16,320 76,399 46,482 C21,553 69,635 54,762', alt: 'M47,72 C39,130 57,184 47,252 C32,322 67,395 43,486 C34,557 61,632 54,762' },
  { kind: 'hair', base: 'M24,34 C35,87 18,144 31,205 C47,276 21,348 39,426', alt: 'M24,34 C30,90 23,141 28,208 C38,278 28,345 39,426' },
  { kind: 'hair', base: 'M76,286 C54,350 83,421 59,498 C30,586 91,680 55,784 C33,850 42,918 67,982', alt: 'M76,286 C63,353 74,418 62,502 C45,588 81,676 52,788 C43,852 48,916 67,982' },
  { kind: 'hair', base: 'M61,0 C73,59 48,119 65,184 C84,256 44,333 70,418 C82,465 73,510 51,552', alt: 'M61,0 C68,62 55,116 61,187 C73,259 52,329 66,422 C72,467 67,507 51,552' },
  { kind: 'hair', base: 'M35,170 C19,231 54,293 32,365 C6,447 65,534 34,628 C22,668 27,710 46,744', alt: 'M35,170 C27,234 46,289 36,369 C21,449 56,530 31,632 C28,671 31,708 46,744' },
  { kind: 'hair', base: 'M82,438 C61,503 88,577 62,657 C32,748 92,851 54,955 C47,978 48,1000 58,1020', alt: 'M82,438 C70,507 79,573 65,661 C48,750 82,847 51,959 C50,980 52,999 58,1020' },
  { kind: 'hair', base: 'M50,96 C64,153 37,218 57,287 C80,366 34,454 63,547 C91,638 34,744 68,858', alt: 'M50,96 C58,156 44,215 53,291 C68,369 43,451 59,551 C76,641 45,741 68,858' },
  { kind: 'hair', base: 'M28,518 C44,571 21,634 40,702 C62,779 25,866 52,950', alt: 'M28,518 C38,574 28,631 36,706 C51,781 34,863 52,950' },
];

function DetailFiberSpine() {
  const gradientId = `detail-fiber-gradient-${useId().replace(/:/g, '')}`;
  return (
    <svg viewBox="-5 0 110 1000" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--service-accent)" stopOpacity="0" />
          <stop offset="10%" stopColor="var(--service-accent)" stopOpacity="0.62" />
          <stop offset="52%" stopColor="var(--service-accent)" stopOpacity="1" />
          <stop offset="91%" stopColor="var(--service-accent)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--service-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {DETAIL_EDGE_FIBERS.map((fiber, index) => {
        const fadeDuration = 10.8 + (index % 5) * 1.43;
        const strokeWidth = fiber.kind === 'core' ? 0.82 + (index % 3) * 0.11 : 0.38 + (index % 2) * 0.09;
        return (
          <g key={fiber.base}>
            <path
              className={`spiral-detail-fiber spiral-detail-fiber--${fiber.kind}`}
              d={fiber.base}
              stroke={`url(#${gradientId})`}
              style={{
                animationDuration: `${fadeDuration.toFixed(2)}s`,
                animationDelay: `${(-index * 1.67).toFixed(2)}s`,
                animationDirection: index % 2 ? 'reverse' : 'normal',
                strokeWidth,
              }}
            />
            <path
              className="spiral-detail-fiber-flow"
              d={fiber.base}
              stroke={`url(#${gradientId})`}
              pathLength={1}
              strokeDasharray="0.14 0.86"
              style={{ strokeWidth: strokeWidth * 1.65 }}
            />
          </g>
        );
      })}
    </svg>
  );
}

// Split-Flap-Buchstaben-Zerhacker für alle 5 "Deine …"-Intro-Textstationen:
// jeder Buchstabe klappt unabhängig von seinen Nachbarn (eigenes Tempo,
// eigene Pausen) endlos durch zufällige Zeichen — kein Split-Flap-Kästchen
// im Hintergrund, nur der weisse Buchstabe selbst kollabiert vertikal
// (scaleY) und entfaltet sich mit dem nächsten Zeichen wieder. Bewusst
// scaleY statt einer echten 3D-rotateX-Perspektiv-Rotation: Letztere
// verzieht/staucht die Glyphen sichtbar während des Flips (abhängig von
// Schriftgrösse und Kamerawinkel), scaleY ist eine reine 2D-Transformation
// ohne jede perspektivische Verzerrungsmöglichkeit. Die Dauerschleife läuft
// permanent während gescrollt wird; steht der Scroll still, bekommen alle
// Buchstaben den Befehl, beim nächsten eigenen Taktschritt auf ihrem
// Zielbuchstaben anzuhalten ("settle"). Sobald wieder gescrollt wird, läuft
// die Dauerschleife an denselben (dann gestoppten) Buchstaben weiter ("spin").
function SpiralShowcase({ t, lang }: { t: typeof T['de']; lang: 'de' | 'en' }) {
  const [activeServiceSlug, setActiveServiceSlug] = useState<string | null>(null);
  const progressRef = useRef(0);
  const targetProgressRef = useRef(0);
  const frameRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const lastStrandProgressRef = useRef(-1);
  const viewportRef = useRef({ width: 0, height: 0 });
  const serviceStationsRef = useRef<HTMLDivElement | null>(null);
  const cardsWorldRef = useRef<HTMLDivElement | null>(null);
  const solutionsFlapRef = useRef<HTMLHeadingElement | null>(null);
  const detailScrollDistanceRef = useRef(0);
  const detailScrollStepsRef = useRef(0);
  // Je 1 Ref-Slot pro Intro-Station (worldIndex 0..4, "Deine …") — Arrays
  // statt einzelner Refs, da alle 5 Stationen dieselbe Split-Flap-Logik in
  // derselben Schleife (IntroFlapWorld-Effekt) durchlaufen.
  const introFlapWorldRefs = useRef<(HTMLDivElement | null)[]>([]);
  const introFlapSmallRefs = useRef<(HTMLDivElement | null)[]>([]);
  const introFlapBigRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mobileIntroFlapRefs = useRef<(HTMLHeadingElement | null)[]>([]);

  // Neural Glass Panels: die vier Karten bilden EIN zusammenstehendes
  // 2×2-Element (CardsHelixGroup), fixiert an EINER festen Helix-Position
  // (worldIndex 5, exakt derselbe Weltkoordinaten-Stopp wie zuvor die
  // erste echte 3D-Leistungskarte in BrainBackground.tsx: nach dem
  // 5. Intro-Text, vor der ersten echten 3D-Leistungskarte, Radius 1.68 — also
  // derselbe Stationsabstand wie zwischen den vorherigen Texten, da
  // HELIX_STEP zwischen allen Stopps konstant ist).
  //
  // CardsHelixWorld (cardsWorldRef) bildet AUSSCHLIESSLICH die
  // Gegenbewegung der Three.js-Kamera ab: Position, Skalierung und
  // Rotation werden jeden Frame aus derselben, bereits gedämpften
  // Kamera-Live-Daten (window.__cardsCameraState, von BrainBackground.tsx
  // im Tick veröffentlicht) über eine echte Perspektiv-Projektion
  // berechnet — keine eigene Scrollberechnung, kein zweiter Timeline.
  // CardsHelixGroup (serviceStationsRef) behält ihre feste 2×2-Anordnung
  // und alle internen Karten-Animationen unverändert; hier wird nur noch
  // Sichtbarkeit (Opacity/pointer-events/is-materialized) gesetzt.
  useEffect(() => {
    const world = cardsWorldRef.current;
    const group = serviceStationsRef.current;
    if (!world || !group) return;

    const introStopCount = 5;
    const totalWorldStops = introStopCount + 4 + 4;
    const cameraTravel = computeCameraTravel(totalWorldStops);
    const worldIndex = introStopCount;
    const stationAngle = helixAngleForWorldIndex(worldIndex, cameraTravel);
    const stationPos = helixPositionForWorldIndex(worldIndex, cameraTravel, CARD_GROUP_RADIUS);
    // Feste radiale Ausrichtung nach aussen, zum Goldstrang hin orientiert
    // (dieselbe Konvention wie rotation.y=angle bei den Intro-Texten).
    const stationNormal = { x: Math.sin(stationAngle), y: 0, z: Math.cos(stationAngle) };
    // Fensterbreite in derselben Grössenordnung wie cameraRailSlowdown()s
    // Fokusfenster in BrainBackground.tsx (kein neuer, frei erfundener Wert).
    const fadeWindow = HELIX_STEP * 1.35;

    let materialized = false;
    let referenceViewZ: number | null = null;
    let rafId = 0;

    const frame = () => {
      rafId = requestAnimationFrame(frame);
      const cam = (window as any).__cardsCameraState;
      if (!cam) return;

      const camPos = {
        x: Math.sin(cam.orbit) * cam.cameraRadius,
        y: cam.cameraY,
        z: Math.cos(cam.orbit) * cam.cameraRadius,
      };

      let fx = 0 - camPos.x;
      let fy = cam.cameraLookY - camPos.y;
      let fz = 0 - camPos.z;
      const fLen = Math.hypot(fx, fy, fz) || 1;
      fx /= fLen; fy /= fLen; fz /= fLen;

      // right = normalize(cross(forward, worldUp)); up = cross(right, forward)
      let rx = fy * 0 - fz * 1;
      let ry = fz * 0 - fx * 0;
      let rz = fx * 1 - fy * 0;
      const rLen = Math.hypot(rx, ry, rz) || 1;
      rx /= rLen; ry /= rLen; rz /= rLen;
      const ux = ry * fz - rz * fy;
      const uy = rz * fx - rx * fz;
      const uz = rx * fy - ry * fx;

      const relX = stationPos.x - camPos.x;
      const relY = stationPos.y - camPos.y;
      const relZ = stationPos.z - camPos.z;

      const viewX = relX * rx + relY * ry + relZ * rz;
      const viewY = relX * ux + relY * uy + relZ * uz;
      const viewZ = relX * fx + relY * fy + relZ * fz;

      const distance = Math.abs(cam.cameraLookY - stationPos.y);
      const visibility = Math.max(0, Math.min(1, 1 - distance / fadeWindow));

      if (viewZ <= 0.001 || visibility <= 0) {
        group.style.opacity = '0';
        group.style.pointerEvents = 'none';
        return;
      }

      // Referenztiefe bei nächster Annäherung (Kamera und Station auf
      // gleichem Winkel): Kameraradius minus Kartenradius, plus die feste
      // vertikale Kameraversetzung — aus echten Live-Kameradaten kalibriert,
      // kein geschätzter Pixelwert.
      if (referenceViewZ === null) {
        referenceViewZ = Math.hypot(cam.cameraRadius - CARD_GROUP_RADIUS, 0.24);
      }

      const tanHalfFovY = Math.tan((cam.fov * Math.PI) / 360);
      const ndcX = viewX / (viewZ * tanHalfFovY * cam.aspect);
      const ndcY = viewY / (viewZ * tanHalfFovY);

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const screenX = (ndcX * 0.5 + 0.5) * vw;
      const screenY = (1 - (ndcY * 0.5 + 0.5)) * vh;
      const scale = Math.max(0.4, Math.min(1.6, referenceViewZ / viewZ));

      // Foreshortening-Yaw: feste Weltnormale der Station, ausgedrückt in
      // der live Kamerabasis — 0° wenn die Station direkt zur Kamera zeigt,
      // wächst, während die Kamera an der fixen Station vorbeifliegt.
      const dotNormalRight = stationNormal.x * rx + stationNormal.z * rz;
      const dotNormalForward = stationNormal.x * fx + stationNormal.z * fz;
      const yawRad = Math.atan2(dotNormalRight, -dotNormalForward);
      const yawDeg = (yawRad * 180) / Math.PI;

      world.style.transform = `translate3d(${screenX.toFixed(2)}px, ${screenY.toFixed(2)}px, 0) scale(${scale.toFixed(4)}) rotateY(${yawDeg.toFixed(3)}deg)`;

      group.style.opacity = String(visibility);
      group.style.pointerEvents = visibility > 0.55 ? 'auto' : 'none';
      if (!materialized && visibility > 0.05) {
        materialized = true;
        group.classList.add('is-materialized');
      }
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Mobile Split-Flap: Die iPhone-Darstellung bleibt im stabilen normalen
  // Dokumentfluss, während ihre fünf Introtexte beim Scrollen durch Zeichen
  // laufen und kurz nach dem Scroll-Stopp wieder lesbar einrasten.
  useEffect(() => {
    if (!window.matchMedia('(max-width: 699px)').matches) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const words = INTRO_SEQUENCE.map((text, index) => {
      const element = mobileIntroFlapRefs.current[index];
      return element ? buildFlapWord(element, text) : [];
    });

    words.forEach((letters) => setFlapWordMode(letters, 'settle', true));

    let settleTimer = 0;
    const onScroll = () => {
      if (reduced) return;
      window.clearTimeout(settleTimer);
      words.forEach((letters) => setFlapWordMode(letters, 'spin', false));
      settleTimer = window.setTimeout(() => {
        words.forEach((letters) => setFlapWordMode(letters, 'settle', false));
      }, 180);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.clearTimeout(settleTimer);
      words.forEach((letters) => setFlapWordMode(letters, 'settle', true));
    };
  }, [lang]);

  // Die Kartenüberschrift ist Teil desselben projizierten DOM-Weltobjekts
  // wie die vier Karten. Sie besitzt deshalb keine eigene Scroll- oder
  // Kameralogik, sondern folgt deren Position, Skalierung und Drehung exakt.
  // Lediglich der Split-Flap-Lauf wird in einem festen 5-Sekunden-Takt kurz
  // aktiviert und anschliessend wieder auf den Zieltext gesetzt.
  useEffect(() => {
    const title = solutionsFlapRef.current;
    if (!title) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const label = lang === 'de' ? 'LÖSUNGEN' : 'SOLUTIONS';
    const letters = buildFlapWord(title, label);
    setFlapWordMode(letters, 'settle', true);

    let settleTimer = 0;
    const triggerFlap = () => {
      if (reduced) return;
      window.clearTimeout(settleTimer);
      setFlapWordMode(letters, 'spin', false);
      settleTimer = window.setTimeout(() => {
        setFlapWordMode(letters, 'settle', false);
      }, 720);
    };

    const flapInterval = window.setInterval(triggerFlap, 5000);
    return () => {
      window.clearInterval(flapInterval);
      window.clearTimeout(settleTimer);
      setFlapWordMode(letters, 'settle', true);
    };
  }, [lang]);

  // IntroFlapWorld: ersetzt die WebGL-Textebenen ALLER 5 Intro-Stationen
  // ("Deine Idee.", "Deine Herausforderung.", "Deine Vision.", "Deine
  // Lösung.", "Deine Erfolgsgeschichte." — worldIndex 0..4, in
  // BrainBackground.tsx wird deren Mesh-Erzeugung übersprungen) durch
  // dieselben Textstationen als DOM-Overlay in Chakra Petch mit
  // unabhängigem Split-Flap-Effekt pro Buchstabe. Position, Kamerafahrt,
  // Helix, Sichtbarkeitsfenster und Perspektiv-Projektion sind exakt
  // dieselbe Technik wie bei CardsHelixWorld oben — nur Schriftart/
  // Darstellungseffekt sind neu. Eine gemeinsame requestAnimationFrame-
  // Schleife bedient alle 5 Stationen; der Scroll-Idle-Zustand ist global
  // (ein Scroll-Stopp lässt alle sichtbaren Stationen gleichzeitig stehen).
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const totalWorldStops = 5 + 4 + 4;
    const cameraTravel = computeCameraTravel(totalWorldStops);
    const fadeWindow = HELIX_STEP * 1.35;

    type IntroFlapStation = {
      world: HTMLDivElement;
      stationPos: { x: number; y: number; z: number };
      stationNormal: { x: number; y: number; z: number };
      smallLetters: FlapLetter[];
      bigLetters: FlapLetter[];
      alignBigWord: () => void;
      referenceViewZ: number | null;
      settled: boolean;
    };

    const stations: IntroFlapStation[] = INTRO_SEQUENCE.map((text, worldIndex) => {
      const world = introFlapWorldRefs.current[worldIndex];
      const smallEl = introFlapSmallRefs.current[worldIndex];
      const bigEl = introFlapBigRefs.current[worldIndex];
      if (!world || !smallEl || !bigEl) return null;

      const stationAngle = helixAngleForWorldIndex(worldIndex, cameraTravel);
      const stationPos = helixPositionForWorldIndex(worldIndex, cameraTravel, INTRO_TEXT_RADIUS);
      const stationNormal = { x: Math.sin(stationAngle), y: 0, z: Math.cos(stationAngle) };

      // "Deine X." → "DEINE" (klein, oben) / "X." (3x, unten, am 3.
      // Buchstaben von DEINE ausgerichtet) — dieselbe Konvention wie bei
      // der ersten Station "Deine Idee.".
      const [firstWord, ...rest] = text.toUpperCase().split(' ');
      const smallLetters = buildFlapWord(smallEl, firstWord);
      const bigLetters = buildFlapWord(bigEl, rest.join(' '));

      function alignBigWord() {
        // offsetLeft statt getBoundingClientRect, weil offsetLeft reines
        // Layout ist und vom per-Frame gesetzten transform (scale/
        // translate) der Kamera-Projektion unberührt bleibt —
        // getBoundingClientRect würde den aktuellen Skalierungsfaktor mit
        // einrechnen und die Ausrichtung dadurch verfälschen.
        bigEl!.style.marginLeft = '0px';
        const offset = smallLetters[2].wrap.offsetLeft - bigLetters[0].wrap.offsetLeft;
        bigEl!.style.marginLeft = `${offset}px`;
      }

      setFlapWordMode(smallLetters, 'spin', reduced);
      setFlapWordMode(bigLetters, 'spin', reduced);

      return { world, stationPos, stationNormal, smallLetters, bigLetters, alignBigWord, referenceViewZ: null, settled: false };
    }).filter((s): s is IntroFlapStation => s !== null);

    if (!stations.length) return;

    // Split-Flap ersetzt die bisherige Opacity-Ein-/Ausblendung: jede
    // Station ist entweder ganz im Fenster (Buchstaben drehen endlos oder
    // stehen fest) oder ganz ausserhalb (unsichtbar) — kein sanftes
    // Überblenden. Der Effekt hängt ausschliesslich vom (globalen)
    // Scroll-Zustand ab: wird gescrollt, drehen die Buchstaben; steht der
    // Scroll still, bleibt der Text jeder gerade sichtbaren Station fest
    // stehen — unabhängig davon, wo genau sie im Bild steht.
    const SCROLL_IDLE_MS = 180;
    let lastScrollAt = performance.now() - SCROLL_IDLE_MS - 1; // vor jedem Scrollen: als "idle" gestartet
    const onScrollActivity = () => { lastScrollAt = performance.now(); };
    window.addEventListener('scroll', onScrollActivity, { passive: true });

    const alignAll = () => stations.forEach((s) => s.alignBigWord());
    alignAll();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(alignAll);
    }
    window.addEventListener('resize', alignAll);

    let rafId = 0;
    const frame = () => {
      rafId = requestAnimationFrame(frame);
      const cam = (window as any).__cardsCameraState;
      if (!cam) return;

      const scrollIdle = performance.now() - lastScrollAt > SCROLL_IDLE_MS;

      const camPos = {
        x: Math.sin(cam.orbit) * cam.cameraRadius,
        y: cam.cameraY,
        z: Math.cos(cam.orbit) * cam.cameraRadius,
      };

      let fx = 0 - camPos.x;
      let fy = cam.cameraLookY - camPos.y;
      let fz = 0 - camPos.z;
      const fLen = Math.hypot(fx, fy, fz) || 1;
      fx /= fLen; fy /= fLen; fz /= fLen;

      let rx = fy * 0 - fz * 1;
      let ry = fz * 0 - fx * 0;
      let rz = fx * 1 - fy * 0;
      const rLen = Math.hypot(rx, ry, rz) || 1;
      rx /= rLen; ry /= rLen; rz /= rLen;
      const ux = ry * fz - rz * fy;
      const uy = rz * fx - rx * fz;
      const uz = rx * fy - ry * fx;

      const tanHalfFovY = Math.tan((cam.fov * Math.PI) / 360);
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      stations.forEach((s) => {
        if (!s.settled && scrollIdle) {
          s.settled = true;
          setFlapWordMode(s.smallLetters, 'settle', reduced);
          setFlapWordMode(s.bigLetters, 'settle', reduced);
        } else if (s.settled && !scrollIdle) {
          s.settled = false;
          setFlapWordMode(s.smallLetters, 'spin', reduced);
          setFlapWordMode(s.bigLetters, 'spin', reduced);
        }

        const relX = s.stationPos.x - camPos.x;
        const relY = s.stationPos.y - camPos.y;
        const relZ = s.stationPos.z - camPos.z;

        const viewX = relX * rx + relY * ry + relZ * rz;
        const viewY = relX * ux + relY * uy + relZ * uz;
        const viewZ = relX * fx + relY * fy + relZ * fz;

        const distance = Math.abs(cam.cameraLookY - s.stationPos.y);
        const visibility = Math.max(0, Math.min(1, 1 - distance / fadeWindow));
        const inWindow = viewZ > 0.001 && visibility > 0;

        if (!inWindow) {
          s.world.style.opacity = '0';
          return;
        }

        if (s.referenceViewZ === null) {
          s.referenceViewZ = Math.hypot(cam.cameraRadius - INTRO_TEXT_RADIUS, 0.24);
        }

        const ndcX = viewX / (viewZ * tanHalfFovY * cam.aspect);
        const ndcY = viewY / (viewZ * tanHalfFovY);
        const screenX = (ndcX * 0.5 + 0.5) * vw;
        const screenY = (1 - (ndcY * 0.5 + 0.5)) * vh;
        const scale = Math.max(0.4, Math.min(1.6, s.referenceViewZ / viewZ));

        // Im "settled"-Zustand (Scroll steht still) immer frontal (0°)
        // anzeigen: der Foreshortening-Yaw hängt vom exakten Kamerawinkel
        // beim Stoppen ab — das kann ein beliebiger, teils starker Winkel
        // sein und liess die Buchstaben dann sichtbar schräg/verzerrt
        // "einfrieren". Beim Scrollen (spin) bleibt der echte, dynamische
        // Kamerawinkel unverändert bestehen.
        const dotNormalRight = s.stationNormal.x * rx + s.stationNormal.z * rz;
        const dotNormalForward = s.stationNormal.x * fx + s.stationNormal.z * fz;
        const yawDeg = s.settled ? 0 : (Math.atan2(dotNormalRight, -dotNormalForward) * 180) / Math.PI;

        s.world.style.transform = `translate3d(${screenX.toFixed(2)}px, ${screenY.toFixed(2)}px, 0) scale(${scale.toFixed(4)}) rotateY(${yawDeg.toFixed(3)}deg)`;
        // Split-Flap statt Opacity-Fade: innerhalb des Fensters immer voll
        // sichtbar (kein Überblenden) — die An-/Abwesenheit wird durch Spin
        // (unleserlich, beim Scrollen) vs. Settle (lesbar, im Stillstand)
        // ausgedrückt (siehe scrollIdle oben).
        s.world.style.opacity = '1';
      });
    };

    rafId = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', alignAll);
      window.removeEventListener('scroll', onScrollActivity);
    };
  }, []);

  useEffect(() => {
    if (CAMERA_ONLY_WORLD) return;
    const section = document.getElementById('solution-spiral');
    if (!section) return;
    const items = Array.from(section.querySelectorAll<HTMLElement>('[data-spiral-item]'));
    const strandAnchors = Array.from(section.querySelectorAll<HTMLElement>('[data-spiral-strand-anchor]'));
    const continuousStrand = section.querySelector<SVGSVGElement>('[data-continuous-strand]');
    const continuousStrandPaths = continuousStrand
      ? Array.from(continuousStrand.querySelectorAll<SVGPathElement>('[data-strand-path]'))
      : [];
    const serviceItems = Array.from(section.querySelectorAll<HTMLElement>('[data-service-card]'));
    let lastRenderedProgress = Number.NaN;

    const update = () => {
      const start = section.offsetTop;
      const end = start + section.offsetHeight - window.innerHeight;
      const raw = (window.scrollY - start) / Math.max(1, end - start);
      targetProgressRef.current = Math.max(0, Math.min(1, raw));
    };

    const updateViewport = () => {
      viewportRef.current = { width: window.innerWidth, height: window.innerHeight };
    };

    const projectHelixPoint = (index: number, currentProgress: number) => {
      const angle = index * spiralAngleStep - currentProgress * rotationTravel;
      const rad = (angle * Math.PI) / 180;
      const y = index * verticalStep - currentProgress * totalTravel + spiralYOffset;
      const z = Math.cos(rad) * (radius - 24);
      const perspective = 1700;
      const depth = perspective / Math.max(420, perspective - z);
      const { width, height } = viewportRef.current;

      return {
        x: width / 2 + Math.sin(rad) * (radius - 24) * depth,
        y: height / 2 + y * depth,
      };
    };

    const renderProgress = (currentProgress: number) => {
      const rotationTravel = (spiralAngleStep * totalTravel) / verticalStep;
      items.forEach((item, i) => {
        const angle = i * spiralAngleStep - currentProgress * rotationTravel;
        const rad = (angle * Math.PI) / 180;
        const y = i * verticalStep - currentProgress * totalTravel + spiralYOffset;
        const front = Math.cos(rad);
        const visible = Math.max(0, 1 - Math.abs(y) / 690);
        const frontFocus = Math.max(0, (front + 0.18) / 1.18);
        const opacity = Math.max(0, Math.min(1, visible * frontFocus));

        item.style.transform = `translate3d(-50%, -50%, 0) rotateY(${angle}deg) translateZ(${radius}px) translate3d(0, ${y}px, 0) scale(1)`;
        item.style.opacity = String(opacity);
        item.style.zIndex = String(Math.round(1000 + front * 120 + visible * 240));
      });

      strandAnchors.forEach((strand, i) => {
        const strandIndex = i + 0.5;
        const angle = strandIndex * spiralAngleStep - currentProgress * rotationTravel;
        const rad = (angle * Math.PI) / 180;
        const y = strandIndex * verticalStep - currentProgress * totalTravel + spiralYOffset;
        const front = Math.cos(rad);
        const visible = Math.max(0, 1 - Math.abs(y) / 720);
        const frontFocus = Math.max(0, (front + 0.1) / 1.1);
        const opacity = Math.max(0, Math.min(0.82, visible * frontFocus * 0.82));

        strand.style.transform = `translate3d(-50%, -50%, 0) rotateY(${angle}deg) translateZ(${radius - 24}px) translate3d(0, ${y}px, 0)`;
        strand.dataset.strandOpacity = String(opacity);
        strand.style.zIndex = String(Math.round(960 + front * 80 + visible * 120));
      });

      if (
        continuousStrand
        && continuousStrandPaths.length
        && strandAnchors.length > 1
        && Math.abs(currentProgress - lastStrandProgressRef.current) > 0.00035
      ) {
        lastStrandProgressRef.current = currentProgress;
        const { width, height } = viewportRef.current;
        continuousStrand.setAttribute('viewBox', `0 0 ${width.toFixed(1)} ${height.toFixed(1)}`);
        const points = strandAnchors.map((_, index) => projectHelixPoint(index + 0.5, currentProgress));
        const first = points[0];
        const second = points[1];
        const last = points[points.length - 1];
        const beforeLast = points[points.length - 2];
        const extendedPoints = [
          {
            x: first.x + (first.x - second.x) * 0.42,
            y: first.y + (first.y - second.y) * 0.42,
          },
          ...points,
          {
            x: last.x + (last.x - beforeLast.x) * 0.42,
            y: last.y + (last.y - beforeLast.y) * 0.42,
          },
        ];

        const createPath = (sourcePoints: typeof extendedPoints, offset: number, phase: number) => sourcePoints.reduce((pathData, point, index, allPoints) => {
          const tv = index / Math.max(1, allPoints.length - 1);
          const wave = Math.sin(currentProgress * 12 + tv * 6 + phase) * 7 * tv * (1 - tv * 0.18);
          const taper = 0.32 + Math.sin(Math.PI * tv) * 0.72;
          const shifted = {
            x: point.x + offset * taper + wave,
            y: point.y + Math.cos(currentProgress * 14 + tv * 9 + phase) * 5 * taper,
          };
          if (index === 0) return `M ${shifted.x.toFixed(1)} ${shifted.y.toFixed(1)}`;
          const previous = allPoints[index - 1];
          const previousTv = (index - 1) / Math.max(1, allPoints.length - 1);
          const previousTaper = 0.36 + Math.sin(Math.PI * previousTv) * 0.94;
          const previousWave = Math.sin(currentProgress * 12 + previousTv * 6 + phase) * 7 * previousTv * (1 - previousTv * 0.18);
          const shiftedPrevious = {
            x: previous.x + offset * previousTaper + previousWave,
            y: previous.y + Math.cos(currentProgress * 14 + previousTv * 9 + phase) * 5 * previousTaper,
          };
          const controlX = (shiftedPrevious.x + shifted.x) / 2;
          return `${pathData} C ${controlX.toFixed(1)} ${shiftedPrevious.y.toFixed(1)}, ${controlX.toFixed(1)} ${shifted.y.toFixed(1)}, ${shifted.x.toFixed(1)} ${shifted.y.toFixed(1)}`;
        }, '');
        const opacity = Math.max(...strandAnchors.map((anchor) => Number(anchor.dataset.strandOpacity || 0)));

        continuousStrandPaths.forEach((pathElement) => {
          const role = pathElement.dataset.strandRole || 'fiber';
          const fiberIndex = Number(pathElement.dataset.fiberIndex || 0);
          const offset = role === 'glow' || role === 'core'
            ? 0
            : role === 'aura'
              ? fiberIndex * 22
              : (fiberIndex - 5.5) * 2.2 + Math.sin(fiberIndex * 1.7) * 2.2;
          const phase = fiberIndex * 0.61;
          pathElement.setAttribute('d', createPath(extendedPoints, offset, phase));
        });
        continuousStrand.style.opacity = String(Math.min(0.82, opacity));
      }

      serviceItems.forEach((item, i) => {
        const rowDelay = i > 1 ? 0.11 : 0;
        const raw = (currentProgress - 0.56 - rowDelay) / 0.2;
        const clamped = Math.max(0, Math.min(1, raw));
        const eased = 1 - Math.pow(1 - clamped, 3);
        const y = (1 - eased) * 150;

        item.style.transform = `translate3d(0, ${y}px, 0)`;
        // Der Detailzustand wird ausschliesslich über .is-detail-open
        // ausgeblendet. Eine zweite, gedämpfte JS-Opacity konnte nach
        // mehreren Öffnungen auf 0 stehen bleiben und spätere Karten sperren.
        item.style.opacity = String(eased);
        item.style.zIndex = '1260';
      });
    };

    const animate = (time: number) => {
      const delta = Math.min(40, time - (lastFrameTimeRef.current || time));
      lastFrameTimeRef.current = time;
      const easing = 1 - Math.pow(0.006, delta / 1000);
      const next = progressRef.current + (targetProgressRef.current - progressRef.current) * easing;
      progressRef.current = Math.abs(targetProgressRef.current - next) < 0.0006
        ? targetProgressRef.current
        : next;

      // Keine Layout-/Style-Schreibvorgänge in ruhenden Frames. Die vorherige
      // Dauerschleife schrieb auch bei unverändertem Scrollstand sämtliche
      // Kartenstile neu und verursachte zusammen mit WebGL unnötige Ruckler.
      if (
        !Number.isFinite(lastRenderedProgress)
        || Math.abs(progressRef.current - lastRenderedProgress) > 0.00005
      ) {
        renderProgress(progressRef.current);
        lastRenderedProgress = progressRef.current;
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      updateViewport();
      update();
    };

    updateViewport();
    update();
    renderProgress(progressRef.current);
    frameRef.current = requestAnimationFrame(animate);
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', handleResize);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (!activeServiceSlug) return;

    let lastScrollY = window.scrollY;
    detailScrollDistanceRef.current = 0;
    detailScrollStepsRef.current = 0;

    const handleScroll = () => {
      const delta = Math.abs(window.scrollY - lastScrollY);
      lastScrollY = window.scrollY;
      if (delta < 4) return;

      detailScrollDistanceRef.current += delta;
      while (detailScrollDistanceRef.current >= 90) {
        detailScrollDistanceRef.current -= 90;
        detailScrollStepsRef.current += 1;
      }

      if (detailScrollStepsRef.current >= 3) {
        setActiveServiceSlug(null);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeServiceSlug]);

  const cards = [
    {
      kind: 'intro',
      code: 'INTRO 01',
      title: INTRO_SEQUENCE[0],
      icon: Wrench,
    },
    {
      kind: 'intro',
      code: 'INTRO 02',
      title: INTRO_SEQUENCE[1],
      icon: Users,
    },
    {
      kind: 'intro',
      code: 'INTRO 03',
      title: INTRO_SEQUENCE[2],
      icon: Compass,
    },
    {
      kind: 'intro',
      code: 'INTRO 04',
      title: INTRO_SEQUENCE[3],
      icon: Lightbulb,
    },
    {
      kind: 'intro',
      code: 'INTRO 05',
      title: INTRO_SEQUENCE[4],
      icon: Workflow,
    },
    {
      kind: 'service',
      slug: 'corporate-design-webauftritt',
      code: '01',
      title: lang === 'de' ? 'Corporate Design\n& Webauftritt' : 'Corporate design\n& web presence',
      body: lang === 'de'
        ? 'Marke, Gestaltung, Wirkung und digitale Präsentation sauber aus einem System gedacht.'
        : 'Brand, design, impact and digital presentation built as one coherent system.',
      detailTitle: lang === 'de' ? 'Ein Auftritt, der sofort seriös wirkt.' : 'A presence that feels credible immediately.',
      detailText: lang === 'de'
        ? 'Ich entwickle ein visuelles Fundament, das zu deinem Unternehmen passt: Logo, Farben, Typografie, Bildsprache, Layoutsystem und Website-Auftritt. Ziel ist kein austauschbares Design, sondern ein professioneller digitaler Eindruck, der Vertrauen schafft und dein Angebot verständlich macht.'
        : 'I build a visual foundation that fits your company: logo, colors, typography, imagery, layout system and web presence. The goal is not generic design, but a credible digital impression that builds trust and explains your offer clearly.',
      detailPoints: lang === 'de'
        ? ['Corporate Design und visuelle Leitplanken', 'Website-Struktur, Texteinstieg und Nutzerführung', 'Moderne Gestaltung mit klarer Wirkung', 'Saubere Übergabe für langfristige Weiterentwicklung']
        : ['Corporate design and visual guidelines', 'Website structure, copy entry and user flow', 'Modern design with clear impact', 'Clean handover for long-term evolution'],
      accent: '#c89a3d',
      accentRgb: '200,154,61',
      icon: Star,
    },
    {
      kind: 'service',
      slug: 'websites-applikationen',
      code: '02',
      title: lang === 'de' ? '2D-/3D-Websites\n& Applikationen' : '2D/3D websites\n& applications',
      body: lang === 'de'
        ? 'Moderne Websites und Web-Apps, die hochwertig aussehen und technisch belastbar sind.'
        : 'Modern websites and web apps that look premium and hold up technically.',
      detailTitle: lang === 'de' ? 'Websites und Apps, die nicht nur gut aussehen.' : 'Websites and apps that do more than look good.',
      detailText: lang === 'de'
        ? 'Ich baue moderne 2D- und 3D-Websites, Landingpages, Portale und Web-Applikationen mit sauberer Architektur. Performance, Responsivität, Animationen, Inhalte und Bedienbarkeit werden zusammen geplant, damit die Lösung stabil, schnell und überzeugend funktioniert.'
        : 'I build modern 2D and 3D websites, landing pages, portals and web applications with clean architecture. Performance, responsiveness, animation, content and usability are planned together so the solution is stable, fast and convincing.',
      detailPoints: lang === 'de'
        ? ['Individuelle Websites, Landingpages und Web-Apps', '2D-/3D-Interaktionen mit Fokus auf Performance', 'Responsive Umsetzung für Desktop und Mobile', 'Technisch saubere Basis für SEO und Erweiterungen']
        : ['Custom websites, landing pages and web apps', '2D/3D interactions with performance focus', 'Responsive implementation for desktop and mobile', 'Clean technical base for SEO and extensions'],
      accent: '#4d7fbf',
      accentRgb: '77,127,191',
      icon: Globe,
    },
    {
      kind: 'service',
      slug: 'crm-erp-datenbanken',
      code: '03',
      title: lang === 'de' ? 'CRM, ERP\n& Datenbanken' : 'CRM, ERP\n& databases',
      body: lang === 'de'
        ? 'Individuelle Systeme, exakt auf Abläufe, Teams, Daten und Wachstum abgestimmt.'
        : 'Custom systems aligned to workflows, teams, data and long-term growth.',
      detailTitle: lang === 'de' ? 'Systeme, die exakt zu deinem Betrieb passen.' : 'Systems aligned exactly to your business.',
      detailText: lang === 'de'
        ? 'Ich konzipiere und entwickle CRM-, ERP- und Datenbanklösungen, die reale Abläufe abbilden statt sie komplizierter zu machen. Kunden, Projekte, Dokumente, Angebote, Rechnungen, Prozesse und Rechte werden so strukturiert, dass dein Unternehmen damit langfristig arbeiten kann.'
        : 'I design and develop CRM, ERP and database solutions that reflect real workflows instead of making them more complicated. Customers, projects, documents, quotes, invoices, processes and roles are structured so your company can rely on them long term.',
      detailPoints: lang === 'de'
        ? ['CRM- und ERP-Funktionen nach Maß', 'Datenbanken, Rollen, Rechte und Workflows', 'Dashboards, Dokumente, Formulare und Auswertungen', 'Schnittstellen zu bestehenden Tools und Prozessen']
        : ['Custom CRM and ERP functions', 'Databases, roles, permissions and workflows', 'Dashboards, documents, forms and reporting', 'Interfaces to existing tools and processes'],
      accent: '#a6425c',
      accentRgb: '166,66,92',
      icon: FolderKanban,
    },
    {
      kind: 'service',
      slug: 'ki-automation-prozesse',
      code: '04',
      title: lang === 'de' ? 'KI-Automation\n& Prozesse' : 'AI automation\n& processes',
      body: lang === 'de'
        ? 'Sinnvolle KI-Lösungen, die Arbeit vereinfachen, Prozesse beschleunigen und Qualität sichern.'
        : 'Practical AI solutions that simplify work, accelerate processes and protect quality.',
      detailTitle: lang === 'de' ? 'KI dort einsetzen, wo sie wirklich hilft.' : 'AI where it actually helps.',
      detailText: lang === 'de'
        ? 'Ich analysiere, wo Automatisierung und KI in deinem Unternehmen konkret Nutzen bringen: weniger manuelle Arbeit, bessere Antworten, schnellere Prozesse, klarere Daten und weniger Fehler. Statt Tool-Chaos entsteht eine passende Lösung, die kontrollierbar und seriös bleibt.'
        : 'I analyze where automation and AI create concrete value in your company: less manual work, better answers, faster processes, clearer data and fewer errors. Instead of tool chaos, you get a fitting solution that remains controlled and professional.',
      detailPoints: lang === 'de'
        ? ['KI-Workflows für wiederkehrende Aufgaben', 'Automatisierung von Kommunikation, Daten und Abläufen', 'Tool-Auswahl und Integration ohne KI-Chaos', 'Sichere, nachvollziehbare und wartbare Umsetzung']
        : ['AI workflows for recurring tasks', 'Automation of communication, data and operations', 'Tool selection and integration without AI chaos', 'Safe, explainable and maintainable implementation'],
      accent: '#4dbf7f',
      accentRgb: '77,191,127',
      icon: Bot,
    },
  ];

  const verticalStep = 210;
  const introCards = cards.filter((card) => card.kind === 'intro');
  const serviceCards = cards.filter((card) => card.kind === 'service');
  const activeService = serviceCards.find((card) => card.slug === activeServiceSlug) || null;
  const detailService = activeService || serviceCards[0];
  const totalTravel = introCards.length * verticalStep + 780;
  const radius = 520;
  const spiralAngleStep = 58;
  const spiralYOffset = 0;
  const rotationTravel = (spiralAngleStep * totalTravel) / verticalStep;
  const progress = 0;

  return (
    <section
      id="solution-spiral"
      className="spiral-section relative z-10"
      data-active-service={activeServiceSlug || ''}
    >
      <div id="about" className="spiral-anchor top-0" />
      <div id="services" className="spiral-anchor top-[18%]" />
      <div id="references" className="spiral-anchor top-[52%]" />
      <div id="portfolio" className="spiral-anchor top-[68%]" />
      <div id="prozess-spiral" className="spiral-anchor top-[82%]" />

      <div className="spiral-sticky">
        <div className="spiral-stage">
          {INTRO_SEQUENCE.map((text, worldIndex) => (
            <div
              key={`intro-flap-${worldIndex}`}
              ref={(el) => { introFlapWorldRefs.current[worldIndex] = el; }}
              className="intro-flap-world"
            >
              <div className="intro-flap-composition">
                <div
                  ref={(el) => { introFlapSmallRefs.current[worldIndex] = el; }}
                  className={`intro-flap-word intro-flap-word--small ${chakraPetch.className}`}
                />
                <div
                  ref={(el) => { introFlapBigRefs.current[worldIndex] = el; }}
                  className={`intro-flap-word intro-flap-word--big ${chakraPetch.className}`}
                />
              </div>
            </div>
          ))}
          {introCards.map((card, i) => {
            const angle = i * spiralAngleStep - progress * rotationTravel;
            const rad = (angle * Math.PI) / 180;
            const y = i * verticalStep - progress * totalTravel + spiralYOffset;
            const front = Math.cos(rad);
            const visible = Math.max(0, 1 - Math.abs(y) / 690);
            const frontFocus = Math.max(0, (front + 0.18) / 1.18);
            const scale = 1;
            const isIntro = card.kind === 'intro';
            const isService = card.kind === 'service';
            const opacity = Math.max(0, Math.min(1, visible * frontFocus));
            const width = isIntro ? 560 : isService ? 470 : 380;
            const Icon = card.icon;
            const accent = card.accent || '#c89a3d';
            const transform = `translate3d(-50%, -50%, 0) rotateY(${angle}deg) translateZ(${radius}px) translate3d(0, ${y}px, 0) scale(${scale})`;
            const content = isIntro ? (
              <div className="spiral-intro-statement">
                <span className="spiral-intro-meta">
                  <span className="spiral-intro-index">{String(i + 1).padStart(2, '0')}</span>
                  <span className="spiral-intro-icon">
                    {Icon ? <Icon size={15} strokeWidth={1.8} /> : null}
                  </span>
                </span>
                <h3 className="spiral-intro-title">{card.title}</h3>
                <span className="spiral-intro-rule" />
              </div>
            ) : isService ? (
              <div className="spiral-service-card">
                <span className="spiral-intro-meta">
                  <span className="spiral-intro-index">{card.code}</span>
                  <span className="spiral-intro-icon">
                    {Icon ? <Icon size={15} strokeWidth={1.8} /> : null}
                  </span>
                </span>
                <h3 className="spiral-service-title">{card.title}</h3>
                <p className="spiral-service-body">{card.body}</p>
                <span className="spiral-intro-rule" />
              </div>
            ) : (
              <>
                <div className="mb-5 flex items-center gap-3">
                  <div className="neural-node" style={{ color: accent, borderColor: `${accent}88` }}>
                    {Icon ? <Icon size={18} /> : null}
                  </div>
                  <div className="neural-thread" style={{ background: `linear-gradient(90deg, ${accent}aa, transparent)` }} />
                  <span className="neural-code" style={{ color: accent }}>{card.code}</span>
                </div>
                <h3 className={card.kind === 'small' ? 'spiral-card-title text-2xl' : 'spiral-card-title'}>
                  {card.title}
                </h3>
                <p className="spiral-card-body">{card.body}</p>
                {card.action ? (
                  <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#e7c56a]">
                    {card.action}
                    <ChevronRight size={14} />
                  </div>
                ) : null}
              </>
            );

            return card.href ? (
              <a
                key={`${card.code}-${i}`}
                href={card.href}
                data-spiral-item
                data-kind={card.kind}
                className={`spiral-card neural-panel ${card.kind === 'wide' ? 'spiral-card-wide' : ''}`}
                style={{ transform, opacity, width, zIndex: Math.round(1000 + front * 120 + visible * 240) }}
              >
                <div className="spiral-card-float">
                  {content}
                </div>
              </a>
            ) : (
              <div
                key={`${card.code}-${i}`}
                data-spiral-item
                data-kind={card.kind}
                className={isIntro ? 'spiral-intro-line' : isService ? 'spiral-service-line' : `spiral-card neural-panel ${card.kind === 'wide' ? 'spiral-card-wide' : ''}`}
                style={{
                  transform,
                  opacity,
                  width,
                  zIndex: Math.round(1000 + front * 120 + visible * 240),
                } as CSSProperties}
              >
                <div className="spiral-card-float">
                  {content}
                </div>
              </div>
            );
          })}
        </div>

        <div ref={cardsWorldRef} className="spiral-cards-world">
        <div
          ref={serviceStationsRef}
          className={`spiral-service-stations ${activeService ? 'is-detail-open' : ''}`}
          aria-label={lang === 'de' ? 'Service Leistungen' : 'Services'}
        >
          <h2
            ref={solutionsFlapRef}
            className={`spiral-solutions-flap intro-flap-word ${chakraPetch.className}`}
            aria-label={lang === 'de' ? 'Lösungen' : 'Solutions'}
          />
          {serviceCards.map((card, i) => {
            return (
              <button
                key={`${card.code}-service-${i}`}
                type="button"
                data-service-card
                data-service-slug={card.slug}
                className="spiral-service-card ngp-panel"
                aria-label={`${card.title}: ${lang === 'de' ? 'Details öffnen' : 'Open details'}`}
                style={{
                  '--service-accent': card.accent,
                  '--service-accent-rgb': card.accentRgb,
                } as CSSProperties}
                onPointerUp={(event) => {
                  if (event.pointerType !== 'mouse' || event.button === 0) {
                    setActiveServiceSlug(card.slug || null);
                  }
                }}
                onClick={(event) => {
                  if (event.detail === 0) setActiveServiceSlug(card.slug || null);
                }}
              >
                <span className="ngp-core">
                  <span className="spiral-intro-meta">
                    <span className="spiral-intro-index">{card.code}</span>
                    <span className="spiral-intro-icon">
                      <NeuralNodeIcon variant={i} />
                    </span>
                  </span>
                  <h3 className="spiral-service-title">{card.title}</h3>
                  <p className="spiral-service-body">{card.body}</p>
                  <span className="spiral-intro-rule" />
                </span>
                <span
                  className="spiral-service-more"
                  title={lang === 'de' ? 'Details öffnen' : 'Open details'}
                  aria-hidden="true"
                >
                  <Maximize2 size={16} strokeWidth={2.1} />
                </span>
              </button>
            );
          })}
          <span
            className="spiral-detail-fiber-spine"
            aria-hidden="true"
            style={{
              '--service-accent': detailService.accent,
              '--service-accent-rgb': detailService.accentRgb,
            } as CSSProperties}
          >
            <DetailFiberSpine />
          </span>
          <button
            type="button"
            className={`spiral-detail-panel ${activeService ? 'is-open' : ''}`}
            aria-hidden={!activeService}
            aria-label={lang === 'de' ? 'Detailansicht schliessen' : 'Close detail view'}
            tabIndex={activeService ? 0 : -1}
            onPointerUp={(event) => {
              if (activeService && (event.pointerType !== 'mouse' || event.button === 0)) {
                setActiveServiceSlug(null);
              }
            }}
            onClick={(event) => {
              if (activeService && event.detail === 0) setActiveServiceSlug(null);
            }}
            style={{
              '--service-accent': detailService.accent,
              '--service-accent-rgb': detailService.accentRgb,
            } as CSSProperties}
          >
            <span
              className="spiral-detail-close"
              title={lang === 'de' ? 'Schliessen' : 'Close'}
              aria-hidden="true"
            >
              <X size={19} strokeWidth={2.2} />
            </span>
            <span className="spiral-intro-meta">
              <span className="spiral-intro-index">{detailService.code}</span>
              <span className="spiral-intro-icon">
                {detailService.icon ? <detailService.icon size={15} strokeWidth={1.8} /> : null}
              </span>
            </span>
            <span className="spiral-detail-title">{detailService.detailTitle}</span>
            <span className="spiral-detail-text">{detailService.detailText}</span>
            <span className="spiral-detail-list">
              {detailService.detailPoints?.map((point) => (
                <span key={point}>{point}</span>
              ))}
            </span>
          </button>
        </div>
        </div>
      </div>

      <div className="spiral-mobile px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {introCards.map((card, i) => {
            if (card.kind === 'intro') {
              const MobileIcon = card.icon;
              return (
                <div key={`${card.code}-mobile-${i}`} className="spiral-intro-statement py-5">
                  <span className="spiral-intro-meta">
                    <span className="spiral-intro-index">{String(i + 1).padStart(2, '0')}</span>
                    <span className="spiral-intro-icon">
                      {MobileIcon ? <MobileIcon size={15} strokeWidth={1.8} /> : null}
                    </span>
                  </span>
                  <h3
                    ref={(el) => { mobileIntroFlapRefs.current[i] = el; }}
                    className={`mobile-intro-flap intro-flap-word text-2xl font-bold text-white leading-tight tracking-[-0.035em] drop-shadow ${chakraPetch.className}`}
                  >
                    {card.title}
                  </h3>
                  <span className="spiral-intro-rule" />
                </div>
              );
            }
            const Icon = card.icon;
            const content = (
              <>
                <div className="mb-4 flex items-center gap-3">
                  <div className="neural-node">
                    <Icon size={18} />
                  </div>
                  <div className="neural-thread" />
                  <span className="neural-code">{card.code}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 leading-tight">{card.title}</h3>
                <p className="text-sm text-[#b9aa8f] leading-relaxed">{card.body}</p>
              </>
            );
            return card.href ? (
              <a key={`${card.code}-mobile-${i}`} href={card.href} className="neural-panel min-h-[180px] p-5">
                {content}
              </a>
            ) : (
              <div key={`${card.code}-mobile-${i}`} className="neural-panel min-h-[180px] p-5">
                {content}
              </div>
            );
          })}
          <div className="spiral-mobile-services">
            {serviceCards.map((card, i) => {
              return (
                <div
                  key={`${card.code}-mobile-service-${i}`}
                  className="spiral-service-card ngp-panel ngp-panel-static is-materialized"
                  style={{
                    '--service-accent': card.accent,
                    '--service-accent-rgb': card.accentRgb,
                  } as CSSProperties}
                >
                  <span className="ngp-core">
                    <span className="spiral-intro-meta">
                      <span className="spiral-intro-index">{card.code}</span>
                      <span className="spiral-intro-icon">
                        <NeuralNodeIcon variant={i} />
                      </span>
                    </span>
                    <h3 className="spiral-service-title">{card.title}</h3>
                    <p className="spiral-service-body">{card.body}</p>
                    <span className="spiral-intro-rule" />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function HomePage() {
  const { lang } = useLanguage();
  const t = T[lang];
  // Auf schmalen Bildschirmen (<900px, dieselbe Schwelle wie
  // getEffectiveViewport()) wird die komplette Hero-Komposition (Gehirne +
  // Überschrift + Buttons) exakt wie am Desktop aufgebaut und danach
  // gleichmässig auf die echte Fensterbreite herunterskaliert, statt Text
  // und Buttons responsiv umzubrechen — dieselben Grössenverhältnisse wie
  // am Desktop bleiben dadurch überall erhalten.
  const [heroScale, setHeroScale] = useState(1);
  const heroFlapLineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const heroBottomFlapLineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  useEffect(() => {
    const updateHeroScale = () => {
      setHeroScale(getEffectiveViewport(window.innerWidth, window.innerHeight).scale);
    };
    updateHeroScale();
    window.addEventListener('resize', updateHeroScale);
    return () => window.removeEventListener('resize', updateHeroScale);
  }, []);
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lines = lang === 'de'
      ? ['DIGITALE LÖSUNGEN.', 'FÜR UNTERNEHMEN MIT ZUKUNFT.']
      : ['DIGITAL SOLUTIONS BUILT', 'AS ONE SYSTEM.'];
    const letters = lines.flatMap((line, index) => {
      const container = heroFlapLineRefs.current[index];
      return container ? buildFlapWord(container, line) : [];
    });
    if (!letters.length || reduced) return;

    let settleTimer = 0;
    const replay = () => {
      window.clearTimeout(settleTimer);
      setFlapWordMode(letters, 'spin', false);
      settleTimer = window.setTimeout(() => {
        setFlapWordMode(letters, 'settle', false);
      }, 720);
    };

    replay();
    const replayInterval = window.setInterval(replay, 5000);
    return () => {
      window.clearTimeout(settleTimer);
      window.clearInterval(replayInterval);
      setFlapWordMode(letters, 'settle', false);
    };
  }, [lang]);
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lines = lang === 'de'
      ? [
          'WEBSITES, SOFTWARE, KI UND AUTOMATISIERUNGEN.',
          'STRATEGISCH GEPLANT, TECHNISCH SAUBER UMGESETZT',
          'UND AUF NACHHALTIGES WACHSTUM AUSGERICHTET.',
        ]
      : [
          'WEBSITES, SYSTEMS, DATABASES, AUTOMATION AND AI —',
          'CLEARLY PLANNED, FAST TO BUILD',
          'AND MADE TO LAST.',
        ];
    const letters = lines.flatMap((line, index) => {
      const container = heroBottomFlapLineRefs.current[index];
      return container ? buildFlapWord(container, line) : [];
    });
    if (!letters.length || reduced) return;

    let settleTimer = 0;
    const replay = () => {
      window.clearTimeout(settleTimer);
      setFlapWordMode(letters, 'spin', false);
      settleTimer = window.setTimeout(() => {
        setFlapWordMode(letters, 'settle', false);
      }, 860);
    };

    replay();
    const replayInterval = window.setInterval(replay, 10000);
    return () => {
      window.clearTimeout(settleTimer);
      window.clearInterval(replayInterval);
      setFlapWordMode(letters, 'settle', false);
    };
  }, [lang]);
  const introWorldTexts = useMemo(() => INTRO_SEQUENCE, []);
  const serviceWorldCards = useMemo(() => lang === 'de'
    ? [
        { code: '01', title: 'Corporate Design\n& Webauftritt', body: 'Marke, Gestaltung, Wirkung und digitale Präsentation sauber aus einem System gedacht.', accent: '#c89a3d' },
        { code: '02', title: '2D-/3D-Websites\n& Applikationen', body: 'Moderne Websites und Web-Apps, die hochwertig aussehen und technisch belastbar sind.', accent: '#4d7fbf' },
        { code: '03', title: 'CRM, ERP\n& Datenbanken', body: 'Individuelle Systeme, exakt auf Abläufe, Teams, Daten und Wachstum abgestimmt.', accent: '#a6425c' },
        { code: '04', title: 'KI-Automation\n& Prozesse', body: 'Sinnvolle KI-Lösungen, die Arbeit vereinfachen, Prozesse beschleunigen und Qualität sichern.', accent: '#8ebef2' },
      ]
    : [
        { code: '01', title: 'Corporate design\n& web presence', body: 'Brand, design, impact and digital presentation built as one coherent system.', accent: '#c89a3d' },
        { code: '02', title: '2D/3D websites\n& applications', body: 'Modern websites and web apps that look premium and hold up technically.', accent: '#4d7fbf' },
        { code: '03', title: 'CRM, ERP\n& databases', body: 'Custom systems aligned to workflows, teams, data and long-term growth.', accent: '#a6425c' },
        { code: '04', title: 'AI automation\n& processes', body: 'Practical AI solutions that simplify work, accelerate processes and protect quality.', accent: '#8ebef2' },
      ], [lang]);

  return (
    <div className="min-h-screen bg-[#0c0a06] text-[#f4edd8]">
      <HomeNavBar />
      <BrainBackground introTexts={introWorldTexts} serviceCards={serviceWorldCards} />

      {/* ── Hero ── */}
      <section className="home-hero relative z-10 min-h-screen overflow-hidden pt-16">
        <div
          className={heroScale !== 1 ? 'absolute left-0' : undefined}
          style={heroScale !== 1 ? {
            // Feste, NICHT skalierte Distanz zur echten (ebenfalls nicht
            // skalierten) Fixed-Navbar — sonst würde der Abstand zwischen
            // Navbar und Überschrift mitschrumpfen und die Überschrift
            // könnte hinter der Navbar verschwinden.
            top: '4rem',
            width: `${REF_WIDTH}px`,
            height: `${REF_HEIGHT}px`,
            transform: `scale(${heroScale})`,
            transformOrigin: 'top left',
          } : undefined}
        >
          <div className="hero-top-copy absolute inset-x-0 top-40 z-10">
            <div className="mx-auto max-w-7xl px-6">
              <div className="hero-copy hero-copy-centered ms-anim">
                <h1
                  className={`hero-title-flap max-w-6xl mx-auto text-5xl font-bold text-white leading-[0.96] tracking-[-0.055em] ${chakraPetch.className}`}
                  aria-label={lang === 'de' ? 'DIGITALE LÖSUNGEN. FÜR UNTERNEHMEN MIT ZUKUNFT.' : 'DIGITAL SOLUTIONS BUILT AS ONE SYSTEM.'}
                >
                  <span ref={(el) => { heroFlapLineRefs.current[0] = el; }} className="hero-flap-line">
                    {lang === 'de' ? 'DIGITALE LÖSUNGEN.' : 'DIGITAL SOLUTIONS BUILT'}
                  </span>
                  <span ref={(el) => { heroFlapLineRefs.current[1] = el; }} className="hero-flap-line">
                    {lang === 'de' ? 'FÜR UNTERNEHMEN MIT ZUKUNFT.' : 'AS ONE SYSTEM.'}
                  </span>
                </h1>
              </div>
            </div>
          </div>

          <div className="hero-bottom-copy absolute inset-x-0 bottom-0 z-10 pb-6">
            <div className="mx-auto max-w-7xl px-6">
              <div className="hero-copy hero-copy-centered ms-anim" style={{ animationDelay: '0.12s' }}>
                <p
                  className={`hero-bottom-flap max-w-lg mx-auto text-lg text-[#d8ccb3] leading-relaxed ${chakraPetch.className}`}
                  aria-label={lang === 'de'
                    ? 'WEBSITES, SOFTWARE, KI UND AUTOMATISIERUNGEN. STRATEGISCH GEPLANT, TECHNISCH SAUBER UMGESETZT UND AUF NACHHALTIGES WACHSTUM AUSGERICHTET.'
                    : 'WEBSITES, SYSTEMS, DATABASES, AUTOMATION AND AI — CLEARLY PLANNED, FAST TO BUILD AND MADE TO LAST.'}
                >
                  <span ref={(el) => { heroBottomFlapLineRefs.current[0] = el; }} className="hero-bottom-flap-line">
                    {lang === 'de' ? 'WEBSITES, SOFTWARE, KI UND AUTOMATISIERUNGEN.' : 'WEBSITES, SYSTEMS, DATABASES, AUTOMATION AND AI —'}
                  </span>
                  <span ref={(el) => { heroBottomFlapLineRefs.current[1] = el; }} className="hero-bottom-flap-line">
                    {lang === 'de' ? 'STRATEGISCH GEPLANT, TECHNISCH SAUBER UMGESETZT' : 'CLEARLY PLANNED, FAST TO BUILD'}
                  </span>
                  <span ref={(el) => { heroBottomFlapLineRefs.current[2] = el; }} className="hero-bottom-flap-line">
                    {lang === 'de' ? 'UND AUF NACHHALTIGES WACHSTUM AUSGERICHTET.' : 'AND MADE TO LAST.'}
                  </span>
                </p>
              </div>
              <div style={{ animationDelay: '0.18s' }} className="ms-anim mt-7 flex justify-center">
                <a
                  href="#solution-spiral"
                  className={`group flex flex-col items-center gap-1 text-[#e7c56a] transition-colors hover:text-[#f6e3a1] ${chakraPetch.className}`}
                  aria-label={lang === 'de' ? 'Nach unten scrollen' : 'Scroll down'}
                >
                  <span className="hero-scroll-label text-xs font-bold tracking-[0.22em]">{lang === 'de' ? 'SCROLLEN' : 'SCROLL'}</span>
                  <ChevronDown size={28} strokeWidth={1.8} className="hero-scroll-chevron transition-transform duration-300 group-hover:translate-y-1" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SpiralShowcase t={t} lang={lang} />

      {/* ── Footer ── */}
      <footer className="border-t border-[#2d2820] bg-[#100d09] py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-[#7a6d5a]">{t.footer.copy}</span>
          <div className="flex items-center gap-6">
            <a href="/impressum"  className="text-sm text-[#7a6d5a] hover:text-[#d4c4a8] transition-colors">{t.footer.imprint}</a>
            <a href="/datenschutz" className="text-sm text-[#7a6d5a] hover:text-[#d4c4a8] transition-colors">{t.footer.privacy}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
