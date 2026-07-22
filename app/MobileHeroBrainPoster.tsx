import brainData from './brainData.json';

const POSTER_WALKS = (brainData.walks as number[][]).filter((_, index) => index % 5 === 0);

function projectWalk(walk: number[]) {
  let path = '';
  for (let index = 0; index < walk.length - 2; index += 3) {
    // Die Live-Szene dreht das Modell um ungefähr 90° auf der Y-Achse.
    // Z/Y entspricht deshalb ihrer frontalen Hero-Ansicht, nicht der
    // seitlichen Rohansicht der JSON-Geometrie.
    const x = walk[index + 2].toFixed(4);
    const y = walk[index + 1].toFixed(4);
    path += `${index === 0 ? 'M' : 'L'}${x} ${y}`;
  }
  return path;
}

export default function MobileHeroBrainPoster() {
  return (
    <div className="mobile-hero-brain-poster" aria-hidden="true">
      <svg viewBox="0 0 390 720" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="mobile-poster-gold-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="0.012" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <g id="mobile-poster-brain-wire">
            {POSTER_WALKS.map((walk, index) => (
              <path key={index} d={projectWalk(walk)} />
            ))}
          </g>
        </defs>

        <g className="mobile-poster-brain mobile-poster-brain--red" transform="translate(-5 220) scale(72 -72)">
          <use href="#mobile-poster-brain-wire" />
        </g>
        <g className="mobile-poster-brain mobile-poster-brain--blue" transform="translate(395 214) scale(72 -72)">
          <use href="#mobile-poster-brain-wire" />
        </g>
        <g className="mobile-poster-brain mobile-poster-brain--gold" transform="translate(195 190) scale(135 -135)">
          <use href="#mobile-poster-brain-wire" />
        </g>
      </svg>
    </div>
  );
}
