# AILA — verbindliche Modell-Spezifikation v3

Diese Version übernimmt die Identität aus `aila-human-ai-fusion-v6.png` und ersetzt `model-sheet-v2` als verbindliche Referenz. Gegenüber v2 wurde ausschließlich die Handgeometrie präzisiert.

## Kling-Referenzen

- `aila-reference-front.png`: primäre Identität und frontale Ruhehaltung
- `aila-reference-three-quarter.png`: Volumen, Material und Handtiefe
- `aila-reference-profile.png`: Seitenform und räumlicher Aufbau
- `aila-reference-attention.png`: offene Begrüßungs- und CTA-Haltung
- `aila-model-sheet-v3.png`: gemeinsame Übersicht

## Unveränderliche Identität

- Weich asymmetrische schwebende Kugel-/Kieselform ohne Hals, Rumpf oder Beine
- Warme graphit-anthrazitfarbene Hülle mit feiner Mikrolederstruktur
- Große nahtlose Gesichtsfläche im selben Graphitton
- Charakteristische asymmetrische Einfassung in Bronze/Champagnergold
- Kleine warme Sichelaugen mit nach innen gerichteter unterer Einkerbung
- In die verbreiterte untere Einfassung integrierter Lichtmund
- Zwei verflochtene goldene Energiestränge im Mund als Mensch-KI-Verbindung
- Fingerabdruckstruktur auf derselben Seite wie in der Ursprungsreferenz
- Reduziertes KI-/Neuronennetz auf der gegenüberliegenden Seite
- Sehr zurückhaltende Lichtpunkte mit feiner Umlaufbahn, niemals als Halo

## Verbindliche Handform

- Zwei kleine, abgelöste, vollständig dreidimensionale Hände
- Kompakte längliche Ellipsoide mit sichtbar gewölbter Tiefe, ähnlich der Form eines Rugbyballs
- Keine flachen Scheiben, Münzen, Schilder oder kreisförmigen Platten
- Graphit-anthrazitfarbene Mikrolederoberfläche wie AILAs Hülle
- Menschliche Seite: erhabene Fingerabdruckrillen umschließen die gesamte gekrümmte Oberfläche
- KI-Seite: Leiterbahnen, neuronale Pfade, Knoten und AI-Artefakte umschließen die gesamte gekrümmte Oberfläche
- Muster folgen der 3D-Wölbung und sind keine aufgeklebten Symbole
- Seiten und Muster niemals spiegeln oder vertauschen

## Ausschlüsse

- Kein Redesign in Schwarz, keine Kapuze und keine symmetrische Tropfenmaske
- Kein Stirnsymbol, Kopfschmuck, Mandala, Halo oder religiöser Eindruck
- Keine Pupillen, menschlichen Augen, Nase, Ohren, Augenbrauen, Zähne oder Haut
- Kein Alien-, Baby-, Spielzeug-, Chibi-, Fantasy- oder bedrohlicher Robotercharakter
- Keine menschlichen Finger, Arme, zusätzlichen Gliedmaßen oder zusätzlichen Hände

## Verwendung

In Kling alle vier Einzelbilder als ein gemeinsames AILA-Element verwenden. Die Frontansicht definiert Gesicht und Handzuordnung, die Dreiviertelansicht die Hauptidentität und Handtiefe, das Profil die räumliche Konstruktion und die Aufmerksamkeitshaltung die CTA-Geste.

## Greenscreen-Ausgabe

Der Ordner `greenscreen/` enthält dieselben vier Ansichten vor einem gleichmäßigen Chroma-Grün. Für eine Website-Animation mit der vorhandenen WebGL-Freistellung gilt:

- `greenscreen/aila-reference-front-greenscreen.png` als Startbild verwenden
- Die schwarzen Referenzen weiterhin für die reine Charakteridentität im AILA-Element verwenden
- Im Videoprompt einen vollständig gleichmäßigen Chroma-Hintergrund ohne Schatten, Verlauf, Reflexionen oder grünes Streulicht verlangen
- Ein schwarzes Startbild nicht für die finale freizustellende Animation verwenden, da AILAs dunkle Hülle bei einer Schwarzfreistellung beschädigt würde
