'use client';
// @ts-nocheck
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import brainData from './brainData.json';
import { HELIX_STEP, TEXT_START_Y, CAMERA_TARGET_START, computeCameraTravel, helixAngleForWorldIndex } from './lib/helixGeometry';

type BrainBackgroundProps = {
  introTexts?: string[];
  serviceCards?: Array<{ code: string; title: string; body: string; accent: string }>;
};

export default function BrainBackground({ introTexts = [], serviceCards = [] }: BrainBackgroundProps) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var isMobile = innerWidth < 700;
    // Timing und Verlauf der Kameraschiene bleiben identisch. Auf schmalen
    // Viewports erweitert sich nur der Bildausschnitt, damit alle Gehirne
    // im gleichen Größenverhältnis wie auf dem Desktop sichtbar bleiben.
    var MOBILE_RADIUS_SCALE = isMobile ? 1.9 : 1;
    var MOBILE_BRAIN_Y_OFFSET = isMobile ? 1.65 : 0;
    var renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.58;
    var scene = new THREE.Scene();
    // Tiefschwarzer, endloser Raum: die Szene selbst ist opak schwarz statt
    // transparent (verlässt sich nicht mehr auf die CSS-Seitenfarbe dahinter),
    // und Nebel lässt weit entfernte Partikel weich ins Schwarz ausblenden statt
    // hart an der Sichtweite abzuschneiden.
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.Fog(0x000000, 18, 78);
    var camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 200);
    camera.position.set(0, 0.4, 9.2);
    camera.lookAt(0, -0.1, 0);
    if (typeof window !== 'undefined') { window.__debugScene = scene; window.__debugCamera = camera; window.__debugTHREE = THREE; }

  function softSprite(){
    var cv=document.createElement('canvas'); cv.width=cv.height=64;
    var g=cv.getContext('2d');
    var gr=g.createRadialGradient(32,32,0,32,32,32);
    gr.addColorStop(0,'rgba(255,255,255,1)');
    gr.addColorStop(.35,'rgba(255,255,255,.45)');
    gr.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle=gr; g.fillRect(0,0,64,64);
    return new THREE.CanvasTexture(cv);
  }
  var sprite=softSprite();

  var world=new THREE.Group(); scene.add(world);
  var DESKTOP_HERO_BRAIN_LIFT=isMobile?0:.72;
  var BRAIN_BASE_Y=-.5+MOBILE_BRAIN_Y_OFFSET+DESKTOP_HERO_BRAIN_LIFT;
  var brain=new THREE.Group(); brain.position.y=BRAIN_BASE_Y; brain.scale.setScalar(3.2775); world.add(brain);
  var introTextGroup=new THREE.Group(); world.add(introTextGroup);
  var introSprites=[];
  var floatingObjects=[];
  // HELIX_STEP/TEXT_START_Y kommen jetzt aus der gemeinsamen Geometrie-Datei
  // (app/lib/helixGeometry.ts) statt hier lokal dupliziert zu sein — dieselbe
  // Quelle wird auch von der Kartengruppe in page.tsx verwendet.
  var totalWorldStops=introTexts.length+serviceCards.length+4;
  var cameraTargetStart=CAMERA_TARGET_START;
  var cameraTravel=computeCameraTravel(totalWorldStops);
  var cameraTargetEnd=cameraTargetStart-cameraTravel;
  // Die bestehende Helix endet exakt an der gemeinsamen 2x2-Kartengruppe.
  // Ab dieser Station bleibt der Orbitwinkel unverändert; die Kamera fährt
  // ausschliesslich auf derselben radialen Achse rückwärts über das Flussdelta.
  var cardGroupWorldY=TEXT_START_Y-introTexts.length*HELIX_STEP;
  var cameraHelixExitStart=THREE.MathUtils.clamp(
    (cameraTargetStart-cardGroupWorldY)/cameraTravel,
    0,
    .92
  );
  var cameraExitPullback=isMobile?11.4:16.4;
  // Die bisherige Mehrwert-Totalen wird vor dem neuen Schlussanflug bereits
  // vollständig erreicht und kurz gehalten. Der restliche Scrollweg gehört
  // ausschliesslich dem diagonalen Flug zum grünen Satellitengehirn.
  var CAMERA_OVERVIEW_ARRIVAL=.82;
  var CAMERA_BRAIN_APPROACH_START=.88;
  var SCENE_MOTION=false;
  var OBJECT_FLOATING=true;
  // Feine, entlang des echten Knotennetzes laufende Nervenimpulse.
  // Die separaten, flächigen Doppelimpulse bleiben davon unberührt.
  var NEURAL_INFORMATION_ACTIVE=true;
  var NEURAL_IMPULSE_INTENSITY=10;
  var lastCameraFov=camera.fov;

  function helixAngle(worldIndex){
    return helixAngleForWorldIndex(worldIndex,cameraTravel);
  }

  function cameraRailSlowdown(progress){
    // Die Textstationen sollen die Fahrt nur minimal entschleunigen. Die
    // Kamera rollt durchgehend weiter und darf nicht mehr an jeder Station
    // wie eine klassische Scroll-Snap-Animation abbremsen.
    var focusWindow=.028, slowdown=1;
    for(var stopIndex=0;stopIndex<totalWorldStops;stopIndex++){
      var stopY=TEXT_START_Y-stopIndex*HELIX_STEP;
      var stopProgress=(cameraTargetStart-stopY)/cameraTravel;
      var distance=Math.abs(progress-stopProgress);
      if(distance>=focusWindow) continue;
      var proximity=1-distance/focusWindow;
      slowdown=Math.min(slowdown,.82+.18*(1-proximity)*(1-proximity));
    }
    return slowdown;
  }

  function createIntroTextMaterial(texture){
    var uniforms={
      map:{value:texture},
      uOpacity:{value:1},
      uBlur:{value:0},
      uBrightness:{value:1}
    };
    return new THREE.ShaderMaterial({
      uniforms:uniforms,
      transparent:true,
      depthWrite:false,
      depthTest:false,
      side:THREE.FrontSide,
      toneMapped:false,
      vertexShader:[
        'varying vec2 vUv;',
        'void main(){',
        '  vUv=uv;',
        '  gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);',
        '}'
      ].join('\n'),
      fragmentShader:[
        'uniform sampler2D map;',
        'uniform float uOpacity;',
        'uniform float uBlur;',
        'uniform float uBrightness;',
        'varying vec2 vUv;',
        'void main(){',
        '  vec2 x=vec2(uBlur,0.0);',
        '  vec2 y=vec2(0.0,uBlur);',
        '  vec4 color=texture2D(map,vUv)*0.28;',
        '  color+=texture2D(map,vUv+x)*0.12;',
        '  color+=texture2D(map,vUv-x)*0.12;',
        '  color+=texture2D(map,vUv+y)*0.12;',
        '  color+=texture2D(map,vUv-y)*0.12;',
        '  color+=texture2D(map,vUv+x+y)*0.06;',
        '  color+=texture2D(map,vUv+x-y)*0.06;',
        '  color+=texture2D(map,vUv-x+y)*0.06;',
        '  color+=texture2D(map,vUv-x-y)*0.06;',
        '  color.rgb*=uBrightness;',
        '  gl_FragColor=vec4(color.rgb,color.a*uOpacity);',
        '}'
      ].join('\n')
    });
  }

  function buildIntroSprite(label,index){
    var textCanvas=document.createElement('canvas');
    textCanvas.width=1536; textCanvas.height=512;
    var context=textCanvas.getContext('2d');
    if(!context) return;
    var textLines=label.split('\n');
    context.clearRect(0,0,textCanvas.width,textCanvas.height);
    context.fillStyle='rgba(231,197,106,.92)';
    context.font='700 30px Arial, sans-serif';
    context.letterSpacing='10px';
    context.fillText(('0'+(index+1)).slice(-2),80,74);
    context.fillStyle='rgba(255,255,255,.98)';
    context.font='900 102px Arial, sans-serif';
    context.shadowColor='rgba(231,197,106,.32)';
    context.shadowBlur=24;
    var lineOffsets=[[0,78,24],[94,8,116],[28,112,4],[86,0,62],[10,96,38]][index%5];
    textLines.forEach(function(line,lineIndex){
      context.fillText(line,80+(lineOffsets[lineIndex]||0),190+lineIndex*112);
    });
    context.shadowBlur=0;
    var texture=new THREE.CanvasTexture(textCanvas);
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.minFilter=THREE.LinearFilter;
    // depthTest:false + ein renderOrder oberhalb aller Stränge (Gold ohne
    // eigenen renderOrder ≈0, Satelliten-Stränge renderOrder 4/5) stellt
    // sicher, dass die Überschrift immer VOR den Nervensträngen gezeichnet
    // wird und nie durch Faserlinien verdeckt wird — unabhängig vom
    // Blickwinkel/Scroll-Fortschritt, ohne Strang-Animation, -Farben oder
    // -Position zu verändern.
    var material=createIntroTextMaterial(texture);
    var textSprite=new THREE.Mesh(new THREE.PlaneGeometry(isMobile?3.77:5.65,isMobile?1.25:1.88),material);
    textSprite.renderOrder=20;
    var textAngle=helixAngle(index);
    var textRadius=2.65;
    textSprite.position.set(Math.sin(textAngle)*textRadius,TEXT_START_Y-index*HELIX_STEP,Math.cos(textAngle)*textRadius);
    textSprite.rotation.y=textAngle;
    textSprite.userData={baseX:textSprite.position.x,baseY:textSprite.position.y,baseZ:textSprite.position.z,baseRotY:textAngle,phase:index*1.37,textUniforms:material.uniforms};
    introTextGroup.add(textSprite);
    introSprites.push(textSprite);
  }

  // Alle 5 Intro-Stationen ("Deine Idee.", "Deine Herausforderung.", "Deine
  // Vision.", "Deine Lösung.", "Deine Erfolgsgeschichte.") werden hier
  // bewusst übersprungen: sie werden stattdessen als DOM-Overlay mit
  // Chakra-Petch-Split-Flap-Effekt gerendert (IntroFlapWorld in page.tsx) —
  // exakt dieselbe Helix-Position/Kamerafahrt, nur andere Darstellung.
  // Kein buildIntroSprite()-Aufruf mehr nötig.

  function buildServiceCard(card,index,worldIndex){
    var cardCanvas=document.createElement('canvas');
    cardCanvas.width=1536; cardCanvas.height=864;
    var context=cardCanvas.getContext('2d');
    if(!context) return;
    var cardGradient=context.createLinearGradient(0,0,1536,864);
    cardGradient.addColorStop(0,'rgba(26,28,32,.94)');
    cardGradient.addColorStop(1,'rgba(15,16,18,.8)');
    context.fillStyle=cardGradient;
    context.fillRect(0,0,1536,864);
    context.strokeStyle=card.accent+'99';
    context.lineWidth=4;
    context.strokeRect(4,4,1528,856);
    var glow=context.createRadialGradient(220,130,0,220,130,460);
    glow.addColorStop(0,card.accent+'44');
    glow.addColorStop(1,'rgba(0,0,0,0)');
    context.fillStyle=glow;
    context.fillRect(0,0,1536,864);
    context.fillStyle=card.accent;
    context.font='700 30px Arial, sans-serif';
    context.fillText(card.code,96,100);
    context.fillStyle='rgba(255,255,255,.98)';
    context.font='900 82px Arial, sans-serif';
    card.title.split('\n').forEach(function(line,lineIndex){ context.fillText(line,96,240+lineIndex*94); });
    context.fillStyle='rgba(245,236,214,.82)';
    context.font='500 36px Arial, sans-serif';
    var words=card.body.split(' '), line='', lineY=550;
    words.forEach(function(word){
      var candidate=line?line+' '+word:word;
      if(context.measureText(candidate).width>1280){ context.fillText(line,96,lineY); line=word; lineY+=52; }
      else line=candidate;
    });
    if(line) context.fillText(line,96,lineY);
    context.fillStyle=card.accent;
    context.fillRect(96,760,430,4);
    var texture=new THREE.CanvasTexture(cardCanvas);
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.minFilter=THREE.LinearFilter;
    var material=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,depthTest:true,opacity:.98,side:THREE.FrontSide,toneMapped:false});
    var cardMesh=new THREE.Mesh(new THREE.PlaneGeometry(isMobile?3.23:4.85,isMobile?1.82:2.73),material);
    var cardAngle=helixAngle(worldIndex);
    cardMesh.position.set(Math.sin(cardAngle)*1.68,-2.2-index*4.2,Math.cos(cardAngle)*1.68);
    cardMesh.position.y=TEXT_START_Y-worldIndex*HELIX_STEP;
    cardMesh.rotation.y=cardAngle;
    cardMesh.userData={baseX:cardMesh.position.x,baseY:cardMesh.position.y,baseZ:cardMesh.position.z,baseRotY:cardAngle,phase:worldIndex*1.37+.52};
    introTextGroup.add(cardMesh);
    floatingObjects.push(cardMesh);
  }

  var BASE_Y=Math.PI/2+0.15, BASE_X=0.22, MAIN_BRAIN_BASE_X=.29;
  var MAX_MAIN_BRAIN_YAW=THREE.MathUtils.degToRad(20);
  var MAIN_BRAIN_SWAY=THREE.MathUtils.degToRad(16);
  var MAIN_BRAIN_MOUSE_YAW=THREE.MathUtils.degToRad(4);
  var MAIN_BRAIN_MOUSE_PITCH=THREE.MathUtils.degToRad(3);
  var GOLD={
    primary:new THREE.Color(0xc89a3d),
    light:new THREE.Color(0xe7c56a),
    highlight:new THREE.Color(0xf6e3a1),
    medium:new THREE.Color(0xb8862b),
    deep:new THREE.Color(0x7c5a1a)
  };
  GOLD.core=GOLD.primary;
  GOLD.line=GOLD.light;
  GOLD.hot=GOLD.highlight;
  GOLD.white=GOLD.highlight;
  var SATELLITE_METALS={
    red:{ deep:new THREE.Color(0x37131d), primary:new THREE.Color(0x6a263b), light:new THREE.Color(0xd9788a) },
    blue:{ deep:new THREE.Color(0x102a4a), primary:new THREE.Color(0x244d82), light:new THREE.Color(0x8ebef2) },
    green:{ deep:new THREE.Color(0x0c3023), primary:new THREE.Color(0x176b48), light:new THREE.Color(0x75e0aa) }
  };
  // Dieselbe gewichtete Metallic-Palette treibt das gesamte Hauptgehirn und
  // den direkt daraus wachsenden Goldstrang: tiefe Schatten, ein warmer Kern
  // und seltene Glanzlichter erzeugen den seidigen Metallverlauf.
  var golds=[
    GOLD.deep,
    GOLD.medium,GOLD.medium,
    GOLD.primary,GOLD.primary,GOLD.primary,
    GOLD.light,GOLD.light,
    GOLD.highlight
  ];
  var cc=new THREE.Color();
  var keyLightDirection=new THREE.Vector3(-.42,.64,.64).normalize();
  function neuralShade(x,y,z){
    var length=Math.max(.001,Math.sqrt(x*x+y*y+z*z));
    var light=Math.max(0,(x*keyLightDirection.x+y*keyLightDirection.y+z*keyLightDirection.z)/length);
    var rim=Math.max(0,-z/length);
    return .22+light*.68+rim*.1;
  }
  // The old blob (dense mesh seam) is now fixed at the data level via the
  // grid-density cap in gen-brain.mjs, so this only needs a very light
  // safety taper near the very tip — the neck/taper should read at roughly
  // the same brightness as the rest of the brain, not dimmed.
  function taperFade(y){
    var lo=-0.75, hi=-0.15;
    var t=(y-lo)/(hi-lo); t=t<0?0:t>1?1:t;
    return 0.72+0.28*t;
  }
  var TAPER_Y_EARLY=-0.15;
  // Der originale Datensatz enthält unterhalb des Gehirns einen separaten,
  // stark verdichteten Hirnstamm. In diesem Bereich soll ausschliesslich der
  // prozedurale Goldtrichter sichtbar sein.
  var ORIGINAL_STUMP_CUTOFF=-.62;
  var ambientStarLayers=[];

  function registerAmbientStarLayer(object,fadeStart,fadeEnd){
    if(!object||!object.material) return object;
    ambientStarLayers.push({
      object:object,
      baseOpacity:object.material.opacity,
      fadeStart:fadeStart,
      fadeEnd:fadeEnd
    });
    return object;
  }

  function pointsObj(arr,cols,size,op,blending){
    var g2=new THREE.BufferGeometry();
    g2.setAttribute('position',new THREE.Float32BufferAttribute(arr,3));
    if(cols) g2.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));
    var m2=new THREE.PointsMaterial({size:size,map:sprite,transparent:true,opacity:op,
      vertexColors:!!cols,color:cols?0xffffff:GOLD.line,blending:blending||THREE.NormalBlending,depthWrite:false});
    return new THREE.Points(g2,m2);
  }

  function addDepthLayer(count,minRadius,maxRadius,size,opacity,colorA,colorB){
    var positions=[], colors=[], layerColorA=new THREE.Color(colorA), layerColorB=new THREE.Color(colorB), layerColor=new THREE.Color();
    for(var depthIndex=0;depthIndex<count;depthIndex++){
      var angle=Math.random()*Math.PI*2;
      var radius=minRadius+Math.random()*(maxRadius-minRadius);
      var y=cameraTargetEnd-7+Math.random()*(cameraTravel+15);
      positions.push(Math.cos(angle)*radius,y,Math.sin(angle)*radius);
      layerColor.copy(layerColorA).lerp(layerColorB,Math.random());
      colors.push(layerColor.r,layerColor.g,layerColor.b);
    }
    var depthPoints=pointsObj(positions,colors,size,opacity,THREE.AdditiveBlending);
    depthPoints.frustumCulled=false;
    world.add(depthPoints);
    return depthPoints;
  }

  // Fünf feste räumliche Ebenen: Die Partikel bewegen sich nicht selbst,
  // erzeugen durch die vorbeifliegende Kamera aber permanenten Vorder- und Hintergrund-Flow.
  registerAmbientStarLayer(addDepthLayer(isMobile?24:52,1.4,3.6,.055,.16,0xe7c56a,0xf6e3a1),.02,.38);
  registerAmbientStarLayer(addDepthLayer(isMobile?34:72,3.7,6.8,.075,.11,0xc89a3d,0xf6e3a1),.07,.44);
  registerAmbientStarLayer(addDepthLayer(isMobile?42:92,6.9,10.5,.11,.075,0xb8862b,0xe7c56a),.12,.5);
  registerAmbientStarLayer(addDepthLayer(isMobile?34:76,10.6,16.5,.16,.045,0x7c5a1a,0xc89a3d),.17,.56);
  registerAmbientStarLayer(addDepthLayer(isMobile?16:36,16.6,23,.42,.02,0x7c5a1a,0xb8862b),.22,.62);

  // --- Staubfeld: tausende feine, leuchtende Partikel, frei über alle drei
  // Achsen im gesamten Raum verteilt (nicht nur in schmalen Radius-Ringen wie
  // die Tiefenebenen oben), statisch positioniert wie die Ebenen — die
  // Bewegung entsteht rein durch die vorbeifliegende Kamera. ---
  function addStardustField(count,size,opacity){
    var positions=[], colors=[], dustColors=[GOLD.core,GOLD.line,GOLD.hot,GOLD.white,GOLD.deep], tint=new THREE.Color();
    for(var dustIndex=0;dustIndex<count;dustIndex++){
      var angle=Math.random()*Math.PI*2;
      var radius=1.3+Math.random()*28;
      var y=cameraTargetEnd-9+Math.random()*(cameraTravel+18);
      positions.push(Math.cos(angle)*radius,y,Math.sin(angle)*radius);
      var flicker=.5+Math.random()*.5;
      tint.copy(dustColors[Math.floor(Math.random()*dustColors.length)]).multiplyScalar(flicker);
      colors.push(tint.r,tint.g,tint.b);
    }
    var stardust=pointsObj(positions,colors,size,opacity,THREE.AdditiveBlending);
    stardust.frustumCulled=false;
    world.add(stardust);
    return stardust;
  }
  registerAmbientStarLayer(addStardustField(isMobile?1300:4200,.09,.85),.08,.58);

  // --- Farbige Leuchtorbs: rote & blaue Partikel, dreimal so gross wie das
  // Gold-Staubfeld, in halber Stückzahl, über einen deutlich grösseren Raum
  // verteilt und ortsfest. Jede Position bekommt zusätzlich zum hellen Kern
  // eine grosse, weiche additive Glow-Hülle — das ist die einzig sinnvolle
  // Art, "umliegende Objekte in ihrem Radius zu erhellen": die Szene besteht
  // ausschliesslich aus unbeleuchteten Points-/Line-Materialien ohne
  // THREE.Light-Unterstützung, ein echtes dynamisches Licht hätte hier keine
  // sichtbare Wirkung auf irgendein Objekt. Der additive Glow überlagert die
  // goldenen Linien in seiner Nähe stattdessen optisch mit Farbe. ---
  function addColoredOrbField(count,coreSize,haloSize,coreOpacity,haloOpacity,shades,radiusMin,radiusMax,yPad){
    var positions=[], colors=[], tint=new THREE.Color();
    for(var orbIndex=0;orbIndex<count;orbIndex++){
      var angle=Math.random()*Math.PI*2;
      var radius=radiusMin+Math.random()*(radiusMax-radiusMin);
      var y=cameraTargetEnd-yPad+Math.random()*(cameraTravel+yPad*2);
      positions.push(Math.cos(angle)*radius,y,Math.sin(angle)*radius);
      var flicker=.55+Math.random()*.45;
      tint.copy(shades[Math.floor(Math.random()*shades.length)]).multiplyScalar(flicker);
      colors.push(tint.r,tint.g,tint.b);
    }
    var core=pointsObj(positions,colors,coreSize,coreOpacity,THREE.AdditiveBlending);
    core.frustumCulled=false;
    world.add(core);
    var halo=pointsObj(positions,colors,haloSize,haloOpacity,THREE.AdditiveBlending);
    halo.frustumCulled=false;
    world.add(halo);
    return [core,halo];
  }
  var BLUE_ORB_SHADES=[new THREE.Color(0x4d7fbf),new THREE.Color(0x8ebef2),new THREE.Color(0xc4e3ff),new THREE.Color(0x244d82)];
  var RED_ORB_SHADES=[new THREE.Color(0xa6425c),new THREE.Color(0xd9788a),new THREE.Color(0xf3b0b9),new THREE.Color(0x6a263b)];
  var coloredOrbCount=isMobile?325:1050;
  var blueAmbientOrbs=addColoredOrbField(coloredOrbCount,.27,1.35,.8,.13,BLUE_ORB_SHADES,2,55,14);
  var redAmbientOrbs=addColoredOrbField(coloredOrbCount,.27,1.35,.8,.13,RED_ORB_SHADES,2,55,14);
  registerAmbientStarLayer(blueAmbientOrbs[0],.18,.64);
  registerAmbientStarLayer(blueAmbientOrbs[1],.2,.66);
  registerAmbientStarLayer(redAmbientOrbs[0],.24,.68);
  registerAmbientStarLayer(redAmbientOrbs[1],.26,.7);

  // Kapitel 2 ist eine bereits existierende, statische Weltgeometrie. Sie
  // wird nicht aus der Kameraposition berechnet: die feste Ausrichtung folgt
  // der semantischen Kartenstation der gemeinsamen Helix. Die Kamera entdeckt
  // diese Landschaft lediglich auf ihrer unveränderten Schiene.
  function createSeededRandom(seed){
    var state=seed>>>0;
    return function(){
      state=(state+0x6d2b79f5)|0;
      var value=Math.imul(state^(state>>>15),1|state);
      value=value+Math.imul(value^(value>>>7),61|value)^value;
      return ((value^(value>>>14))>>>0)/4294967296;
    };
  }

  var BR=brainData;

  var __hideSet = (typeof window!=='undefined' ? new URLSearchParams(window.location.search).get('hide')||'' : '').split(',');
  function dbgHide(key,obj){ if(__hideSet.indexOf(key)!==-1) obj.visible=false; return obj; }
  var pts=[], ppos=[], pcol=[];
  var sca=BR.scatter;
  for(var i=0;i<sca.length;i+=3){
    var vx=sca[i],vy=sca[i+1],vz=sca[i+2];
    if(vy<ORIGINAL_STUMP_CUTOFF) continue;
    pts.push(new THREE.Vector3(vx,vy,vz));
    ppos.push(vx,vy,vz);
    cc.copy(golds[Math.floor(Math.random()*golds.length)]).multiplyScalar(taperFade(vy)*neuralShade(vx,vy,vz));
    pcol.push(cc.r,cc.g,cc.b);
  }
  var scatterN=pts.length;
  brain.add(dbgHide('scatter',pointsObj(ppos,pcol,.072,1)));

  var lpos=[], lcol=[], wpos=[], wcol=[], pairs=[], walkPaths=[];
  BR.walks.forEach(function(flat){
    cc.copy(golds[Math.floor(Math.random()*golds.length)]);
    var cnt=flat.length/3, base=pts.length, path=[];
    for(var k=0;k<cnt;k++){
      var x=flat[k*3],y=flat[k*3+1],z=flat[k*3+2];
      pts.push(new THREE.Vector3(x,y,z));
      wpos.push(x,y,z);
      var fw=taperFade(y)*neuralShade(x,y,z);
      wcol.push(cc.r*fw,cc.g*fw,cc.b*fw);
      path.push(new THREE.Vector3(x,y,z));
      if(k>0){
        var px=flat[(k-1)*3],py=flat[(k-1)*3+1],pz=flat[(k-1)*3+2];
        lpos.push(px,py,pz,x,y,z);
        var fa=taperFade(py)*neuralShade(px,py,pz), fb=taperFade(y)*neuralShade(x,y,z);
        lcol.push(cc.r*fa,cc.g*fa,cc.b*fa,cc.r*fb,cc.g*fb,cc.b*fb);
        pairs.push([base+k-1,base+k]);
      }
    }
    if(path.length>3) walkPaths.push(path);
  });

  // --- Nervenstrang: wächst direkt aus dem Stumpf-Ring des Gehirn-Meshes und
  // wird in dieselben Puffer (lpos/lcol/wpos/wcol) wie das Gehirn geschrieben.
  // Gehirn und Nervenstrang sind dadurch buchstäblich ein einziges
  // THREE.LineSegments- und ein einziges THREE.Points-Objekt, keine zwei
  // getrennten 3D-Objekte mehr. ---
  var SBASE_X=-0.3467, SBASE_Y=-0.8764, SBASE_Z=0.052;
  var stumpCenterLocal=new THREE.Vector3(SBASE_X,SBASE_Y,SBASE_Z);
  var stumpCenterOffset=new THREE.Vector3();
  var strandInverseRotation=new THREE.Quaternion();
  var worldVerticalInStrandLocal=new THREE.Vector3();
  var roots=[];
  for(var ri=0;ri<BR.stumpRing.length;ri+=3){
    roots.push(new THREE.Vector3(BR.stumpRing[ri],BR.stumpRing[ri+1],BR.stumpRing[ri+2]));
  }
  var SP={ length:10.35, rStr:0.08, gather:0.25, taper:0.24,
           curve:0, twist:5.2, jitter:0, ptSize:0.044, spacing:0.06,
           ringSpread:0.1, offX:0, offY:0, offZ:0,
           droop:1.5, frayStart:0.98, fraySpread:0.12 };
  // Gemeinsame Kaugummi-Verformung aller vier Faserfarben. Der obere Strang
  // bleibt fest; ab pullStart wird die verflochtene Zone zunehmend nach unten
  // gezogen. waveStart liegt bewusst erst im letzten Strangdrittel, damit die
  // frühere Wulst verschwindet und direkt am unteren Faserende neu entsteht.
  var WULST_TUNING={
    pullStart:.54,
    waveStart:.73,
    stretch:1.72,
    liquify:1.52,
    redBlueDrop:4.46
  };
  // Anteil (0..1) des Bündels, ab dem Fasern seitlich/nach vorne ausbrechen
  // dürfen. Niedrig gesetzt, damit die Verdrehung/Verwebung (der "Wulst"-
  // Look aus der Rot/Blau-Assimilation) über die gesamte sichtbare Länge
  // aktiv bleibt statt in einen ruhigen, geraden Abschnitt überzugehen.
  var BREAKOUT_START=0.12;
  // Trichter: Jede Faser startet an einem echten goldenen Vertex im Stumpf-
  // Bereich, läuft über einen organischen Fächer zu einem individuellen Punkt
  // auf dem unteren Auslassring und ordnet sich erst danach weich im Bündel.
  var FN={ count:220, anchorRadius:0.59, funnelHeight:0.19, funnelSegs:3, convergePull:0.65,
           outletRadius:0.16, outletHeightSpread:0.22, randomness:1 };
  var MP={ moveLeft:0, moveRight:0, moveForward:0, moveBack:0, moveVertical:0.01 };
  var WIND={ sway:0.04, speed:0.37, wave:0.036, waveFrequency:9 };
  var GOLD_RENDER={ intensity:1, lineOpacity:.34, pointOpacity:.36 };
  var GOLD_STRAND_TUNING={
    topThickness:1,
    bottomThickness:1,
    escapeAmount:1,
    escapeAmplitude:.47,
    escapeFrequency:1.92,
    escapeWavelength:.56,
    escapeSpeed:1,
    colorHue:0,
    colorSaturation:1,
    colorLightness:1,
    colorIntensity:1,
    topBrightness:1,
    bottomBrightness:1
  };
  // Talwerte der neuronalen Landschaft (appendReferenceNeuralLandscape),
  // per Tuning-Panel live einstellbar. Werte sind die Desktop-Basis; auf
  // Mobile skaliert LANDSCAPE_MOBILE_SCALE Breite/Tiefe/Punktdichte mit.
  var LANDSCAPE_TUNING={
    halfWidth:7.2,
    depth:4.8,
    corridorWidthFactor:.32,
    corridorSharpness:1.55,
    corridorHeight:3,
    floorDepth:1.1,
    meanderAmplitudeBase:.22,
    meanderAmplitudeRange:.68,
    meanderFrequencyBase:1.1,
    meanderFrequencyRange:2.4,
    fiberFamilyCount:3,
    trunkPoints:26,
    deltaPoints:64,
    fieldPoints:118,
    jitterXAmount:.16,
    jitterZAmount:.12,
    wallBumpAmount:.4,
    colorHue:0,
    colorSaturation:1,
    colorLightness:1,
    // Rund um den Stamm/in der Mitte des Tals sollen nur horizontale
    // Querverbindungen zwischen Nachbarfasern das Tal zeichnen, keine
    // radialen (vertikal wirkenden) Einzelfaser-Linien. horizontalZoneFraction
    // legt fest, welcher Anteil (0..1) jedes Faserpfads ab dem Stammfuss
    // horizontal-only bleibt; der Rest (Richtung Horizont) darf wieder als
    // durchgehende Faser gezeichnet werden. horizontalLinkStep steuert die
    // Dichte der horizontalen Linien (kleiner = dichter).
    horizontalZoneFraction:1,
    horizontalLinkStep:2
  };
  var LANDSCAPE_MOBILE_SCALE=.61;
  function moveX(){ return SP.offX + MP.moveRight - MP.moveLeft; }
  function moveY(){ return SP.offY + MP.moveVertical; }
  function moveZ(){ return SP.offZ + MP.moveForward - MP.moveBack; }
  function rnd(){return Math.random();}
  function smooth(x){x=x<0?0:x>1?1:x;return x*x*(3-2*x);}
  function smoother(x){
    x=x<0?0:x>1?1:x;
    return x*x*x*(x*(x*6-15)+10);
  }
  function cubicBezierValue(start,controlA,controlB,end,progress){
    var inverse=1-progress;
    return inverse*inverse*inverse*start
      +3*inverse*inverse*progress*controlA
      +3*inverse*progress*progress*controlB
      +progress*progress*progress*end;
  }
  function stretchedWavePhase(progress,startCycles,endCycles){
    var u=THREE.MathUtils.clamp(progress,0,1);
    // Integral einer kontinuierlich fallenden Smoothstep-Frequenz. Dadurch
    // wächst die lokale Wellenlänge wirklich stufenlos statt abschnittsweise.
    var inverseSmoothIntegral=u-u*u*u+.5*u*u*u*u;
    return Math.PI*2*(endCycles*u+(startCycles-endCycles)*inverseSmoothIntegral);
  }
  function wulstPullEnvelope(progress){
    return smoother((progress-WULST_TUNING.pullStart)/(1-WULST_TUNING.pullStart));
  }
  function wulstVerticalPull(progress){
    return WULST_TUNING.redBlueDrop*wulstPullEnvelope(progress);
  }
  function wulstWaveProgress(progress){
    return THREE.MathUtils.clamp(
      (progress-WULST_TUNING.waveStart)/(1-WULST_TUNING.waveStart),
      0,
      1
    );
  }
  var STRAND_ON = !(typeof window!=='undefined' && new URLSearchParams(window.location.search).get('nostrand')==='1');
  var sBase=[], sMeta=[], sFibers=[], vc=0;
  var wobbleLineRefs=[], wobblePtsRefs=[];
  var organismVertices=[], organismMeta=[], organismLineRefs=[], organismPointRefs=[];
  var organismCurrent=new Float32Array(0);
  var organismScratch=new THREE.Vector3();
  var organismStationAngle=cameraHelixExitStart*Math.PI*2;
  // Weltblickrichtung der Endkamera in den GEDREHTEN lokalen Brain-Raum
  // transformieren. Ohne diese inverse Transformation wird die Talachse durch
  // brain.rotation.y/x erneut gedreht und erscheint aus der Seitenansicht.
  var organismBrainQuaternion=new THREE.Quaternion().setFromEuler(
    new THREE.Euler(MAIN_BRAIN_BASE_X,BASE_Y,0)
  ).invert();
  // Exakte Endkamera-Basis statt empirischer Winkelkorrekturen: Der Strang
  // steht am Horizont, die Landschaft fließt horizontal auf die Kamera zu.
  // Die Tangente der Kamerabahn ist ihre echte Bildschirm-Breitenachse.
  var organismCorrectedForward=new THREE.Vector3(
    Math.sin(organismStationAngle),0,Math.cos(organismStationAngle)
  ).applyQuaternion(organismBrainQuaternion).normalize();
  var organismCorrectedRight=new THREE.Vector3(
    Math.cos(organismStationAngle),0,-Math.sin(organismStationAngle)
  ).applyQuaternion(organismBrainQuaternion).normalize();
  var organismDownVector=new THREE.Vector3(0,-1,0).applyQuaternion(organismBrainQuaternion).normalize();
  var organismForwardX=organismCorrectedForward.x, organismForwardY=organismCorrectedForward.y, organismForwardZ=organismCorrectedForward.z;
  var organismRightX=organismCorrectedRight.x, organismRightY=organismCorrectedRight.y, organismRightZ=organismCorrectedRight.z;
  var organismDownX=organismDownVector.x, organismDownY=organismDownVector.y, organismDownZ=organismDownVector.z;
  var wobbleX=new Float32Array(0), wobbleZ=new Float32Array(0);
  var goldEscapeWeights=[], goldEscapePhases=[], goldEscapeFrequencies=[], goldEscapeSpeeds=[];
  var goldParticleRiseActive=new Uint8Array(0);
  var goldParticleRisePhases=new Float32Array(0);
  var goldParticleRiseSpeeds=new Float32Array(0);
  var goldParticleRiseRadii=new Float32Array(0);
  var goldParticleRiseAngles=new Float32Array(0);
  var GOLD_STRAND_END_KEY='ms-gold-strand-end-v1';
  var strandEndTargetWorld=null;
  var strandEndOffsetWorld=new THREE.Vector3();
  var strandEndOffsetLocal=new THREE.Vector3();
  var goldTipLocal=new THREE.Vector3();
  var goldTipWorld=new THREE.Vector3();
  var goldTipProjected=new THREE.Vector3();
  var goldDragRaycaster=new THREE.Raycaster();
  var goldDragPlane=new THREE.Plane();
  var goldDragPointer=new THREE.Vector2();
  var goldDragPointerOffset=new THREE.Vector3();
  var goldDragQuaternion=new THREE.Quaternion();
  var goldDragScale=new THREE.Vector3();
  var goldDragScratch=new THREE.Vector3();
  var goldDragActive=false;
  var goldDragHovered=false;
  var goldDragHandle=null;
  var goldDragHandleMaterial=null;
  try { window.localStorage.removeItem(GOLD_STRAND_END_KEY); } catch(_) {}
  // gemeinsame Durchhang-Richtung (Schwerkraft): leicht nach vorne/unten,
  // nicht rein vertikal, wirkt organischer als ein reiner Y-Fall
  var DROOP_DX=0, DROOP_DZ=0;

  function appendLivingOrganismContinuation(outPos,outCol,outPtsPos,outPtsCol){
    if(!sFibers.length) return;
    var continuationRandom=createSeededRandom(0x4d534f52);
    var trunkPoints=isMobile?20:28;
    var transitionPoints=isMobile?48:68;
    var valleyPoints=isMobile?56:82;
    var valleyHalfWidth=isMobile?3.7:5.1;
    var valleyBankHeight=isMobile?1.34:1.86;
    var branchCount=isMobile?9:13;
    var branches=[];
    var continuationColor=new THREE.Color();

    for(var branchIndex=0;branchIndex<branchCount;branchIndex++){
      var branchPosition=branchCount===1?0:branchIndex/(branchCount-1)*2-1;
      var branchSign=branchPosition<0?-1:1;
      var branchLane=branchSign*Math.pow(Math.abs(branchPosition),.84)*valleyHalfWidth*.88;
      branchLane+=(continuationRandom()-.5)*valleyHalfWidth*.13;
      branches.push({
        lane:THREE.MathUtils.clamp(branchLane,-valleyHalfWidth*.94,valleyHalfWidth*.94),
        phase:continuationRandom()*Math.PI*2,
        releaseStart:.3+continuationRandom()*.18,
        transitionForward:5.8+continuationRandom()*1.35,
        transitionDrop:2.42+continuationRandom()*.72,
        valleyForward:17.2+continuationRandom()*4.8,
        valleyDrop:.68+continuationRandom()*.78,
        bankBias:(continuationRandom()-.5)*.16
      });
    }

    function fiberColor(fiberIndex,tipVertex){
      var colorBand=Math.abs(fiberIndex*17+tipVertex*7)%12;
      var palette=colorBand<2
        ?[SATELLITE_METALS.red.deep,SATELLITE_METALS.red.primary,SATELLITE_METALS.red.light]
        :(colorBand<4
          ?[SATELLITE_METALS.blue.deep,SATELLITE_METALS.blue.primary,SATELLITE_METALS.blue.light]
          :[GOLD.deep,GOLD.primary,GOLD.light]);
      return palette[Math.abs(fiberIndex*13+tipVertex*7)%palette.length];
    }

    function appendVertex(parentVertex,relativeX,relativeY,relativeZ,waveStrength,phase,travel,color,previousVertex){
      var organismVertexIndex=organismVertices.length/3;
      organismVertices.push(relativeX,relativeY,relativeZ);
      organismMeta.push({
        parentVertex:parentVertex,
        waveStrength:waveStrength,
        phase:phase,
        travel:travel
      });
      var parentOffset=parentVertex*3;
      var initialX=sBase[parentOffset]+relativeX;
      var initialY=sBase[parentOffset+1]+relativeY;
      var initialZ=sBase[parentOffset+2]+relativeZ;
      var pointOffset=outPtsPos.length;
      outPtsPos.push(initialX,initialY,initialZ);
      outPtsCol.push(color.r,color.g,color.b);
      organismPointRefs.push({off:pointOffset,src:organismVertexIndex});
      if(previousVertex!==null){
        var previousOffset=previousVertex*3;
        var previousMeta=organismMeta[previousVertex];
        var previousParentOffset=previousMeta.parentVertex*3;
        var lineOffset=outPos.length;
        outPos.push(
          sBase[previousParentOffset]+organismVertices[previousOffset],
          sBase[previousParentOffset+1]+organismVertices[previousOffset+1],
          sBase[previousParentOffset+2]+organismVertices[previousOffset+2],
          initialX,initialY,initialZ
        );
        outCol.push(color.r,color.g,color.b,color.r,color.g,color.b);
        organismLineRefs.push({off:lineOffset,src:previousVertex});
        organismLineRefs.push({off:lineOffset+3,src:organismVertexIndex});
      }
      return organismVertexIndex;
    }

    for(var continuationFiberIndex=0;continuationFiberIndex<sFibers.length;continuationFiberIndex++){
      var sourceFiber=sFibers[continuationFiberIndex];
      var tipVertex=sourceFiber.start+sourceFiber.len-1;
      var sourceColor=fiberColor(continuationFiberIndex,tipVertex);
      var branch=branches[continuationFiberIndex%branchCount];
      var branchPhase=branch.phase+(continuationRandom()-.5)*.72;
      var laneDrift=(continuationRandom()-.5)*(isMobile?.52:.72);
      var finalLane=THREE.MathUtils.clamp(branch.lane+laneDrift,-valleyHalfWidth,valleyHalfWidth);
      var macroReleaseStart=branch.releaseStart+(continuationRandom()-.5)*.08;
      var microReleaseStart=Math.min(.79,macroReleaseStart+.18+continuationRandom()*.16);
      var trunkLength=2.62+continuationRandom()*.58;
      var transitionDrop=branch.transitionDrop+(continuationRandom()-.5)*.24;
      var transitionForwardReach=branch.transitionForward+(continuationRandom()-.5)*.42;
      var valleyForwardReach=branch.valleyForward+(continuationRandom()-.5)*1.15;
      var valleyDrop=branch.valleyDrop+(continuationRandom()-.5)*.24;
      var transitionWeaveAmplitude=.028+continuationRandom()*.062;
      var transitionWeaveFrequency=3.55+continuationRandom()*2.3;
      var valleyMeanderAmplitude=.16+continuationRandom()*.38;
      var valleyMeanderFrequency=1.35+continuationRandom()*1.7;
      var valleyLiftAmplitude=.035+continuationRandom()*.085;
      var colorIntensity=.78+continuationRandom()*.2;
      var fiberDisplayColor=continuationColor.copy(sourceColor).multiplyScalar(colorIntensity).clone();
      var previousVertex=null;
      var emittedPointIndex=0;
      var totalPathPoints=trunkPoints+transitionPoints+valleyPoints;

      function appendPathVertex(relativeX,relativeY,relativeZ,waveStrength){
        var pathProgress=emittedPointIndex/Math.max(1,totalPathPoints-1);
        previousVertex=appendVertex(
          tipVertex,
          relativeX,
          relativeY,
          relativeZ,
          waveStrength,
          branchPhase,
          pathProgress,
          fiberDisplayColor,
          previousVertex
        );
        emittedPointIndex++;
      }

      for(var trunkIndex=0;trunkIndex<trunkPoints;trunkIndex++){
        var trunkT=trunkIndex/Math.max(1,trunkPoints-1);
        var trunkEase=smoother(trunkT);
        var trunkSway=Math.sin(Math.PI*trunkT)*Math.sin(branchPhase+trunkT*2.2)*.024;
        var trunkForward=.16*trunkEase;
        appendPathVertex(
          organismRightX*trunkSway+organismForwardX*trunkForward,
          -trunkLength*trunkT,
          organismRightZ*trunkSway+organismForwardZ*trunkForward,
          1-.06*trunkEase
        );
      }

      var transitionEndSide=0;
      var transitionEndForward=0;
      var transitionEndY=0;
      for(var transitionIndex=1;transitionIndex<=transitionPoints;transitionIndex++){
        var transitionT=transitionIndex/transitionPoints;
        var transitionEase=smoother(transitionT);
        var macroRelease=smoother((transitionT-macroReleaseStart)/(1-macroReleaseStart));
        var microRelease=smoother((transitionT-microReleaseStart)/(1-microReleaseStart));
        var transitionWeave=(Math.sin(branchPhase+transitionT*transitionWeaveFrequency)-Math.sin(branchPhase))
          *transitionWeaveAmplitude*macroRelease*(1-macroRelease*.22);
        var transitionSide=branch.lane*macroRelease
          +(finalLane-branch.lane)*microRelease
          +transitionWeave;
        var transitionBank=(Math.pow(Math.abs(transitionSide)/valleyHalfWidth,1.62)*valleyBankHeight
          +branch.bankBias*macroRelease)*macroRelease;
        var transitionForwardPosition=.16+transitionForwardReach*transitionEase;
        var transitionY=-trunkLength-transitionDrop*transitionT*(2-transitionT)+transitionBank;
        var transitionWaveStrength=.96-.43*transitionEase;
        appendPathVertex(
          organismRightX*transitionSide+organismForwardX*transitionForwardPosition,
          transitionY,
          organismRightZ*transitionSide+organismForwardZ*transitionForwardPosition,
          transitionWaveStrength
        );
        transitionEndSide=transitionSide;
        transitionEndForward=transitionForwardPosition;
        transitionEndY=transitionY;
      }

      var transitionEndBank=Math.pow(Math.abs(transitionEndSide)/valleyHalfWidth,1.62)*valleyBankHeight
        +branch.bankBias;
      for(var valleyIndex=1;valleyIndex<=valleyPoints;valleyIndex++){
        var valleyT=valleyIndex/valleyPoints;
        var valleyEase=smoother(valleyT);
        var meanderEnvelope=Math.sin(Math.PI*valleyT);
        var valleyMeander=Math.sin(branchPhase+valleyT*valleyMeanderFrequency)
          *valleyMeanderAmplitude*meanderEnvelope;
        var valleySide=transitionEndSide+(finalLane-transitionEndSide)*valleyEase+valleyMeander;
        valleySide=THREE.MathUtils.clamp(valleySide,-valleyHalfWidth,valleyHalfWidth);
        var valleyBank=Math.pow(Math.abs(valleySide)/valleyHalfWidth,1.62)*valleyBankHeight
          +branch.bankBias*(1-valleyT*.35);
        var valleyAdvance=valleyForwardReach*valleyT*valleyT*(2-valleyT);
        var valleyForward=transitionEndForward+valleyAdvance;
        var valleyLift=(Math.sin(branchPhase*.7+valleyT*3.4)-Math.sin(branchPhase*.7))
          *valleyLiftAmplitude*meanderEnvelope;
        var valleyY=transitionEndY-valleyDrop*valleyEase+(valleyBank-transitionEndBank)+valleyLift;
        var valleyWaveStrength=.53-.47*valleyEase;
        appendPathVertex(
          organismRightX*valleySide+organismForwardX*valleyForward,
          valleyY,
          organismRightZ*valleySide+organismForwardZ*valleyForward,
          valleyWaveStrength
        );
      }
    }
  }

  // Neuaufbau nach der Landschaftsreferenz: kein Talmodell, keine getrennten
  // Äste, sondern ein einziger Stamm, der sich kelchförmig in ein breites,
  // perspektivisch tiefes Flussdelta legt. Alle Vertices landen weiterhin in
  // exakt denselben Linien-/Punktebuffern wie der Hauptstrang.
  function appendReferenceNeuralLandscape(outPos,outCol,outPtsPos,outPtsCol){
    if(!sFibers.length) return;
    var landscapeRandom=createSeededRandom(0x4e455552);
    var landscapeSourceFiberCount=sFibers.length;
    // Hauptstrang = drei vollständige, am gemeinsamen Endquerschnitt bereits
    // assimilierte Faserfamilien. Keine nachträgliche Zufalls-Einfärbung.
    var landscapeMobileScale=isMobile?LANDSCAPE_MOBILE_SCALE:1;
    var landscapeFiberFamilyCount=Math.max(1,Math.round(LANDSCAPE_TUNING.fiberFamilyCount));
    var landscapeFiberCount=landscapeSourceFiberCount*landscapeFiberFamilyCount;
    var landscapeTrunkPoints=Math.max(2,Math.round(LANDSCAPE_TUNING.trunkPoints*landscapeMobileScale));
    var landscapeDeltaPoints=Math.max(2,Math.round(LANDSCAPE_TUNING.deltaPoints*landscapeMobileScale));
    var landscapeFieldPoints=Math.max(4,Math.round(LANDSCAPE_TUNING.fieldPoints*landscapeMobileScale));
    // brain.scale=3.2775: Diese lokalen Maße bleiben bewusst innerhalb der
    // Distanz zur Endkamera. Größere alte Werte liefen durch die Kamera durch
    // und erzeugten den spiegelverkehrten radialen Fächer.
    var landscapeHalfWidth=LANDSCAPE_TUNING.halfWidth*landscapeMobileScale;
    var landscapeDepth=LANDSCAPE_TUNING.depth*landscapeMobileScale;
    // Tal-Prinzip (Referenz: mesh3d.gallery "corridor walls"): flacher
    // Talboden um den Strang, Wände steigen erst jenseits der Corridor-
    // Breite an -> Kamera/Betrachter blickt in ein Tal statt auf eine
    // gleichmässig gewölbte Schale.
    var landscapeCorridorWidth=landscapeHalfWidth*LANDSCAPE_TUNING.corridorWidthFactor;
    var landscapeCorridorSharpness=LANDSCAPE_TUNING.corridorSharpness;
    var landscapeCorridorHeight=LANDSCAPE_TUNING.corridorHeight;
    // Zusätzliche, feste Vertiefung des Talbodens (unabhängig von den
    // zufälligen Pro-Faser transitionDrop-Werten).
    var landscapeFloorDepth=LANDSCAPE_TUNING.floorDepth;
    // Mittelwert des bisherigen pro-Faser-zufälligen transitionDrop-Bereichs
    // (1.18-1.52), aber für ALLE Fasern gleich - siehe fieldY weiter unten.
    var landscapeSharedFloorBase=1.35;
    var landscapeColor=new THREE.Color();
    var landscapePaths=[];

    // Mehrschichtiges Sinus-Rauschen (Referenz: mesh3d.gallery snoise-Summe
    // im Terrain-Shader). Bricht die reine X-Abhängigkeit der Talwand auf,
    // damit Nachbarfasern nicht alle an derselben Schwelle synchron
    // hochklettern und ein künstliches Gitter bilden.
    function corridorNoise(x:number,z:number,seed:number){
      return Math.sin(x*1.7+z*.9+seed)*.5
        +Math.sin(x*.6-z*1.3+seed*1.7)*.32
        +Math.sin(x*3.1+z*2.2-seed*.6)*.18;
    }

    function landscapeFiberColor(fiberFamily,fiberIndex,tipVertex){
      var palette=fiberFamily===0
        ?[GOLD.deep,GOLD.primary,GOLD.light]
        :(fiberFamily===1
          ?[SATELLITE_METALS.red.deep,SATELLITE_METALS.red.primary,SATELLITE_METALS.red.light]
          :[SATELLITE_METALS.blue.deep,SATELLITE_METALS.blue.primary,SATELLITE_METALS.blue.light]);
      return palette[Math.abs(fiberIndex*11+tipVertex*3)%palette.length];
    }

    function appendLandscapeVertex(parentVertex,x,y,z,waveStrength,phase,travel,color,previousVertex,drawRadialLine){
      var vertexIndex=organismVertices.length/3;
      organismVertices.push(x,y,z);
      // Punkte in der horizontalen Zone (drawRadialLine===false) bekommen
      // eine STATISCHE Elternposition (kein wobbleX/wobbleZ vom Stamm-
      // Tip-Vertex) - sonst wackelt jeder Tip-Vertex mit eigener, unabhängiger
      // Phase (bis zu ~0.17 Einheiten Ausschlag), und die horizontale
      // Querverbindung zwischen zwei UNTERSCHIEDLICHEN, unkorreliert
      // wackelnden Fasern sieht bei jedem Frame wie ein Zacken aus.
      organismMeta.push({
        parentVertex:parentVertex,
        waveStrength:drawRadialLine===false?0:waveStrength,
        phase:phase,
        travel:travel,
        static:drawRadialLine===false
      });
      var parentOffset=parentVertex*3;
      var px=sBase[parentOffset]+x;
      var py=sBase[parentOffset+1]+y;
      var pz=sBase[parentOffset+2]+z;
      var pointOffset=outPtsPos.length;
      outPtsPos.push(px,py,pz);
      outPtsCol.push(color.r,color.g,color.b);
      organismPointRefs.push({off:pointOffset,src:vertexIndex});
      if(previousVertex!==null&&drawRadialLine!==false){
        var previousOffset=previousVertex*3;
        var previousMeta=organismMeta[previousVertex];
        var previousParentOffset=previousMeta.parentVertex*3;
        var lineOffset=outPos.length;
        outPos.push(
          sBase[previousParentOffset]+organismVertices[previousOffset],
          sBase[previousParentOffset+1]+organismVertices[previousOffset+1],
          sBase[previousParentOffset+2]+organismVertices[previousOffset+2],
          px,py,pz
        );
        outCol.push(color.r,color.g,color.b,color.r,color.g,color.b);
        organismLineRefs.push({off:lineOffset,src:previousVertex});
        organismLineRefs.push({off:lineOffset+3,src:vertexIndex});
      }
      return vertexIndex;
    }

    // Gemeinsamer, fixer Referenzpunkt für alle Punkte der horizontalen
    // Zone: jede Faser endet an einer ANDEREN Stelle des Hauptstrangs (siehe
    // endF-Streuung in genStrandInto), wodurch sBase[tipVertex] pro Faser
    // um mehrere Einheiten in Y abweicht. Würde jede Faser weiterhin ihren
    // eigenen tipVertex als Bezugspunkt nutzen, würde diese Streuung direkt
    // in die Weltposition durchschlagen und jede horizontale Querverbindung
    // zwischen zwei verschiedenen Fasern wie einen Zacken aussehen lassen -
    // selbst wenn ihr lokaler Feld-Offset (fieldSide/fieldForward/fieldDrop)
    // längst absolut identisch behandelt wird.
    var landscapeSharedTipVertex=sFibers[0].start+sFibers[0].len-1;
    for(var landscapeFiberIndex=0;landscapeFiberIndex<landscapeFiberCount;landscapeFiberIndex++){
      var landscapeFiberFamily=Math.floor(landscapeFiberIndex/landscapeSourceFiberCount);
      var landscapeSourceIndex=landscapeFiberIndex%landscapeSourceFiberCount;
      var sourceFiber=sFibers[landscapeSourceIndex];
      var tipVertex=sourceFiber.start+sourceFiber.len-1;
      var phase=sMeta[sourceFiber.start*2+1]
        +landscapeFiberFamily*2.0943951023931953
        +(landscapeRandom()-.5)*.9;
      var orderedPosition=landscapeFiberCount===1?0:landscapeFiberIndex/(landscapeFiberCount-1)*2-1;
      // Deterministisches Durchmischen verhindert einen künstlichen Fächer,
      // bewahrt aber eine gleichmäßig gefüllte Landschaft.
      var laneSeed=((landscapeFiberIndex*73)%landscapeFiberCount)/Math.max(1,landscapeFiberCount-1)*2-1;
      var laneMix=orderedPosition*.18+laneSeed*.82;
      var laneSign=laneMix<0?-1:1;
      var targetSide=laneSign*Math.pow(Math.abs(laneMix),.72)*landscapeHalfWidth;
      targetSide+=(landscapeRandom()-.5)*landscapeHalfWidth*.12;
      // targetDepth/transitionForwardEnd waren bisher pro Faser zufällig,
      // wodurch "gleicher Row-Index" NICHT "gleiche Tiefe" bedeutete - zwei
      // bei angeblich gleicher Tiefe verbundene Fasern konnten in Wirklichkeit
      // weit auseinanderliegende Z-Werte haben. Das erzeugte beim Zeichnen
      // der horizontalen Querverbindungen (appendLandscapeLink) Sprünge, die
      // wie vertikale Zacken aussahen. Jetzt für alle Fasern gleich, damit
      // "Row R" bei jeder Faser wirklich dieselbe Tiefe meint.
      var targetDepth=landscapeDepth*.92;
      // Individuelle Kontrollwerte der langen, kontinuierlichen Umlenkung.
      // Kein gemeinsamer Bodenpunkt und keine gemeinsame Knickhöhe.
      var transitionDrop=1.18+landscapeRandom()*.34;
      var transitionForwardEnd=1.69;
      // Nahe am Fuss (Übergangsphase) darf kaum seitliche Bewegung
      // entstehen - das eigentliche Ausbrechen beginnt erst in der
      // Feld-/Talphase, weit hinten am Horizont-Referenzpunkt.
      var transitionSideEnd=targetSide*(.03+landscapeRandom()*.04);
      var transitionControlOneDrop=transitionDrop*(.23+landscapeRandom()*.13);
      var transitionControlTwoDrop=transitionDrop*(.88+landscapeRandom()*.08);
      var transitionControlTwoForward=.24+landscapeRandom()*.28;
      var transitionControlTwoSide=transitionSideEnd*(.12+landscapeRandom()*.18);
      var meanderAmplitude=LANDSCAPE_TUNING.meanderAmplitudeBase+landscapeRandom()*LANDSCAPE_TUNING.meanderAmplitudeRange;
      var meanderFrequency=LANDSCAPE_TUNING.meanderFrequencyBase+landscapeRandom()*LANDSCAPE_TUNING.meanderFrequencyRange;
      var fiberColor=landscapeColor.copy(landscapeFiberColor(
        landscapeFiberFamily,landscapeSourceIndex,tipVertex
      )).clone();
      if(LANDSCAPE_TUNING.colorHue!==0||LANDSCAPE_TUNING.colorSaturation!==1||LANDSCAPE_TUNING.colorLightness!==1){
        var landscapeHsl={h:0,s:0,l:0};
        fiberColor.getHSL(landscapeHsl);
        fiberColor.setHSL(
          (landscapeHsl.h+LANDSCAPE_TUNING.colorHue+1)%1,
          THREE.MathUtils.clamp(landscapeHsl.s*LANDSCAPE_TUNING.colorSaturation,0,1),
          THREE.MathUtils.clamp(landscapeHsl.l*LANDSCAPE_TUNING.colorLightness,0,1)
        );
      }
      var previousVertex=null;
      var pathVertices=[];
      var pathSides=[];
      var emitted=0;
      var total=landscapeTrunkPoints+landscapeDeltaPoints+landscapeFieldPoints;

      // "Im Tal" = die Feldphase (die flache Talfläche selbst). Die
      // Übergangszone (Stamm -> Tal) bleibt eine durchgehende Faser, weil
      // ihre Höhe pro Faser stark streut (individuelle Übergangskurve) und
      // horizontale Querverbindungen dort trotz gleicher Tiefe wie Zacken
      // aussähen.
      var landscapeFieldStartRow=landscapeTrunkPoints+landscapeDeltaPoints;
      var horizontalZoneEnd=landscapeFieldStartRow
        +LANDSCAPE_TUNING.horizontalZoneFraction*(landscapeFieldPoints-1);
      function emitLandscape(x,y,z,waveStrength,sideValue){
        var pathProgress=emitted/Math.max(1,total-1);
        // Am Hauptstrang-Ende bei Phase 1 weiterlaufen. Die Ableitung des
        // Phasenwegs nimmt nach unten stetig ab -> längere Wellen im Tal.
        var continuedWaveTravel=1+pathProgress-.38*pathProgress*pathProgress;
        // Rund um den Stamm/in der Mitte des Tals nur horizontale
        // Querverbindungen (appendLandscapeLink unten) zeichnen lassen -
        // keine radiale Einzelfaser-Linie zum Vorgängerpunkt.
        var drawRadialLine=emitted<landscapeFieldStartRow||emitted>horizontalZoneEnd;
        // In der horizontalen Zone gemeinsamen Referenzpunkt statt der
        // eigenen (unterschiedlich hohen) Faserspitze verwenden - siehe
        // landscapeSharedTipVertex weiter oben.
        var emitParentVertex=drawRadialLine?tipVertex:landscapeSharedTipVertex;
        previousVertex=appendLandscapeVertex(
          emitParentVertex,x,y,z,waveStrength,phase,continuedWaveTravel,fiberColor,previousVertex,drawRadialLine
        );
        pathVertices.push(previousVertex);
        pathSides.push(sideValue);
        emitted++;
      }

      // Ein einziger langer kubischer Übergang. P0->P1 ist exakt vertikal;
      // P2->P3 ist fast horizontal nach vorne. Damit bleiben Position und
      // Tangente ohne sichtbare Bodenlinie oder 90°-Knick kontinuierlich.
      var transitionPoints=landscapeTrunkPoints+landscapeDeltaPoints;
      for(var transitionIndex=0;transitionIndex<transitionPoints;transitionIndex++){
        var transitionT=transitionIndex/Math.max(1,transitionPoints-1);
        var transitionOneMinus=1-transitionT;
        var transitionB1=3*transitionOneMinus*transitionOneMinus*transitionT;
        var transitionB2=3*transitionOneMinus*transitionT*transitionT;
        var transitionB3=transitionT*transitionT*transitionT;
        var transitionSide=transitionControlTwoSide*transitionB2+transitionSideEnd*transitionB3;
        var transitionForward=transitionControlTwoForward*transitionB2+transitionForwardEnd*transitionB3;
        var transitionDown=transitionControlOneDrop*transitionB1
          +transitionControlTwoDrop*transitionB2
          +transitionDrop*transitionB3;
        var transitionOrganicWave=Math.sin(phase+transitionT*7.2)
          *meanderAmplitude*.055*Math.sin(Math.PI*transitionT);
        transitionSide+=transitionOrganicWave;
        emitLandscape(
          organismRightX*transitionSide+organismForwardX*transitionForward+organismDownX*transitionDown,
          organismRightY*transitionSide+organismForwardY*transitionForward+organismDownY*transitionDown,
          organismRightZ*transitionSide+organismForwardZ*transitionForward+organismDownZ*transitionDown,
          1-.12*smoother(transitionT),
          transitionSide
        );
      }

      // 3: flache, breite Landschaft mit ruhiger werdenden Wellen bis tief
      // zum Horizont; seitlich steigt die Ebene wie in der Referenz sanft an.
      for(var fieldIndex=1;fieldIndex<=landscapeFieldPoints;fieldIndex++){
        var fieldT=fieldIndex/landscapeFieldPoints;
        var fieldEnvelope=Math.sin(Math.PI*fieldT);
        var fieldMeander=Math.sin(phase+fieldT*meanderFrequency*Math.PI*2)
          *meanderAmplitude*fieldEnvelope;
        var fieldSpread=smoother(fieldT);
        // Echtes Zufalls-Jitter pro Punkt: die Lane-Zuteilung der Fasern ist
        // deterministisch gleichmässig verteilt, wodurch viele Nachbarfasern
        // sonst exakt an derselben X/Z-Position gleichzeitig die Wand
        // erreichen -> künstliches Gitter. Bricht die Regelmässigkeit auf.
        var fieldJitterX=(landscapeRandom()-.5)*landscapeHalfWidth*LANDSCAPE_TUNING.jitterXAmount;
        // Tiefen-Jitter ist bewusst NICHT pro Faser zufällig, sondern eine
        // reine Funktion von fieldT (identisch für alle Fasern) - sonst
        // bedeutet "Row R" bei jeder Faser eine andere Tiefe, und die
        // horizontalen Querverbindungen springen sichtbar in Z (siehe
        // targetDepth/transitionForwardEnd weiter oben, gleicher Grund).
        var fieldJitterZ=Math.sin(fieldT*11.3)*landscapeDepth*LANDSCAPE_TUNING.jitterZAmount*.5;
        var fieldSide=THREE.MathUtils.clamp(
          transitionSideEnd+(targetSide-transitionSideEnd)*fieldSpread+fieldMeander+fieldJitterX,
          -landscapeHalfWidth*1.08,
          landscapeHalfWidth*1.08
        );
        var fieldForward=transitionForwardEnd+targetDepth*fieldT+fieldJitterZ;
        // Grossflächiges Rauschen verschiebt die Wandkante pro (X,Z)-Position,
        // statt sie starr an einer festen X-Schwelle zu fixieren -> Nachbar-
        // fasern klettern nicht mehr synchron hoch (kein Gittermuster).
        // Seed ist reine POSITION (kein "phase", das ist pro Faser
        // unterschiedlich) - sonst bekommen räumlich benachbarte Fasern
        // unterschiedliche Höhen und jede horizontale Querverbindung
        // (appendLandscapeLink) sieht wie ein Zacken statt einer glatten
        // Höhenlinie aus.
        var corridorWidthNoise=corridorNoise(fieldSide*.6,fieldForward*.6,0);
        var effectiveCorridorWidth=Math.max(
          landscapeCorridorWidth*.35,
          landscapeCorridorWidth+corridorWidthNoise*landscapeCorridorWidth*.6
        );
        var wallDistance=Math.max(Math.abs(fieldSide)-effectiveCorridorWidth,0);
        var fieldBank=Math.pow(
          wallDistance/(landscapeHalfWidth-landscapeCorridorWidth),
          landscapeCorridorSharpness
        )*landscapeCorridorHeight;
        // Feinkörnige zweite Rauschschicht direkt auf der Wandfläche (analog
        // mesh3d: zwei Oktaven), skaliert mit der Nähe zur Wand, damit der
        // Talboden ruhig bleibt und nur die Hänge Textur bekommen.
        var wallBumpiness=smoother(Math.min(1,wallDistance/1.4));
        var fieldBumpNoise=corridorNoise(fieldSide*2.3,fieldForward*2.1,0)
          *LANDSCAPE_TUNING.wallBumpAmount*wallBumpiness;
        var terrainWave=(Math.sin(fieldSide*.72)+Math.sin(fieldForward*.34)*.55)
          *.12*(1-fieldT*.55);
        // Gemeinsamer, NICHT pro-Faser-zufälliger Talboden: transitionDrop
        // ist bewusst pro Faser unterschiedlich (für die individuelle
        // Übergangskurve), würde hier aber räumlich benachbarte Fasern auf
        // verschiedene Grundhöhen setzen und jede horizontale Querverbindung
        // wie einen Zacken aussehen lassen.
        var fieldY=-landscapeSharedFloorBase-landscapeFloorDepth+fieldBank+fieldBumpNoise+terrainWave-.28*fieldT;
        var fieldDrop=Math.max(transitionDrop,-fieldY);
        emitLandscape(
          organismRightX*fieldSide+organismForwardX*fieldForward+organismDownX*fieldDrop,
          organismRightY*fieldSide+organismForwardY*fieldForward+organismDownY*fieldDrop,
          organismRightZ*fieldSide+organismForwardZ*fieldForward+organismDownZ*fieldDrop,
          .84-.16*fieldT,
          fieldSide
        );
      }
      landscapePaths.push({side:targetSide,vertices:pathVertices,sides:pathSides,color:fiberColor});
    }

    // Die Referenz ist keine Ansammlung isolierter Fäden, sondern eine dichte
    // neuronale Oberfläche. Benachbarte Originalfasern werden deshalb in
    // regelmäßigen Tiefenabständen horizontal miteinander verflochten.
    // Auch diese Segmente werden demselben linesObj-Buffer hinzugefügt.
    function appendLandscapeLink(sourceVertex,targetVertex,sourceColor,targetColor){
      var sourceMeta=organismMeta[sourceVertex], targetMeta=organismMeta[targetVertex];
      var sourceOffset=sourceVertex*3, targetOffset=targetVertex*3;
      var sourceParentOffset=sourceMeta.parentVertex*3, targetParentOffset=targetMeta.parentVertex*3;
      var lineOffset=outPos.length;
      outPos.push(
        sBase[sourceParentOffset]+organismVertices[sourceOffset],
        sBase[sourceParentOffset+1]+organismVertices[sourceOffset+1],
        sBase[sourceParentOffset+2]+organismVertices[sourceOffset+2],
        sBase[targetParentOffset]+organismVertices[targetOffset],
        sBase[targetParentOffset+1]+organismVertices[targetOffset+1],
        sBase[targetParentOffset+2]+organismVertices[targetOffset+2]
      );
      outCol.push(
        sourceColor.r*.72,sourceColor.g*.72,sourceColor.b*.72,
        targetColor.r*.72,targetColor.g*.72,targetColor.b*.72
      );
      organismLineRefs.push({off:lineOffset,src:sourceVertex});
      organismLineRefs.push({off:lineOffset+3,src:targetVertex});
    }
    var landscapePathLength=landscapeTrunkPoints+landscapeDeltaPoints+landscapeFieldPoints;
    // Rund um den Stamm/in der Mitte des Tals sollen ausschliesslich
    // horizontale Querverbindungen zwischen Nachbarfasern das Tal zeichnen
    // (wie Höhenlinien) statt radialer Einzelfaser-Linien - siehe
    // drawRadialLine in emitLandscape weiter oben. Deckt exakt dieselbe
    // Zone ab (horizontalZoneFraction).
    var landscapeFieldStartRow=landscapeTrunkPoints+landscapeDeltaPoints;
    var landscapeHorizontalRowEnd=Math.min(
      landscapePathLength-1,
      Math.floor(landscapeFieldStartRow+LANDSCAPE_TUNING.horizontalZoneFraction*(landscapeFieldPoints-1))
    );
    var landscapeLinkStep=Math.max(1,Math.round(LANDSCAPE_TUNING.horizontalLinkStep));
    // Nachbarschaft wird PRO REIHE neu bestimmt: nahe am Stamm haben Fasern
    // noch nicht ihre finale Seiten-Reihenfolge erreicht (transitionSideEnd,
    // Meander, Jitter variieren pro Faser). Eine feste Sortierung nach dem
    // Zielwert verband dort falsche Nachbarn und erzeugte chaotische
    // Zickzack-Linien statt sauberer horizontaler Ringe.
    var landscapeRowOrder=landscapePaths.map(function(_,pathIndex){ return pathIndex; });
    for(var landscapeRow=landscapeFieldStartRow;landscapeRow<=landscapeHorizontalRowEnd;landscapeRow+=landscapeLinkStep){
      landscapeRowOrder.sort(function(a,b){
        return landscapePaths[a].sides[landscapeRow]-landscapePaths[b].sides[landscapeRow];
      });
      for(var landscapePathIndex=0;landscapePathIndex<landscapeRowOrder.length-1;landscapePathIndex++){
        var currentPath=landscapePaths[landscapeRowOrder[landscapePathIndex]];
        var nextPath=landscapePaths[landscapeRowOrder[landscapePathIndex+1]];
        // Nur exakt derselbe Row-Index (= exakt dieselbe Tiefe/derselbe
        // Fortschritt entlang des Pfads) wird verbunden, damit die Linie
        // wirklich rein horizontal bleibt und keine Tiefenkomponente
        // (= optisch "vertikal" wirkend) enthält.
        appendLandscapeLink(
          currentPath.vertices[landscapeRow],
          nextPath.vertices[landscapeRow],
          currentPath.color,
          nextPath.color
        );
      }
    }
  }

  function genStrandInto(outPos,outCol,outPtsPos,outPtsCol){
    sBase=[]; sMeta=[]; sFibers=[]; vc=0; wobbleLineRefs=[]; wobblePtsRefs=[];
    organismVertices=[]; organismMeta=[]; organismLineRefs=[]; organismPointRefs=[];
    goldEscapeWeights=[]; goldEscapePhases=[]; goldEscapeFrequencies=[]; goldEscapeSpeeds=[];
    var N=Math.max(20,Math.round(SP.length/SP.spacing));
    var mx=moveX(), my=moveY(), mz=moveZ();
    // Echte goldene Vertex-Positionen im Stumpf-Bereich (Kugel um SBASE) als
    // Faser-Ankerpunkte sammeln — keine erfundenen Punkte. Deckt Stumpf-Ring,
    // Oberfläche und Umgebung in vollen 3D ab (nicht nur eine Ebene).
    var stumpAnchorPts=pts.filter(function(p){
      var dx=p.x-SBASE_X, dy=p.y-SBASE_Y, dz=p.z-SBASE_Z;
      return dx*dx+dy*dy+dz*dz<=FN.anchorRadius*FN.anchorRadius;
    });
    if(!stumpAnchorPts.length) stumpAnchorPts=roots.length?roots:[new THREE.Vector3(SBASE_X,SBASE_Y,SBASE_Z)];
    var anchorOrder=stumpAnchorPts.map(function(_,ix){return ix;});
    for(var sh=anchorOrder.length-1;sh>0;sh--){ var jx=Math.floor(rnd()*(sh+1)); var tmp=anchorOrder[sh]; anchorOrder[sh]=anchorOrder[jx]; anchorOrder[jx]=tmp; }
    var fiberCount=Math.max(2,Math.round(FN.count*.5)*2);
    var pairProfiles=[];
    for(var f=0;f<fiberCount;f++){
      var pairIndex=Math.floor(f*.5), pairProfile=pairProfiles[pairIndex];
      if(!pairProfile){
        pairProfile={
          angle:pairIndex/Math.max(1,fiberCount*.5)*6.283+(rnd()-.5)*.025,
          twist:(rnd()-.5)*SP.twist,
          frayJitter:.4+rnd()*.6,
          endF:(pairIndex%4)?0.9+0.1*rnd():0.6+0.3*rnd(),
          escapeWeight:(rnd()<GOLD_STRAND_TUNING.escapeAmount)?(.5+rnd()*.5):0,
          escapePhase:rnd()*Math.PI*2,
          escapeFrequency:7+rnd()*9,
          escapeSpeed:.46+rnd()*.52
        };
        pairProfiles[pairIndex]=pairProfile;
      }
      // Ankerpunkt: ein echter goldener Vertex aus dem Stumpf-Bereich,
      // gleichmässig durchgemischt über alle verfügbaren Punkte zyklisch.
      var anchorRaw=stumpAnchorPts[anchorOrder[f%anchorOrder.length]];
      var anchor=new THREE.Vector3(anchorRaw.x+mx,anchorRaw.y+my,anchorRaw.z+mz);
      var bundlePull=FN.convergePull*(0.75+rnd()*0.5);
      var microGroup=f%15, mediumGroup=Math.floor(f/15)%5;
      var outletAngle=pairProfile.angle+(f%2?Math.PI:0)+(rnd()-.5)*.18;
      var microAngle=outletAngle+(rnd()-.5)*.1+microGroup*.006;
      var outletRadius=Math.max(SP.rStr*1.35,FN.outletRadius*(.84+rnd()*.32)*(1-bundlePull*.2))*GOLD_STRAND_TUNING.topThickness;
      var outletDrop=Math.max(.06,FN.funnelHeight*(1.05+rnd()*.65)+(rnd()-.5)*FN.outletHeightSpread);
      var outletY=SBASE_Y+my-outletDrop;
      var mediumAngle=outletAngle+(rnd()-.5)*.14+mediumGroup*.012;
      var microRadius=outletRadius*(1.3+rnd()*.24)*(1.12-bundlePull*.1);
      var mediumRadius=outletRadius*(1.04+rnd()*.18);
      var microCenter=new THREE.Vector3(
        SBASE_X+mx+Math.cos(microAngle)*microRadius,
        SBASE_Y+my+.035+rnd()*.1,
        SBASE_Z+mz+Math.sin(microAngle)*microRadius
      );
      var mediumCenter=new THREE.Vector3(
        SBASE_X+mx+Math.cos(mediumAngle)*mediumRadius,
        outletY+FN.funnelHeight*(.14+rnd()*.18),
        SBASE_Z+mz+Math.sin(mediumAngle)*mediumRadius
      );
      // Jede Faser verlässt den Trichter an einem eigenen Punkt am unteren
      // Ring: über den ganzen Radius verteilt und mit leicht abweichender
      // Höhe. Es gibt dadurch keine gemeinsame Nadelspitze mehr.
      var largeCenter=new THREE.Vector3(
        SBASE_X+mx+Math.cos(outletAngle)*outletRadius,
        outletY,
        SBASE_Z+mz+Math.sin(outletAngle)*outletRadius
      );
      var a0=pairProfile.angle+(f%2?Math.PI:0), tw=pairProfile.twist, rootWaveAmp=.006+rnd()*.008;
      var frayJitter=pairProfile.frayJitter;
      var endF=pairProfile.endF;
      var legacyFunnelSteps=Math.max(3,Math.round(FN.funnelSegs));
      var totalSteps=Math.max(24,Math.round(N*endF)+legacyFunnelSteps);
      var rootSteps=Math.min(totalSteps-18,Math.max(Math.round(totalSteps*.27),legacyFunnelSteps*6));
      var bundleSteps=totalSteps-rootSteps;
      var bundleSpacing=SP.length*endF/Math.max(1,bundleSteps-1);
      var steps=totalSteps, base=vc;
      sFibers.push({start:base, len:steps});
      var fiberCol=golds[Math.floor(rnd()*golds.length)];
      for(var r=0;r<steps;r++){
        var tv=r/(steps-1);
        var px,py,pz;
        if(r<rootSteps){
          var rootProgress=rootSteps>1?r/(rootSteps-1):1;
          var stageStart, stageEnd, stageProgress;
          if(rootProgress<.34){
            stageStart=anchor;
            stageEnd=microCenter;
            stageProgress=smooth(rootProgress/.34);
          } else if(rootProgress<.72){
            stageStart=microCenter;
            stageEnd=mediumCenter;
            stageProgress=smooth((rootProgress-.34)/.38);
          } else {
            stageStart=mediumCenter;
            stageEnd=largeCenter;
            stageProgress=smooth((rootProgress-.72)/.28);
          }
          var rootWeave=Math.sin(a0+rootProgress*8.5)*rootWaveAmp*rootProgress*(1-rootProgress);
          px=stageStart.x+(stageEnd.x-stageStart.x)*stageProgress+Math.cos(a0)*rootWeave;
          py=stageStart.y+(stageEnd.y-stageStart.y)*stageProgress+Math.sin(a0*1.7)*rootWeave*.55;
          pz=stageStart.z+(stageEnd.z-stageStart.z)*stageProgress+Math.sin(a0)*rootWeave;
        } else {
          var br=r-rootSteps;
          var btv=bundleSteps>1?br/(bundleSteps-1):0;
          // Bündel bleibt bis BREAKOUT_START ein ruhiger, gerader Strang ohne
          // Verdrehung; erst danach setzt Twist und Ausbrechen zur Landschaft
          // hin ein (deckt sich mit dem Übergangspunkt zur Landschaft).
          var breakoutProgress=smooth(Math.max(0,(btv-BREAKOUT_START)/(1-BREAKOUT_START)));
          var ang=a0+breakoutProgress*tw;
          var bundleScale=1-SP.taper*btv;
          var thicknessScale=GOLD_STRAND_TUNING.topThickness+(GOLD_STRAND_TUNING.bottomThickness-GOLD_STRAND_TUNING.topThickness)*btv;
          var swirl=SP.rStr*smooth(Math.min(1,btv/Math.max(SP.gather,.001)))*thicknessScale;
          var frayEnv=smooth(Math.max(0,(btv-SP.frayStart)/Math.max(.001,1-SP.frayStart)));
          var fraySpread=frayEnv*SP.fraySpread*frayJitter*thicknessScale;
          var escapeEnvelope=breakoutProgress;
          var escapeTravel=btv*pairProfile.escapeFrequency*GOLD_STRAND_TUNING.escapeFrequency/GOLD_STRAND_TUNING.escapeWavelength
            -pairProfile.escapeSpeed*GOLD_STRAND_TUNING.escapeSpeed;
          var escapeWave=(Math.sin(escapeTravel+pairProfile.escapePhase)+Math.sin(escapeTravel*1.71+pairProfile.escapePhase*.43)*.36)
            *pairProfile.escapeWeight*GOLD_STRAND_TUNING.escapeAmplitude*escapeEnvelope*thicknessScale*.18;
          var droop=SP.droop*btv*btv;
          var outletSettle=smooth(Math.min(1,btv/.38));
          var bundleCenterX=largeCenter.x+(SBASE_X+mx-largeCenter.x)*outletSettle;
          var bundleCenterZ=largeCenter.z+(SBASE_Z+mz-largeCenter.z)*outletSettle;
          px=bundleCenterX+SP.curve*Math.sin(btv*2.1)+Math.cos(ang)*(swirl+fraySpread+escapeWave)+droop*DROOP_DX;
          pz=bundleCenterZ+0.7*SP.curve*Math.sin(btv*1.6+1.0)+Math.sin(ang)*(swirl+fraySpread+escapeWave*.72)+droop*DROOP_DZ;
          py=largeCenter.y-br*bundleSpacing*bundleScale;
        }
        // sanftes Ausblenden im letzten Abschnitt statt hartem Ende
        var endFade=1-smooth(Math.max(0,(tv-0.86)/0.14));
        px+=(rnd()-0.5)*SP.jitter; py+=(rnd()-0.5)*SP.jitter; pz+=(rnd()-0.5)*SP.jitter;
        var v=vc;
        sBase.push(px,py,pz);
        sMeta.push(tv,a0);
        goldEscapeWeights.push(pairProfile.escapeWeight);
        goldEscapePhases.push(pairProfile.escapePhase);
        goldEscapeFrequencies.push(pairProfile.escapeFrequency);
        goldEscapeSpeeds.push(pairProfile.escapeSpeed);
        // neuralShade() bewertet Licht als Skalarprodukt der Richtung ab dem
        // WELT-Ursprung mit der Lichtrichtung. Beim kompakten Gehirn (Punkte
        // rundum den Ursprung) ergibt das eine natürliche Verteilung heller/
        // dunkler Stellen. Beim Strang, der weit unterhalb des Ursprungs
        // fast senkrecht nach unten verläuft, zeigt diese Richtung für JEDEN
        // Punkt fast exakt nach unten — das Skalarprodukt kollabiert auf den
        // Minimalwert, der Strang bleibt dadurch komplett dunkel, egal wie
        // hoch der Helligkeits-Multiplikator ist. Fix: die Radialrichtung
        // relativ zur eigenen (senkrechten) Strangachse verwenden statt der
        // absoluten Weltposition — dann variiert die Beleuchtung wie bei
        // einem echten beleuchteten Kabel nach Umfangswinkel (helle/dunkle
        // Seite), genau wie beim Gehirn nach Kugelwinkel.
        var radialX=px-(SBASE_X+mx), radialZ=pz-(SBASE_Z+mz);
        cc.copy(fiberCol).multiplyScalar((.72+.28*endFade)*neuralShade(radialX,0,radialZ));
        var ptOff=outPtsPos.length;
        outPtsPos.push(px,py,pz);
        outPtsCol.push(cc.r,cc.g,cc.b);
        wobblePtsRefs.push({off:ptOff,srcV:v});
        if(r>0){
          var pi=(v-1)*3;
          var lnOff=outPos.length;
          outPos.push(sBase[pi],sBase[pi+1],sBase[pi+2],px,py,pz);
          outCol.push(cc.r,cc.g,cc.b,cc.r,cc.g,cc.b);
          wobbleLineRefs.push({off:lnOff,srcV:v-1});
          wobbleLineRefs.push({off:lnOff+3,srcV:v});
        }
        vc++;
      }
    }
    // Die frühere linienbasierte neuronale Tallandschaft wird nicht mehr
    // angehängt. Unter dem Strang übernimmt eine eigenständige, dichte
    // Partikelozean-Oberfläche den räumlichen Abschluss.
  }

  function resetWobbleBuffers(){
    wobbleX=new Float32Array(vc);
    wobbleZ=new Float32Array(vc);
    organismCurrent=new Float32Array(organismVertices.length);
    goldEscapeWeights=new Float32Array(goldEscapeWeights);
    goldEscapePhases=new Float32Array(goldEscapePhases);
    goldEscapeFrequencies=new Float32Array(goldEscapeFrequencies);
    goldEscapeSpeeds=new Float32Array(goldEscapeSpeeds);
    goldParticleRiseActive=new Uint8Array(vc);
    goldParticleRisePhases=new Float32Array(vc);
    goldParticleRiseSpeeds=new Float32Array(vc);
    goldParticleRiseRadii=new Float32Array(vc);
    goldParticleRiseAngles=new Float32Array(vc);
    for(var goldRiseIndex=0;goldRiseIndex<vc;goldRiseIndex++){
      // Schneller deterministischer Integer-Hash: Die Auswahl bleibt auch bei
      // einem Rebuild stabil und erzeugt keine sichtbaren Faser-Gruppen.
      var goldRiseHash=Math.imul(goldRiseIndex+1,0x9e3779b1)^0x48414c4f;
      goldRiseHash=Math.imul(goldRiseHash^(goldRiseHash>>>16),0x85ebca6b);
      goldRiseHash=Math.imul(goldRiseHash^(goldRiseHash>>>13),0xc2b2ae35);
      var goldRiseRandom=((goldRiseHash^(goldRiseHash>>>16))>>>0)/4294967296;
      // Die komplette sichtbare Goldwolke bewegt sich. Jeder Punkt besitzt
      // trotzdem eine eigene Phase, Geschwindigkeit, Distanz und Umlaufbahn,
      // damit keine geschlossene Schicht gemeinsam nach oben rutscht.
      goldParticleRiseActive[goldRiseIndex]=1;
      goldParticleRisePhases[goldRiseIndex]=((goldRiseRandom*7.193)%1);
      goldParticleRiseSpeeds[goldRiseIndex]=.055+((goldRiseRandom*13.71)%1)*.085;
      goldParticleRiseRadii[goldRiseIndex]=.045+((goldRiseRandom*23.37)%1)*.18;
      goldParticleRiseAngles[goldRiseIndex]=((goldRiseRandom*31.91)%1)*Math.PI*2;
    }
  }

  // Die zentrale Goldbahn wird einmal aus den bereits vorhandenen Goldfasern
  // gemittelt. Rot, Blau und Grün verwenden diese Bahn später nur als räumlichen
  // Bezug ab dem Merge-Punkt – es werden keinerlei neue Fasern erzeugt.
  var GOLD_CENTERLINE_SAMPLES=96;
  var goldCenterlineLocal=new Float32Array(GOLD_CENTERLINE_SAMPLES*3);
  var goldFrameCenterLocal=new THREE.Vector3();
  var goldFrameTangentLocal=new THREE.Vector3();
  var goldFrameNormalLocal=new THREE.Vector3();
  var goldFrameBinormalLocal=new THREE.Vector3();
  var goldFrameSampleBefore=new THREE.Vector3();
  var goldFrameSampleAfter=new THREE.Vector3();

  function rebuildGoldCenterline(){
    if(!sFibers.length) return;
    for(var centerSampleIndex=0;centerSampleIndex<GOLD_CENTERLINE_SAMPLES;centerSampleIndex++){
      var centerProgress=centerSampleIndex/Math.max(1,GOLD_CENTERLINE_SAMPLES-1);
      var centerX=0, centerY=0, centerZ=0;
      for(var centerFiberIndex=0;centerFiberIndex<sFibers.length;centerFiberIndex++){
        var centerFiber=sFibers[centerFiberIndex];
        var centerVertex=centerFiber.start+Math.round((centerFiber.len-1)*centerProgress);
        var centerOffset=centerVertex*3;
        centerX+=sBase[centerOffset];
        centerY+=sBase[centerOffset+1];
        centerZ+=sBase[centerOffset+2];
      }
      var targetOffset=centerSampleIndex*3;
      goldCenterlineLocal[targetOffset]=centerX/sFibers.length;
      goldCenterlineLocal[targetOffset+1]=centerY/sFibers.length;
      goldCenterlineLocal[targetOffset+2]=centerZ/sFibers.length;
    }
  }

  function sampleGoldCenterline(progress,target){
    var clampedProgress=THREE.MathUtils.clamp(progress,0,1);
    var samplePosition=clampedProgress*(GOLD_CENTERLINE_SAMPLES-1);
    var lowerSample=Math.floor(samplePosition);
    var upperSample=Math.min(GOLD_CENTERLINE_SAMPLES-1,lowerSample+1);
    var sampleBlend=samplePosition-lowerSample;
    var lowerOffset=lowerSample*3, upperOffset=upperSample*3;
    target.set(
      goldCenterlineLocal[lowerOffset]+(goldCenterlineLocal[upperOffset]-goldCenterlineLocal[lowerOffset])*sampleBlend,
      goldCenterlineLocal[lowerOffset+1]+(goldCenterlineLocal[upperOffset+1]-goldCenterlineLocal[lowerOffset+1])*sampleBlend,
      goldCenterlineLocal[lowerOffset+2]+(goldCenterlineLocal[upperOffset+2]-goldCenterlineLocal[lowerOffset+2])*sampleBlend
    );
    return target;
  }

  function sampleDeformedGoldCenterline(progress,target){
    sampleGoldCenterline(progress,target);
    target.addScaledVector(worldVerticalInStrandLocal,-wulstVerticalPull(progress));
    return target;
  }

  function sampleGoldStrandFrame(progress){
    var frameStep=1/(GOLD_CENTERLINE_SAMPLES-1);
    sampleDeformedGoldCenterline(progress,goldFrameCenterLocal);
    sampleDeformedGoldCenterline(Math.max(0,progress-frameStep),goldFrameSampleBefore);
    sampleDeformedGoldCenterline(Math.min(1,progress+frameStep),goldFrameSampleAfter);
    goldFrameTangentLocal.copy(goldFrameSampleAfter).sub(goldFrameSampleBefore).normalize();
    goldFrameNormalLocal.copy(worldVerticalInStrandLocal).cross(goldFrameTangentLocal);
    if(goldFrameNormalLocal.lengthSq()<.00001) goldFrameNormalLocal.set(1,0,0);
    else goldFrameNormalLocal.normalize();
    goldFrameBinormalLocal.copy(goldFrameTangentLocal).cross(goldFrameNormalLocal).normalize();
  }

  var originalWalkLineLength=lpos.length, originalWalkPointLength=wpos.length;
  var baseLinePos, baseLineCol, baseWPos, baseWCol;
  if(STRAND_ON) genStrandInto(lpos,lcol,wpos,wcol);
  for(var originalPointOffset=0;originalPointOffset<originalWalkPointLength;originalPointOffset+=3){
    if(wpos[originalPointOffset+1]>=ORIGINAL_STUMP_CUTOFF) continue;
    wcol[originalPointOffset]=0;
    wcol[originalPointOffset+1]=0;
    wcol[originalPointOffset+2]=0;
  }
  for(var originalLineOffset=0;originalLineOffset<originalWalkLineLength;originalLineOffset+=6){
    if(lpos[originalLineOffset+1]>=ORIGINAL_STUMP_CUTOFF&&lpos[originalLineOffset+4]>=ORIGINAL_STUMP_CUTOFF) continue;
    lcol[originalLineOffset]=0;
    lcol[originalLineOffset+1]=0;
    lcol[originalLineOffset+2]=0;
    lcol[originalLineOffset+3]=0;
    lcol[originalLineOffset+4]=0;
    lcol[originalLineOffset+5]=0;
  }
  baseLinePos=lpos.slice(0,originalWalkLineLength);
  baseLineCol=lcol.slice(0,originalWalkLineLength);
  baseWPos=wpos.slice(0,originalWalkPointLength);
  baseWCol=wcol.slice(0,originalWalkPointLength);
  resetWobbleBuffers();
  rebuildGoldCenterline();

  // Feste Wasserlinie in Weltkoordinaten. Alle Fasergeometrien werden unter
  // dieser Ebene abgeschnitten, damit der Strang tatsächlich in die
  // Partikeloberfläche eintaucht und nicht transparent darüber weiterläuft.
  var NEURAL_OCEAN_WORLD_Y=cardGroupWorldY-(isMobile?4.15:6.25);
  var NEURAL_OCEAN_CLIP_Y=NEURAL_OCEAN_WORLD_Y-(isMobile?.42:.62);
  var neuralOceanClipPlane=new THREE.Plane(
    new THREE.Vector3(0,1,0),
    -NEURAL_OCEAN_CLIP_Y
  );
  renderer.localClippingEnabled=true;

  var lgeo=new THREE.BufferGeometry();
  lgeo.setAttribute('position',new THREE.Float32BufferAttribute(lpos,3));
  lgeo.setAttribute('color',new THREE.Float32BufferAttribute(lcol,3));
  var linesObj=new THREE.LineSegments(lgeo,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:GOLD_RENDER.lineOpacity,blending:THREE.NormalBlending,depthWrite:false}));
  linesObj.material.clippingPlanes=[neuralOceanClipPlane];
  linesObj.name='neural-lines';
  brain.add(dbgHide('walks',linesObj));
  var wptsObj=pointsObj(wpos,wcol,SP.ptSize,GOLD_RENDER.pointOpacity);
  wptsObj.material.clippingPlanes=[neuralOceanClipPlane];
  wptsObj.name='neural-points';
  brain.add(dbgHide('wpts',wptsObj));
  var goldLineBaseColors=linesObj.geometry.attributes.color.array.slice();
  var goldPointBaseColors=wptsObj.geometry.attributes.color.array.slice();

  // Ruhiges, grosswelliges Partikelmeer am unteren Bildrand. Die Punkte
  // werden einmal auf der CPU verteilt; sämtlicher Wellengang läuft danach
  // im Vertex-Shader und belastet den JavaScript-Thread nicht pro Partikel.
  var oceanWaveAnimationData=null;
  var oceanWaveAnimationDisposed=false;

  function buildNeuralParticleOcean(){
    if(!sFibers.length) return null;
    // Die bisherige dichte Nahflaeche bleibt unveraendert. Ein separater,
    // leichterer Fernbereich verlaengert sie hinter dem Strang bis weit ueber
    // den sichtbaren Horizont hinaus, ohne die Dichte im Vordergrund zu senken.
    var nearParticleCount=isMobile?150000:520000;
    var farParticleCount=isMobile?55000:180000;
    var particleCount=nearParticleCount+farParticleCount;
    var oceanPositions=new Float32Array(particleCount*3);
    var oceanColors=new Float32Array(particleCount*3);
    var oceanData=new Float32Array(particleCount*4);
    var oceanRandom=createSeededRandom(0x4f434541);
    // Gleiche Welt-Dimension wie das frühere, durch brain.scale vergrösserte
    // Tal. Die Ebene sitzt fest unter den Karten und kann deshalb nicht mehr
    // zusammen mit einem lokalen Faserendpunkt aus dem Kamerabild rutschen.
    var oceanHalfWidth=isMobile?12.5:22.5;
    var oceanNearDepthBehind=isMobile?3.4:5.2;
    var oceanFarDepthBehind=isMobile?72:105;
    var oceanDepthAhead=isMobile?11.5:18.5;
    var oceanCorridor=isMobile?4.2:7.4;
    var oceanWorldY=NEURAL_OCEAN_WORLD_Y;
    var oceanWorldRightX=Math.cos(organismStationAngle);
    var oceanWorldRightZ=-Math.sin(organismStationAngle);
    var oceanWorldForwardX=Math.sin(organismStationAngle);
    var oceanWorldForwardZ=Math.cos(organismStationAngle);
    var strandCollisionRadius=isMobile?.4:.56;
    var sourceWaveControls=Array.from({length:13},function(){
      return new THREE.Vector4();
    });
    var sourceWaveTilts=Array.from({length:13},function(){
      return new THREE.Vector2();
    });
    var oceanColor=new THREE.Color();
    for(var oceanIndex=0;oceanIndex<particleCount;oceanIndex++){
      // Quasi-rasterartige Grundverteilung plus starker Jitter: lückenlos wie
      // eine Oberfläche, aus der Nähe aber bewusst wild und nicht geordnet.
      var oceanSide;
      var oceanForward;
      var oceanWidthScale=1;
      var oceanHorizonProgress=0;
      if(oceanIndex<nearParticleCount){
        var oceanU=(oceanIndex+.5)/nearParticleCount;
        oceanSide=((oceanU*1.618033988749895)%1*2-1)*oceanHalfWidth;
        oceanSide+=(oceanRandom()-.5)*oceanHalfWidth*.035;
        // Ein kleiner Anteil liegt hinter dem Andockpunkt. So beginnt das Meer
        // sichtbar unter dem Strang und nicht erst ausserhalb des Bildrandes.
        oceanForward=-oceanNearDepthBehind
          +Math.pow(oceanRandom(),.9)*(oceanNearDepthBehind+oceanDepthAhead);
      }else{
        // Der Fernbereich setzt exakt an der bisherigen Rueckkante an. Seine
        // Tiefe wird zum Horizont hin zunehmend duenn besetzt und seine Breite
        // waechst mit dem Sichtkegel, sodass seitlich keine Kante auftaucht.
        var farIndex=oceanIndex-nearParticleCount;
        var farU=(farIndex+oceanRandom())/farParticleCount;
        oceanHorizonProgress=Math.pow(farU,1.72);
        oceanForward=-THREE.MathUtils.lerp(
          oceanNearDepthBehind,
          oceanFarDepthBehind,
          oceanHorizonProgress
        );
        oceanWidthScale=1+oceanHorizonProgress*(isMobile?3.3:2.65);
        oceanSide=((((farIndex+.5)*1.618033988749895)%1)*2-1)
          *oceanHalfWidth*oceanWidthScale;
        oceanSide+=(oceanRandom()-.5)*oceanHalfWidth*oceanWidthScale*.045;
      }
      var scaledOceanCorridor=oceanCorridor*oceanWidthScale;
      var oceanBankDistance=Math.max(Math.abs(oceanSide)-scaledOceanCorridor,0);
      var oceanBank=Math.pow(
        oceanBankDistance/Math.max(.001,(oceanHalfWidth-oceanCorridor)*oceanWidthScale),
        1.58
      )*(isMobile?1.8:3.15)*Math.pow(1-oceanHorizonProgress,2.35);
      var oceanX=oceanWorldRightX*oceanSide+oceanWorldForwardX*oceanForward;
      var oceanZ=oceanWorldRightZ*oceanSide+oceanWorldForwardZ*oceanForward;
      var collisionDistance=Math.sqrt(oceanX*oceanX+oceanZ*oceanZ);
      // Keine ausgesparte Kreisfläche: Partikel laufen lückenlos bis durch
      // die Strangachse. Ein weicher Meniskus hebt nur ihre Höhe an und lässt
      // die Oberfläche organisch am eintauchenden Bündel hochziehen.
      var collisionCollar=Math.exp(-collisionDistance*.72)*(isMobile?.26:.42);
      var oceanMicroHeight=(oceanRandom()-.5)*.075;
      var oceanPositionOffset=oceanIndex*3;
      oceanPositions[oceanPositionOffset]=oceanX;
      oceanPositions[oceanPositionOffset+1]=oceanWorldY+oceanBank+collisionCollar+oceanMicroHeight;
      oceanPositions[oceanPositionOffset+2]=oceanZ;
      // Der gesamte Ozean verwendet exakt dieselbe zufällige Goldspanne wie
      // die aufsteigenden Partikel des unteren Rings.
      oceanColor.copy(GOLD.light).lerp(GOLD.highlight,.46+oceanRandom()*.54);
      oceanColors[oceanPositionOffset]=oceanColor.r;
      oceanColors[oceanPositionOffset+1]=oceanColor.g;
      oceanColors[oceanPositionOffset+2]=oceanColor.b;
      var oceanDataOffset=oceanIndex*4;
      oceanData[oceanDataOffset]=oceanSide;
      oceanData[oceanDataOffset+1]=oceanForward;
      oceanData[oceanDataOffset+2]=oceanRandom()*Math.PI*2;
      oceanData[oceanDataOffset+3]=.68+oceanRandom()*.72;
    }
    var oceanGeometry=new THREE.BufferGeometry();
    oceanGeometry.setAttribute('position',new THREE.BufferAttribute(oceanPositions,3));
    oceanGeometry.setAttribute('aColor',new THREE.BufferAttribute(oceanColors,3));
    oceanGeometry.setAttribute('aOcean',new THREE.BufferAttribute(oceanData,4));
    var oceanMaterial=new THREE.RawShaderMaterial({
      uniforms:{
        uTime:{value:0},
        uPixelRatio:{value:Math.min(window.devicePixelRatio||1,2)},
        // Der zeitliche Alpha-Schimmer wird im Shader exakt wie beim Ring
        // berechnet; die Basis bleibt deshalb unskaliert.
        uOpacity:{value:1},
        uBrightness:{value:.5},
        uReveal:{value:0},
        uBrainPulses:{value:new THREE.Vector4()},
        uStrandRadius:{value:strandCollisionRadius},
        uOceanHalfWidth:{value:oceanHalfWidth},
        // Die GLB-Wellenprojektion behaelt ihren bisherigen Nahbereich; nur
        // die neue Fernflaeche laeuft anschliessend frei bis zum Horizont.
        uOceanDepthMid:{value:(oceanDepthAhead-oceanNearDepthBehind)*.5},
        uOceanDepthHalf:{value:(oceanDepthAhead+oceanNearDepthBehind)*.5},
        uOceanBackStart:{value:oceanNearDepthBehind},
        uOceanFarFadeStart:{value:(oceanFarDepthBehind-oceanNearDepthBehind)*.24},
        uOceanFarFadeEnd:{value:(oceanFarDepthBehind-oceanNearDepthBehind)*.92},
        uSourceWaveControls:{value:sourceWaveControls},
        uSourceWaveTilts:{value:sourceWaveTilts}
      },
      vertexShader:[
        'precision highp float;',
        'uniform mat4 modelViewMatrix;',
        'uniform mat4 projectionMatrix;',
        'uniform float uTime;',
        'uniform float uPixelRatio;',
        'uniform float uStrandRadius;',
        'uniform float uOceanHalfWidth;',
        'uniform float uOceanDepthMid;',
        'uniform float uOceanDepthHalf;',
        'uniform float uOceanBackStart;',
        'uniform float uOceanFarFadeStart;',
        'uniform float uOceanFarFadeEnd;',
        'uniform vec4 uSourceWaveControls[13];',
        'uniform vec2 uSourceWaveTilts[13];',
        'attribute vec3 position;',
        'attribute vec3 aColor;',
        'attribute vec4 aOcean;',
        'varying vec3 vColor;',
        'varying float vShimmer;',
        'varying float vCrest;',
        'varying float vImpact;',
        'varying float vHorizonFade;',
        'void main(){',
        '  float side=aOcean.x;',
        '  float depth=aOcean.y;',
        '  float phase=aOcean.z;',
        '  float radius=length(position.xz);',
        // Originalbewegung aus dem GLB: Die 13 animierten Steuerknochen
        // werden als weiches Höhenfeld über die Partikeloberfläche gelegt.
        '  vec2 sourcePosition=vec2(',
        '    side/max(.001,uOceanHalfWidth)*12.72,',
        '    (depth-uOceanDepthMid)/max(.001,uOceanDepthHalf)*12.72',
        '  );',
        '  float sourceHeight=0.0;',
        '  float sourceWeight=0.0;',
        '  for(int controlIndex=0;controlIndex<13;controlIndex++){',
        '    vec4 control=uSourceWaveControls[controlIndex];',
        '    vec2 controlDelta=sourcePosition-control.xy;',
        '    float controlWeight=exp(-dot(controlDelta,controlDelta)*.072);',
        '    vec2 controlTilt=uSourceWaveTilts[controlIndex];',
        '    float tiltedHeight=control.z+dot(controlTilt,controlDelta)*.26;',
        '    sourceHeight+=tiltedHeight*controlWeight;',
        '    sourceWeight+=controlWeight;',
        '  }',
        // Die GLB-Bewegung liefert nur noch eine dezente, organische Unruhe.
        // Der Hauptwellengang besteht aus 5,5 langsamen, leicht diagonalen
        // Kämmen über die gesamte Breite. So hebt sich nicht mehr die komplette
        // Fläche gleichzeitig, sondern jeder Kamm läuft einzeln durch das Meer.
        '  float glbWave=sourceHeight/max(.0001,sourceWeight)*.52;',
        '  float normalizedSide=side/max(.001,uOceanHalfWidth);',
        // Die höhere Zeitphase verschiebt die Kämme gut erkennbar seitlich,
        // ohne die vertikale Bewegung hektischer werden zu lassen.
        '  float ridgePhase=normalizedSide*17.2788+depth*.19-uTime*.52;',
        '  float ridgeWave=sin(ridgePhase)*.38;',
        '  ridgeWave+=sin(ridgePhase*2.0-.62)*.075;',
        '  ridgeWave+=sin(depth*.31-normalizedSide*2.4+uTime*.041)*.09;',
        '  float impact=exp(-max(0.0,radius-uStrandRadius)*.31);',
        '  float reflected=sin((radius-uStrandRadius)*.62+uTime*.15+phase*.006)*.42*impact;',
        // Hinter dem Eintauchbereich verlieren die Wellen kontinuierlich an
        // Hoehe. So entstehen in der perspektivischen Verdichtung keine
        // hellen, linienartigen Kammbaender am Horizont.
        '  float backDistance=max(0.0,-depth-uOceanBackStart);',
        '  float distantWaveFade=1.0-smoothstep(0.0,uOceanFarFadeStart,backDistance);',
        '  float wave=(glbWave+ridgeWave)*distantWaveFade+reflected;',
        '  vec3 displaced=position+vec3(0.0,wave,0.0);',
        '  vec4 mvPosition=modelViewMatrix*vec4(displaced,1.0);',
        '  gl_Position=projectionMatrix*mvPosition;',
        '  vCrest=smoothstep(.34,1.18,wave);',
        '  vImpact=impact;',
        '  gl_PointSize=aOcean.w*(1.0+vCrest*.28+impact*.16)*uPixelRatio*(31.0/max(6.0,-mvPosition.z));',
        '  vColor=aColor;',
        // Langer, gleichmaessiger Helligkeitsabfall ab Beginn der Fernflaeche.
        // Ein zusaetzlicher weicher Abschluss liegt noch vor der Geometriekante.
        '  float horizonProgress=clamp(backDistance/max(.001,uOceanFarFadeEnd),0.0,1.0);',
        '  float horizonDissolve=1.0-smoothstep(.82,1.0,horizonProgress);',
        '  vHorizonFade=exp(-horizonProgress*2.65)*horizonDissolve;',
        // Dieselbe individuelle Funkelphase wie bei den Ringpartikeln.
        '  vShimmer=.72+.28*sin(uTime*(.48+aOcean.w*.16)+phase);',
        '}'
      ].join('\n'),
      fragmentShader:[
        'precision highp float;',
        'uniform float uOpacity;',
        'uniform float uBrightness;',
        'uniform float uReveal;',
        'uniform vec4 uBrainPulses;',
        'varying vec3 vColor;',
        'varying float vShimmer;',
        'varying float vCrest;',
        'varying float vImpact;',
        'varying float vHorizonFade;',
        'void main(){',
        '  float radial=length(gl_PointCoord-vec2(.5))*2.0;',
        // Exakt derselbe kompakte Leuchtkern wie beim unteren Goldring.
        '  float glow=pow(max(0.0,1.0-radial),1.7);',
        // Wie beim Goldring reagiert der Ozean nur auf den goldenen Puls und
        // bleibt dadurch dauerhaft in derselben Goldfarbe.
        '  float pulseEnergy=clamp(uBrainPulses.x,0.0,1.0);',
        '  float alpha=glow*uOpacity*uReveal*vHorizonFade*(.58+vShimmer*.34)*(1.0+pulseEnergy*.9);',
        '  if(alpha<.015) discard;',
        '  vec3 litColor=mix(vColor,vec3(1.0),.22+pulseEnergy*.28);',
        '  gl_FragColor=vec4(litColor*(1.0+pulseEnergy*.72)*uBrightness,alpha);',
        '}'
      ].join('\n'),
      transparent:true,
      depthWrite:false,
      depthTest:true,
      blending:THREE.AdditiveBlending,
      toneMapped:false
    });
    var oceanPoints=new THREE.Points(oceanGeometry,oceanMaterial);
    oceanPoints.name='neural-particle-ocean';
    oceanPoints.frustumCulled=false;
    // Nach Gold- und Sekundärfasern zeichnen: Die dichte Oberfläche legt sich
    // über deren untergetauchten Abschnitt und verbindet beide Silhouetten.
    oceanPoints.renderOrder=8;
    world.add(oceanPoints);
    return {
      points:oceanPoints,
      material:oceanMaterial,
      sourceWaveControls:sourceWaveControls,
      sourceWaveTilts:sourceWaveTilts
    };
  }
  var neuralParticleOcean=buildNeuralParticleOcean();

  function buildOceanImmersionHalo(){
    if(!neuralParticleOcean) return null;
    var haloCount=isMobile?520:1800;
    var haloPositions=new Float32Array(haloCount*3);
    var haloColors=new Float32Array(haloCount*3);
    var haloData=new Float32Array(haloCount*4);
    var haloRiseData=new Float32Array(haloCount*4);
    var haloWaveData=new Float32Array(haloCount*2);
    var haloRandom=createSeededRandom(0x48414c4f);
    var haloColor=new THREE.Color();
    for(var haloIndex=0;haloIndex<haloCount;haloIndex++){
      var haloAngle=haloRandom()*Math.PI*2;
      var haloRadius=(isMobile?.16:.22)+Math.pow(haloRandom(),.72)*(isMobile?1.18:1.92);
      var haloOffset=haloIndex*3;
      haloPositions[haloOffset]=Math.cos(haloAngle)*haloRadius;
      haloPositions[haloOffset+1]=NEURAL_OCEAN_WORLD_Y;
      haloPositions[haloOffset+2]=Math.sin(haloAngle)*haloRadius;
      haloColor.copy(GOLD.light).lerp(GOLD.highlight,.46+haloRandom()*.54);
      haloColors[haloOffset]=haloColor.r;
      haloColors[haloOffset+1]=haloColor.g;
      haloColors[haloOffset+2]=haloColor.b;
      var haloDataOffset=haloIndex*4;
      haloData[haloDataOffset]=haloAngle;
      haloData[haloDataOffset+1]=haloRadius;
      haloData[haloDataOffset+2]=haloRandom()*Math.PI*2;
      haloData[haloDataOffset+3]=.52+haloRandom()*.74;
      // Jeder Punkt besitzt seinen eigenen, bewusst langsamen Aufstiegszyklus.
      // Die zufällige Startphase verhindert sichtbare Gruppen/Partikelringe.
      // Halbe Aufstiegsgeschwindigkeit fuer den unteren Ring; Hoehe,
      // Aufloesung und Kopplung an die Ozeanwelle bleiben identisch.
      haloRiseData[haloDataOffset]=.0375+haloRandom()*.0475;
      haloRiseData[haloDataOffset+1]=(isMobile?3.8:6.8)+Math.pow(haloRandom(),.72)*(isMobile?3.6:6.4);
      haloRiseData[haloDataOffset+2]=.035+haloRandom()*.12;
      haloRiseData[haloDataOffset+3]=haloRandom();
      var waveDataOffset=haloIndex*2;
      haloWaveData[waveDataOffset]=Math.cos(organismStationAngle)*haloPositions[haloOffset]
        -Math.sin(organismStationAngle)*haloPositions[haloOffset+2];
      haloWaveData[waveDataOffset+1]=Math.sin(organismStationAngle)*haloPositions[haloOffset]
        +Math.cos(organismStationAngle)*haloPositions[haloOffset+2];
    }
    var haloGeometry=new THREE.BufferGeometry();
    haloGeometry.setAttribute('position',new THREE.BufferAttribute(haloPositions,3));
    haloGeometry.setAttribute('aColor',new THREE.BufferAttribute(haloColors,3));
    haloGeometry.setAttribute('aHalo',new THREE.BufferAttribute(haloData,4));
    haloGeometry.setAttribute('aRise',new THREE.BufferAttribute(haloRiseData,4));
    haloGeometry.setAttribute('aWave',new THREE.BufferAttribute(haloWaveData,2));
    var haloMaterial=new THREE.RawShaderMaterial({
      uniforms:{
        uTime:{value:0},
        uPixelRatio:{value:Math.min(window.devicePixelRatio||1,2)},
        uReveal:{value:0},
        uPulse:{value:0},
        // 50 % der bisherigen Leuchtkraft, ohne Dichte oder Goldton zu
        // veraendern. Die Pulsanimation bleibt relativ dazu erhalten.
        uBrightness:{value:.5},
        // Dieselben Steuerdaten wie im Partikelmeer: Die aufsteigenden Punkte
        // werden am Ursprung von exakt derselben unteren Welle angehoben.
        uStrandRadius:{value:neuralParticleOcean.material.uniforms.uStrandRadius.value},
        uOceanHalfWidth:{value:neuralParticleOcean.material.uniforms.uOceanHalfWidth.value},
        uOceanDepthMid:{value:neuralParticleOcean.material.uniforms.uOceanDepthMid.value},
        uOceanDepthHalf:{value:neuralParticleOcean.material.uniforms.uOceanDepthHalf.value},
        uSourceWaveControls:{value:neuralParticleOcean.sourceWaveControls},
        uSourceWaveTilts:{value:neuralParticleOcean.sourceWaveTilts}
      },
      vertexShader:[
        'precision highp float;',
        'uniform mat4 modelViewMatrix;',
        'uniform mat4 projectionMatrix;',
        'uniform float uTime;',
        'uniform float uPixelRatio;',
        'uniform float uStrandRadius;',
        'uniform float uOceanHalfWidth;',
        'uniform float uOceanDepthMid;',
        'uniform float uOceanDepthHalf;',
        'uniform vec4 uSourceWaveControls[13];',
        'uniform vec2 uSourceWaveTilts[13];',
        'attribute vec3 position;',
        'attribute vec3 aColor;',
        'attribute vec4 aHalo;',
        'attribute vec4 aRise;',
        'attribute vec2 aWave;',
        'varying vec3 vColor;',
        'varying float vTwinkle;',
        'varying float vDissolve;',
        'void main(){',
        // Untere Welle identisch zum Meer auswerten. Ihr Einfluss nimmt beim
        // Aufstieg ab, als wuerde sie den Partikel einzeln aus der Flaeche
        // herausheben und anschliessend an die Luft uebergeben.
        '  vec2 sourcePosition=vec2(',
        '    aWave.x/max(.001,uOceanHalfWidth)*12.72,',
        '    (aWave.y-uOceanDepthMid)/max(.001,uOceanDepthHalf)*12.72',
        '  );',
        '  float sourceHeight=0.0;',
        '  float sourceWeight=0.0;',
        '  for(int controlIndex=0;controlIndex<13;controlIndex++){',
        '    vec4 control=uSourceWaveControls[controlIndex];',
        '    vec2 controlDelta=sourcePosition-control.xy;',
        '    float controlWeight=exp(-dot(controlDelta,controlDelta)*.072);',
        '    float tiltedHeight=control.z+dot(uSourceWaveTilts[controlIndex],controlDelta)*.26;',
        '    sourceHeight+=tiltedHeight*controlWeight;',
        '    sourceWeight+=controlWeight;',
        '  }',
        '  float glbWave=sourceHeight/max(.0001,sourceWeight)*.52;',
        '  float normalizedSide=aWave.x/max(.001,uOceanHalfWidth);',
        '  float ridgePhase=normalizedSide*17.2788+aWave.y*.19-uTime*.52;',
        '  float ridgeWave=sin(ridgePhase)*.38;',
        '  ridgeWave+=sin(ridgePhase*2.0-.62)*.075;',
        '  ridgeWave+=sin(aWave.y*.31-normalizedSide*2.4+uTime*.041)*.09;',
        '  float impact=exp(-max(0.0,aHalo.y-uStrandRadius)*.31);',
        '  float reflected=sin((aHalo.y-uStrandRadius)*.62+uTime*.15+aHalo.z*.006)*.42*impact;',
        '  float baseWave=glbWave+ridgeWave+reflected;',
        // 18 % Ruhezeit am unteren Rand, danach ein weicher individueller
        // Aufstieg. Am Zyklusende ist der Punkt bereits vollstaendig geloest.
        '  float cycle=fract(uTime*aRise.x+aRise.w);',
        '  float riseProgress=smoothstep(.18,1.0,cycle);',
        '  float waveCarry=1.0-smoothstep(.0,.46,riseProgress);',
        '  float radialScale=mix(1.0,.24,riseProgress);',
        '  float orbit=uTime*(.055+aHalo.w*.026)+riseProgress*(.7+aRise.z*2.2);',
        '  vec3 drifted=position;',
        '  drifted.x=cos(aHalo.x+orbit)*aHalo.y*radialScale;',
        '  drifted.z=sin(aHalo.x+orbit)*aHalo.y*radialScale;',
        '  float airDrift=sin(uTime*(.17+aRise.x*1.7)+aHalo.z)*aRise.z*riseProgress;',
        '  drifted.x+=cos(aHalo.x+aHalo.z)*airDrift;',
        '  drifted.z+=sin(aHalo.x+aHalo.z)*airDrift;',
        '  drifted.x+=cos(ridgePhase)*.08*waveCarry;',
        '  drifted.z+=sin(ridgePhase)*.055*waveCarry;',
        '  drifted.y+=baseWave*waveCarry+riseProgress*aRise.y;',
        '  vec4 mvPosition=modelViewMatrix*vec4(drifted,1.0);',
        '  gl_Position=projectionMatrix*mvPosition;',
        '  vDissolve=1.0-smoothstep(.08,1.0,riseProgress);',
        '  vTwinkle=.72+.28*sin(uTime*(.48+aHalo.w*.16)+aHalo.z);',
        '  gl_PointSize=(1.15+aHalo.w*.95)*mix(1.0,.34,riseProgress)*uPixelRatio*(31.0/max(6.0,-mvPosition.z));',
        '  vColor=aColor;',
        '}'
      ].join('\n'),
      fragmentShader:[
        'precision highp float;',
        'uniform float uReveal;',
        'uniform float uPulse;',
        'uniform float uBrightness;',
        'varying vec3 vColor;',
        'varying float vTwinkle;',
        'varying float vDissolve;',
        'void main(){',
        '  float radial=length(gl_PointCoord-vec2(.5))*2.0;',
        '  float glow=pow(max(0.0,1.0-radial),1.7);',
        '  float alpha=glow*uReveal*vDissolve*(.58+vTwinkle*.34)*(1.0+uPulse*.9);',
        '  if(alpha<.012) discard;',
        '  vec3 color=mix(vColor,vec3(1.0),.22+uPulse*.28);',
        '  gl_FragColor=vec4(color*(1.0+uPulse*.72)*uBrightness,alpha);',
        '}'
      ].join('\n'),
      transparent:true,
      depthWrite:false,
      depthTest:true,
      blending:THREE.AdditiveBlending,
      toneMapped:false
    });
    var haloPoints=new THREE.Points(haloGeometry,haloMaterial);
    haloPoints.name='ocean-immersion-halo';
    haloPoints.frustumCulled=false;
    haloPoints.renderOrder=9;
    world.add(haloPoints);
    return {points:haloPoints,material:haloMaterial};
  }
  // Der goldene Ozean bleibt erhalten; der zuvor darueber aufsteigende
  // Partikelring wird nicht mehr erzeugt.
  var oceanImmersionHalo=null;

  function updateNeuralParticleOceanWave(time){
    if(!neuralParticleOcean||!oceanWaveAnimationData) return;
    var animationDuration=oceanWaveAnimationData.duration;
    var animationFps=oceanWaveAnimationData.fps;
    var animationFrames=oceanWaveAnimationData.frames;
    var sourceTime=((time%animationDuration)+animationDuration)%animationDuration;
    var sourceFrame=sourceTime*animationFps;
    var sourceFrameA=Math.floor(sourceFrame)%animationFrames.length;
    var sourceFrameB=(sourceFrameA+1)%animationFrames.length;
    var sourceBlend=sourceFrame-Math.floor(sourceFrame);
    var frameA=animationFrames[sourceFrameA];
    var frameB=animationFrames[sourceFrameB];
    for(var controlIndex=0;controlIndex<neuralParticleOcean.sourceWaveControls.length;controlIndex++){
      var controlOffset=controlIndex*5;
      var sourceMeanZ=oceanWaveAnimationData.controls[controlIndex].meanZ;
      neuralParticleOcean.sourceWaveControls[controlIndex].set(
        frameA[controlOffset]+(frameB[controlOffset]-frameA[controlOffset])*sourceBlend,
        frameA[controlOffset+1]+(frameB[controlOffset+1]-frameA[controlOffset+1])*sourceBlend,
        frameA[controlOffset+2]+(frameB[controlOffset+2]-frameA[controlOffset+2])*sourceBlend-sourceMeanZ,
        1
      );
      neuralParticleOcean.sourceWaveTilts[controlIndex].set(
        frameA[controlOffset+3]+(frameB[controlOffset+3]-frameA[controlOffset+3])*sourceBlend,
        frameA[controlOffset+4]+(frameB[controlOffset+4]-frameA[controlOffset+4])*sourceBlend
      );
    }
  }
  fetch('/oceanWaveAnimation.json')
    .then(function(response){
      if(!response.ok) throw new Error('Ocean wave animation could not be loaded');
      return response.json();
    })
    .then(function(animationData){
      if(oceanWaveAnimationDisposed) return;
      oceanWaveAnimationData=animationData;
      updateNeuralParticleOceanWave(0);
    })
    .catch(function(error){
      console.warn(error);
    });

  function applyGoldRendering(){
    linesObj.material.opacity=Math.min(1,GOLD_RENDER.lineOpacity*GOLD_RENDER.intensity);
    wptsObj.material.opacity=Math.min(1,GOLD_RENDER.pointOpacity*GOLD_RENDER.intensity);
    wptsObj.material.size=SP.ptSize;
  }
  applyGoldRendering();

  var goldStrandHsl={h:0,s:0,l:0};
  var goldTunedColor=new THREE.Color();
  function tuneGoldStrandColor(target,red,green,blue,progress){
    target.setRGB(red,green,blue);
    target.getHSL(goldStrandHsl);
    target.setHSL(
      ((goldStrandHsl.h+GOLD_STRAND_TUNING.colorHue)%1+1)%1,
      THREE.MathUtils.clamp(goldStrandHsl.s*GOLD_STRAND_TUNING.colorSaturation,0,1),
      THREE.MathUtils.clamp(goldStrandHsl.l*GOLD_STRAND_TUNING.colorLightness,0,1)
    );
    var verticalBrightness=GOLD_STRAND_TUNING.topBrightness
      +(GOLD_STRAND_TUNING.bottomBrightness-GOLD_STRAND_TUNING.topBrightness)*progress;
    target.multiplyScalar(GOLD_STRAND_TUNING.colorIntensity*verticalBrightness);
  }

  function goldStrandBendWeight(progress){
    return smooth((progress-.22)/.78);
  }

  var fusionRedColor=new THREE.Color(0xd9788a);
  var fusionBlueColor=new THREE.Color(0x8ebef2);
  function updateGoldFusionColor(targetColors,baseColors,offset,vertexIndex){
    // Dieselbe Rot/Blau/Gold-Mischung wird bereits innerhalb des dichten
    // Wulsts übernommen und bleibt danach bis zum letzten Vertex erhalten.
    var fusionAmount=smoother((sMeta[vertexIndex*2]-.48)/.18)*.72;
    var selector=Math.sin(sMeta[vertexIndex*2+1]*2.71+vertexIndex*.037);
    var fusionColor=selector>.33?fusionRedColor:(selector<-.33?fusionBlueColor:GOLD.light);
    var progress=sMeta[vertexIndex*2];
    tuneGoldStrandColor(
      goldTunedColor,
      baseColors[offset]+(fusionColor.r-baseColors[offset])*fusionAmount,
      baseColors[offset+1]+(fusionColor.g-baseColors[offset+1])*fusionAmount,
      baseColors[offset+2]+(fusionColor.b-baseColors[offset+2])*fusionAmount,
      progress
    );
    targetColors[offset]=goldTunedColor.r;
    targetColors[offset+1]=goldTunedColor.g;
    targetColors[offset+2]=goldTunedColor.b;
  }

  function goldStrandVertexLocal(vertexIndex,out,includeEndOffset){
    var sourceOffset=vertexIndex*3;
    var strandDeltaY=sBase[sourceOffset+1]-SBASE_Y;
    out.set(
      SBASE_X+(sBase[sourceOffset]-SBASE_X)+worldVerticalInStrandLocal.x*strandDeltaY+wobbleX[vertexIndex],
      SBASE_Y+worldVerticalInStrandLocal.y*strandDeltaY,
      SBASE_Z+(sBase[sourceOffset+2]-SBASE_Z)+worldVerticalInStrandLocal.z*strandDeltaY+wobbleZ[vertexIndex]
    );
    out.addScaledVector(
      worldVerticalInStrandLocal,
      -wulstVerticalPull(sMeta[vertexIndex*2])
    );
    if(includeEndOffset&&strandEndTargetWorld){
      out.addScaledVector(strandEndOffsetLocal,goldStrandBendWeight(sMeta[vertexIndex*2]));
    }
    return out;
  }

  var goldRiseAxisNormal=new THREE.Vector3();
  var goldRiseAxisBinormal=new THREE.Vector3();
  function goldRisingParticleLocal(vertexIndex,time,out){
    var risePhase=goldParticleRisePhases[vertexIndex];
    var riseCycle=(time*goldParticleRiseSpeeds[vertexIndex]+risePhase)%1;
    // Kurze Pause unter der Oberflaeche, dann ein langsamer Aufstieg vom
    // unteren Strangende bis ueber die sichtbare Mitte des Hauptstrangs.
    var riseProgress=smoother((riseCycle-.12)/.88);
    var pathProgress=1-riseProgress*.72;
    sampleGoldCenterline(pathProgress,out);
    var centerDeltaY=out.y-SBASE_Y;
    out.set(
      SBASE_X+(out.x-SBASE_X)+worldVerticalInStrandLocal.x*centerDeltaY,
      SBASE_Y+worldVerticalInStrandLocal.y*centerDeltaY,
      SBASE_Z+(out.z-SBASE_Z)+worldVerticalInStrandLocal.z*centerDeltaY
    );
    out.addScaledVector(worldVerticalInStrandLocal,-wulstVerticalPull(pathProgress));
    if(strandEndTargetWorld){
      out.addScaledVector(strandEndOffsetLocal,goldStrandBendWeight(pathProgress));
    }

    // Ein kleiner Orbit haelt jeden Partikel sichtbar neben den Fasern. Der
    // Radius wird oben enger, sodass der Strom dem Mittelstrang folgt.
    goldRiseAxisNormal.set(1,0,0).addScaledVector(
      worldVerticalInStrandLocal,
      -worldVerticalInStrandLocal.x
    );
    if(goldRiseAxisNormal.lengthSq()<.0001) goldRiseAxisNormal.set(0,0,1);
    else goldRiseAxisNormal.normalize();
    goldRiseAxisBinormal.copy(worldVerticalInStrandLocal).cross(goldRiseAxisNormal).normalize();
    var riseAngle=goldParticleRiseAngles[vertexIndex]+time*(.13+goldParticleRiseSpeeds[vertexIndex]);
    var riseRadius=goldParticleRiseRadii[vertexIndex]*(1-riseProgress*.58);
    out.addScaledVector(goldRiseAxisNormal,Math.cos(riseAngle)*riseRadius);
    out.addScaledVector(goldRiseAxisBinormal,Math.sin(riseAngle)*riseRadius);

    // Die untere Welle gibt den Startimpuls. Sobald der Punkt aufsteigt,
    // verliert er diese gebundene Bewegung und driftet frei entlang der Achse.
    var waveCarry=1-smoother(riseProgress/.34);
    var lowerWave=(
      Math.sin(time*.52+risePhase*Math.PI*2)*.13
      +Math.sin(time*.19+risePhase*Math.PI*5.3)*.045
    )*waveCarry;
    out.addScaledVector(worldVerticalInStrandLocal,lowerWave);

    // Hoehenabhaengige Aufloesung: ab dem mittleren Aufstieg wird die Farbe
    // zunehmend gegen Schwarz gefahren; beim Zykluswechsel ist sie unsichtbar.
    return 1-smoother((riseProgress-.28)/.72);
  }

  function goldStrandTipLocal(out,includeEndOffset){
    var lowestY=Infinity;
    for(var tipFiberIndex=0;tipFiberIndex<sFibers.length;tipFiberIndex++){
      var tipFiber=sFibers[tipFiberIndex];
      var tipVertex=tipFiber.start+tipFiber.len-1;
      lowestY=Math.min(lowestY,sBase[tipVertex*3+1]);
    }
    var tipCount=0;
    out.set(0,0,0);
    for(var tipAverageIndex=0;tipAverageIndex<sFibers.length;tipAverageIndex++){
      var averageFiber=sFibers[tipAverageIndex];
      var averageVertex=averageFiber.start+averageFiber.len-1;
      if(sBase[averageVertex*3+1]>lowestY+.18) continue;
      goldStrandVertexLocal(averageVertex,goldDragScratch,includeEndOffset);
      out.add(goldDragScratch);
      tipCount++;
    }
    if(!tipCount){
      goldStrandVertexLocal(0,out,includeEndOffset);
      return out;
    }
    return out.multiplyScalar(1/tipCount);
  }

  function updateGoldEndOffset(){
    if(!strandEndTargetWorld){
      strandEndOffsetWorld.set(0,0,0);
      strandEndOffsetLocal.set(0,0,0);
      return;
    }
    brain.updateWorldMatrix(true,false);
    goldStrandTipLocal(goldTipLocal,false);
    goldTipWorld.copy(goldTipLocal);
    brain.localToWorld(goldTipWorld);
    strandEndOffsetWorld.copy(strandEndTargetWorld).sub(goldTipWorld);
    brain.getWorldQuaternion(goldDragQuaternion).invert();
    brain.getWorldScale(goldDragScale);
    strandEndOffsetLocal.copy(strandEndOffsetWorld).applyQuaternion(goldDragQuaternion);
    strandEndOffsetLocal.x/=Math.max(.0001,goldDragScale.x);
    strandEndOffsetLocal.y/=Math.max(.0001,goldDragScale.y);
    strandEndOffsetLocal.z/=Math.max(.0001,goldDragScale.z);
  }

  function goldStrandTipWorld(out,includeEndOffset){
    goldStrandTipLocal(goldTipLocal,includeEndOffset);
    out.copy(goldTipLocal);
    brain.localToWorld(out);
    return out;
  }

  // Echte transparente 3D-Glaskugel auf der zentralen Helixachse. Ihr
  // oberster Pol wird in jedem Frame exakt an die Y-Position des bewegten
  // Nervenstrang-Endpunkts gesetzt; x/z bleiben unverrückbar auf der Achse.
  var neuralGlassRadius=2.82;
  // Perspektivischer Kontakt-Ausgleich: Der geometrische Y-Pol erschien aus
  // dem schrägen Kamerawinkel oberhalb des sichtbaren Faserabschlusses. Diese
  // Absenkung entspricht der im Renderbild gemessenen Überlappung.
  var neuralGlassContactDrop=.9;
  var neuralGlassGeometry=new THREE.SphereGeometry(neuralGlassRadius,96,64);
  var neuralGlassMaterial=new THREE.MeshPhysicalMaterial({
    color:0x010204,
    emissive:0x000000,
    emissiveIntensity:0,
    transparent:false,
    opacity:1,
    transmission:0,
    thickness:1.8,
    ior:1.5,
    roughness:.94,
    metalness:0,
    clearcoat:0,
    clearcoatRoughness:1,
    specularIntensity:0,
    specularColor:0xffffff,
    depthWrite:false,
    side:THREE.DoubleSide
  });
  var neuralGlassSphere=new THREE.Mesh(neuralGlassGeometry,neuralGlassMaterial);
  neuralGlassSphere.name='helix-axis-glass-sphere';
  // Lokale Polachse deutlich zum Betrachter hin kippen. Die Kugel bleibt als
  // rotationssymmetrische Form zentriert; sichtbar verschieben sich vor allem
  // der gebündelte Faseransatz und die Hochglanzreflexe nach vorne.
  neuralGlassSphere.rotation.x=THREE.MathUtils.degToRad(14);
  neuralGlassSphere.renderOrder=18;
  neuralGlassSphere.frustumCulled=false;
  world.add(neuralGlassSphere);

  var neuralGlassGlowGeometry=new THREE.SphereGeometry(neuralGlassRadius*1.018,64,48);
  var neuralGlassGlowMaterial=new THREE.MeshBasicMaterial({
    color:0xb9d2e8,
    transparent:true,
    opacity:0,
    blending:THREE.AdditiveBlending,
    depthWrite:false,
    side:THREE.BackSide
  });
  var neuralGlassGlow=new THREE.Mesh(neuralGlassGlowGeometry,neuralGlassGlowMaterial);
  neuralGlassGlow.name='helix-axis-glass-sphere-glow';
  neuralGlassGlow.renderOrder=17;
  neuralGlassSphere.add(neuralGlassGlow);

  // Kleine, an der Kugel befestigte Studiolichter erzeugen auf dem nahezu
  // schwarzen Material klar lesbare Hochglanzreflexe und eine feine Kontur.
  var neuralGlassKeyLight=new THREE.PointLight(0xffffff,0,22,1.55);
  neuralGlassKeyLight.position.set(-4.2,4.8,5.6);
  neuralGlassSphere.add(neuralGlassKeyLight);
  var neuralGlassRimLight=new THREE.PointLight(0xc9e6ff,0,20,1.65);
  neuralGlassRimLight.position.set(4.8,1.2,-4.6);
  neuralGlassSphere.add(neuralGlassRimLight);
  var neuralGlassFillLight=new THREE.PointLight(0xffffff,0,18,1.8);
  neuralGlassFillLight.position.set(1.5,-1.2,5.8);
  neuralGlassSphere.add(neuralGlassFillLight);
  // Kugel inklusive ihrer gesamten Darstellung dauerhaft aus der Szene
  // entfernen. Die Ressourcen bleiben bis zum regulären Dispose erhalten,
  // werden aber weder gerendert noch pro Frame animiert.
  world.remove(neuralGlassSphere);

  // Dreidimensional aufliegende Nervenfasern: Alle Bahnen starten am oberen
  // Pol und folgen mit minimalem Oberflächenabstand der echten Kugelkrümmung.
  // Rot/Blau greifen die beiden Satellitenstränge auf; helle Fasern verbinden
  // sie optisch mit der schwarzen Hochglanzoberfläche.
  var sphereFiberPositions=[];
  var sphereFiberColors=[];
  var sphereFiberPointPositions=[];
  var sphereFiberPointColors=[];
  var sphereFiberVertexMeta=[];
  var sphereFiberLinePointIndices=[];
  var sphereFiberContinuationRefs=[];
  var sphereFiberRadius=neuralGlassRadius+.035;
  // Exakt eine Fortsetzung pro realer Faser des oberen Strangs.
  var sphereFiberOriginalCount=sFibers.length||FN.count;
  var sphereFiberAdditionalBlueCount=Math.floor(sphereFiberOriginalCount*.5);
  var sphereFiberCount=sphereFiberOriginalCount+sphereFiberAdditionalBlueCount;
  // Keine separate Kugelpalette: exakt dieselben Rot-/Blau-Instanzen, die
  // updateGoldFusionColor() am unteren Hauptstrang verwendet.
  var sphereFusionMixed=new THREE.Color();
  var sphereFiberMaxParentLength=1;
  for(var sphereFiberLengthIndex=0;sphereFiberLengthIndex<sFibers.length;sphereFiberLengthIndex++){
    sphereFiberMaxParentLength=Math.max(sphereFiberMaxParentLength,sFibers[sphereFiberLengthIndex].len);
  }
  var sphereFiberColor=new THREE.Color();
  var strandPointColorOffsetByVertex=new Map();
  for(var strandColorRefIndex=0;strandColorRefIndex<wobblePtsRefs.length;strandColorRefIndex++){
    var strandColorRef=wobblePtsRefs[strandColorRefIndex];
    if(!strandPointColorOffsetByVertex.has(strandColorRef.srcV)){
      strandPointColorOffsetByVertex.set(strandColorRef.srcV,strandColorRef.off);
    }
  }
  for(var sphereFiberIndex=0;sphereFiberIndex<sphereFiberCount;sphereFiberIndex++){
    var sphereFiberIsFineBlue=sphereFiberIndex>=sphereFiberOriginalCount;
    var sphereFiberSourceIndex=sphereFiberIsFineBlue
      ? (sphereFiberIndex-sphereFiberOriginalCount)*2%sphereFiberOriginalCount
      : sphereFiberIndex;
    // Keine neue Zufallsstruktur auf der Kugel. Länge, Phase, Farbe und
    // Laufrichtung stammen ausschließlich von der jeweiligen Originalfaser.
    var sphereFiberParent=sFibers.length?sFibers[sphereFiberSourceIndex%sFibers.length]:null;
    // Wie oben enden die Fasern unterschiedlich lang. Dadurch gibt es keinen
    // künstlichen Sammelpunkt am unteren Kugelpol.
    var sphereFiberLengthShare=sphereFiberParent?sphereFiberParent.len/sphereFiberMaxParentLength:1;
    var sphereFiberEndTheta=1.72+1.18*sphereFiberLengthShare;
    var sphereFiberParentVertex=sphereFiberParent
      ? sphereFiberParent.start+sphereFiberParent.len-1
      : 0;
    var sphereFiberParentPhase=sphereFiberParent
      ? sMeta[sphereFiberParent.start*2+1]
      : sphereFiberIndex*1.73;
    var sphereFiberContinuationPhase=sphereFiberParentPhase+(sphereFiberIsFineBlue
      ?.47+(sphereFiberIndex-sphereFiberOriginalCount)*.019
      :0);
    var sphereFiberParentColorOffset=strandPointColorOffsetByVertex.has(sphereFiberParentVertex)
      ? strandPointColorOffsetByVertex.get(sphereFiberParentVertex)
      : -1;
    var liveStrandColors=wptsObj.geometry.attributes.color.array;
    if(sphereFiberParentColorOffset>=0){
      sphereFiberColor.setRGB(
        liveStrandColors[sphereFiberParentColorOffset],
        liveStrandColors[sphereFiberParentColorOffset+1],
        liveStrandColors[sphereFiberParentColorOffset+2]
      );
    } else {
      sphereFiberColor.copy(GOLD.light);
    }
    // Gleicher Punktabstand wie im oberen Strang, auf die Bogenlänge der
    // jeweiligen Kugelfaser übertragen.
    var sphereFiberSegments=Math.max(24,Math.round(sphereFiberEndTheta*sphereFiberRadius/SP.spacing));
    var sphereFiberFirstPointIndex=sphereFiberPointPositions.length/3;
    for(var sphereFiberSegment=0;sphereFiberSegment<sphereFiberSegments;sphereFiberSegment++){
      var sphereFiberT=sphereFiberSegment/(sphereFiberSegments-1);
      var sphereFiberTheta=.018+sphereFiberEndTheta*sphereFiberT;
      // Die Initialwerte werden im Frame aus dem echten Endsegment ersetzt.
      var sphereFiberAngle=0;
      var sphereFiberSin=Math.sin(sphereFiberTheta);
      var sphereFiberX=sphereFiberRadius*sphereFiberSin*Math.cos(sphereFiberAngle);
      var sphereFiberY=sphereFiberRadius*Math.cos(sphereFiberTheta);
      var sphereFiberZ=sphereFiberRadius*sphereFiberSin*Math.sin(sphereFiberAngle);
      var sphereFiberPointIndex=sphereFiberPointPositions.length/3;
      if(sphereFiberSegment>0){
        var sphereFiberPrevOffset=(sphereFiberPointPositions.length/3-1)*3;
        sphereFiberLinePointIndices.push(sphereFiberPointIndex-1,sphereFiberPointIndex);
        sphereFiberPositions.push(
          sphereFiberPointPositions[sphereFiberPrevOffset],
          sphereFiberPointPositions[sphereFiberPrevOffset+1],
          sphereFiberPointPositions[sphereFiberPrevOffset+2],
          sphereFiberX,sphereFiberY,sphereFiberZ
        );
        var sphereFiberBrightness=.38+.62*(1-sphereFiberT*.72);
        sphereFiberColors.push(
          sphereFiberColor.r*sphereFiberBrightness,sphereFiberColor.g*sphereFiberBrightness,sphereFiberColor.b*sphereFiberBrightness,
          sphereFiberColor.r*sphereFiberBrightness,sphereFiberColor.g*sphereFiberBrightness,sphereFiberColor.b*sphereFiberBrightness
        );
      }
      sphereFiberPointPositions.push(sphereFiberX,sphereFiberY,sphereFiberZ);
      sphereFiberPointColors.push(sphereFiberColor.r,sphereFiberColor.g,sphereFiberColor.b);
      sphereFiberVertexMeta.push({
        fiberIndex:sphereFiberIndex,
        additionalFiber:sphereFiberIsFineBlue,
        theta:sphereFiberTheta,
        phase:sphereFiberContinuationPhase,
        travel:sphereFiberT,
        arc:sphereFiberTheta*sphereFiberRadius,
        parentVertex:sphereFiberParentVertex,
        parentColorOffset:sphereFiberParentColorOffset,
        escapeWeight:goldEscapeWeights[sphereFiberParentVertex]||0,
        escapePhase:goldEscapePhases[sphereFiberParentVertex]||0,
        escapeFrequency:goldEscapeFrequencies[sphereFiberParentVertex]||1,
        escapeSpeed:goldEscapeSpeeds[sphereFiberParentVertex]||1,
        arcShare:(sphereFiberEndTheta*sphereFiberRadius)/SP.length,
        red:sphereFiberColor.r,
        green:sphereFiberColor.g,
        blue:sphereFiberColor.b
      });
    }
    sphereFiberContinuationRefs.push({
      parentVertex:sphereFiberParentVertex,
      previousVertex:sphereFiberParent
        ? Math.max(sphereFiberParent.start,sphereFiberParentVertex-1)
        : sphereFiberParentVertex,
      spherePoint:sphereFiberFirstPointIndex,
      parentColorOffset:sphereFiberParentColorOffset
    });
  }
  // Kein zweites Faserobjekt: Die Fortsetzungen werden direkt hinten an die
  // bestehenden GPU-Puffer von neural-lines und neural-points angehängt.
  // Gehirn → Strang → Kugel ist damit pro Darstellungsart EIN Draw-Objekt.
  var originalLinePositions=linesObj.geometry.attributes.position.array;
  var originalLineColors=linesObj.geometry.attributes.color.array;
  var sphereLineBufferOffset=originalLinePositions.length;
  var mergedLinePositions=new Float32Array(sphereLineBufferOffset+sphereFiberPositions.length);
  var mergedLineColors=new Float32Array(sphereLineBufferOffset+sphereFiberColors.length);
  mergedLinePositions.set(originalLinePositions,0);
  mergedLineColors.set(originalLineColors,0);
  mergedLinePositions.set(sphereFiberPositions,sphereLineBufferOffset);
  mergedLineColors.set(sphereFiberColors,sphereLineBufferOffset);
  linesObj.geometry.setAttribute('position',new THREE.BufferAttribute(mergedLinePositions,3).setUsage(THREE.DynamicDrawUsage));
  linesObj.geometry.setAttribute('color',new THREE.BufferAttribute(mergedLineColors,3).setUsage(THREE.DynamicDrawUsage));
  // Nur die ursprüngliche Stranggeometrie zeichnen; alle früher angehängten
  // Kugelsegmente liegen außerhalb des Draw-Ranges.
  linesObj.geometry.setDrawRange(0,sphereLineBufferOffset/3);

  var originalPointPositions=wptsObj.geometry.attributes.position.array;
  var originalPointColors=wptsObj.geometry.attributes.color.array;
  var spherePointBufferOffset=originalPointPositions.length;
  var mergedPointPositions=new Float32Array(spherePointBufferOffset+sphereFiberPointPositions.length);
  var mergedPointColors=new Float32Array(spherePointBufferOffset+sphereFiberPointColors.length);
  mergedPointPositions.set(originalPointPositions,0);
  mergedPointColors.set(originalPointColors,0);
  mergedPointPositions.set(sphereFiberPointPositions,spherePointBufferOffset);
  mergedPointColors.set(sphereFiberPointColors,spherePointBufferOffset);
  wptsObj.geometry.setAttribute('position',new THREE.BufferAttribute(mergedPointPositions,3).setUsage(THREE.DynamicDrawUsage));
  wptsObj.geometry.setAttribute('color',new THREE.BufferAttribute(mergedPointColors,3).setUsage(THREE.DynamicDrawUsage));
  wptsObj.geometry.setDrawRange(0,spherePointBufferOffset/3);

  var lastSphereFiberUpdate=-1;
  var sphereToBrainMatrix=new THREE.Matrix4();
  var brainToSphereMatrix=new THREE.Matrix4();
  var sphereContinuationEndpoint=new THREE.Vector3();
  var sphereContinuationPrevious=new THREE.Vector3();
    var sphereContinuationScratch=new THREE.Vector3();
  var sphereContinuationDirection=new THREE.Vector3();
  var sphereContinuationPreviousDirection=new THREE.Vector3();
  var sphereContinuationData=[];
  function updateSphereFibers(time){
    return;
    /* Kugelfasern entfernt. */
    if(lastSphereFiberUpdate>=0&&time-lastSphereFiberUpdate<.028) return;
    lastSphereFiberUpdate=time;
    world.updateMatrixWorld(true);
    sphereToBrainMatrix.copy(brain.matrixWorld).invert().multiply(neuralGlassSphere.matrixWorld);
    brainToSphereMatrix.copy(neuralGlassSphere.matrixWorld).invert().multiply(brain.matrixWorld);
    var sphereTransformElements=sphereToBrainMatrix.elements;
    var animatedPointPositions=wptsObj.geometry.attributes.position.array;
    var animatedPointColors=wptsObj.geometry.attributes.color.array;
    var parentStrandColors=wptsObj.geometry.attributes.color.array;
    // Letzte zwei echte Vertices jeder Elternfaser in den lokalen Kugelraum
    // überführen. Daraus entstehen nahtloser Startpunkt und Eintrittstangente.
    sphereContinuationData.length=0;
    for(var sphereContinuationIndex=0;sphereContinuationIndex<sphereFiberContinuationRefs.length;sphereContinuationIndex++){
      var sphereContinuationRef=sphereFiberContinuationRefs[sphereContinuationIndex];
      goldStrandVertexLocal(sphereContinuationRef.parentVertex,goldDragScratch,true);
      sphereContinuationEndpoint.copy(goldDragScratch).applyMatrix4(brainToSphereMatrix);
      goldStrandVertexLocal(sphereContinuationRef.previousVertex,goldDragScratch,true);
      sphereContinuationPrevious.copy(goldDragScratch).applyMatrix4(brainToSphereMatrix);
      var sphereContinuationTangent=sphereContinuationEndpoint.clone().sub(sphereContinuationPrevious).normalize();
      sphereContinuationDirection.copy(sphereContinuationEndpoint).normalize();
      sphereContinuationPreviousDirection.copy(sphereContinuationPrevious).normalize();
      var sphereContinuationStartPhi=Math.atan2(sphereContinuationDirection.z,sphereContinuationDirection.x);
      var sphereContinuationPreviousPhi=Math.atan2(sphereContinuationPreviousDirection.z,sphereContinuationPreviousDirection.x);
      var sphereContinuationPhiStep=THREE.MathUtils.euclideanModulo(
        sphereContinuationStartPhi-sphereContinuationPreviousPhi+Math.PI,
        Math.PI*2
      )-Math.PI;
      var sphereContinuationSourceSpacing=Math.max(.0001,sphereContinuationEndpoint.distanceTo(sphereContinuationPrevious));
      sphereContinuationData.push({
        endpoint:sphereContinuationEndpoint.clone(),
        tangent:sphereContinuationTangent,
        startTheta:Math.acos(THREE.MathUtils.clamp(sphereContinuationDirection.y,-1,1)),
        startPhi:sphereContinuationStartPhi,
        // Exakt die lokale Drehgeschwindigkeit des letzten Originalsegments,
        // damit Nachbarschaft und Bündelstruktur unverändert weiterlaufen.
        phiPerUnit:THREE.MathUtils.clamp(sphereContinuationPhiStep/sphereContinuationSourceSpacing,-1.15,1.15)
      });
    }
    for(var sphereAnimatedIndex=0;sphereAnimatedIndex<sphereFiberVertexMeta.length;sphereAnimatedIndex++){
      var sphereAnimatedMeta=sphereFiberVertexMeta[sphereAnimatedIndex];
      var sphereAnimatedTravel=sphereAnimatedMeta.travel;
      var sphereContinuation=sphereContinuationData[sphereAnimatedMeta.fiberIndex];
      // Die Originalwellen laufen mit demselben fortgesetzten Wegparameter
      // weiter; es gibt keine separate Kugel-Wellenanimation.
      var sphereContinuedTravel=1+sphereAnimatedTravel*sphereAnimatedMeta.arcShare;
      // Identische beide Wellenformeln des oberen Strangs, nur in die lokale
      // Tangentialebene der Kugeloberfläche übertragen.
      var sphereLateralWave=(
        Math.sin(time*WIND.speed*2.95+sphereContinuedTravel*WIND.waveFrequency+sphereAnimatedMeta.phase)*WIND.wave
        +Math.sin(time*WIND.speed*1.31+sphereAnimatedMeta.phase)*WIND.sway*.08
      )*sphereContinuedTravel*sphereContinuedTravel;
      var sphereDepthWave=(
        Math.cos(time*WIND.speed*2.43+sphereContinuedTravel*WIND.waveFrequency*.78+sphereAnimatedMeta.phase)*WIND.wave*.82
        +Math.cos(time*WIND.speed*1.07+sphereAnimatedMeta.phase)*WIND.sway*.06
      )*sphereContinuedTravel*sphereContinuedTravel;
      // Der charakteristische dichte Wulst des Hauptstrangs besteht nicht
      // nur aus WIND, sondern vor allem aus diesen starken, phasenversetzten
      // Gum- und Escape-Wellen. Dieselben Formeln laufen auf der Kugel weiter.
      var sphereGumEnvelope=smoother(sphereAnimatedTravel/.16);
      var sphereGumTravel=stretchedWavePhase(sphereAnimatedTravel,8,1.35);
      var sphereGumAmplitude=THREE.MathUtils.lerp(.065,.38,smoother(sphereAnimatedTravel))*sphereGumEnvelope;
      sphereLateralWave+=Math.sin(
        sphereAnimatedMeta.phase+sphereGumTravel+time*WIND.speed*.42
      )*sphereGumAmplitude;
      sphereDepthWave+=Math.cos(
        sphereAnimatedMeta.phase*.83+sphereGumTravel*.91+time*WIND.speed*.34
      )*sphereGumAmplitude*.78;
      if(sphereAnimatedMeta.escapeWeight){
        var sphereEscapeEnvelope=smooth(sphereAnimatedTravel/.2)*smooth((1-sphereAnimatedTravel)/.18);
        var sphereEscapeTravel=sphereContinuedTravel*sphereAnimatedMeta.escapeFrequency*GOLD_STRAND_TUNING.escapeFrequency/GOLD_STRAND_TUNING.escapeWavelength
          -time*sphereAnimatedMeta.escapeSpeed*GOLD_STRAND_TUNING.escapeSpeed;
        var sphereEscapeWave=(Math.sin(sphereEscapeTravel+sphereAnimatedMeta.escapePhase)
          +Math.sin(sphereEscapeTravel*1.71+sphereAnimatedMeta.escapePhase*.43)*.36)
          *sphereAnimatedMeta.escapeWeight*GOLD_STRAND_TUNING.escapeAmplitude*sphereEscapeEnvelope*.18;
        sphereLateralWave+=Math.cos(sphereAnimatedMeta.phase)*sphereEscapeWave;
        sphereDepthWave+=Math.sin(sphereAnimatedMeta.phase)*sphereEscapeWave*.72;
      }
      // Mehrskalige, phasengleiche Verwebung wie im dichten Hauptstrang.
      // Die Auslenkung bleibt in echten Welteinheiten und wird erst danach
      // tangential auf die Kugel gelegt — so entstehen organische Kreuzungen
      // statt sauberer Längengrade.
      var sphereWeaveEnvelope=smoother(sphereAnimatedTravel/.055);
      var sphereWeaveTravel=stretchedWavePhase(sphereAnimatedTravel,13.8,1.62);
      var sphereWeaveAmplitude=THREE.MathUtils.lerp(.28,.92,smoother(sphereAnimatedTravel))
        *sphereWeaveEnvelope;
      sphereLateralWave+=(
        Math.sin(sphereAnimatedMeta.phase+sphereWeaveTravel+time*WIND.speed*.28)
        +Math.sin(sphereAnimatedMeta.phase*.47+sphereWeaveTravel*1.83-time*WIND.speed*.17)*.52
      )*sphereWeaveAmplitude;
      sphereDepthWave+=(
        Math.cos(sphereAnimatedMeta.phase*.83+sphereWeaveTravel*.91+time*WIND.speed*.23)
        +Math.cos(sphereAnimatedMeta.phase*1.31+sphereWeaveTravel*1.57+time*WIND.speed*.13)*.48
      )*sphereWeaveAmplitude*.9;
      // Keine Auffächerung: Die bestehende Winkelordnung der Faserenden wird
      // bewahrt und nur deren reale Enddrehung entlang der Kugel fortgesetzt.
      var sphereAnimatedAngle=sphereContinuation.startPhi
        +sphereContinuation.phiPerUnit*sphereAnimatedMeta.arc
        +sphereLateralWave/sphereFiberRadius;
      var sphereAnimatedTheta=sphereContinuation.startTheta
        +sphereAnimatedMeta.arc/sphereFiberRadius
        +sphereDepthWave/sphereFiberRadius;
      // Ausgeprägte dreidimensionale Wülste: einzelne Fasergruppen steigen
      // sichtbar über die Oberfläche, statt nur flach auf ihr zu mäandrieren.
      var sphereBulgeWave=Math.sin(
        sphereAnimatedMeta.phase*.71+sphereWeaveTravel*.64+time*WIND.speed*.19
      );
      var sphereBulgeCluster=Math.pow(Math.max(0,sphereBulgeWave),2)
        *THREE.MathUtils.lerp(.08,.34,smoother(sphereAnimatedTravel))
        *sphereWeaveEnvelope;
      var sphereAnimatedRadius=sphereFiberRadius+sphereBulgeCluster
        +Math.sin(time*WIND.speed*2.43+sphereAnimatedMeta.phase+sphereContinuedTravel*WIND.waveFrequency*.78)*WIND.wave*.35;
      var sphereAnimatedSin=Math.sin(sphereAnimatedTheta);
      var sphereLocalX=sphereAnimatedRadius*sphereAnimatedSin*Math.cos(sphereAnimatedAngle);
      var sphereLocalY=sphereAnimatedRadius*Math.cos(sphereAnimatedTheta);
      var sphereLocalZ=sphereAnimatedRadius*sphereAnimatedSin*Math.sin(sphereAnimatedAngle);
      // Vertex 0 IST der Originalendpunkt. Die ersten Folgevertices führen
      // dessen Eintrittstangente weich auf die gekrümmte Oberfläche über.
      var sphereSurfaceAttach=smoother(sphereAnimatedTravel/.075);
      var sphereTangentTravel=Math.min(sphereAnimatedTravel/.075,1)*SP.spacing*3.2;
      sphereContinuationScratch.copy(sphereContinuation.endpoint)
        .addScaledVector(sphereContinuation.tangent,sphereTangentTravel);
      sphereLocalX=THREE.MathUtils.lerp(sphereContinuationScratch.x,sphereLocalX,sphereSurfaceAttach);
      sphereLocalY=THREE.MathUtils.lerp(sphereContinuationScratch.y,sphereLocalY,sphereSurfaceAttach);
      sphereLocalZ=THREE.MathUtils.lerp(sphereContinuationScratch.z,sphereLocalZ,sphereSurfaceAttach);
      var sphereAnimatedOffset=spherePointBufferOffset+sphereAnimatedIndex*3;
      animatedPointPositions[sphereAnimatedOffset]=sphereTransformElements[0]*sphereLocalX+sphereTransformElements[4]*sphereLocalY+sphereTransformElements[8]*sphereLocalZ+sphereTransformElements[12];
      animatedPointPositions[sphereAnimatedOffset+1]=sphereTransformElements[1]*sphereLocalX+sphereTransformElements[5]*sphereLocalY+sphereTransformElements[9]*sphereLocalZ+sphereTransformElements[13];
      animatedPointPositions[sphereAnimatedOffset+2]=sphereTransformElements[2]*sphereLocalX+sphereTransformElements[6]*sphereLocalY+sphereTransformElements[10]*sphereLocalZ+sphereTransformElements[14];

      var sphereParentColorOffset=sphereAnimatedMeta.parentColorOffset;
      var sphereLiveRed=sphereParentColorOffset>=0?parentStrandColors[sphereParentColorOffset]:sphereAnimatedMeta.red;
      var sphereLiveGreen=sphereParentColorOffset>=0?parentStrandColors[sphereParentColorOffset+1]:sphereAnimatedMeta.green;
      var sphereLiveBlue=sphereParentColorOffset>=0?parentStrandColors[sphereParentColorOffset+2]:sphereAnimatedMeta.blue;
      // Die Originalhelligkeit steuert weiterhin jede einzelne Faser; der
      // Farbton wird jedoch auf dieselbe gemeinsame Rot/Blau-Mischung wie im
      // sichtbaren Strang normiert. Blau bleibt dabei klar dominant.
      var sphereLiveLuminance=THREE.MathUtils.clamp(
        sphereLiveRed*.2126+sphereLiveGreen*.7152+sphereLiveBlue*.0722,
        .16,
        .72
      );
      var sphereFusionSelector=Math.sin(sphereAnimatedMeta.phase*2.71+sphereAnimatedMeta.fiberIndex*.037);
      // Blau dominiert wie im sichtbaren Zielbereich; Violett entsteht nicht
      // als Ersatzfarbe, sondern physisch durch die Überlagerung beider Farben.
      var sphereUsesRed=sphereFusionSelector>.48;
      sphereFusionMixed.copy(sphereUsesRed?fusionRedColor:fusionBlueColor);
      var sphereFusionBrightness=THREE.MathUtils.clamp(
        .5+sphereLiveLuminance*.5,
        .58,
        .88
      );
      if(sphereUsesRed) sphereFusionBrightness*=.76;
      if(sphereAnimatedMeta.additionalFiber) sphereFusionBrightness*=.24;
      animatedPointColors[sphereAnimatedOffset]=sphereFusionMixed.r*sphereFusionBrightness;
      animatedPointColors[sphereAnimatedOffset+1]=sphereFusionMixed.g*sphereFusionBrightness;
      animatedPointColors[sphereAnimatedOffset+2]=sphereFusionMixed.b*sphereFusionBrightness;
    }
    var animatedLinePositions=linesObj.geometry.attributes.position.array;
    var animatedLineColors=linesObj.geometry.attributes.color.array;
    for(var sphereLineIndex=0;sphereLineIndex<sphereFiberLinePointIndices.length;sphereLineIndex++){
      var sphereSourcePoint=sphereFiberLinePointIndices[sphereLineIndex];
      var sphereSourceOffset=spherePointBufferOffset+sphereSourcePoint*3;
      var sphereLineOffset=sphereLineBufferOffset+sphereLineIndex*3;
      animatedLinePositions[sphereLineOffset]=animatedPointPositions[sphereSourceOffset];
      animatedLinePositions[sphereLineOffset+1]=animatedPointPositions[sphereSourceOffset+1];
      animatedLinePositions[sphereLineOffset+2]=animatedPointPositions[sphereSourceOffset+2];
      animatedLineColors[sphereLineOffset]=animatedPointColors[sphereSourceOffset];
      animatedLineColors[sphereLineOffset+1]=animatedPointColors[sphereSourceOffset+1];
      animatedLineColors[sphereLineOffset+2]=animatedPointColors[sphereSourceOffset+2];
    }
    wptsObj.geometry.attributes.position.needsUpdate=true;
    wptsObj.geometry.attributes.color.needsUpdate=true;
    linesObj.geometry.attributes.position.needsUpdate=true;
    linesObj.geometry.attributes.color.needsUpdate=true;
  }

  var neuralGlassTipWorld=new THREE.Vector3();
  function updateNeuralGlassSphere(){
    return;
    /* Kugel entfernt. */
    goldStrandTipWorld(neuralGlassTipWorld,true);
    neuralGlassSphere.position.set(
      0,
      neuralGlassTipWorld.y-neuralGlassRadius-neuralGlassContactDrop,
      0
    );
  }
  updateNeuralGlassSphere();
  updateSphereFibers(0);

  function livingOrganismVertexLocal(vertexIndex,out,time){
    var organismVertexMeta=organismMeta[vertexIndex];
    if(!organismVertexMeta) return out.set(0,0,0);
    if(organismVertexMeta.static){
      var staticParentOffset=organismVertexMeta.parentVertex*3;
      out.set(sBase[staticParentOffset],sBase[staticParentOffset+1],sBase[staticParentOffset+2]);
      out.addScaledVector(
        worldVerticalInStrandLocal,
        -wulstVerticalPull(sMeta[organismVertexMeta.parentVertex*2])
      );
    } else {
      goldStrandVertexLocal(organismVertexMeta.parentVertex,out,true);
    }
    var organismOffset=vertexIndex*3;
    out.x+=organismVertices[organismOffset];
    out.y+=organismVertices[organismOffset+1];
    out.z+=organismVertices[organismOffset+2];
    var waveStrength=organismVertexMeta.waveStrength;
    if(waveStrength<=.0001) return out;
    var waveTravel=organismVertexMeta.travel;
    var wavePhase=organismVertexMeta.phase;
    var lateralWave=(
      Math.sin(time*WIND.speed*2.95+waveTravel*WIND.waveFrequency+wavePhase)*WIND.wave
      +Math.sin(time*WIND.speed*1.31+wavePhase)*WIND.sway*.08
    )*waveStrength;
    var depthWave=(
      Math.cos(time*WIND.speed*2.43+waveTravel*WIND.waveFrequency*.78+wavePhase)*WIND.wave*.82
      +Math.cos(time*WIND.speed*1.07+wavePhase)*WIND.sway*.06
    )*waveStrength;
    out.x+=organismRightX*lateralWave+organismForwardX*depthWave;
    out.z+=organismRightZ*lateralWave+organismForwardZ*depthWave;
    return out;
  }

  function updateGoldStrandGeometry(time){
    if(!STRAND_ON||!vc) return;
    for(var strandVertexIndex=0;strandVertexIndex<vc;strandVertexIndex++){
      var strandProgress=sMeta[strandVertexIndex*2], strandPhase=sMeta[strandVertexIndex*2+1];
      wobbleX[strandVertexIndex]=Math.sin(time*WIND.speed*2.95+strandProgress*WIND.waveFrequency+strandPhase)*WIND.wave*strandProgress*strandProgress
        +Math.sin(time*WIND.speed*1.31+strandPhase)*WIND.sway*.08*strandProgress*strandProgress;
      wobbleZ[strandVertexIndex]=Math.cos(time*WIND.speed*2.43+strandProgress*WIND.waveFrequency*.78+strandPhase)*WIND.wave*.82*strandProgress*strandProgress
        +Math.cos(time*WIND.speed*1.07+strandPhase)*WIND.sway*.06*strandProgress*strandProgress;
      var goldGumProgress=wulstWaveProgress(strandProgress);
      if(goldGumProgress>0){
        var goldGumEnvelope=smoother(goldGumProgress/.2);
        // Die Frequenz fällt nach unten stark ab. Zusammen mit der vertikalen
        // Dehnung werden die Wellen dadurch sichtbar länger, je näher sie dem
        // unteren Ende kommen.
        var goldGumTravel=stretchedWavePhase(
          goldGumProgress,
          5.4/WULST_TUNING.stretch,
          .62/WULST_TUNING.stretch
        );
        var goldGumAmplitude=THREE.MathUtils.lerp(.035,.2,smoother(goldGumProgress))
          *goldGumEnvelope*WULST_TUNING.liquify;
        wobbleX[strandVertexIndex]+=Math.sin(
          strandPhase+goldGumTravel+time*WIND.speed*.42
        )*goldGumAmplitude;
        wobbleZ[strandVertexIndex]+=Math.cos(
          strandPhase*.83+goldGumTravel*.91+time*WIND.speed*.34
        )*goldGumAmplitude*.78;
      }
      var goldEscapeWeight=goldEscapeWeights[strandVertexIndex]||0;
      if(goldEscapeWeight){
        var goldEscapeEnvelope=smooth((strandProgress-.08)/.2)*smooth((.96-strandProgress)/.18);
        var goldEscapeTravel=strandProgress*goldEscapeFrequencies[strandVertexIndex]*GOLD_STRAND_TUNING.escapeFrequency/GOLD_STRAND_TUNING.escapeWavelength
          -time*goldEscapeSpeeds[strandVertexIndex]*GOLD_STRAND_TUNING.escapeSpeed;
        var goldEscapeWave=(Math.sin(goldEscapeTravel+goldEscapePhases[strandVertexIndex])
          +Math.sin(goldEscapeTravel*1.71+goldEscapePhases[strandVertexIndex]*.43)*.36)
          *goldEscapeWeight*GOLD_STRAND_TUNING.escapeAmplitude*goldEscapeEnvelope*.18;
        wobbleX[strandVertexIndex]+=Math.cos(strandPhase)*goldEscapeWave;
        wobbleZ[strandVertexIndex]+=Math.sin(strandPhase)*goldEscapeWave*.72;
      }
    }
    updateGoldEndOffset();
    for(var organismVertexIndex=0;organismVertexIndex<organismMeta.length;organismVertexIndex++){
      livingOrganismVertexLocal(organismVertexIndex,organismScratch,time);
      var organismCurrentOffset=organismVertexIndex*3;
      organismCurrent[organismCurrentOffset]=organismScratch.x;
      organismCurrent[organismCurrentOffset+1]=organismScratch.y;
      organismCurrent[organismCurrentOffset+2]=organismScratch.z;
    }
    var linePositionArray=linesObj.geometry.attributes.position.array;
    var lineColorArray=linesObj.geometry.attributes.color.array;
    for(var lineReferenceIndex=0;lineReferenceIndex<wobbleLineRefs.length;lineReferenceIndex++){
      var lineReference=wobbleLineRefs[lineReferenceIndex];
      goldStrandVertexLocal(lineReference.srcV,goldDragScratch,true);
      linePositionArray[lineReference.off]=goldDragScratch.x;
      linePositionArray[lineReference.off+1]=goldDragScratch.y;
      linePositionArray[lineReference.off+2]=goldDragScratch.z;
      updateGoldFusionColor(lineColorArray,goldLineBaseColors,lineReference.off,lineReference.srcV);
    }
    for(var organismLineReferenceIndex=0;organismLineReferenceIndex<organismLineRefs.length;organismLineReferenceIndex++){
      var organismLineReference=organismLineRefs[organismLineReferenceIndex];
      var organismLineSourceOffset=organismLineReference.src*3;
      linePositionArray[organismLineReference.off]=organismCurrent[organismLineSourceOffset];
      linePositionArray[organismLineReference.off+1]=organismCurrent[organismLineSourceOffset+1];
      linePositionArray[organismLineReference.off+2]=organismCurrent[organismLineSourceOffset+2];
    }
    linesObj.geometry.attributes.position.needsUpdate=true;
    linesObj.geometry.attributes.color.needsUpdate=true;
    var pointPositionArray=wptsObj.geometry.attributes.position.array;
    var pointColorArray=wptsObj.geometry.attributes.color.array;
    for(var pointReferenceIndex=0;pointReferenceIndex<wobblePtsRefs.length;pointReferenceIndex++){
      var pointReference=wobblePtsRefs[pointReferenceIndex];
      var goldPointDissolve=1;
      if(goldParticleRiseActive[pointReference.srcV]){
        goldPointDissolve=goldRisingParticleLocal(pointReference.srcV,time,goldDragScratch);
      } else {
        goldStrandVertexLocal(pointReference.srcV,goldDragScratch,true);
      }
      pointPositionArray[pointReference.off]=goldDragScratch.x;
      pointPositionArray[pointReference.off+1]=goldDragScratch.y;
      pointPositionArray[pointReference.off+2]=goldDragScratch.z;
      updateGoldFusionColor(pointColorArray,goldPointBaseColors,pointReference.off,pointReference.srcV);
      // Das ist der tatsaechlich sichtbare Punkt-Buffer am Mittelstrang.
      // Nur seine Goldpartikel werden halbiert; Linien und Gehirn behalten
      // ihre bisherige Leuchtkraft. Aufsteiger blenden zusaetzlich nach oben aus.
      var goldPointBrightness=.5*goldPointDissolve;
      pointColorArray[pointReference.off]*=goldPointBrightness;
      pointColorArray[pointReference.off+1]*=goldPointBrightness;
      pointColorArray[pointReference.off+2]*=goldPointBrightness;
    }
    for(var organismPointReferenceIndex=0;organismPointReferenceIndex<organismPointRefs.length;organismPointReferenceIndex++){
      var organismPointReference=organismPointRefs[organismPointReferenceIndex];
      var organismPointSourceOffset=organismPointReference.src*3;
      pointPositionArray[organismPointReference.off]=organismCurrent[organismPointSourceOffset];
      pointPositionArray[organismPointReference.off+1]=organismCurrent[organismPointSourceOffset+1];
      pointPositionArray[organismPointReference.off+2]=organismCurrent[organismPointSourceOffset+2];
    }
    wptsObj.geometry.attributes.position.needsUpdate=true;
    wptsObj.geometry.attributes.color.needsUpdate=true;
    goldStrandTipWorld(goldTipWorld,true);
    if(goldDragHandle){
      goldDragHandle.position.copy(goldTipWorld);
      goldDragHandleMaterial.opacity=(goldDragActive||goldDragHovered)?.86:.42;
    }
  }

  function persistGoldStrandEnd(){
    try {
      if(!strandEndTargetWorld){ window.localStorage.removeItem(GOLD_STRAND_END_KEY); return; }
      window.localStorage.setItem(GOLD_STRAND_END_KEY,JSON.stringify({
        x:strandEndTargetWorld.x,
        y:strandEndTargetWorld.y,
        z:strandEndTargetWorld.z
      }));
    } catch(_) {}
  }

  function resetGoldStrandEnd(){
    strandEndTargetWorld=null;
    strandEndOffsetWorld.set(0,0,0);
    strandEndOffsetLocal.set(0,0,0);
    persistGoldStrandEnd();
  }

  goldDragHandleMaterial=new THREE.SpriteMaterial({
    map:sprite,
    color:GOLD.line,
    transparent:true,
    opacity:.42,
    blending:THREE.AdditiveBlending,
    depthWrite:false,
    depthTest:false
  });
  goldDragHandle=new THREE.Sprite(goldDragHandleMaterial);
  goldDragHandle.name='gold-strand-drag-handle';
  goldDragHandle.scale.set(.18,.18,1);
  goldDragHandle.visible=!isMobile;
  scene.add(goldDragHandle);

  function rebuildStrand(){
    var newLPos=baseLinePos.slice(), newLCol=baseLineCol.slice();
    var newWPos=baseWPos.slice(), newWCol=baseWCol.slice();
    if(STRAND_ON) genStrandInto(newLPos,newLCol,newWPos,newWCol);
    resetWobbleBuffers();
    rebuildGoldCenterline();
    var ng=new THREE.BufferGeometry();
    ng.setAttribute('position',new THREE.Float32BufferAttribute(newLPos,3));
    ng.setAttribute('color',new THREE.Float32BufferAttribute(newLCol,3));
    linesObj.geometry.dispose();
    linesObj.geometry=ng;
    var nwg=new THREE.BufferGeometry();
    nwg.setAttribute('position',new THREE.Float32BufferAttribute(newWPos,3));
    nwg.setAttribute('color',new THREE.Float32BufferAttribute(newWCol,3));
    wptsObj.geometry.dispose();
    wptsObj.geometry=nwg;
    goldLineBaseColors=linesObj.geometry.attributes.color.array.slice();
    goldPointBaseColors=wptsObj.geometry.attributes.color.array.slice();
    applyGoldRendering();
    if(satelliteStrands&&satelliteStrands.length) rebuildSecondaryStrands();
  }

  var deg=new Uint8Array(scatterN), xpos=[];
  for(i=0;i<scatterN;i++){
    for(var j=i+1;j<scatterN;j++){
      if(deg[i]>2) break;
      if(deg[j]>2) continue;
      if(pts[i].y<TAPER_Y_EARLY||pts[j].y<TAPER_Y_EARLY) continue;
      if(pts[i].distanceToSquared(pts[j])<.02&&Math.random()<.5){
        xpos.push(pts[i].x,pts[i].y,pts[i].z,pts[j].x,pts[j].y,pts[j].z);
        pairs.push([i,j]); deg[i]++; deg[j]++;
      }
    }
  }
  var xgeo=new THREE.BufferGeometry();
  xgeo.setAttribute('position',new THREE.Float32BufferAttribute(xpos,3));
  brain.add(dbgHide('cross',new THREE.LineSegments(xgeo,new THREE.LineBasicMaterial({color:GOLD.line,transparent:true,opacity:.1,blending:THREE.AdditiveBlending,depthWrite:false}))));

  // --- Feines, wirres Liniengewebe: viele zusätzliche dünne Verbindungen
  // zwischen den goldenen Punkten, überzieht das Gehirn dichter ---
  var degFine=new Uint16Array(scatterN), finePos=[], fineCol=[];
  var FINE_MIN2=.0012, FINE_MAX2=isMobile?.045:.065, FINE_DEG=isMobile?9:14, FINE_PROB=.95;
  // the narrow brainstem taper is a tight tube — a full degree cap there packs
  // too many crossing lines into a tiny volume and fuses into a solid blob
  var TAPER_Y=-0.15, TAPER_FINE_DEG=1, TAPER_FINE_MIN2=.012;
  function fineDegCap(idx){ return pts[idx].y<TAPER_Y ? TAPER_FINE_DEG : FINE_DEG; }
  function fineMin2Cap(iA,iB){ return (pts[iA].y<TAPER_Y||pts[iB].y<TAPER_Y) ? TAPER_FINE_MIN2 : FINE_MIN2; }
  for(i=0;i<scatterN;i++){
    if(degFine[i]>=fineDegCap(i)) continue;
    for(var jf=i+1;jf<scatterN;jf++){
      if(degFine[i]>=fineDegCap(i)) break;
      if(degFine[jf]>=fineDegCap(jf)) continue;
      var d2f=pts[i].distanceToSquared(pts[jf]);
      if(d2f>fineMin2Cap(i,jf)&&d2f<FINE_MAX2&&Math.random()<FINE_PROB){
        finePos.push(pts[i].x,pts[i].y,pts[i].z,pts[jf].x,pts[jf].y,pts[jf].z);
        cc.copy(golds[Math.floor(Math.random()*golds.length)]);
        var ffa=taperFade(pts[i].y)*neuralShade(pts[i].x,pts[i].y,pts[i].z), ffb=taperFade(pts[jf].y)*neuralShade(pts[jf].x,pts[jf].y,pts[jf].z);
        fineCol.push(cc.r*ffa,cc.g*ffa,cc.b*ffa,cc.r*ffb,cc.g*ffb,cc.b*ffb);
        pairs.push([i,jf]);
        degFine[i]++; degFine[jf]++;
      }
    }
  }
  var fgeo=new THREE.BufferGeometry();
  fgeo.setAttribute('position',new THREE.Float32BufferAttribute(finePos,3));
  fgeo.setAttribute('color',new THREE.Float32BufferAttribute(fineCol,3));
  brain.add(dbgHide('fine',new THREE.LineSegments(fgeo,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.075,blending:THREE.AdditiveBlending,depthWrite:false}))));

  // --- Verbindungsgraph aller goldenen Linien (Walks + Cross-Links + Feingewebe),
  // dient den blauen Nervenblitzen als Wegenetz zum "Entlangfolgen" ---
  var graphAdj=[]; for(i=0;i<pts.length;i++) graphAdj.push([]);
  pairs.forEach(function(p){ graphAdj[p[0]].push(p[1]); graphAdj[p[1]].push(p[0]); });

  var npos=[];
  for(var nodeOffset=0;nodeOffset<BR.nodes.length;nodeOffset+=3){
    if(BR.nodes[nodeOffset+1]<ORIGINAL_STUMP_CUTOFF) continue;
    npos.push(BR.nodes[nodeOffset],BR.nodes[nodeOffset+1],BR.nodes[nodeOffset+2]);
  }
  var nodesP=pointsObj(npos,null,.21,.44);
  brain.add(dbgHide('nodes',nodesP));

  function halo(sc,op,hy){
    var sm=new THREE.SpriteMaterial({map:sprite,color:GOLD.core,transparent:true,opacity:op,blending:THREE.AdditiveBlending,depthWrite:false});
    var sp=new THREE.Sprite(sm); sp.scale.set(sc,sc,1); sp.position.y=hy; brain.add(sp);
  }
  if (typeof window==='undefined' || new URLSearchParams(window.location.search).get('nohalo')!=='1') {
    halo(6.2,.035,0); halo(3.7,.06,.1); halo(1.9,.11,.2);
  }

  var satelliteBrains=[];
  function hideSatelliteTail(satellite){
    var satelliteLines=satellite.getObjectByName('neural-lines');
    var satellitePoints=satellite.getObjectByName('neural-points');
    var linePositions=satelliteLines.geometry.attributes.position.array;
    var lineColors=satelliteLines.geometry.attributes.color.array;
    var pointPositions=satellitePoints.geometry.attributes.position.array;
    var pointColors=satellitePoints.geometry.attributes.color.array;
    for(var lineIndex=baseLinePos.length;lineIndex<linePositions.length;lineIndex+=3){
      linePositions[lineIndex]=SBASE_X;
      linePositions[lineIndex+1]=SBASE_Y;
      linePositions[lineIndex+2]=SBASE_Z;
      lineColors[lineIndex]=0;
      lineColors[lineIndex+1]=0;
      lineColors[lineIndex+2]=0;
    }
    for(var pointIndex=baseWPos.length;pointIndex<pointPositions.length;pointIndex+=3){
      pointPositions[pointIndex]=SBASE_X;
      pointPositions[pointIndex+1]=SBASE_Y;
      pointPositions[pointIndex+2]=SBASE_Z;
      pointColors[pointIndex]=0;
      pointColors[pointIndex+1]=0;
      pointColors[pointIndex+2]=0;
    }
    satelliteLines.geometry.attributes.position.needsUpdate=true;
    satelliteLines.geometry.attributes.color.needsUpdate=true;
    satellitePoints.geometry.attributes.position.needsUpdate=true;
    satellitePoints.geometry.attributes.color.needsUpdate=true;
  }
  function tintSatelliteBrain(satellite,palette){
    var tintColor=palette.primary;
    satellite.traverse(function(part){
      if(part.geometry&&part.geometry.attributes&&part.geometry.attributes.color){
        var tintedGeometry=part.geometry.clone();
        var colorAttribute=tintedGeometry.attributes.color;
        for(var colorIndex=0;colorIndex<colorAttribute.count;colorIndex++){
          var brightness=Math.max(colorAttribute.getX(colorIndex),colorAttribute.getY(colorIndex),colorAttribute.getZ(colorIndex));
          // Derselbe seidige Metallic-Verlauf wie im Faserbündel: tiefe
          // Schatten, Bordeaux/Blau als Grundton und seltene Glanzlichter.
          var metallic=.5+.5*Math.sin(colorIndex*12.9898+colorIndex*.071);
          var from=metallic<.5?palette.deep:palette.primary;
          var to=metallic<.5?palette.primary:palette.light;
          var blend=metallic<.5?metallic*2:(metallic-.5)*2;
          var shade=.34+brightness*.76;
          colorAttribute.setXYZ((from.r+(to.r-from.r)*blend)*shade,(from.g+(to.g-from.g)*blend)*shade,(from.b+(to.b-from.b)*blend)*shade);
        }
        colorAttribute.needsUpdate=true;
        part.geometry=tintedGeometry;
      }
      if(part.material){
        var tintedMaterial=part.material.clone();
        if(tintedMaterial.color){
          // Die Satelliten dürfen niemals Restfarben des goldenen
          // Ausgangsgehirns durch Vertex-Farben übernehmen. Ihre komplette
          // Drahtstruktur bleibt deshalb strikt in der eigenen Metallpalette.
          tintedMaterial.vertexColors=false;
          tintedMaterial.color.copy(part.isPoints?palette.light:tintColor);
        }
        part.material=tintedMaterial;
      }
    });
  }
  function addSatelliteBrain(x,y,z,phase,palette){
    var satellite=brain.clone(true);
    tintSatelliteBrain(satellite,palette);
    satellite.scale.setScalar(1.76);
    satellite.position.set(x,y,z);
    satellite.rotation.set(BASE_X,BASE_Y,0);
    satellite.userData={baseX:x,baseY:y,baseZ:z,baseRotY:BASE_Y,phase:phase};
    world.add(satellite);
    satelliteBrains.push(satellite);
    return satellite;
  }
  // Auf schmalen Mobile-Viewports ist das horizontale Sichtfeld der Kamera
  // (gleiche vertikale FOV, aber viel kleineres Seitenverhältnis) deutlich
  // enger als auf Desktop — bei den Desktop-Offsets (±5.7) wären die
  // Satelliten-Gehirne komplett ausserhalb des sichtbaren Bereichs.
  // Position wird aus dem tatsächlichen Kamera-FOV/Seitenverhältnis
  // berechnet (statt fest verdrahtet), damit sie sich proportional an
  // jede Bildschirmgrösse anpasst und immer mit Rand vollständig sichtbar
  // ist — nicht nur bei einer einzelnen getesteten Handybreite.
  if(isMobile){
    var satelliteZ=-.85;
    var heroCameraDistance=(8.78+Math.sin(.6)*.46+Math.sin(1.7)*.22)*MOBILE_RADIUS_SCALE;
    var halfVFovRad=THREE.MathUtils.degToRad(camera.fov/2);
    var halfHFovRad=Math.atan(Math.tan(halfVFovRad)*camera.aspect);
    var visibleHalfWidthAtSat=(heroCameraDistance-satelliteZ)*Math.tan(halfHFovRad);
    // 76% der sichtbaren Halbbreite nutzen: Satelliten schweben nah am
    // Bildschirmrand statt zentral über dem Text zu verschmelzen, mit
    // Rand zur Bildschirmkante damit nichts angeschnitten wird.
    var satelliteX=visibleHalfWidthAtSat*.76;
    addSatelliteBrain(-satelliteX,.32+MOBILE_BRAIN_Y_OFFSET,satelliteZ,.35,SATELLITE_METALS.red);
    addSatelliteBrain(satelliteX,.46+MOBILE_BRAIN_Y_OFFSET,satelliteZ-.2,2.7,SATELLITE_METALS.blue);
  } else {
    addSatelliteBrain(-5.7,-.62+DESKTOP_HERO_BRAIN_LIFT,-.7,.35,SATELLITE_METALS.red);
    addSatelliteBrain(5.7,-.44+DESKTOP_HERO_BRAIN_LIFT,-.9,2.7,SATELLITE_METALS.blue);
  }
  // Das grüne Satellitengehirn wird bewusst auf die endgültige
  // Kameraperspektive ausgerichtet: weit entlang ihrer linken Tangente und
  // oberhalb des sichtbaren Bildrands. In der Mehrwert-Totalen bleibt so nur
  // sein schräg nach links oben auslaufender grüner Nervenstrang sichtbar,
  // das Gehirn selbst liegt vollständig ausserhalb des Bildes.
  var greenSatelliteY=BRAIN_BASE_Y-SP.length*brain.scale.x*.18;
  var greenSatelliteAngle=cameraHelixExitStart*Math.PI*2;
  var greenSatelliteRadius=isMobile?8.2:13.4;
  var greenSatelliteBrain=addSatelliteBrain(
    -Math.cos(greenSatelliteAngle)*greenSatelliteRadius,
    greenSatelliteY,
    Math.sin(greenSatelliteAngle)*greenSatelliteRadius,
    4.35,
    SATELLITE_METALS.green
  );
  // Während die Kamera diese Höhe passiert, fährt das Gehirn kurz an den
  // linken Bildrand. Sein Mittelpunkt bleibt ausserhalb, die innere Kante
  // wird jedoch angeschnitten sichtbar. Diese Weltposition hält es danach
  // bis zur Anfahrt auf die vier Lösungskarten. Erst unmittelbar vor dieser
  // Station gleitet es in die für die Endansicht definierte Position zurück.
  var greenRevealProgress=THREE.MathUtils.clamp(
    (cameraTargetStart-greenSatelliteY)/cameraTravel,
    0,
    1
  );
  var greenRevealAngle=greenRevealProgress*Math.PI*2;
  var greenRevealRadius=isMobile?2.45:5.65;
  greenSatelliteBrain.userData.cameraReveal={
    progress:greenRevealProgress,
    x:-Math.cos(greenRevealAngle)*greenRevealRadius,
    z:Math.sin(greenRevealAngle)*greenRevealRadius
  };

  // --- Verbindliche Maske für beide Gehirnhälften: dieselbe Scatter-Punktwolke
  // (BR.scatter, bereits als pts[0..scatterN) vorhanden), nach dem Vorzeichen
  // der lateralen z-Achse gesplittet. Links und rechts teilen sich dadurch
  // exakt dieselbe Rohform/Aussenkontur — keine zwei unabhängigen Konturen. ---
  var scatterPts=pts.slice(0,scatterN);
  var rightScatterPts=scatterPts.filter(function(p){ return p.z>0; });

  function densifyWithinMask(basePoints,targetCount){
    var result=basePoints.slice();
    var guard=0;
    while(result.length<targetCount&&guard<targetCount*30){
      var a=result[Math.floor(rnd()*basePoints.length)];
      var b=result[Math.floor(rnd()*basePoints.length)];
      guard++;
      if(a===b) continue;
      var t=.25+rnd()*.5;
      result.push(new THREE.Vector3().lerpVectors(a,b,t));
    }
    return result;
  }

  var networkNodes=[], networkAdjacency=[], networkPointsObj=null;
  function buildTechnicalBrain(){
    if(rightScatterPts.length<4) return;
    var rightNodes=densifyWithinMask(rightScatterPts,isMobile?150:380);
    var halfNodeCount=rightNodes.length;
    var nodeColors=[];
    for(var nodeIndex=0;nodeIndex<halfNodeCount;nodeIndex++){
      networkNodes.push(rightNodes[nodeIndex]);
    }
    for(nodeIndex=0;nodeIndex<halfNodeCount;nodeIndex++){
      var mirroredNode=rightNodes[nodeIndex];
      networkNodes.push(new THREE.Vector3(mirroredNode.x,mirroredNode.y,-mirroredNode.z));
    }
    var halfNodeColors=[];
    for(nodeIndex=0;nodeIndex<halfNodeCount;nodeIndex++){
      var intensity=.38+rnd()*.62;
      halfNodeColors.push(new THREE.Color(GOLD.core).lerp(GOLD.line,intensity));
    }
    for(nodeIndex=0;nodeIndex<halfNodeCount;nodeIndex++) nodeColors.push(halfNodeColors[nodeIndex]);
    for(nodeIndex=0;nodeIndex<halfNodeCount;nodeIndex++) nodeColors.push(halfNodeColors[nodeIndex].clone());
    for(nodeIndex=0;nodeIndex<networkNodes.length;nodeIndex++){
      networkAdjacency.push([]);
    }
    var techPointPositions=[], techPointColors=[];
    for(nodeIndex=0;nodeIndex<networkNodes.length;nodeIndex++){
      var node=networkNodes[nodeIndex];
      techPointPositions.push(node.x,node.y,node.z);
      techPointColors.push(nodeColors[nodeIndex].r,nodeColors[nodeIndex].g,nodeColors[nodeIndex].b);
    }
    var techLinePositions=[], techLineColors=[];
    var networkNeighborCount=9;
    function appendNetworkEdge(sourceIndex,targetIndex){
      networkAdjacency[sourceIndex].push(targetIndex);
      networkAdjacency[targetIndex].push(sourceIndex);
      var sourceNode=networkNodes[sourceIndex], targetNode=networkNodes[targetIndex];
      var sourceColor=nodeColors[sourceIndex], targetColor=nodeColors[targetIndex];
      techLinePositions.push(sourceNode.x,sourceNode.y,sourceNode.z,targetNode.x,targetNode.y,targetNode.z);
      techLineColors.push(sourceColor.r,sourceColor.g,sourceColor.b,targetColor.r,targetColor.g,targetColor.b);
    }
    for(var sourceIndex=0;sourceIndex<halfNodeCount;sourceIndex++){
      var nearestIndices=[], nearestDistances=[];
      for(var targetIndex=0;targetIndex<halfNodeCount;targetIndex++){
        if(sourceIndex===targetIndex) continue;
        var distance=rightNodes[sourceIndex].distanceToSquared(rightNodes[targetIndex]);
        for(var nearestSlot=0;nearestSlot<networkNeighborCount;nearestSlot++){
          if(distance<(nearestDistances[nearestSlot]===undefined?Infinity:nearestDistances[nearestSlot])){
            nearestDistances.splice(nearestSlot,0,distance);
            nearestIndices.splice(nearestSlot,0,targetIndex);
            nearestDistances.length=Math.min(nearestDistances.length,networkNeighborCount);
            nearestIndices.length=Math.min(nearestIndices.length,networkNeighborCount);
            break;
          }
        }
      }
      for(var nearestIndex=0;nearestIndex<nearestIndices.length;nearestIndex++){
        var neighborIndex=nearestIndices[nearestIndex];
        if(neighborIndex<sourceIndex) continue;
        appendNetworkEdge(sourceIndex,neighborIndex);
        appendNetworkEdge(sourceIndex+halfNodeCount,neighborIndex+halfNodeCount);
      }
    }
    var techLineGeometry=new THREE.BufferGeometry();
    techLineGeometry.setAttribute('position',new THREE.Float32BufferAttribute(techLinePositions,3));
    techLineGeometry.setAttribute('color',new THREE.Float32BufferAttribute(techLineColors,3));
    var techLines=new THREE.LineSegments(techLineGeometry,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.48,blending:THREE.NormalBlending,depthWrite:false}));
    techLines.frustumCulled=false;
    networkPointsObj=pointsObj(techPointPositions,techPointColors,.058,.7,THREE.NormalBlending);
    networkPointsObj.frustumCulled=false;
    networkPointsObj.name='network-nodes';
    brain.add(techLines);
    brain.add(networkPointsObj);
    var hubPositions=[], hubColors=[];
    for(nodeIndex=0;nodeIndex<halfNodeCount;nodeIndex+=12){
      for(var hemisphereIndex=0;hemisphereIndex<2;hemisphereIndex++){
        var hubNode=networkNodes[nodeIndex+hemisphereIndex*halfNodeCount];
        hubPositions.push(hubNode.x,hubNode.y,hubNode.z);
        hubColors.push(GOLD.line.r,GOLD.line.g,GOLD.line.b);
      }
    }
    var hubPoints=pointsObj(hubPositions,hubColors,.13,.85,THREE.AdditiveBlending);
    hubPoints.frustumCulled=false;
    brain.add(hubPoints);
  }

  buildTechnicalBrain();

  var satelliteStrands=[];
  function createSecondaryStrandParams(){
    return {
      fiberAmount:.58,
      intensity:1,
      lineOpacity:GOLD_RENDER.lineOpacity,
      pointOpacity:GOLD_RENDER.pointOpacity,
      pointSize:SP.ptSize,
      topThickness:1,
      bottomThickness:1,
      topFunnel:1,
      connectorShare:.18,
      joinRadius:.08,
      funnelSpread:1,
      funnelLength:.72,
      funnelTopRadius:.31,
      funnelOutletRadius:.052,
      firstDroop:1.22,
      secondDroop:1.42,
      sidePull:.8,
      endPull:1,
      sway:.75,
      pulseSpeed:3.4,
      pulseStrength:.32,
      baseBrightness:.3,
      topBrightness:1,
      bottomBrightness:1,
      escapeAmount:1,
      escapeAmplitude:1.39,
      escapeFrequency:3,
      escapeWavelength:.72,
      escapeSpeed:1,
      goldEntryProgressStart:.41,
      goldEntryProgressRange:.24,
      colorHue:0,
      colorSaturation:1,
      colorLightness:1,
      colorIntensity:1,
      posX:0,
      posY:0,
      posZ:0
    };
  }
  var RED_STRAND=createSecondaryStrandParams();
  var BLUE_STRAND=createSecondaryStrandParams();
  var GREEN_STRAND=createSecondaryStrandParams();
  RED_STRAND.baseBrightness=.95;
  RED_STRAND.pulseStrength=.14;
  BLUE_STRAND.baseBrightness=.95;
  BLUE_STRAND.pulseStrength=.14;
  BLUE_STRAND.bottomThickness=1.04;
  BLUE_STRAND.escapeAmplitude=1.35;
  BLUE_STRAND.escapeWavelength=1;
  GREEN_STRAND.baseBrightness=.94;
  GREEN_STRAND.pulseStrength=.12;
  GREEN_STRAND.fiberAmount=.5;
  GREEN_STRAND.topThickness=.72;
  // Der frei haengende gruene Zulauf bleibt schlank. Der gemeinsame Umfang
  // an der Wasserlinie wird unten explizit aus dem Goldrahmen berechnet.
  GREEN_STRAND.bottomThickness=.74;
  GREEN_STRAND.topFunnel=.82;
  GREEN_STRAND.funnelSpread=.48;
  GREEN_STRAND.funnelLength=.58;
  GREEN_STRAND.funnelTopRadius=.22;
  GREEN_STRAND.funnelOutletRadius=.038;
  GREEN_STRAND.firstDroop=.78;
  GREEN_STRAND.secondDroop=.88;
  // Vollständige Wellenreferenz des roten Strangs. Insbesondere muss auch der
  // Anteil bewegter Randfasern übernommen werden; mit dem früheren Wert .12
  // blieb die Laufwelle im kompakten grünen Bündel praktisch unsichtbar.
  GREEN_STRAND.sway=RED_STRAND.sway;
  GREEN_STRAND.escapeAmount=RED_STRAND.escapeAmount;
  GREEN_STRAND.escapeAmplitude=RED_STRAND.escapeAmplitude;
  GREEN_STRAND.escapeFrequency=RED_STRAND.escapeFrequency;
  GREEN_STRAND.escapeWavelength=RED_STRAND.escapeWavelength;
  GREEN_STRAND.escapeSpeed=RED_STRAND.escapeSpeed;
  // Der grüne Ursprung liegt bereits auf halber Stranghöhe. Seine Fasern
  // steigen deshalb erst etwas tiefer in die Goldbahn ein und knicken nicht
  // sichtbar nach oben zurück.
  GREEN_STRAND.goldEntryProgressStart=.52;
  GREEN_STRAND.goldEntryProgressRange=.18;
  // Die Assimilation beginnt erst auf der vorhandenen Gold-Mittelbahn und
  // verwendet deren lokalen 3D-Rahmen als organischen Bezug.
  var ASSIMILATION_GOLD_PROGRESS=.55;
  var secondaryMergeTargetWorld=new THREE.Vector3();
  var secondarySatelliteWorld=new THREE.Vector3();
  var secondaryRenderPoint=new THREE.Vector3();
  var secondaryMergeCenterWorld=new THREE.Vector3();
  var secondaryMergedTargetLocal=new THREE.Vector3();
  var secondaryMergedTargetWorld=new THREE.Vector3();
  var secondarySharedCenterWorld=new THREE.Vector3();
  var secondaryFrameNormalWorld=new THREE.Vector3();
  var secondaryFrameBinormalWorld=new THREE.Vector3();
  var secondaryMergeY=0;

  function makeSecondaryFiberShape(){
    return {
      phaseOffset:(Math.random()-.5)*.22,
      radiusOffset:(Math.random()-.5)*.07,
      firstDroop:.92+Math.random()*.18,
      secondDroop:1.08+Math.random()*.2,
      firstSway:(Math.random()-.5)*.2,
      secondSway:(Math.random()-.5)*.15,
      windPhase:Math.random()*Math.PI*2,
      funnelVariation:.82+Math.random()*.36,
      // Kein gemeinsamer horizontaler Abschluss des dichten Wulsts: Jede
      // Elternfaser wird über eine eigene, breit gestaffelte Länge gedehnt.
      funnelEnd:.18+Math.random()*.28
    };
  }

  function applySecondaryRendering(strand){
    var params=strand.params;
    strand.lineMesh.material.opacity=Math.min(1,params.lineOpacity*params.intensity);
    strand.pointMesh.material.opacity=Math.min(1,params.pointOpacity*params.intensity);
    strand.pointMesh.material.size=params.pointSize;
  }

  var secondaryColorHsl={h:0,s:0,l:0};
  function tuneSecondaryMetal(source,target,params){
    target.copy(source);
    target.getHSL(secondaryColorHsl);
    target.setHSL(
      ((secondaryColorHsl.h+params.colorHue)%1+1)%1,
      THREE.MathUtils.clamp(secondaryColorHsl.s*params.colorSaturation,0,1),
      THREE.MathUtils.clamp(secondaryColorHsl.l*params.colorLightness,0,1)
    );
  }

  function updateSecondaryMetal(strand){
    tuneSecondaryMetal(strand.palette.deep,strand.tunedDeep,strand.params);
    tuneSecondaryMetal(strand.palette.primary,strand.tunedPrimary,strand.params);
    tuneSecondaryMetal(strand.palette.light,strand.tunedLight,strand.params);
  }

  function rebuildSecondaryStrandGeometry(strand){
    var params=strand.params;
    // Kompakter Kern aus vielen feinen Einzelfasern, ergänzt durch eine
    // kleinere Schicht loser Randfasern. So bleibt es ein Faserbündel und
    // wird niemals zu einem glatten Leuchtschlauch.
    var fiberCount=Math.max(96,Math.round((isMobile?148:360)*params.fiberAmount));
    var fiberSegments=isMobile?64:92;
    var fibers=[], pointValueCount=0, lineValueCount=0;
    for(var selectedIndex=0;selectedIndex<fiberCount;selectedIndex++){
      var sourceAngle=Math.PI*2*selectedIndex/fiberCount+(Math.random()-.5)*.16;
      var radialDistribution=Math.pow(Math.random(),2.65);
      // Alle Sekundärfasern bleiben bis zum Ende des Goldstrangs erhalten.
      // Ihr Eintritt in dessen Querschnitt sowie ihre finale Ausfaserung
      // werden aber pro Faser versetzt. Dadurch entsteht keine kompakte
      // Übergangswolke und keine sichtbare Schnittlinie.
      var fiberEndProgress=1;
      var fiberLength=fiberSegments;
      fibers.push({
        sourceAngle:sourceAngle,
        sourceRadius:.035+radialDistribution*.345,
        sourceDrop:.04+Math.random()*.16,
        len:fiberLength,
        endProgress:fiberEndProgress,
        endFadeStart:.84+Math.random()*.04,
        pointOffset:pointValueCount,
        lineOffset:lineValueCount,
        shape:makeSecondaryFiberShape(),
        metallicPhase:Math.random()*Math.PI*2,
        edgeWeight:smooth((radialDistribution-.52)/.48),
        branchPhase:Math.random()*Math.PI*2,
        // Deterministische, pro Faser gespeicherte Assimilationsdaten.
        // Rot, Blau und Grün werden damit über eine lange Zone einzeln und
        // gegeneinander versetzt zwischen die Goldfasern verteilt, ohne je
        // als drei kompakte Farbbündel zusammenzuklappen.
        assimilationAngle:(selectedIndex*strand.weaveCount+strand.weaveIndex)*2.399963229728653,
        assimilationRadius:Math.sqrt(((selectedIndex*strand.weaveCount+strand.weaveIndex)*0.7548776662466927)%1),
        assimilationStart:.24+Math.random()*.3,
        assimilationEnd:.62+Math.random()*.22,
        goldEntryProgress:params.goldEntryProgressStart+Math.random()*params.goldEntryProgressRange,
        goldExitProgress:1,
        assimilationPhase:Math.random()*Math.PI*2,
        assimilationRadiusDrift:(Math.random()-.5)*.16,
        terminalFrayAngle:Math.random()*Math.PI*2,
        terminalFrayJitter:.4+Math.random()*.6,
        // Nur einige Randfasern lösen sich sichtbar aus dem Kern. Diese
        // gezielten Ausreisser geben dem Bündel die organische, lebendige
        // Silhouette, ohne die tragende Gesamtform zu verlieren.
        // Mehrere voneinander unabhängige Randfasern lösen sich aus dem
        // Bündel. Ihre Frequenzen und Geschwindigkeiten bleiben individuell,
        // damit die Bewegung wie ein lebendes Nervenfaserfeld wirkt.
        escapeWeight:Math.random()<params.escapeAmount ? .48+Math.random()*.52 : 0,
        escapeFrequency:7+Math.random()*9,
        escapeSpeed:.46+Math.random()*.52
      });
      pointValueCount+=fiberLength*3;
      lineValueCount+=Math.max(0,fiberLength-1)*6;
    }
    strand.fibers=fibers;
    strand.linePositions=new Float32Array(lineValueCount);
    strand.lineColors=new Float32Array(lineValueCount);
    strand.pointPositions=new Float32Array(pointValueCount);
    strand.pointColors=new Float32Array(pointValueCount);
    var lineGeometry=new THREE.BufferGeometry();
    lineGeometry.setAttribute('position',new THREE.BufferAttribute(strand.linePositions,3));
    lineGeometry.setAttribute('color',new THREE.BufferAttribute(strand.lineColors,3));
    strand.lineMesh.geometry.dispose();
    strand.lineMesh.geometry=lineGeometry;
    var pointGeometry=new THREE.BufferGeometry();
    pointGeometry.setAttribute('position',new THREE.BufferAttribute(strand.pointPositions,3));
    pointGeometry.setAttribute('color',new THREE.BufferAttribute(strand.pointColors,3));
    strand.pointMesh.geometry.dispose();
    strand.pointMesh.geometry=pointGeometry;
    applySecondaryRendering(strand);
  }

  function rebuildSecondaryStrands(){
    for(var rebuildIndex=0;rebuildIndex<satelliteStrands.length;rebuildIndex++) rebuildSecondaryStrandGeometry(satelliteStrands[rebuildIndex]);
  }

  function useExistingSatelliteStrand(satellite,phase,palette,flowDirection,sideSign,params,weaveIndex,weaveCount){
    hideSatelliteTail(satellite);
    var tailGroup=new THREE.Group();
    tailGroup.name='secondary-energy-strand';
    var lineGeometry=new THREE.BufferGeometry();
    lineGeometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(0),3));
    lineGeometry.setAttribute('color',new THREE.BufferAttribute(new Float32Array(0),3));
    var lineMesh=new THREE.LineSegments(lineGeometry,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:GOLD_RENDER.lineOpacity,blending:THREE.NormalBlending,depthWrite:false}));
    lineMesh.material.clippingPlanes=[neuralOceanClipPlane];
    lineMesh.frustumCulled=false;
    lineMesh.renderOrder=4;
    tailGroup.add(lineMesh);
    var pointGeometry=new THREE.BufferGeometry();
    pointGeometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(0),3));
    pointGeometry.setAttribute('color',new THREE.BufferAttribute(new Float32Array(0),3));
    var pointMesh=new THREE.Points(pointGeometry,new THREE.PointsMaterial({size:SP.ptSize,map:sprite,transparent:true,opacity:GOLD_RENDER.pointOpacity,vertexColors:true,color:0xffffff,blending:THREE.NormalBlending,depthWrite:false}));
    pointMesh.material.clippingPlanes=[neuralOceanClipPlane];
    pointMesh.frustumCulled=false;
    pointMesh.renderOrder=5;
    tailGroup.add(pointMesh);
    brain.add(tailGroup);
    var strand={
      satellite:satellite,
      phase:phase,
      palette:palette,
      tunedDeep:new THREE.Color(),
      tunedPrimary:new THREE.Color(),
      tunedLight:new THREE.Color(),
      flowDirection:flowDirection,
      sideSign:sideSign,
      weaveIndex:weaveIndex,
      weaveCount:weaveCount,
      params:params,
      lineMesh:lineMesh,
      pointMesh:pointMesh,
      fibers:[],
      linePositions:null,
      pointPositions:null,
      lineColors:null,
      pointColors:null,
      lowerAnchors:null
    };
    satelliteStrands.push(strand);
    rebuildSecondaryStrandGeometry(strand);
    return strand;
  }

  function curveExistingSatelliteStrand(strand,flowTime){
    if(!strand.fibers.length) return;
    var params=strand.params;
    var x=0, y=0, z=0;
    brain.updateWorldMatrix(true,false);
    strand.satellite.updateWorldMatrix(true,false);
    strand.satellite.getWorldPosition(secondarySatelliteWorld);
    goldStrandTipWorld(secondaryMergeTargetWorld,true);
    sampleGoldStrandFrame(ASSIMILATION_GOLD_PROGRESS);
    secondaryMergeCenterWorld.copy(goldFrameCenterLocal);
    brain.localToWorld(secondaryMergeCenterWorld);
    secondaryMergeY=secondaryMergeCenterWorld.y;
    strand.lineColors.fill(0);
    strand.pointColors.fill(0);
    var mergeX=secondaryMergeTargetWorld.x;
    var mergeY=secondaryMergeTargetWorld.y;
    var mergeZ=secondaryMergeTargetWorld.z;
    updateSecondaryMetal(strand);
    // Der goldene Trichter arbeitet mit einem breiten Faserursprung, drei
    // weichen Sammelstufen (.34/.38/.28) und einer relativ langen
    // Wurzelzone. Die farbigen Satellitentrichter nutzen exakt diese Logik, nur
    // proportional zur Skalierung ihres jeweiligen Satelliten-Gehirns.
    if(!strand.lowerAnchors){
      var satellitePoints=strand.satellite.getObjectByName('neural-points');
      var sourceAttribute=satellitePoints&&satellitePoints.geometry&&satellitePoints.geometry.attributes.position;
      var anchors=[];
      if(sourceAttribute){
        var sourcePositions=sourceAttribute.array;
        // Der geklonte Satellit enthält hinter den originalen Gehirnpunkten
        // noch die bereits versteckte Alt-Strang-Geometrie. Diese kollabierten
        // Punkte dürfen niemals als Trichteranker dienen, sonst entsteht eine
        // freie seitliche Spitze unter dem kleinen Gehirn.
        var sourceCount=Math.min(sourceAttribute.count,Math.floor(baseWPos.length/3));
        var minY=Infinity, maxY=-Infinity;
        for(var sourceIndex=0;sourceIndex<sourceCount;sourceIndex++){
          var sourceY=sourcePositions[sourceIndex*3+1];
          minY=Math.min(minY,sourceY); maxY=Math.max(maxY,sourceY);
        }
        var lowerLimit=minY+(maxY-minY)*.34;
        for(var lowerIndex=0;lowerIndex<sourceCount;lowerIndex++){
          var lowerY=sourcePositions[lowerIndex*3+1];
          if(lowerY<=lowerLimit) anchors.push(new THREE.Vector3(sourcePositions[lowerIndex*3],lowerY,sourcePositions[lowerIndex*3+2]));
        }
      }
      // Fallback bleibt bewusst breit verteilt, falls ein Modell keine
      // neural-points-Geometrie besitzt.
      if(!anchors.length) anchors=[new THREE.Vector3(-.24,-.42,0),new THREE.Vector3(.24,-.42,0),new THREE.Vector3(0,-.48,.18),new THREE.Vector3(0,-.48,-.18)];
      strand.lowerAnchors=anchors;
    }
    for(var fiberIndex=0;fiberIndex<strand.fibers.length;fiberIndex++){
      var fiber=strand.fibers[fiberIndex], fiberShape=fiber.shape;
      var funnelEnd=THREE.MathUtils.clamp(fiberShape.funnelEnd,.08,.9);
      var sourceScale=strand.satellite.scale.x*params.topFunnel;
      var anchorLocal=strand.lowerAnchors[(fiberIndex*37)%strand.lowerAnchors.length];
      var anchorWorld=anchorLocal.clone();
      strand.satellite.localToWorld(anchorWorld);
      var startX=anchorWorld.x, startY=anchorWorld.y, startZ=anchorWorld.z;
      var funnelAngle=fiber.sourceAngle+fiberShape.phaseOffset*.42;
      var funnelCos=Math.cos(funnelAngle), funnelSin=Math.sin(funnelAngle);
      var funnelScale=sourceScale*fiberShape.funnelVariation*params.topThickness;
      var funnelLength=params.funnelLength*sourceScale;
      var funnelMicroX=secondarySatelliteWorld.x+funnelCos*params.funnelTopRadius*funnelScale;
      var funnelMicroY=secondarySatelliteWorld.y-funnelLength*.36-fiber.sourceDrop*sourceScale;
      var funnelMicroZ=secondarySatelliteWorld.z+funnelSin*params.funnelTopRadius*funnelScale;
      var funnelMediumX=secondarySatelliteWorld.x+funnelCos*params.funnelTopRadius*funnelScale*.48;
      var funnelMediumY=secondarySatelliteWorld.y-funnelLength*.67;
      var funnelMediumZ=secondarySatelliteWorld.z+funnelSin*params.funnelTopRadius*funnelScale*.48;
      var funnelOutletX=secondarySatelliteWorld.x+funnelCos*params.funnelOutletRadius*funnelScale;
      var funnelOutletY=secondarySatelliteWorld.y-funnelLength;
      var funnelOutletZ=secondarySatelliteWorld.z+funnelSin*params.funnelOutletRadius*funnelScale;
      var sideX=funnelOutletX-mergeX;
      var sideZ=funnelOutletZ-mergeZ;
      var sideLength=Math.sqrt(sideX*sideX+sideZ*sideZ);
      if(sideLength<.0001){ sideX=strand.sideSign; sideZ=0; sideLength=1; }
      sideX/=sideLength;
      sideZ/=sideLength;
      var depthX=-sideZ;
      var depthZ=sideX;
      var horizontalSpan=Math.sqrt((mergeX-funnelOutletX)*(mergeX-funnelOutletX)+(mergeZ-funnelOutletZ)*(mergeZ-funnelOutletZ));
      var catenaryDepth=.2+Math.min(.62,horizontalSpan*.09);
      var firstSag=catenaryDepth*fiberShape.firstDroop*params.firstDroop;
      var secondSag=catenaryDepth*fiberShape.secondDroop*params.secondDroop;
      var fiberAngle=fiberShape.phaseOffset*17+fiberIndex*.618;
      var edgeWeight=fiber.edgeWeight;
      var previousX=startX, previousY=startY, previousZ=startZ;
      var previousR=0, previousG=0, previousB=0, lineOffset=fiber.lineOffset;
      for(var step=0;step<fiber.len;step++){
        var progress=fiber.len>1?step/(fiber.len-1):0;
        // Jede bestehende Faser besitzt einen eigenen, langen und C2-stetigen
        // Eintritt in die gemeinsame Struktur. Dadurch gibt es keine
        // gemeinsame Schnittlinie und keine Bündel-Kompression als Block.
        var assimilationCenter=(fiber.assimilationStart+fiber.assimilationEnd)*.5;
        var assimilationSpan=(fiber.assimilationEnd-fiber.assimilationStart)
          *WULST_TUNING.liquify;
        var stretchedAssimilationStart=THREE.MathUtils.clamp(
          assimilationCenter-assimilationSpan*.5,
          .08,
          .9
        );
        var stretchedAssimilationEnd=THREE.MathUtils.clamp(
          assimilationCenter+assimilationSpan*.5,
          stretchedAssimilationStart+.04,
          .985
        );
        var assimilationBlend=smoother(
          (progress-stretchedAssimilationStart)
          /(stretchedAssimilationEnd-stretchedAssimilationStart)
        );
        var funnelProgress=Math.min(1,progress/funnelEnd);
        var funnelX, funnelY, funnelZ, funnelStage;
        if(funnelProgress<.34){
          funnelStage=smooth(funnelProgress/.34);
          funnelX=startX+(funnelMicroX-startX)*funnelStage;
          funnelY=startY+(funnelMicroY-startY)*funnelStage;
          funnelZ=startZ+(funnelMicroZ-startZ)*funnelStage;
        } else if(funnelProgress<.72){
          funnelStage=smooth((funnelProgress-.34)/.38);
          funnelX=funnelMicroX+(funnelMediumX-funnelMicroX)*funnelStage;
          funnelY=funnelMicroY+(funnelMediumY-funnelMicroY)*funnelStage;
          funnelZ=funnelMicroZ+(funnelMediumZ-funnelMicroZ)*funnelStage;
        } else {
          funnelStage=smooth((funnelProgress-.72)/.28);
          funnelX=funnelMediumX+(funnelOutletX-funnelMediumX)*funnelStage;
          funnelY=funnelMediumY+(funnelOutletY-funnelMediumY)*funnelStage;
          funnelZ=funnelMediumZ+(funnelOutletZ-funnelMediumZ)*funnelStage;
        }
        var pathProgress=smooth((progress-funnelEnd)/(1-funnelEnd));
        var sagEnvelope=Math.sin(pathProgress*Math.PI);
        var hangingSag=(firstSag*(1-pathProgress)+secondSag*pathProgress)*sagEnvelope;
        var thicknessScale=params.topThickness+(params.bottomThickness-params.topThickness)*pathProgress;
        var looseSpread=(.005+fiber.sourceRadius*.15+params.funnelSpread*.008)*sagEnvelope*thicknessScale;
        var windEnvelope=sagEnvelope;
        var rawWindSide=Math.sin(flowTime*.64+pathProgress*5.4+fiberShape.windPhase)*params.sway*.045;
        var rawWindDepth=Math.cos(flowTime*.49+pathProgress*4.1+fiberShape.windPhase*1.37)*params.sway*.022;
        var windSide=rawWindSide*windEnvelope;
        var windDepth=rawWindDepth*windEnvelope;
        // Nur die lockeren äusseren Fasern dürfen sichtbar aus dem dichten
        // Kern ausbrechen. Ihre Wellen sind phasenverschoben, damit keine
        // dekorative Parallelwelle entsteht.
        var edgeWaveEnvelope=sagEnvelope;
        var escapeEnvelope=smooth((pathProgress-.06)/.2)*smooth((.94-pathProgress)/.2);
        var rawEdgeWave=(.014+edgeWeight*.11+fiber.escapeWeight*.235)*thicknessScale*params.escapeAmplitude;
        var rawEdgeWaveSide=Math.sin(pathProgress*(7.4+edgeWeight*5.1)+fiber.branchPhase+flowTime*.31)*rawEdgeWave;
        var rawEdgeWaveDepth=Math.cos(pathProgress*(6.2+edgeWeight*4.3)+fiber.branchPhase*1.43+flowTime*.24)*rawEdgeWave*.72;
        var edgeWaveSide=rawEdgeWaveSide*edgeWaveEnvelope;
        var edgeWaveDepth=rawEdgeWaveDepth*edgeWaveEnvelope;
        var travellingWave=pathProgress*fiber.escapeFrequency*params.escapeFrequency/params.escapeWavelength-flowTime*fiber.escapeSpeed*params.escapeSpeed;
        var rawEscapeSide=(Math.sin(travellingWave+fiber.branchPhase*2.1)+Math.sin(travellingWave*1.73+fiber.branchPhase*.47)*.38)*fiber.escapeWeight*.245*thicknessScale*params.escapeAmplitude;
        var rawEscapeDepth=(Math.cos(travellingWave*.89+fiber.branchPhase*.71)+Math.sin(travellingWave*1.41+fiber.branchPhase*1.8)*.32)*fiber.escapeWeight*.175*thicknessScale*params.escapeAmplitude;
        var escapeSide=rawEscapeSide*escapeEnvelope;
        var escapeDepth=rawEscapeDepth*escapeEnvelope;
        var manualEnvelope=sagEnvelope;
        var endSpread=.008+Math.abs(fiberShape.radiusOffset)*.022;
        var endOffsetX=Math.cos(fiberAngle)*endSpread;
        var endOffsetZ=Math.sin(fiberAngle)*endSpread;
        var manualVertical=params.posY*manualEnvelope;
        var pathX=funnelOutletX+(mergeX-funnelOutletX)*pathProgress;
        var pathY=funnelOutletY+(mergeY-funnelOutletY)*pathProgress-hangingSag-manualVertical;
        var pathZ=funnelOutletZ+(mergeZ-funnelOutletZ)*pathProgress;
        // Im Trichter nur die drei Referenzstufen. Danach folgt zuerst die
        // frei hängende Diagonale und anschliessend die breite, organische
        // Einordnung auf dem Umfang des goldenen Hauptfaserbündels.
        var funnelRelease=1-smooth(progress/funnelEnd);
        x=pathX+(funnelX-pathX)*funnelRelease;
        y=pathY+(funnelY-pathY)*funnelRelease;
        z=pathZ+(funnelZ-pathZ)*funnelRelease;
        var staticSide=Math.cos(fiberAngle)*looseSpread+params.posX*manualEnvelope+endOffsetX;
        var staticDepth=Math.sin(fiberAngle)*looseSpread+params.posZ*manualEnvelope+endOffsetZ;
        // Im gemeinsamen Hauptstrang laufen die bestehenden Bewegungsphasen
        // weiter, statt am Ende der seitlichen Catenary-Bahn auszuklingen.
        var lowerFlowCarry=smoother((pathProgress-.58)/.24);
        var liveSide=windSide+edgeWaveSide+escapeSide
          +lowerFlowCarry*((rawWindSide-windSide)+(rawEdgeWaveSide-edgeWaveSide)+(rawEscapeSide-escapeSide));
        var liveDepth=windDepth+edgeWaveDepth+escapeDepth
          +lowerFlowCarry*((rawWindDepth-windDepth)+(rawEdgeWaveDepth-edgeWaveDepth)+(rawEscapeDepth-escapeDepth));
        x+=sideX*(staticSide+liveSide)+depthX*(staticDepth+liveDepth);
        z+=sideZ*(staticSide+liveSide)+depthZ*(staticDepth+liveDepth);
        if(assimilationBlend>0){
          // Die Mittelbahn wird schrittweise in den vorhandenen Goldrahmen
          // überführt. Die Wellen, Windreaktionen und Ausreisser werden dabei
          // nicht ersetzt, sondern in dessen Normal-/Binormalebene getragen.
          var assimilationTravel=smoother(
            (progress-stretchedAssimilationStart)/(1-stretchedAssimilationStart)
          );
          // Jede Faser wird auf einer eigenen Station in den bereits
          // vorhandenen Goldstrang eingewoben. Die unterschiedliche
          // Eintrittshöhe und das gestaffelte Auslaufen verhindern, dass
          // die Farben als synchroner, blockartiger Körper erscheinen.
          var sharedGoldProgress=fiber.goldEntryProgress
            +(fiber.goldExitProgress-fiber.goldEntryProgress)*assimilationTravel;
          sampleGoldStrandFrame(sharedGoldProgress);
          // Der gruene Strang lief bisher mit seinen vollen Ausreissern bis an
          // die Wasserlinie weiter und bildete dadurch links ein eigenes
          // Faserfeld. In der unteren Merge-Zone wird er nun weich auf den
          // gemeinsamen Goldrahmen gebuendelt; oberhalb davon bleibt seine
          // bisherige organische Bewegung vollstaendig erhalten.
          var greenTerminalCohesion=params===GREEN_STRAND
            ?smoother((sharedGoldProgress-.78)/.18)
            :0;
          var gumProgress=wulstWaveProgress(sharedGoldProgress);
          var gumTravel=stretchedWavePhase(
            gumProgress,
            5.4/WULST_TUNING.stretch,
            .62/WULST_TUNING.stretch
          );
          var gumEnvelope=smoother(gumProgress/.2);
          var assimilationWave=gumTravel+flowTime*.31+fiber.branchPhase+fiber.assimilationPhase;
          var assimilationAngle=fiber.assimilationAngle+Math.sin(assimilationWave)*.35
            +Math.sin(assimilationWave*1.71+fiberShape.phaseOffset)*.12;
          var assimilationRadius=THREE.MathUtils.clamp(
            fiber.assimilationRadius+fiber.assimilationRadiusDrift*Math.sin(assimilationWave*1.23),
            .035,.98
          );
          // Kein dicker Ring mehr oberhalb der Endfasern: Der Radius wächst
          // erst innerhalb der nach unten gezogenen Endzone kaugummiartig an.
          var gumThickness=THREE.MathUtils.lerp(1,2.32,smoother(gumProgress));
          var terminalThickness=THREE.MathUtils.lerp(
            thicknessScale,
            1,
            greenTerminalCohesion
          );
          var organicRadius=SP.rStr*(.08+.92*assimilationRadius)
            *(1+Math.sin(assimilationWave*1.37+fiber.assimilationPhase)*.09)
            *terminalThickness*gumThickness;
          var terminalFrayEnvelope=smoother((sharedGoldProgress-SP.frayStart)/Math.max(.001,1-SP.frayStart));
          var terminalFray=terminalFrayEnvelope*SP.fraySpread*fiber.terminalFrayJitter*terminalThickness
            *(1-greenTerminalCohesion);
          secondaryMergedTargetLocal.copy(goldFrameCenterLocal)
            .addScaledVector(goldFrameNormalLocal,Math.cos(assimilationAngle)*organicRadius+Math.cos(fiber.terminalFrayAngle)*terminalFray)
            .addScaledVector(goldFrameBinormalLocal,Math.sin(assimilationAngle)*organicRadius+Math.sin(fiber.terminalFrayAngle)*terminalFray)
            .addScaledVector(goldFrameTangentLocal,terminalFray*(.12+fiber.edgeWeight*.28));
          secondarySharedCenterWorld.copy(goldFrameCenterLocal);
          brain.localToWorld(secondarySharedCenterWorld);
          secondaryFrameNormalWorld.copy(goldFrameNormalLocal).add(goldFrameCenterLocal);
          brain.localToWorld(secondaryFrameNormalWorld);
          secondaryFrameNormalWorld.sub(secondarySharedCenterWorld).normalize();
          secondaryFrameBinormalWorld.copy(goldFrameBinormalLocal).add(goldFrameCenterLocal);
          brain.localToWorld(secondaryFrameBinormalWorld);
          secondaryFrameBinormalWorld.sub(secondarySharedCenterWorld).normalize();
          secondaryMergedTargetWorld.copy(secondaryMergedTargetLocal);
          brain.localToWorld(secondaryMergedTargetWorld);
          secondaryMergedTargetWorld.x-=secondarySharedCenterWorld.x;
          secondaryMergedTargetWorld.z-=secondarySharedCenterWorld.z;
          var terminalLiveScale=1-greenTerminalCohesion;
          var assimilatedX=secondaryMergedTargetWorld.x
            +secondaryFrameNormalWorld.x*liveSide*terminalLiveScale
            +secondaryFrameBinormalWorld.x*liveDepth*terminalLiveScale;
          var assimilatedY=secondaryMergedTargetWorld.y
            +secondaryFrameNormalWorld.y*liveSide*terminalLiveScale
            +secondaryFrameBinormalWorld.y*liveDepth*terminalLiveScale;
          var assimilatedZ=secondaryMergedTargetWorld.z
            +secondaryFrameNormalWorld.z*liveSide*terminalLiveScale
            +secondaryFrameBinormalWorld.z*liveDepth*terminalLiveScale;
          var gumAmplitude=THREE.MathUtils.lerp(.035,.19,smoother(gumProgress))
            *gumEnvelope*WULST_TUNING.liquify;
          var gumSide=Math.sin(
            gumTravel+fiber.branchPhase+fiber.assimilationPhase+flowTime*WIND.speed*.42
          )*gumAmplitude;
          var gumDepth=Math.cos(
            gumTravel*.91+fiber.branchPhase*.83+fiberShape.windPhase+flowTime*WIND.speed*.34
          )*gumAmplitude*.78;
          assimilatedX+=(secondaryFrameNormalWorld.x*gumSide+secondaryFrameBinormalWorld.x*gumDepth)*terminalLiveScale;
          assimilatedY+=(secondaryFrameNormalWorld.y*gumSide+secondaryFrameBinormalWorld.y*gumDepth)*terminalLiveScale;
          assimilatedZ+=(secondaryFrameNormalWorld.z*gumSide+secondaryFrameBinormalWorld.z*gumDepth)*terminalLiveScale;
          x+=(assimilatedX-x)*assimilationBlend;
          y+=(assimilatedY-y)*assimilationBlend;
          z+=(assimilatedZ-z)*assimilationBlend;
        }
        if(params===GREEN_STRAND){
          // Die fruehere Fortschrittsgrenze lag bei dieser kuerzeren Bahn erst
          // unterhalb der Clipping-Ebene. Jetzt beginnt die Buendelung in einem
          // festen, sichtbaren Weltbereich oberhalb der echten Wasserlinie und
          // erreicht dort garantiert 100 Prozent.
          var greenOceanApproachHeight=isMobile?4.8:7.8;
          var greenOceanBundle=smoother(
            (NEURAL_OCEAN_CLIP_Y+greenOceanApproachHeight-y)
            /greenOceanApproachHeight
          );
          if(greenOceanBundle>0){
            var greenTargetProgress=.82+greenOceanBundle*.14;
            sampleGoldStrandFrame(greenTargetProgress);
            // Derselbe Endradius wie im Rot-/Blau-/Gold-Buendel, aber ohne
            // terminales Fray, Wind oder einseitigen Live-Versatz.
            var greenCommonRadius=SP.rStr*(.08+.92*fiber.assimilationRadius)
              *THREE.MathUtils.lerp(1.72,2.32,greenOceanBundle);
            secondaryMergedTargetLocal.copy(goldFrameCenterLocal)
              .addScaledVector(
                goldFrameNormalLocal,
                Math.cos(fiber.assimilationAngle)*greenCommonRadius
              )
              .addScaledVector(
                goldFrameBinormalLocal,
                Math.sin(fiber.assimilationAngle)*greenCommonRadius
              );
            secondaryMergedTargetWorld.copy(secondaryMergedTargetLocal);
            brain.localToWorld(secondaryMergedTargetWorld);
            // Rot und Blau entfernen an dieser Stelle den seitlichen
            // Weltversatz der wandernden Gold-Mittelkurve und tauchen um die
            // gemeinsame Szenenachse ein. Gruen muss exakt dieselbe
            // Zentrierung verwenden, sonst laeuft es rechts am Buendel vorbei.
            secondarySharedCenterWorld.copy(goldFrameCenterLocal);
            brain.localToWorld(secondarySharedCenterWorld);
            secondaryMergedTargetWorld.x-=secondarySharedCenterWorld.x;
            secondaryMergedTargetWorld.z-=secondarySharedCenterWorld.z;
            x=THREE.MathUtils.lerp(x,secondaryMergedTargetWorld.x,greenOceanBundle);
            z=THREE.MathUtils.lerp(z,secondaryMergedTargetWorld.z,greenOceanBundle);
          }
        }
        // Die Absenkung steckt bereits in der gemeinsam deformierten
        // Gold-Mittelbahn. Ein zweiter Y-Versatz würde die Farbfasern vom Gold
        // und vom anschliessenden Tal trennen.
        var pulse=Math.max(0,Math.sin(flowTime*params.pulseSpeed*strand.flowDirection-progress*20*strand.flowDirection+fiberShape.phaseOffset));
        var verticalBrightness=params.topBrightness+(params.bottomBrightness-params.topBrightness)*pathProgress;
        var brightness=(params.baseBrightness+pulse*params.pulseStrength)
          *params.intensity*params.colorIntensity*verticalBrightness;
        // Jede Faser bleibt innerhalb ihrer eigenen Metallic-Palette. Der
        // Verlauf verschiebt sich sanft, ohne die drei Metallfarben zu vermischen.
        var metallic=.5+.5*Math.sin(fiber.metallicPhase+progress*7.2+flowTime*.28);
        var metallicFrom=metallic<.5?strand.tunedDeep:strand.tunedPrimary;
        var metallicTo=metallic<.5?strand.tunedPrimary:strand.tunedLight;
        var metallicBlend=metallic<.5?metallic*2:(metallic-.5)*2;
        var colorR=(metallicFrom.r+(metallicTo.r-metallicFrom.r)*metallicBlend)*brightness;
        var colorG=(metallicFrom.g+(metallicTo.g-metallicFrom.g)*metallicBlend)*brightness;
        var colorB=(metallicFrom.b+(metallicTo.b-metallicFrom.b)*metallicBlend)*brightness;
        secondaryRenderPoint.set(x,y,z);
        brain.worldToLocal(secondaryRenderPoint);
        x=secondaryRenderPoint.x;
        y=secondaryRenderPoint.y;
        z=secondaryRenderPoint.z;
        var pointIndex=fiber.pointOffset+step*3;
        strand.pointPositions[pointIndex]=x;
        strand.pointPositions[pointIndex+1]=y;
        strand.pointPositions[pointIndex+2]=z;
        strand.pointColors[pointIndex]=colorR;
        strand.pointColors[pointIndex+1]=colorG;
        strand.pointColors[pointIndex+2]=colorB;
        if(step>0){
          strand.linePositions[lineOffset]=previousX;
          strand.linePositions[lineOffset+1]=previousY;
          strand.linePositions[lineOffset+2]=previousZ;
          strand.linePositions[lineOffset+3]=x;
          strand.linePositions[lineOffset+4]=y;
          strand.linePositions[lineOffset+5]=z;
          strand.lineColors[lineOffset]=previousR;
          strand.lineColors[lineOffset+1]=previousG;
          strand.lineColors[lineOffset+2]=previousB;
          strand.lineColors[lineOffset+3]=colorR;
          strand.lineColors[lineOffset+4]=colorG;
          strand.lineColors[lineOffset+5]=colorB;
          lineOffset+=6;
        }
        previousX=x;
        previousY=y;
        previousZ=z;
        previousR=colorR;
        previousG=colorG;
        previousB=colorB;
      }
    }
    strand.lineMesh.geometry.attributes.position.needsUpdate=true;
    strand.lineMesh.geometry.attributes.color.needsUpdate=true;
    strand.pointMesh.geometry.attributes.position.needsUpdate=true;
    strand.pointMesh.geometry.attributes.color.needsUpdate=true;
    applySecondaryRendering(strand);
  }

  if(satelliteBrains.length>2){
    useExistingSatelliteStrand(satelliteBrains[0],Math.PI,SATELLITE_METALS.red,1,-1,RED_STRAND,0,3);
    useExistingSatelliteStrand(satelliteBrains[1],0,SATELLITE_METALS.blue,-1,1,BLUE_STRAND,1,3);
    useExistingSatelliteStrand(satelliteBrains[2],Math.PI*.5,SATELLITE_METALS.green,1,-1,GREEN_STRAND,2,3);
  }

  // Zentraler Controller für das Hauptgehirn und alle drei Satelliten. Er benutzt ausschliesslich
  // bestehende Knoten und Kanten des neuronalen Graphen; es gibt keine freien
  // Blitze, keine globalen Flashes und keine unabhängigen Zufallstimer mehr.
  function neuralHash(value){
    var seed=Math.sin(value*12.9898+78.233)*43758.5453;
    return seed-Math.floor(seed);
  }
  var neuralStartNodes=[];
  for(var neuralNodeIndex=0;neuralNodeIndex<graphAdj.length;neuralNodeIndex++){
    if(graphAdj[neuralNodeIndex]&&graphAdj[neuralNodeIndex].length&&pts[neuralNodeIndex].y>-.55) neuralStartNodes.push(neuralNodeIndex);
  }
  var neuralConvergenceAnchor=new THREE.Vector3(SBASE_X,SBASE_Y+.035,SBASE_Z);
  var neuralConvergenceNodeIndex=-1, neuralConvergenceDistance=Infinity;
  for(var convergenceSearchIndex=0;convergenceSearchIndex<pts.length;convergenceSearchIndex++){
    if(!graphAdj[convergenceSearchIndex]||!graphAdj[convergenceSearchIndex].length) continue;
    var convergenceDistance=pts[convergenceSearchIndex].distanceToSquared(neuralConvergenceAnchor);
    if(convergenceDistance<neuralConvergenceDistance){
      neuralConvergenceDistance=convergenceDistance;
      neuralConvergenceNodeIndex=convergenceSearchIndex;
    }
  }
  var neuralNextToConvergence=new Int32Array(graphAdj.length);
  neuralNextToConvergence.fill(-1);
  if(neuralConvergenceNodeIndex>=0){
    var convergenceQueue=[neuralConvergenceNodeIndex];
    neuralNextToConvergence[neuralConvergenceNodeIndex]=neuralConvergenceNodeIndex;
    for(var convergenceQueueIndex=0;convergenceQueueIndex<convergenceQueue.length;convergenceQueueIndex++){
      var convergenceCurrent=convergenceQueue[convergenceQueueIndex];
      var convergenceNeighbours=graphAdj[convergenceCurrent]||[];
      for(var convergenceNeighbourIndex=0;convergenceNeighbourIndex<convergenceNeighbours.length;convergenceNeighbourIndex++){
        var convergenceNeighbour=convergenceNeighbours[convergenceNeighbourIndex];
        if(neuralNextToConvergence[convergenceNeighbour]!==-1) continue;
        neuralNextToConvergence[convergenceNeighbour]=convergenceCurrent;
        convergenceQueue.push(convergenceNeighbour);
      }
    }
  }
  function buildNeuralRoute(seed,kind,hops){
    if(!neuralStartNodes.length) return [];
    var current=neuralStartNodes[Math.floor(neuralHash(seed+kind.length)*neuralStartNodes.length)];
    var previous=-1, route=[current];
    var wanderHops=Math.max(4,Math.round(hops*.52));
    for(var routeStep=0;routeStep<wanderHops;routeStep++){
      var neighbours=graphAdj[current]||[], candidates=[];
      for(var neighbourIndex=0;neighbourIndex<neighbours.length;neighbourIndex++) if(neighbours[neighbourIndex]!==previous) candidates.push(neighbours[neighbourIndex]);
      if(!candidates.length) candidates=neighbours.slice();
      if(!candidates.length) break;
      candidates.sort(function(a,b){
        var downA=(pts[current].y-pts[a].y)*(kind==='gold'?1.45:(kind==='blue'?.8:.45));
        var downB=(pts[current].y-pts[b].y)*(kind==='gold'?1.45:(kind==='blue'?.8:.45));
        return downB-downA;
      });
      var choiceCount=kind==='blue'?Math.min(2,candidates.length):Math.min(4,candidates.length);
      var choice=Math.floor(neuralHash(seed*3.17+routeStep*1.91+(kind==='red'?4:9))*choiceCount);
      previous=current;
      current=candidates[choice];
      route.push(current);
    }
    if(neuralConvergenceNodeIndex>=0){
      var convergenceGuard=0;
      while(current!==neuralConvergenceNodeIndex&&neuralNextToConvergence[current]>=0&&convergenceGuard<48){
        current=neuralNextToConvergence[current];
        route.push(current);
        convergenceGuard++;
      }
    }
    return route;
  }
  function NeuralImpulse(parentGroup,palette){
    this.maxTrail=9;
    this.positions=new Float32Array(this.maxTrail*3);
    this.colors=new Float32Array(this.maxTrail*3);
    var trailGeometry=new THREE.BufferGeometry();
    trailGeometry.setAttribute('position',new THREE.BufferAttribute(this.positions,3));
    trailGeometry.setAttribute('color',new THREE.BufferAttribute(this.colors,3));
    this.trailMaterial=new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:palette.depthTest!==false,toneMapped:palette.toneMapped!==false});
    this.trail=new THREE.Line(trailGeometry,this.trailMaterial);
    this.trail.frustumCulled=false;
    this.trail.visible=false;
    parentGroup.add(this.trail);
    this.coreMaterial=new THREE.SpriteMaterial({map:sprite,color:palette.highlight,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:palette.depthTest!==false,toneMapped:palette.toneMapped!==false});
    this.core=new THREE.Sprite(this.coreMaterial);
    this.core.frustumCulled=false;
    this.core.visible=false;
    parentGroup.add(this.core);
    this.glowMaterial=new THREE.SpriteMaterial({map:sprite,color:palette.primary,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:palette.depthTest!==false,toneMapped:palette.toneMapped!==false});
    this.glow=new THREE.Sprite(this.glowMaterial);
    this.glow.frustumCulled=false;
    this.glow.visible=false;
    parentGroup.add(this.glow);
    this.nodeGlows=[];
    for(var glowIndex=0;glowIndex<3;glowIndex++){
      var material=new THREE.SpriteMaterial({map:sprite,color:palette.light,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:palette.depthTest!==false,toneMapped:palette.toneMapped!==false});
      var node=new THREE.Sprite(material);
      node.frustumCulled=false;
      node.visible=false;
      parentGroup.add(node);
      this.nodeGlows.push({node:node,material:material,life:0});
    }
    this.palette=palette;
    this.intensity=palette.intensity||NEURAL_IMPULSE_INTENSITY;
    this.sizeScale=palette.sizeScale||1;
    this.samplePoint=new THREE.Vector3();
    this.active=false;
  }
  NeuralImpulse.prototype.begin=function(route,duration,onComplete){
    if(route.length<2) return false;
    this.route=route;
    this.duration=duration;
    this.elapsed=0;
    this.lastNode=-1;
    this.holdDuration=.34;
    this.onComplete=onComplete||null;
    this.active=true;
    this.trail.visible=true;
    this.core.visible=true;
    this.glow.visible=true;
    return true;
  };
  NeuralImpulse.prototype.sample=function(progress,target){
    var segmentFloat=THREE.MathUtils.clamp(progress,0,1)*(this.route.length-1);
    var segment=Math.min(this.route.length-2,Math.floor(segmentFloat));
    target.copy(pts[this.route[segment]]).lerp(pts[this.route[segment+1]],segmentFloat-segment);
    return {point:target,nodeIndex:this.route[Math.round(segmentFloat)]};
  };
  NeuralImpulse.prototype.update=function(dt){
    for(var glowIndex=0;glowIndex<this.nodeGlows.length;glowIndex++){
      var glow=this.nodeGlows[glowIndex];
      if(glow.life<=0) continue;
      glow.life-=dt;
      if(glow.life<=0){ glow.node.visible=false; glow.material.opacity=0; continue; }
      var glowFade=Math.max(0,glow.life/.36);
      glow.material.opacity=.07*this.intensity*glowFade*glowFade;
      var glowSize=(.07+(.11*(1-glowFade)))*this.sizeScale*Math.sqrt(this.intensity/5);
      glow.node.scale.set(glowSize,glowSize,1);
    }
    if(!this.active) return;
    this.elapsed+=dt;
    var progress=THREE.MathUtils.clamp(this.elapsed/this.duration,0,1);
    var holdProgress=THREE.MathUtils.clamp((this.elapsed-this.duration)/this.holdDuration,0,1);
    // Der Kopf bleibt bei der Ankunft sichtbar und klingt erst während der
    // kurzen Ruhephase am tiefsten Knoten weich aus.
    var travelEnvelope=Math.sin(Math.min(progress,.5)*Math.PI);
    var envelope=progress<1?travelEnvelope:(1-holdProgress)*.78;
    var head=this.sample(progress,this.samplePoint);
    if(head.nodeIndex!==this.lastNode){
      this.lastNode=head.nodeIndex;
      var nodeGlow=this.nodeGlows[head.nodeIndex%this.nodeGlows.length];
      nodeGlow.node.position.copy(pts[head.nodeIndex]);
      nodeGlow.life=.36;
      nodeGlow.node.visible=true;
    }
    this.core.position.copy(head.point);
    this.glow.position.copy(head.point);
    var coreSize=(.042+envelope*.022)*this.sizeScale*Math.sqrt(this.intensity/5);
    this.core.scale.set(coreSize,coreSize,1);
    this.glow.scale.set(coreSize*2.5,coreSize*2.5,1);
    this.coreMaterial.opacity=.32*this.intensity*envelope;
    this.glowMaterial.opacity=.045*this.intensity*envelope;
    for(var trailIndex=0;trailIndex<this.maxTrail;trailIndex++){
      var trailProgress=Math.max(0,progress-(this.maxTrail-1-trailIndex)*.026);
      var trailSample=this.sample(trailProgress,this.samplePoint);
      var trailAlpha=(trailIndex/(this.maxTrail-1))*envelope;
      this.positions[trailIndex*3]=trailSample.point.x;
      this.positions[trailIndex*3+1]=trailSample.point.y;
      this.positions[trailIndex*3+2]=trailSample.point.z;
      this.colors[trailIndex*3]=this.palette.light.r*trailAlpha;
      this.colors[trailIndex*3+1]=this.palette.light.g*trailAlpha;
      this.colors[trailIndex*3+2]=this.palette.light.b*trailAlpha;
    }
    this.trail.geometry.attributes.position.needsUpdate=true;
    this.trail.geometry.attributes.color.needsUpdate=true;
    this.trailMaterial.opacity=.23*this.intensity*envelope;
    if(this.elapsed>=this.duration+this.holdDuration){
      this.active=false;
      this.trailMaterial.opacity=0;
      this.coreMaterial.opacity=0;
      this.glowMaterial.opacity=0;
      this.trail.visible=false;
      this.core.visible=false;
      this.glow.visible=false;
      var onComplete=this.onComplete;
      this.onComplete=null;
      if(onComplete) onComplete();
    }
  };
  function NeuralConvergenceNode(parentGroup){
    this.maxCharge=12;
    this.charge=0;
    this.pendingDischarge=0;
    this.dischargeCycle=0;
    this.nextChargeTarget=8;
    this.anchor=neuralConvergenceAnchor.clone();
    this.coreMaterial=new THREE.SpriteMaterial({map:sprite,color:GOLD.highlight,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
    this.core=new THREE.Sprite(this.coreMaterial);
    this.core.position.copy(this.anchor);
    this.core.frustumCulled=false;
    parentGroup.add(this.core);
    this.haloMaterial=new THREE.SpriteMaterial({map:sprite,color:GOLD.light,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
    this.halo=new THREE.Sprite(this.haloMaterial);
    this.halo.position.copy(this.anchor);
    this.halo.frustumCulled=false;
    parentGroup.add(this.halo);
    this.discharge=new GoldStrandDischarge(parentGroup);
  }
  NeuralConvergenceNode.prototype.addCharge=function(){
    this.charge=Math.min(this.maxCharge,this.charge+1);
    if(this.pendingDischarge<=0&&this.charge>=this.nextChargeTarget){
      this.pendingDischarge=.12+neuralHash(this.dischargeCycle*7.13+this.charge*.71)*.58;
    }
  };
  NeuralConvergenceNode.prototype.update=function(dt){
    if(this.pendingDischarge>0){
      this.pendingDischarge-=dt;
      if(this.pendingDischarge<=0){
        this.discharge.trigger();
        this.charge=0;
        this.dischargeCycle++;
        this.nextChargeTarget=8+Math.floor(neuralHash(this.dischargeCycle*5.91)*5);
      }
    }
    var chargeLevel=this.charge/this.maxCharge;
    var breathing=.94+Math.sin(performance.now()*.006)*.06;
    var coreSize=(.055+chargeLevel*.115)*breathing;
    this.core.scale.set(coreSize,coreSize,1);
    this.halo.scale.set(coreSize*(2.25+chargeLevel*.8),coreSize*(2.25+chargeLevel*.8),1);
    this.coreMaterial.opacity=Math.min(1,(.06+chargeLevel*.56)*NEURAL_IMPULSE_INTENSITY/5);
    this.haloMaterial.opacity=Math.min(.32,(.014+chargeLevel*.12)*NEURAL_IMPULSE_INTENSITY/5);
    this.discharge.update(dt);
  };
  function GoldStrandDischarge(parentGroup){
    this.sampleCount=18;
    this.positions=new Float32Array(this.sampleCount*3);
    this.colors=new Float32Array(this.sampleCount*3);
    var geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.BufferAttribute(this.positions,3));
    geometry.setAttribute('color',new THREE.BufferAttribute(this.colors,3));
    this.material=new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
    this.line=new THREE.Line(geometry,this.material);
    this.line.frustumCulled=false;
    parentGroup.add(this.line);
    this.headMaterial=new THREE.SpriteMaterial({map:sprite,color:GOLD.highlight,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
    this.head=new THREE.Sprite(this.headMaterial);
    this.head.frustumCulled=false;
    parentGroup.add(this.head);
    this.haloMaterial=new THREE.SpriteMaterial({map:sprite,color:GOLD.light,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
    this.halo=new THREE.Sprite(this.haloMaterial);
    this.halo.frustumCulled=false;
    parentGroup.add(this.halo);
    this.impactMaterial=new THREE.SpriteMaterial({map:sprite,color:GOLD.highlight,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
    this.impact=new THREE.Sprite(this.impactMaterial);
    this.impact.frustumCulled=false;
    parentGroup.add(this.impact);
    this.fiberIndices=[];
    var fiberStride=Math.max(1,Math.floor(sFibers.length/8));
    for(var fiberIndex=0;fiberIndex<sFibers.length;fiberIndex+=fiberStride) this.fiberIndices.push(fiberIndex);
    this.sampleScratch=new THREE.Vector3();
    this.active=false;
    this.elapsed=0;
    this.duration=.72;
    this.impactLife=0;
  }
  GoldStrandDischarge.prototype.sampleCenterline=function(progress,target){
    var totalX=0,totalY=0,totalZ=0,count=0;
    for(var fiberIndex=0;fiberIndex<this.fiberIndices.length;fiberIndex++){
      var fiber=sFibers[this.fiberIndices[fiberIndex]];
      if(!fiber) continue;
      var vertexIndex=fiber.start+Math.round(THREE.MathUtils.clamp(progress,0,1)*(fiber.len-1));
      goldStrandVertexLocal(vertexIndex,this.sampleScratch,true);
      totalX+=this.sampleScratch.x;
      totalY+=this.sampleScratch.y;
      totalZ+=this.sampleScratch.z;
      count++;
    }
    return target.set(totalX/Math.max(1,count),totalY/Math.max(1,count),totalZ/Math.max(1,count));
  };
  GoldStrandDischarge.prototype.trigger=function(){
    if(this.active) return;
    this.elapsed=0;
    this.active=true;
  };
  GoldStrandDischarge.prototype.update=function(dt){
    if(!this.active){
      if(this.impactLife<=0) return;
      this.impactLife-=dt;
      var impactFade=Math.max(0,this.impactLife/.34);
      var impactScale=.11+(.24*(1-impactFade));
      this.impact.scale.set(impactScale,impactScale,1);
      this.impactMaterial.opacity=.36*impactFade*impactFade;
      return;
    }
    this.elapsed+=dt;
    var progress=THREE.MathUtils.clamp(this.elapsed/this.duration,0,1);
    var tailProgress=Math.max(0,progress-.31);
    for(var sampleIndex=0;sampleIndex<this.sampleCount;sampleIndex++){
      var sampleProgress=tailProgress+(progress-tailProgress)*(sampleIndex/(this.sampleCount-1));
      var point=this.sampleCenterline(sampleProgress,this.sampleScratch);
      var alpha=Math.pow(sampleIndex/(this.sampleCount-1),1.45)*Math.sin(progress*Math.PI);
      this.positions[sampleIndex*3]=point.x;
      this.positions[sampleIndex*3+1]=point.y;
      this.positions[sampleIndex*3+2]=point.z;
      this.colors[sampleIndex*3]=GOLD.highlight.r*alpha;
      this.colors[sampleIndex*3+1]=GOLD.highlight.g*alpha;
      this.colors[sampleIndex*3+2]=GOLD.highlight.b*alpha;
    }
    this.line.geometry.attributes.position.needsUpdate=true;
    this.line.geometry.attributes.color.needsUpdate=true;
    this.material.opacity=.72*NEURAL_IMPULSE_INTENSITY/5;
    var headPoint=this.sampleCenterline(progress,this.sampleScratch);
    this.head.position.copy(headPoint);
    this.halo.position.copy(headPoint);
    var headSize=.055+Math.sin(progress*Math.PI)*.055;
    this.head.scale.set(headSize,headSize,1);
    this.halo.scale.set(headSize*3.4,headSize*3.4,1);
    this.headMaterial.opacity=.82*Math.sin(progress*Math.PI);
    this.haloMaterial.opacity=.12*Math.sin(progress*Math.PI);
    if(progress>=1){
      this.active=false;
      this.material.opacity=0;
      this.headMaterial.opacity=0;
      this.haloMaterial.opacity=0;
      this.impact.position.copy(headPoint);
      this.impactLife=.34;
    }
  };
  function NeuralActivityController(){
    var goldImpulsePalette={primary:GOLD.primary,light:GOLD.light,highlight:GOLD.highlight,intensity:2.7,sizeScale:.42};
    this.goldImpulses=[];
    this.redImpulses=[];
    this.blueImpulses=[];
    this.greenImpulses=[];
    for(var goldImpulseCreateIndex=0;goldImpulseCreateIndex<40;goldImpulseCreateIndex++){
      this.goldImpulses.push(new NeuralImpulse(brain,goldImpulsePalette));
    }
    for(var satelliteImpulseCreateIndex=0;satelliteImpulseCreateIndex<40;satelliteImpulseCreateIndex++){
      this.redImpulses.push(new NeuralImpulse(satelliteBrains[0],{primary:SATELLITE_METALS.red.primary,light:SATELLITE_METALS.red.light,highlight:new THREE.Color(0xf3b0b9),intensity:4.4,sizeScale:.42,depthTest:false,toneMapped:false}));
      this.blueImpulses.push(new NeuralImpulse(satelliteBrains[1],{primary:SATELLITE_METALS.blue.primary,light:SATELLITE_METALS.blue.light,highlight:new THREE.Color(0xc4e3ff),intensity:4.4,sizeScale:.42,depthTest:false,toneMapped:false}));
      this.greenImpulses.push(new NeuralImpulse(satelliteBrains[2],{primary:SATELLITE_METALS.green.primary,light:SATELLITE_METALS.green.light,highlight:new THREE.Color(0xc7ffe1),intensity:4.4,sizeScale:.42,depthTest:false,toneMapped:false}));
    }
    this.impulses={
      gold:this.goldImpulses[0],
      red:this.redImpulses[0],
      blue:this.blueImpulses[0],
      green:this.greenImpulses[0]
    };
    this.randomSeed=1;
    this.randomTimers={gold:[],red:[],blue:[],green:[]};
    for(var goldTimerCreateIndex=0;goldTimerCreateIndex<this.goldImpulses.length;goldTimerCreateIndex++) this.randomTimers.gold.push(Math.random()*6.6);
    for(var satelliteTimerCreateIndex=0;satelliteTimerCreateIndex<this.redImpulses.length;satelliteTimerCreateIndex++){
      this.randomTimers.red.push(Math.random()*2.6);
      this.randomTimers.blue.push(Math.random()*3.1);
      this.randomTimers.green.push(Math.random()*3.4);
    }
    this.sequenceIndex=0;
    this.sequenceTime=0;
    this.cooldown=.85;
    this.steps=[];
    this.goldConvergence=new NeuralConvergenceNode(brain);
    this.sequences=[
      [{actor:'gold',delay:0,hops:14,duration:2.05},{actor:'red',delay:.86,hops:11,duration:2.25}],
      [{actor:'gold',delay:0,hops:13,duration:1.95},{actor:'blue',delay:.78,hops:12,duration:1.85}],
      [{actor:'gold',delay:0,hops:12,duration:1.9},{actor:'green',delay:.82,hops:11,duration:2.05}],
      [{actor:'gold',delay:0,hops:11,duration:1.9},{actor:'red',delay:.7,hops:10,duration:2.1},{actor:'blue',delay:1.58,hops:12,duration:1.8},{actor:'green',delay:2.12,hops:11,duration:1.9},{actor:'gold',delay:2.75,hops:8,duration:1.45}]
    ];
  }
  NeuralActivityController.prototype.startSequence=function(){
    var sequence=this.sequences[this.sequenceIndex%this.sequences.length];
    this.steps=[];
    for(var stepIndex=0;stepIndex<sequence.length;stepIndex++) this.steps.push({actor:sequence[stepIndex].actor,delay:sequence[stepIndex].delay,hops:sequence[stepIndex].hops,duration:sequence[stepIndex].duration,started:false});
    this.sequenceTime=0;
    this.sequenceIndex++;
  };
  NeuralActivityController.prototype.update=function(dt){
    for(var goldUpdateIndex=0;goldUpdateIndex<this.goldImpulses.length;goldUpdateIndex++) this.goldImpulses[goldUpdateIndex].update(dt);
    for(var redUpdateIndex=0;redUpdateIndex<this.redImpulses.length;redUpdateIndex++) this.redImpulses[redUpdateIndex].update(dt);
    for(var blueUpdateIndex=0;blueUpdateIndex<this.blueImpulses.length;blueUpdateIndex++) this.blueImpulses[blueUpdateIndex].update(dt);
    for(var greenUpdateIndex=0;greenUpdateIndex<this.greenImpulses.length;greenUpdateIndex++) this.greenImpulses[greenUpdateIndex].update(dt);
    for(var goldTimerIndex=0;goldTimerIndex<this.goldImpulses.length;goldTimerIndex++){
      this.randomTimers.gold[goldTimerIndex]-=dt;
      if(this.randomTimers.gold[goldTimerIndex]<=0&&!this.goldImpulses[goldTimerIndex].active){
        this.randomSeed++;
        this.goldImpulses[goldTimerIndex].begin(buildNeuralRoute(this.randomSeed*17+goldTimerIndex*31,'gold',12+Math.floor(Math.random()*8)),1.55+Math.random()*.8,null);
        this.randomTimers.gold[goldTimerIndex]=1.8+Math.random()*4.8;
      }
    }
    var satelliteActors=[
      {name:'red',impulses:this.redImpulses,basePause:2.5,pauseRange:5.2},
      {name:'blue',impulses:this.blueImpulses,basePause:3.4,pauseRange:6.4},
      {name:'green',impulses:this.greenImpulses,basePause:3,pauseRange:5.8}
    ];
    for(var actorIndex=0;actorIndex<satelliteActors.length;actorIndex++){
      var actor=satelliteActors[actorIndex].name;
      var actorImpulses=satelliteActors[actorIndex].impulses;
      for(var actorImpulseIndex=0;actorImpulseIndex<actorImpulses.length;actorImpulseIndex++){
        var impulse=actorImpulses[actorImpulseIndex];
        this.randomTimers[actor][actorImpulseIndex]-=dt;
        if(this.randomTimers[actor][actorImpulseIndex]<=0&&!impulse.active){
          this.randomSeed++;
          impulse.begin(buildNeuralRoute(this.randomSeed*23+actorIndex*41+actorImpulseIndex*13,actor,10+Math.floor(Math.random()*9)),1.45+Math.random()*.9,null);
          this.randomTimers[actor][actorImpulseIndex]=satelliteActors[actorIndex].basePause+Math.random()*satelliteActors[actorIndex].pauseRange;
        }
      }
    }
  };
  var neuralActivityController=new NeuralActivityController();

  // Das interne Entwicklungswerkzeug bleibt auf der öffentlichen Website
  // standardmässig ausgeblendet, ist aber über ?tune=1 in der URL erreichbar
  // (z.B. zum Live-Einstellen der Tal-Werte), ohne die Produktivseite zu
  // beeinflussen.
  var SHOW_STRAND_TUNING=typeof window!=='undefined'
    &&new URLSearchParams(window.location.search).get('tune')==='1';
  var tunePanel=null, tuneLauncher=null;
  var tuneStartsOpen=SHOW_STRAND_TUNING;
  if (SHOW_STRAND_TUNING&&typeof window!=='undefined') {
    function sectionLabel(text,color){
      var s=document.createElement('div');
      s.textContent=text;
      s.style.cssText='margin:12px 0 7px;color:'+(color||'#e7c56a')+';font-weight:bold;letter-spacing:.08em;text-transform:uppercase;';
      tunePanel.appendChild(s);
    }
    function addSlider(def,target,handler){
      var key=def[0], label=def[1], min=def[2], max=def[3], step=def[4];
      var row=document.createElement('div'); row.style.cssText='margin-bottom:6px;';
      var lab=document.createElement('div');
      lab.style.cssText='display:flex;justify-content:space-between;margin-bottom:2px;';
      var labName=document.createElement('span'); labName.textContent=label;
      var labVal=document.createElement('span'); labVal.textContent=String(target[key]);
      lab.appendChild(labName); lab.appendChild(labVal);
      var input=document.createElement('input');
      input.type='range'; input.min=String(min); input.max=String(max); input.step=String(step);
      input.value=String(target[key]); input.style.cssText='width:100%;accent-color:#c89a3d;';
      input.oninput=function(){
        target[key]=parseFloat(input.value);
        labVal.textContent=target[key].toFixed(step>=1?0:3);
        if(handler===false) return;
        if(typeof handler==='function') handler();
        else rebuildStrand();
      };
      row.appendChild(lab); row.appendChild(input);
      tunePanel.appendChild(row);
    }
    var PRIMARY_SHAPE_SLIDERS=[
      ['rStr','Wirbel-Radius',0,0.08,0.002],
      ['gather','Wirbel-Einsetzpunkt',0.02,0.9,0.01],
      ['taper','Bündel-Verjüngung',0,0.6,0.01],
      ['curve','Schwung',0,0.15,0.005],
      ['twist','Verdrehung',0,10,0.1],
      ['jitter','Zittern',0,0.03,0.001],
      ['spacing','Punktabstand',0.015,0.06,0.001],
      ['ringSpread','Ring-Streuung',0.1,4,0.05],
      ['droop','Schwerkraft-Durchhang',0,1.5,0.01],
      ['frayStart','Auffransen ab',0.3,0.98,0.01],
      ['fraySpread','Auffransen-Streuung',0,0.15,0.002]
    ];
    var FUNNEL_SLIDERS=[
      ['count','Faseranzahl',10,300,1],
      ['anchorRadius','Anker-Radius (Stumpf)',0.1,1.2,0.01],
      ['funnelHeight','Trichter-Höhe',0.05,0.9,0.01],
      ['funnelSegs','Trichter-Segmente',3,20,1],
      ['convergePull','Konvergenz-Stärke',0.1,1,0.01],
      ['outletRadius','Auslass-Radius unten',0.04,0.42,0.005],
      ['outletHeightSpread','Auslass-Höhenstreuung',0,0.5,0.005],
      ['randomness','Zufälligkeit',0,1,0.01]
    ];
    var WIND_SLIDERS=[
      ['sway','Luftzug-Stärke',0,0.14,0.001],
      ['speed','Luftzug-Tempo',0.05,1.2,0.01],
      ['wave','Faser-Wellen',0,0.12,0.001],
      ['waveFrequency','Wellen-Frequenz',1,16,0.1]
    ];
    var MOVE_SLIDERS=[
      ['moveLeft','Nach links',0,0.8,0.005],
      ['moveRight','Nach rechts',0,0.8,0.005],
      ['moveForward','Nach vorne',0,0.8,0.005],
      ['moveBack','Nach hinten',0,0.8,0.005],
      ['moveVertical','Vertikal hoch/runter',-0.8,0.8,0.005]
    ];
    var PRIMARY_FINE_POSITION_SLIDERS=[
      ['offX','Basis X',-1.2,1.2,0.005],
      ['offY','Basis Y',-1.2,1.2,0.005],
      ['offZ','Basis Z',-1.2,1.2,0.005]
    ];
    var GOLD_RENDER_SLIDERS=[
      ['intensity','Lichtintensität',0.05,3,0.01],
      ['lineOpacity','Linien-Deckkraft',0.02,1,0.01],
      ['pointOpacity','Faser-Deckkraft',0.02,1,0.01]
    ];
    var GOLD_POINT_SLIDERS=[
      ['ptSize','Faser-Dicke',0.004,0.12,0.001]
    ];
    var GOLD_THICKNESS_SLIDERS=[
      ['topThickness','Gesamtdicke oben',0.25,3,0.01],
      ['bottomThickness','Gesamtdicke unten',0.25,3,0.01]
    ];
    var GOLD_ESCAPE_SLIDERS=[
      ['escapeAmount','Ausreisser-Menge',0,1,0.01],
      ['escapeAmplitude','Ausreisser-Ausschlag',0,3,0.01],
      ['escapeFrequency','Wellen-Häufigkeit',0.1,3,0.01],
      ['escapeWavelength','Wellenlänge',0.2,4,0.01],
      ['escapeSpeed','Wellen-Fluss',0,3,0.01]
    ];
    var GOLD_COLOR_SLIDERS=[
      ['colorHue','Metall-Farbton',-0.14,0.14,0.001],
      ['colorSaturation','Metall-Sättigung',0,1.6,0.01],
      ['colorLightness','Metall-Helligkeit',0.2,1.6,0.01],
      ['colorIntensity','Farbintensität',0,3,0.01]
    ];
    var GOLD_LIGHT_GRADIENT_SLIDERS=[
      ['topBrightness','Belichtung oben',0,3,0.01],
      ['bottomBrightness','Belichtung unten',0,3,0.01]
    ];
    var LANDSCAPE_SHAPE_SLIDERS=[
      ['halfWidth','Talbreite (Berg links/rechts)',2,14,0.05],
      ['depth','Taltiefe nach hinten',1,10,0.05],
      ['floorDepth','Talboden-Tiefe (Mitte)',0,4,0.02],
      ['corridorWidthFactor','Breite des flachen Bodens',0.05,0.9,0.01],
      ['corridorSharpness','Wand-Schärfe',0.5,4,0.02],
      ['corridorHeight','Berghöhen links/rechts',0,7,0.02]
    ];
    var LANDSCAPE_TEXTURE_SLIDERS=[
      ['meanderAmplitudeBase','Wellen-Ausschlag (Basis)',0,2,0.01],
      ['meanderAmplitudeRange','Wellen-Ausschlag (Streuung)',0,2,0.01],
      ['meanderFrequencyBase','Wellenlänge (Basis)',0.1,6,0.05],
      ['meanderFrequencyRange','Wellenlänge (Streuung)',0,6,0.05],
      ['jitterXAmount','Unregelmässigkeit seitlich',0,0.6,0.005],
      ['jitterZAmount','Unregelmässigkeit in die Tiefe',0,0.6,0.005],
      ['wallBumpAmount','Unebenheit der Hänge',0,1.5,0.01]
    ];
    var LANDSCAPE_DENSITY_SLIDERS=[
      ['fiberFamilyCount','Faserfamilien (Farbgruppen)',1,6,1],
      ['trunkPoints','Knotenpunkte · Stammnahe Zone',4,60,1],
      ['deltaPoints','Knotenpunkte · Übergangszone',4,140,1],
      ['fieldPoints','Knotenpunkte · Talfläche',10,240,2]
    ];
    var LANDSCAPE_HORIZONTAL_SLIDERS=[
      ['horizontalZoneFraction','Horizontale Zone (Anteil der Talfläche)',0,1,0.02],
      ['horizontalLinkStep','Abstand der horizontalen Linien',1,12,1]
    ];
    var LANDSCAPE_COLOR_SLIDERS=[
      ['colorHue','Farbton-Verschiebung',-0.3,0.3,0.002],
      ['colorSaturation','Sättigung',0,2,0.01],
      ['colorLightness','Helligkeit',0.2,2,0.01]
    ];
    var SECONDARY_GEOMETRY_SLIDERS=[
      ['fiberAmount','Faseranzahl',0.08,1.6,0.01],
      ['topFunnel','Trichter oben',0.2,3,0.01],
      ['connectorShare','Einwärtsneigung ab',0.05,0.65,0.01],
      ['joinRadius','Endbündel-Radius',0.01,0.22,0.005],
      ['funnelSpread','Faser-Streuung',0,2,0.01],
      ['firstDroop','Durchhang Start',0.1,2.5,0.01],
      ['secondDroop','Durchhang Mitte',0.1,2.5,0.01],
      ['sidePull','Seitenhalt',0,1.8,0.01],
      ['endPull','End-Anziehung',0,1.5,0.01],
      ['sway','Seitenschwingung',0,2.5,0.01]
    ];
    var SECONDARY_THICKNESS_SLIDERS=[
      ['topThickness','Gesamtdicke oben',0.25,3,0.01],
      ['bottomThickness','Gesamtdicke unten',0.25,3,0.01],
      ['pointSize','Einzelfaser-Dicke',0.01,0.2,0.001]
    ];
    var SECONDARY_ESCAPE_SLIDERS=[
      ['escapeAmount','Ausreisser-Menge',0,1,0.01],
      ['escapeAmplitude','Ausreisser-Ausschlag',0,3,0.01],
      ['escapeFrequency','Wellen-Häufigkeit',0.1,3,0.01],
      ['escapeWavelength','Wellenlänge',0.2,4,0.01],
      ['escapeSpeed','Wellen-Fluss',0,3,0.01]
    ];
    var SECONDARY_COLOR_SLIDERS=[
      ['colorHue','Metall-Farbton',-0.14,0.14,0.001],
      ['colorSaturation','Metall-Sättigung',0,1.6,0.01],
      ['colorLightness','Metall-Helligkeit',0.2,1.6,0.01],
      ['colorIntensity','Farbintensität',0,3,0.01]
    ];
    var SECONDARY_LIGHT_SLIDERS=[
      ['intensity','Gesamt-Belichtung',0.05,3,0.01],
      ['topBrightness','Belichtung oben',0,3,0.01],
      ['bottomBrightness','Belichtung unten',0,3,0.01],
      ['lineOpacity','Linien-Deckkraft',0.02,1,0.01],
      ['pointOpacity','Faser-Deckkraft',0.02,1,0.01],
      ['baseBrightness','Grundhelligkeit',0.02,1,0.01],
      ['pulseStrength','Pulsstärke',0,1.2,0.01],
      ['pulseSpeed','Puls-Tempo',0,8,0.05]
    ];
    var SECONDARY_POSITION_SLIDERS=[
      ['posX','Position X',-2,2,0.01],
      ['posY','Position Y',-2,2,0.01],
      ['posZ','Position Z',-2,2,0.01]
    ];
    tunePanel=document.createElement('div');
    tunePanel.style.cssText='position:fixed;top:80px;right:10px;z-index:99999;'
      +'background:rgba(10,10,10,.88);color:#fff;font:11px/1.4 monospace;padding:12px;border-radius:8px;'
      +'max-height:80vh;overflow:auto;width:276px;box-shadow:0 4px 20px rgba(0,0,0,.5);';
    var TUNING_PANEL_POSITION_KEY='ms-strand-tuning-panel-position-v1';
    function persistTuningPanelPosition(){
      try {
        window.localStorage.setItem(TUNING_PANEL_POSITION_KEY,JSON.stringify({
          left:parseFloat(tunePanel.style.left),
          top:parseFloat(tunePanel.style.top)
        }));
      } catch(_) {}
    }
    try {
      var savedTuningPanelPosition=JSON.parse(window.localStorage.getItem(TUNING_PANEL_POSITION_KEY)||'null');
      if(savedTuningPanelPosition&&Number.isFinite(savedTuningPanelPosition.left)&&Number.isFinite(savedTuningPanelPosition.top)){
        tunePanel.style.left=savedTuningPanelPosition.left+'px';
        tunePanel.style.top=savedTuningPanelPosition.top+'px';
        tunePanel.style.right='auto';
      }
    } catch(_) {}
    tunePanel.style.display=tuneStartsOpen?'block':'none';
    var title=document.createElement('div');
    title.textContent='☰ 3-Strang-Tuning · ziehen zum Platzieren';
    title.style.cssText='font-weight:bold;margin-bottom:8px;font-size:12px;cursor:move;'
      +'user-select:none;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,.15);';
    tunePanel.appendChild(title);

    // Panel per Maus (und Touch) frei verschiebbar machen, ziehbar am Titel.
    (function makeDraggable(handle, panel){
      var dragging=false, startX=0, startY=0, startLeft=0, startTop=0;
      function toLeftTop(){
        var r=panel.getBoundingClientRect();
        panel.style.left=r.left+'px';
        panel.style.top=r.top+'px';
        panel.style.right='auto';
      }
      function clamp(){
        var maxLeft=window.innerWidth-panel.offsetWidth-4;
        var maxTop=window.innerHeight-40;
        var left=Math.min(Math.max(4,parseFloat(panel.style.left)),Math.max(4,maxLeft));
        var top=Math.min(Math.max(4,parseFloat(panel.style.top)),Math.max(4,maxTop));
        panel.style.left=left+'px';
        panel.style.top=top+'px';
      }
      function onDown(clientX,clientY){
        toLeftTop();
        dragging=true;
        startX=clientX; startY=clientY;
        startLeft=parseFloat(panel.style.left);
        startTop=parseFloat(panel.style.top);
      }
      function onMove(clientX,clientY){
        if(!dragging) return;
        panel.style.left=(startLeft+(clientX-startX))+'px';
        panel.style.top=(startTop+(clientY-startY))+'px';
        clamp();
      }
      function onUp(){
        if(!dragging) return;
        dragging=false;
        persistTuningPanelPosition();
      }
      handle.addEventListener('mousedown',function(e){ e.preventDefault(); onDown(e.clientX,e.clientY); });
      window.addEventListener('mousemove',function(e){ if(dragging) onMove(e.clientX,e.clientY); });
      window.addEventListener('mouseup',onUp);
      handle.addEventListener('touchstart',function(e){ var t=e.touches[0]; onDown(t.clientX,t.clientY); },{passive:true});
      window.addEventListener('touchmove',function(e){ if(dragging){ var t=e.touches[0]; onMove(t.clientX,t.clientY); } },{passive:true});
      window.addEventListener('touchend',onUp);
    })(title,tunePanel);

    function refreshSecondaryStrand(strand,rebuildGeometry){
      if(!strand) return;
      if(rebuildGeometry) rebuildSecondaryStrandGeometry(strand);
      curveExistingSatelliteStrand(strand,typeof t==='number'?t:0);
      applySecondaryRendering(strand);
    }

    function refreshGoldStrand(rebuildGeometry){
      if(rebuildGeometry) rebuildStrand();
      updateGoldStrandGeometry(typeof t==='number'?t:0);
      applyGoldRendering();
    }

    sectionLabel('Schnellsteuerung • Länge nach unten','#ffffff');
    addSlider(
      ['length','Stranglänge nach unten',2,20,.05],
      SP,
      function(){ refreshGoldStrand(true); }
    );
    addSlider(
      ['stretch','Wellen nach unten strecken',.7,3,.01],
      WULST_TUNING,
      function(){
        refreshGoldStrand(false);
        for(var strandIndex=0;strandIndex<satelliteStrands.length;strandIndex++) refreshSecondaryStrand(satelliteStrands[strandIndex],false);
      }
    );
    addSlider(
      ['redBlueDrop','Gesamte Wulst nach unten',0,6,.02],
      WULST_TUNING,
      function(){
        refreshGoldStrand(false);
        for(var strandIndex=0;strandIndex<satelliteStrands.length;strandIndex++) refreshSecondaryStrand(satelliteStrands[strandIndex],false);
      }
    );
    addSlider(
      ['liquify','Kante verflüssigen',.6,3,.01],
      WULST_TUNING,
      function(){
        refreshGoldStrand(false);
        for(var strandIndex=0;strandIndex<satelliteStrands.length;strandIndex++) refreshSecondaryStrand(satelliteStrands[strandIndex],false);
      }
    );

    function appendSecondaryControls(name,strand,color){
      if(!strand) return;
      sectionLabel(name+' • 3D-Position',color);
      SECONDARY_POSITION_SLIDERS.forEach(function(def){
        addSlider(def,strand.params,function(){ refreshSecondaryStrand(strand,false); });
      });
      sectionLabel(name+' • Gesamtdicke',color);
      SECONDARY_THICKNESS_SLIDERS.forEach(function(def){
        addSlider(def,strand.params,function(){ refreshSecondaryStrand(strand,false); });
      });
      sectionLabel(name+' • Faserbündel & Trichter',color);
      SECONDARY_GEOMETRY_SLIDERS.forEach(function(def){
        addSlider(def,strand.params,function(){ refreshSecondaryStrand(strand,def[0]==='fiberAmount'); });
      });
      sectionLabel(name+' • Ausreisser-Fasern',color);
      SECONDARY_ESCAPE_SLIDERS.forEach(function(def){
        addSlider(def,strand.params,function(){ refreshSecondaryStrand(strand,def[0]==='escapeAmount'); });
      });
      sectionLabel(name+' • Metallfarbe',color);
      SECONDARY_COLOR_SLIDERS.forEach(function(def){
        addSlider(def,strand.params,function(){ refreshSecondaryStrand(strand,false); });
      });
      sectionLabel(name+' • Lichtverlauf & Energie',color);
      SECONDARY_LIGHT_SLIDERS.forEach(function(def){
        addSlider(def,strand.params,function(){ refreshSecondaryStrand(strand,false); });
      });
    }

    sectionLabel('Gold • Gesamtposition','#f6e3a1');
    MOVE_SLIDERS.forEach(function(def){ addSlider(def,MP); });
    sectionLabel('Gold • Feinversatz','#f6e3a1');
    PRIMARY_FINE_POSITION_SLIDERS.forEach(function(def){ addSlider(def,SP); });
    sectionLabel('Gold • Trichter oben/unten','#f6e3a1');
    FUNNEL_SLIDERS.forEach(function(def){ addSlider(def,FN); });
    sectionLabel('Gold • Luftzug & Wellen','#f6e3a1');
    WIND_SLIDERS.forEach(function(def){ addSlider(def,WIND,false); });
    sectionLabel('Gold • Faserbündel','#f6e3a1');
    PRIMARY_SHAPE_SLIDERS.forEach(function(def){ addSlider(def,SP); });
    sectionLabel('Gold • Gesamtdicke','#f6e3a1');
    GOLD_THICKNESS_SLIDERS.forEach(function(def){ addSlider(def,GOLD_STRAND_TUNING,function(){ refreshGoldStrand(true); }); });
    sectionLabel('Gold • Ausreisser-Fasern','#f6e3a1');
    GOLD_ESCAPE_SLIDERS.forEach(function(def){
      addSlider(def,GOLD_STRAND_TUNING,function(){ refreshGoldStrand(def[0]==='escapeAmount'); });
    });
    sectionLabel('Gold • Metallfarbe','#f6e3a1');
    GOLD_COLOR_SLIDERS.forEach(function(def){ addSlider(def,GOLD_STRAND_TUNING,function(){ refreshGoldStrand(false); }); });
    sectionLabel('Gold • Lichtverlauf & Dicke','#f6e3a1');
    GOLD_LIGHT_GRADIENT_SLIDERS.forEach(function(def){ addSlider(def,GOLD_STRAND_TUNING,function(){ refreshGoldStrand(false); }); });
    GOLD_RENDER_SLIDERS.forEach(function(def){ addSlider(def,GOLD_RENDER,function(){ applyGoldRendering(); }); });
    GOLD_POINT_SLIDERS.forEach(function(def){ addSlider(def,SP,function(){ applyGoldRendering(); }); });

    sectionLabel('Tal • Form & Ausmasse','#7fd9a8');
    LANDSCAPE_SHAPE_SLIDERS.forEach(function(def){
      addSlider(def,LANDSCAPE_TUNING,function(){ refreshGoldStrand(true); });
    });
    sectionLabel('Tal • Wellen & Unebenheit','#7fd9a8');
    LANDSCAPE_TEXTURE_SLIDERS.forEach(function(def){
      addSlider(def,LANDSCAPE_TUNING,function(){ refreshGoldStrand(true); });
    });
    sectionLabel('Tal • Fasern & Knotenpunkte','#7fd9a8');
    LANDSCAPE_DENSITY_SLIDERS.forEach(function(def){
      addSlider(def,LANDSCAPE_TUNING,function(){ refreshGoldStrand(true); });
    });
    sectionLabel('Tal • Färbung','#7fd9a8');
    LANDSCAPE_COLOR_SLIDERS.forEach(function(def){
      addSlider(def,LANDSCAPE_TUNING,function(){ refreshGoldStrand(true); });
    });
    sectionLabel('Tal • Horizontale Linien','#7fd9a8');
    LANDSCAPE_HORIZONTAL_SLIDERS.forEach(function(def){
      addSlider(def,LANDSCAPE_TUNING,function(){ refreshGoldStrand(true); });
    });

    appendSecondaryControls('Rot • linker Strang',satelliteStrands[0],'#d9788a');
    appendSecondaryControls('Blau • rechter Strang',satelliteStrands[1],'#8ebef2');
    appendSecondaryControls('Grün • mittlerer linker Strang',satelliteStrands[2],'#75e0aa');
    sectionLabel('Gold • Interaktives Ende','#f6e3a1');
    var resetGoldEndBtn=document.createElement('button');
    resetGoldEndBtn.type='button';
    resetGoldEndBtn.textContent='Gezogenes Ende zurücksetzen';
    resetGoldEndBtn.style.cssText='width:100%;padding:7px;background:rgba(231,197,106,.12);color:#f6e3a1;'
      +'border:1px solid rgba(231,197,106,.52);border-radius:5px;font-weight:bold;cursor:pointer;';
    resetGoldEndBtn.onclick=resetGoldStrandEnd;
    tunePanel.appendChild(resetGoldEndBtn);
    window.__strandTuning={SP:SP,FN:FN,MP:MP,WIND:WIND,GOLD_RENDER:GOLD_RENDER,GOLD_STRAND_TUNING:GOLD_STRAND_TUNING,WULST_TUNING:WULST_TUNING,LANDSCAPE_TUNING:LANDSCAPE_TUNING,RED_STRAND:RED_STRAND,BLUE_STRAND:BLUE_STRAND,GREEN_STRAND:GREEN_STRAND,resetGoldEnd:resetGoldStrandEnd};
    var copyBtn=document.createElement('button');
    copyBtn.textContent='Werte kopieren';
    copyBtn.style.cssText='margin-top:8px;width:100%;padding:6px;background:#c89a3d;color:#000;'
      +'border:none;border-radius:5px;font-weight:bold;cursor:pointer;';
    var out=document.createElement('textarea');
    out.style.cssText='width:100%;height:190px;margin-top:6px;font:10px/1.3 monospace;background:#111;color:#0f0;'
      +'border:1px solid #444;border-radius:4px;padding:4px;';
    copyBtn.onclick=function(){
      var snippet='SP={ length:'+SP.length+', rStr:'+SP.rStr+', gather:'+SP.gather
        +', taper:'+SP.taper+', curve:'+SP.curve+', twist:'+SP.twist+', jitter:'+SP.jitter
        +', ptSize:'+SP.ptSize+', spacing:'+SP.spacing
        +', ringSpread:'+SP.ringSpread+', offX:'+SP.offX+', offY:'+SP.offY+', offZ:'+SP.offZ
        +', droop:'+SP.droop+', frayStart:'+SP.frayStart+', fraySpread:'+SP.fraySpread+' }\\n'
        +'FN={ count:'+FN.count+', anchorRadius:'+FN.anchorRadius+', funnelHeight:'+FN.funnelHeight
        +', funnelSegs:'+FN.funnelSegs+', convergePull:'+FN.convergePull+', outletRadius:'+FN.outletRadius
        +', outletHeightSpread:'+FN.outletHeightSpread+', randomness:'+FN.randomness+' }\\n'
        +'MP={ moveLeft:'+MP.moveLeft+', moveRight:'+MP.moveRight+', moveForward:'+MP.moveForward
        +', moveBack:'+MP.moveBack+', moveVertical:'+MP.moveVertical+' }\\n'
        +'WIND={ sway:'+WIND.sway+', speed:'+WIND.speed+', wave:'+WIND.wave+', waveFrequency:'+WIND.waveFrequency+' }\\n'
        +'stumpCenter=['+SBASE_X+','+SBASE_Y+','+SBASE_Z+']\n'
        +'GOLD_RENDER='+JSON.stringify(GOLD_RENDER)+'\n'
        +'GOLD_STRAND_TUNING='+JSON.stringify(GOLD_STRAND_TUNING)+'\n'
        +'WULST_TUNING='+JSON.stringify(WULST_TUNING)+'\n'
        +'LANDSCAPE_TUNING='+JSON.stringify(LANDSCAPE_TUNING)+'\n'
        +'GOLD_END='+(strandEndTargetWorld?JSON.stringify({x:strandEndTargetWorld.x,y:strandEndTargetWorld.y,z:strandEndTargetWorld.z}):'null')+'\n'
        +'RED_STRAND='+JSON.stringify(RED_STRAND)+'\n'
        +'BLUE_STRAND='+JSON.stringify(BLUE_STRAND)+'\n'
        +'GREEN_STRAND='+JSON.stringify(GREEN_STRAND);
      out.value=snippet;
      out.select();
      if(navigator.clipboard) navigator.clipboard.writeText(snippet).catch(function(){});
    };
    tunePanel.appendChild(copyBtn);
    tunePanel.appendChild(out);
    document.body.appendChild(tunePanel);
    tuneLauncher=document.createElement('button');
    tuneLauncher.type='button';
    tuneLauncher.style.cssText='position:fixed;right:14px;bottom:18px;z-index:100000;padding:10px 12px;'
      +'border:1px solid rgba(231,197,106,.72);border-radius:999px;background:rgba(15,16,18,.92);'
      +'color:#e7c56a;font:700 11px/1.1 monospace;letter-spacing:.08em;text-transform:uppercase;'
      +'cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.35);';
    function setTuningPanelOpen(open){
      tunePanel.style.display=open?'block':'none';
      tuneLauncher.textContent=open?'Tuning schliessen':'Strang-Tuning';
      tuneLauncher.setAttribute('aria-label',open?'Strang-Tuning schliessen':'Strang-Tuning öffnen');
      tuneLauncher.setAttribute('aria-expanded',String(open));
    }
    tuneLauncher.onclick=function(){ setTuningPanelOpen(tunePanel.style.display==='none'); };
    setTuningPanelOpen(tuneStartsOpen);
    document.body.appendChild(tuneLauncher);
  }

    var mouseX = 0, mouseY = 0, smoothMouseX = 0, smoothMouseY = 0;
    const onMouse = (e) => { mouseX = (e.clientX / innerWidth - 0.5) * 2; mouseY = (e.clientY / innerHeight - 0.5) * 2; };
    function setGoldDragPointer(event){
      goldDragPointer.set(event.clientX/innerWidth*2-1,-(event.clientY/innerHeight)*2+1);
    }
    function pointerIsOverGoldTip(event){
      if(isMobile||!goldDragHandle||!goldDragHandle.visible) return false;
      brain.updateWorldMatrix(true,false);
      updateGoldEndOffset();
      goldStrandTipWorld(goldTipWorld,true);
      camera.updateMatrixWorld();
      goldTipProjected.copy(goldTipWorld).project(camera);
      if(goldTipProjected.z<-1||goldTipProjected.z>1) return false;
      var tipScreenX=(goldTipProjected.x*.5+.5)*innerWidth;
      var tipScreenY=(-goldTipProjected.y*.5+.5)*innerHeight;
      return Math.hypot(event.clientX-tipScreenX,event.clientY-tipScreenY)<=34;
    }
    function onGoldPointerDown(event){
      if(event.button!==0||!pointerIsOverGoldTip(event)) return;
      event.preventDefault();
      setGoldDragPointer(event);
      camera.getWorldDirection(goldDragScratch).normalize();
      goldDragPlane.setFromNormalAndCoplanarPoint(goldDragScratch,goldTipWorld);
      goldDragRaycaster.setFromCamera(goldDragPointer,camera);
      if(goldDragRaycaster.ray.intersectPlane(goldDragPlane,goldDragScratch)){
        goldDragPointerOffset.copy(goldTipWorld).sub(goldDragScratch);
      } else {
        goldDragPointerOffset.set(0,0,0);
      }
      strandEndTargetWorld=goldTipWorld.clone();
      goldDragActive=true;
      goldDragHovered=true;
      document.body.style.cursor='grabbing';
    }
    function onGoldPointerMove(event){
      if(!goldDragActive){
        goldDragHovered=pointerIsOverGoldTip(event);
        document.body.style.cursor=goldDragHovered?'grab':'';
        return;
      }
      event.preventDefault();
      setGoldDragPointer(event);
      goldDragRaycaster.setFromCamera(goldDragPointer,camera);
      if(goldDragRaycaster.ray.intersectPlane(goldDragPlane,goldDragScratch)){
        strandEndTargetWorld.copy(goldDragScratch).add(goldDragPointerOffset);
      }
    }
    function onGoldPointerUp(){
      if(!goldDragActive) return;
      goldDragActive=false;
      goldDragHovered=false;
      document.body.style.cursor='';
      persistGoldStrandEnd();
    }
    const resize = () => {
      // updateStyle=false: keep the canvas's own width:100%/height:100% CSS
      // (set inline below) instead of letting Three.js stamp a literal
      // innerWidth px value onto it — innerWidth can exceed the true CSS
      // viewport width (scrollbar-gutter quirks), which caused horizontal
      // overflow on mobile.
      renderer.setSize(innerWidth, innerHeight, false);
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      if(neuralParticleOcean){
        neuralParticleOcean.material.uniforms.uPixelRatio.value=Math.min(window.devicePixelRatio||1,2);
      }
      if(oceanImmersionHalo){
        oceanImmersionHalo.material.uniforms.uPixelRatio.value=Math.min(window.devicePixelRatio||1,2);
      }
    };
    // Scroll setzt nur das gewünschte Ziel auf der Schiene. Die tatsächliche
    // Fahrt wird darunter als gedämpfte Masse integriert: Beschleunigung,
    // Geschwindigkeit und Trägheit bleiben zwischen einzelnen Scroll-Events
    // erhalten, damit die Kamera kurz weich ausrollt statt hart zu stoppen.
    var scrollP = 0, targetScrollP = 0;
    var cameraProgress = 0, cameraVelocity = 0, cameraAimY = cameraTargetStart;
    var CAMERA_MASS = 1.48;
    var CAMERA_SPRING = 15.5;
    var CAMERA_DAMPING = 7.25;
    var textWorldPosition = new THREE.Vector3();
    var documentVisible = document.visibilityState === 'visible';
    const onScroll = () => {
      var journey=document.getElementById('solution-spiral');
      if(!journey) return;
      var start=journey.offsetTop-innerHeight;
      // Auf Mobile braucht die identische 13-Stopps-Kameraschiene genügend
      // Fingerweg. Die normale mobile Kartenliste verkürzt den Container,
      // darf aber nicht die Kamera-Timeline zusammendrücken.
      var distance=isMobile
        ? Math.max(1,innerHeight*7.95)
        : Math.max(1,journey.offsetHeight);
      targetScrollP=Math.max(0,Math.min(1,(scrollY-start)/distance));
    };
    const onVisibilityChange = () => { documentVisible = document.visibilityState === 'visible'; };
    window.addEventListener('mousemove', onMouse);
    window.addEventListener('pointerdown', onGoldPointerDown, true);
    window.addEventListener('pointermove', onGoldPointerMove, true);
    window.addEventListener('pointerup', onGoldPointerUp, true);
    window.addEventListener('pointercancel', onGoldPointerUp, true);
    window.addEventListener('resize', resize);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);
    resize(); onScroll();
    renderer.render(scene, camera);

    // Unregelmässiger Doppelimpuls über das komplette goldene Hauptgehirn:
    // ein kurzer, gedämpfter Vorimpuls und direkt danach ein stärkeres
    // Aufglühen. Es werden nur vorhandene Materialien moduliert, also keine
    // zusätzliche Geometrie und kein weiterer Render-Loop erzeugt.
    var goldPulseMaterials=[];
    var seenGoldPulseMaterials=new Set();
    brain.traverse(function(object){
      var objectMaterials=object.material
        ? (Array.isArray(object.material)?object.material:[object.material])
        : [];
      for(var pulseMaterialIndex=0;pulseMaterialIndex<objectMaterials.length;pulseMaterialIndex++){
        var pulseMaterial=objectMaterials[pulseMaterialIndex];
        if(!pulseMaterial||seenGoldPulseMaterials.has(pulseMaterial)) continue;
        seenGoldPulseMaterials.add(pulseMaterial);
        goldPulseMaterials.push({
          material:pulseMaterial,
          opacity:typeof pulseMaterial.opacity==='number'?pulseMaterial.opacity:1,
          color:pulseMaterial.color&&pulseMaterial.color.isColor?pulseMaterial.color.clone():null
        });
      }
    });
    var goldPulseStart=-1;
    var nextGoldPulse=performance.now()+1200+Math.random()*2400;
    var lastGoldPulseStrength=-1;
    var goldPulseStrength=0;
    function nextGoldPulseDelay(){
      // Bewusst verschieden breite Zeitgruppen statt eines einzigen
      // gleichförmigen Zufallsfensters: kurze, mittlere und lange Pausen
      // erscheinen in zufälliger Reihenfolge und bilden kein spürbares Muster.
      var pauseGroup=Math.floor(Math.random()*3);
      if(pauseGroup===0) return 2400+Math.random()*1800;
      if(pauseGroup===1) return 5000+Math.random()*2700;
      return 8400+Math.random()*3800;
    }
    function pulseEnvelope(elapsed,start,duration){
      var progress=(elapsed-start)/duration;
      if(progress<=0||progress>=1) return 0;
      var sine=Math.sin(progress*Math.PI);
      return sine*sine;
    }
    function updateGoldBrainPulse(now){
      if(reduced){ goldPulseStrength=0; return; }
      if(goldPulseStart<0&&now>=nextGoldPulse) goldPulseStart=now;
      var strength=0;
      if(goldPulseStart>=0){
        var elapsed=(now-goldPulseStart)/1000;
        strength=pulseEnvelope(elapsed,0,.16)*.22
          +pulseEnvelope(elapsed,.235,.22)*.52;
        if(elapsed>.52){
          goldPulseStart=-1;
          nextGoldPulse=now+nextGoldPulseDelay();
          strength=0;
        }
      }
      goldPulseStrength=strength;
      if(Math.abs(strength-lastGoldPulseStrength)<.002) return;
      lastGoldPulseStrength=strength;
      for(var materialIndex=0;materialIndex<goldPulseMaterials.length;materialIndex++){
        var pulseEntry=goldPulseMaterials[materialIndex];
        pulseEntry.material.opacity=Math.min(1,pulseEntry.opacity*(1+strength*.9));
        if(pulseEntry.color){
          pulseEntry.material.color.copy(pulseEntry.color).multiplyScalar(1+strength*.72);
        }
      }
    }

    // Rot, Blau und Grün erhalten denselben bewährten Doppelimpuls, aber jeweils
    // eine vollständig eigene Zufallsuhr. Die unterschiedlichen Zeitfenster
    // verhindern, dass die Satelliten regelmässig oder synchron wirken.
    function createSatellitePulseState(target,minPause,maxPause,initialMin,initialMax){
      var pulseMaterials=[];
      var seenMaterials=new Set();
      target.traverse(function(object){
        var materials=object.material
          ? (Array.isArray(object.material)?object.material:[object.material])
          : [];
        for(var index=0;index<materials.length;index++){
          var material=materials[index];
          if(!material||seenMaterials.has(material)) continue;
          seenMaterials.add(material);
          pulseMaterials.push({
            material:material,
            opacity:typeof material.opacity==='number'?material.opacity:1,
            color:material.color&&material.color.isColor?material.color.clone():null
          });
        }
      });
      return {
        materials:pulseMaterials,
        start:-1,
        next:performance.now()+initialMin+Math.random()*(initialMax-initialMin),
        minPause:minPause,
        maxPause:maxPause,
        lastStrength:-1,
        strength:0
      };
    }
    var satellitePulseStates=[
      createSatellitePulseState(satelliteBrains[0],3300,7600,700,3100),
      createSatellitePulseState(satelliteBrains[1],4700,9800,1800,5200),
      createSatellitePulseState(satelliteBrains[2],3900,8600,1200,4300)
    ];
    function updateSatelliteBrainPulse(state,now){
      if(!state) return;
      if(reduced){ state.strength=0; return; }
      if(state.start<0&&now>=state.next) state.start=now;
      var strength=0;
      if(state.start>=0){
        var elapsed=(now-state.start)/1000;
        strength=pulseEnvelope(elapsed,0,.16)*.22
          +pulseEnvelope(elapsed,.235,.22)*.52;
        if(elapsed>.52){
          state.start=-1;
          state.next=now+state.minPause+Math.random()*(state.maxPause-state.minPause);
          strength=0;
        }
      }
      state.strength=strength;
      if(Math.abs(strength-state.lastStrength)<.002) return;
      state.lastStrength=strength;
      for(var index=0;index<state.materials.length;index++){
        var pulseEntry=state.materials[index];
        pulseEntry.material.opacity=Math.min(1,pulseEntry.opacity*(1+strength*.9));
        if(pulseEntry.color){
          pulseEntry.material.color.copy(pulseEntry.color).multiplyScalar(1+strength*.72);
        }
      }
    }

    var t = 0, last = 0, rafId = 0, lastWobbleUpdate = 0, lastSatelliteStrandUpdate = 0, lastGoldStrandUpdate = 0;
    function tick(now) {
      rafId = requestAnimationFrame(tick);
      if (!documentVisible) return;
      var dt = Math.min((now - last) / 1000 || 0.016, 0.05); last = now;
      if (SCENE_MOTION || OBJECT_FLOATING) t += dt;
      var mouseEase=1-Math.exp(-dt*3.2);
      smoothMouseX += (mouseX-smoothMouseX)*mouseEase;
      smoothMouseY += (mouseY-smoothMouseY)*mouseEase;
      var mainBrainSway=Math.sin(t*.08)*MAIN_BRAIN_SWAY;
      var mainBrainYaw=BASE_Y+mainBrainSway+smoothMouseX*MAIN_BRAIN_MOUSE_YAW;
      var satelliteSway=Math.sin(t*.08)*Math.PI/6;
      brain.rotation.y = THREE.MathUtils.clamp(mainBrainYaw,BASE_Y-MAX_MAIN_BRAIN_YAW,BASE_Y+MAX_MAIN_BRAIN_YAW);
      brain.rotation.x = THREE.MathUtils.clamp(MAIN_BRAIN_BASE_X+Math.sin(t*.23)*.012+smoothMouseY*MAIN_BRAIN_MOUSE_PITCH,.24,.34);
      // Keine seitliche Roll-Neigung: das Gehirn soll exakt horizontal
      // schweben, ohne Neigung auf irgendeine Seite — nur Blickrichtung
      // (Y, oben) und Nicken (X, oben) bleiben animiert.
      brain.rotation.z = 0;
      stumpCenterOffset.copy(stumpCenterLocal).applyEuler(brain.rotation).multiplyScalar(brain.scale.x);
      brain.position.x = -stumpCenterOffset.x+smoothMouseX*.14;
      brain.position.z = -stumpCenterOffset.z;
      brain.position.y = BRAIN_BASE_Y+Math.sin(t*.38)*.11-smoothMouseY*.08;
      strandInverseRotation.setFromEuler(brain.rotation).invert();
      worldVerticalInStrandLocal.set(0,1,0).applyQuaternion(strandInverseRotation);
      if(neuralParticleOcean){
        neuralParticleOcean.material.uniforms.uTime.value=reduced?0:t;
        updateNeuralParticleOceanWave(reduced?0:t);
      }
      if(oceanImmersionHalo){
        oceanImmersionHalo.material.uniforms.uTime.value=reduced?0:t;
      }
      for (var satelliteIndex=0;satelliteIndex<satelliteBrains.length;satelliteIndex++) {
        var satelliteBrain=satelliteBrains[satelliteIndex];
        var satelliteData=satelliteBrain.userData;
        var satelliteTime=t*.31+satelliteData.phase;
        var satelliteBaseX=satelliteData.baseX;
        var satelliteBaseZ=satelliteData.baseZ;
        if(satelliteData.cameraReveal){
          var greenRevealIn=smoother(
            (cameraProgress-(satelliteData.cameraReveal.progress-.065))/.04
          );
          var greenRevealOut=1-smoother(
            (cameraProgress-(cameraHelixExitStart-.04))/.04
          );
          var greenRevealWeight=greenRevealIn*greenRevealOut;
          satelliteBaseX=THREE.MathUtils.lerp(
            satelliteData.baseX,
            satelliteData.cameraReveal.x,
            greenRevealWeight
          );
          satelliteBaseZ=THREE.MathUtils.lerp(
            satelliteData.baseZ,
            satelliteData.cameraReveal.z,
            greenRevealWeight
          );
        }
        satelliteBrain.position.x=satelliteBaseX+Math.sin(satelliteTime)*.16;
        satelliteBrain.position.y=satelliteData.baseY+Math.cos(satelliteTime*1.17)*.13;
        satelliteBrain.position.z=satelliteBaseZ+Math.sin(satelliteTime*1.43+1.4)*.12;
        satelliteBrain.rotation.x=BASE_X+Math.sin(satelliteTime*.81)*.025;
        satelliteBrain.rotation.y=satelliteData.baseRotY+satelliteSway;
        // Keine seitliche Roll-Neigung, siehe Kommentar beim Hauptgehirn.
        satelliteBrain.rotation.z=0;
      }
      if(now-lastSatelliteStrandUpdate>48){
        lastSatelliteStrandUpdate=now;
        brain.updateWorldMatrix(true,false);
        for(var secondarySatelliteIndex=0;secondarySatelliteIndex<satelliteBrains.length;secondarySatelliteIndex++) satelliteBrains[secondarySatelliteIndex].updateWorldMatrix(true,false);
        for(var secondaryStrandIndex=0;secondaryStrandIndex<satelliteStrands.length;secondaryStrandIndex++) curveExistingSatelliteStrand(satelliteStrands[secondaryStrandIndex],t);
      }
      if (OBJECT_FLOATING) {
        for (var floatingIndex=0;floatingIndex<floatingObjects.length;floatingIndex++) {
          var floatingObject=floatingObjects[floatingIndex];
          var floatingData=floatingObject.userData;
          var floatingTime=t*.42+floatingData.phase;
          floatingObject.position.x=floatingData.baseX+Math.sin(floatingTime)*.17+Math.sin(floatingTime*1.91+1.2)*.055;
          floatingObject.position.y=floatingData.baseY+Math.cos(floatingTime*1.18+.4)*.18;
          floatingObject.position.z=floatingData.baseZ+Math.sin(floatingTime*1.47+2.1)*.14;
          floatingObject.rotation.x=Math.sin(floatingTime*1.06)*.026;
          floatingObject.rotation.y=floatingData.baseRotY+Math.cos(floatingTime*.92)*.04;
          floatingObject.rotation.z=Math.sin(floatingTime*1.31+1.6)*.022;
        }
      }
      // Die vollständige Aktualisierung unten berechnet Bewegung, gedehnte
      // Endwellen und den gemeinsamen vertikalen Zug in einem Durchlauf.
      // Der frühere zweite Wobble-Pfad überschrieb diese Verformung zwischen
      // zwei Updates und liess die Wulst sichtbar zurückspringen.
      if(STRAND_ON&&vc>0){
        var goldUpdateInterval=goldDragActive?16:40;
        if(now-lastGoldStrandUpdate>goldUpdateInterval){
          lastGoldStrandUpdate=now;
          updateGoldStrandGeometry(t);
          updateNeuralGlassSphere();
          updateSphereFibers(t);
        }
      }
      if (NEURAL_INFORMATION_ACTIVE && !reduced) neuralActivityController.update(dt);
      nodesP.material.opacity = .44;
      updateGoldBrainPulse(now);
      for(var satellitePulseIndex=0;satellitePulseIndex<satellitePulseStates.length;satellitePulseIndex++){
        updateSatelliteBrainPulse(satellitePulseStates[satellitePulseIndex],now);
      }
      if(neuralParticleOcean){
        neuralParticleOcean.material.uniforms.uBrainPulses.value.set(
          goldPulseStrength,
          satellitePulseStates[0].strength,
          satellitePulseStates[1].strength,
          satellitePulseStates[2].strength
        );
      }
      if(oceanImmersionHalo){
        oceanImmersionHalo.material.uniforms.uPulse.value=goldPulseStrength;
      }
      var railSlowdown=cameraProgress<=cameraHelixExitStart?cameraRailSlowdown(cameraProgress):1;
      var cameraAcceleration=((targetScrollP-cameraProgress)*CAMERA_SPRING*railSlowdown-cameraVelocity*CAMERA_DAMPING)/CAMERA_MASS;
      cameraVelocity+=cameraAcceleration*dt;
      cameraProgress+=cameraVelocity*dt;
      if(cameraProgress<0){ cameraProgress=0; cameraVelocity=Math.max(0,cameraVelocity); }
      if(cameraProgress>1){ cameraProgress=1; cameraVelocity=Math.min(0,cameraVelocity); }
      if(Math.abs(targetScrollP-cameraProgress)<.00003&&Math.abs(cameraVelocity)<.00008){
        cameraProgress=targetScrollP;
        cameraVelocity=0;
      }
      scrollP=cameraProgress;
      var sf = cameraProgress;
      var chapterTransitionProgress=THREE.MathUtils.clamp(
        (sf-cameraHelixExitStart)/Math.max(.0001,CAMERA_OVERVIEW_ARRIVAL-cameraHelixExitStart),
        0,
        1
      );
      var oceanReveal=smoother(
        THREE.MathUtils.clamp((chapterTransitionProgress-.06)/.32,0,1)
      );
      if(neuralParticleOcean){
        neuralParticleOcean.material.uniforms.uReveal.value=oceanReveal;
      }
      if(oceanImmersionHalo){
        oceanImmersionHalo.material.uniforms.uReveal.value=oceanReveal;
      }
      var brainApproachProgress=THREE.MathUtils.clamp(
        (sf-CAMERA_BRAIN_APPROACH_START)/Math.max(.0001,1-CAMERA_BRAIN_APPROACH_START),
        0,
        1
      );
      // Vor der Kartenstation bleibt der frühere angeschnittene Blick auf
      // das grüne Gehirn erhalten. Während Totalen und Kartenüberflug wird
      // das komplette Gehirn ausgeblendet; erst im leeren Raum hinter der
      // Karte darf es wieder Teil des Kamerabilds werden.
      greenSatelliteBrain.visible=sf<cameraHelixExitStart-.015
        ||brainApproachProgress>.42;
      var valleyRevealProgress=THREE.MathUtils.clamp(
        (chapterTransitionProgress-.1)/.9,
        0,
        1
      );
      for(var ambientLayerIndex=0;ambientLayerIndex<ambientStarLayers.length;ambientLayerIndex++){
        var ambientLayer=ambientStarLayers[ambientLayerIndex];
        var ambientFade=smooth(
          (valleyRevealProgress-ambientLayer.fadeStart)/
          Math.max(.0001,ambientLayer.fadeEnd-ambientLayer.fadeStart)
        );
        ambientLayer.object.material.opacity=ambientLayer.baseOpacity*(1-ambientFade);
        ambientLayer.object.visible=ambientFade<.999;
      }
      var railSf=sf;
      var dollyPullback=0;
      if(sf>cameraHelixExitStart){
        var exitRange=Math.max(.0001,CAMERA_OVERVIEW_ARRIVAL-cameraHelixExitStart);
        var exitT=THREE.MathUtils.clamp((sf-cameraHelixExitStart)/exitRange,0,1);
        var exitEase=smoother(exitT);
        // Ab Einblendung der vier Karten ist die Helixrotation vollständig
        // beendet. Die Kamera hält Winkel und Höhe der Kartenstation und fährt
        // nur noch rückwärts auf der radialen Talachse Richtung Betrachter.
        railSf=cameraHelixExitStart;
        dollyPullback=cameraExitPullback*exitEase;
      }
      var orbit=railSf*Math.PI*2;
      var lookY=cameraTargetStart-railSf*cameraTravel;
      var heroPerspective=Math.max(0,1-railSf/.11);
      var cameraY=lookY+.24+heroPerspective*.16;
      var desiredCameraLookY=lookY-heroPerspective*.1-cameraVelocity*.55;
      var aimEase=1-Math.exp(-dt*5.4);
      cameraAimY+=(desiredCameraLookY-cameraAimY)*aimEase;
      var baseCameraRadius=(8.78
        +Math.sin(railSf*Math.PI*2*3.15+.6)*.46
        +Math.sin(railSf*Math.PI*2*6.4+1.7)*.22);
      var mobileHeroFraming=1;
      if(isMobile){
        var mobileHeroMix=1-THREE.MathUtils.smoothstep(railSf,.015,.075);
        mobileHeroFraming=1+(MOBILE_RADIUS_SCALE-1)*mobileHeroMix;
      }
      var cameraRadius=baseCameraRadius*mobileHeroFraming+dollyPullback;
      var targetFov=53+Math.sin(railSf*Math.PI*2*2.15+.45)*1.65;
      var cameraX=Math.sin(orbit)*cameraRadius;
      var cameraZ=Math.cos(orbit)*cameraRadius;
      var cameraLookX=0;
      var cameraLookY=cameraAimY;
      var cameraLookZ=0;
      if(brainApproachProgress>0){
        // Phase 1: Über die gelbe 01-Karte hinweg in den noch leeren Raum.
        // Der Blick bleibt zunächst auf der Kartenebene; das Gehirn wird in
        // dieser Phase absichtlich noch nicht anvisiert oder eingeblendet.
        var approachStartX=cameraX;
        var approachStartY=cameraY;
        var approachStartZ=cameraZ;
        var approachFocusX=greenSatelliteBrain.position.x;
        var approachFocusY=greenSatelliteBrain.position.y;
        var approachFocusZ=greenSatelliteBrain.position.z;
        var cameraLeftX=-Math.cos(orbit);
        var cameraLeftZ=Math.sin(orbit);
        var emptySpaceX=approachStartX+cameraLeftX*(isMobile?2.1:4.2)+(0-approachStartX)*.22;
        var emptySpaceY=approachStartY+(isMobile?1.7:3.4);
        var emptySpaceZ=approachStartZ+cameraLeftZ*(isMobile?2.1:4.2)+(0-approachStartZ)*.22;
        var overflightRaw=THREE.MathUtils.clamp(brainApproachProgress/.32,0,1);
        var overflightEase=smoother(overflightRaw);
        var overflightControlX=approachStartX+cameraLeftX*(isMobile?1.25:2.7);
        var overflightControlY=approachStartY+(isMobile?.45:.85);
        var overflightControlZ=approachStartZ+cameraLeftZ*(isMobile?1.25:2.7);
        cameraX=cubicBezierValue(approachStartX,overflightControlX,emptySpaceX,emptySpaceX,overflightEase);
        cameraY=cubicBezierValue(approachStartY,overflightControlY,emptySpaceY,emptySpaceY,overflightEase);
        cameraZ=cubicBezierValue(approachStartZ,overflightControlZ,emptySpaceZ,emptySpaceZ,overflightEase);

        // Phase 2: Erst hinter der Karte kippt die Optik nach oben. Die
        // Kamera nähert sich langsam aus einer tieferen, seitlichen Position,
        // ohne bereits frontal auf dem Gehirn zu stehen.
        var riseRaw=THREE.MathUtils.clamp((brainApproachProgress-.32)/.46,0,1);
        var riseEase=smoother(riseRaw);
        var emptyFromBrainX=emptySpaceX-approachFocusX;
        var emptyFromBrainY=emptySpaceY-approachFocusY;
        var emptyFromBrainZ=emptySpaceZ-approachFocusZ;
        var emptyFromBrainLength=Math.sqrt(
          emptyFromBrainX*emptyFromBrainX
          +emptyFromBrainY*emptyFromBrainY
          +emptyFromBrainZ*emptyFromBrainZ
        )||1;
        emptyFromBrainX/=emptyFromBrainLength;
        emptyFromBrainY/=emptyFromBrainLength;
        emptyFromBrainZ/=emptyFromBrainLength;
        var preFrontDistance=isMobile?6.4:7.8;
        var preFrontX=approachFocusX+emptyFromBrainX*preFrontDistance;
        var preFrontY=Math.min(
          approachFocusY-(isMobile?.9:1.45),
          approachFocusY+emptyFromBrainY*preFrontDistance
        );
        var preFrontZ=approachFocusZ+emptyFromBrainZ*preFrontDistance;
        var riseControlAX=emptySpaceX+cameraLeftX*(isMobile?.6:1.2);
        var riseControlAY=emptySpaceY+(isMobile?1.1:2.1);
        var riseControlAZ=emptySpaceZ+cameraLeftZ*(isMobile?.6:1.2);
        var riseControlBX=preFrontX+emptyFromBrainX*(isMobile?.8:1.5);
        var riseControlBY=preFrontY-1;
        var riseControlBZ=preFrontZ+emptyFromBrainZ*(isMobile?.8:1.5);
        if(riseRaw>0){
          cameraX=cubicBezierValue(emptySpaceX,riseControlAX,riseControlBX,preFrontX,riseEase);
          cameraY=cubicBezierValue(emptySpaceY,riseControlAY,riseControlBY,preFrontY,riseEase);
          cameraZ=cubicBezierValue(emptySpaceZ,riseControlAZ,riseControlBZ,preFrontZ,riseEase);
        }
        var upwardLookRaw=THREE.MathUtils.clamp((riseRaw-.08)/.72,0,1);
        var upwardLookEase=smoother(upwardLookRaw);
        cameraLookX=approachFocusX*upwardLookEase;
        cameraLookY=cameraAimY+(approachFocusY-cameraAimY)*upwardLookEase;
        cameraLookZ=approachFocusZ*upwardLookEase;

        // Phase 3: Vor dem Gehirn schwenkt die Kamera auf die Welt-Z-Achse.
        // Diese Endachse zeigt das identisch ausgerichtete Satellitengehirn
        // frontal; die leicht tiefere Y-Position bewahrt den Blick von unten.
        var frontalRaw=THREE.MathUtils.clamp((brainApproachProgress-.78)/.22,0,1);
        var frontalEase=smoother(frontalRaw);
        var frontalDistance=isMobile?5.3:6.4;
        var frontalX=approachFocusX;
        var frontalY=approachFocusY-(isMobile?.32:.48);
        var frontalZ=approachFocusZ+frontalDistance;
        var frontalControlAX=preFrontX+(frontalX-preFrontX)*.28;
        var frontalControlAY=preFrontY+(frontalY-preFrontY)*.18;
        var frontalControlAZ=preFrontZ+(frontalZ-preFrontZ)*.12;
        var frontalControlBX=frontalX-(isMobile?.8:1.35);
        var frontalControlBY=frontalY-.12;
        var frontalControlBZ=frontalZ+(isMobile?.7:1.15);
        if(frontalRaw>0){
          cameraX=cubicBezierValue(preFrontX,frontalControlAX,frontalControlBX,frontalX,frontalEase);
          cameraY=cubicBezierValue(preFrontY,frontalControlAY,frontalControlBY,frontalY,frontalEase);
          cameraZ=cubicBezierValue(preFrontZ,frontalControlAZ,frontalControlBZ,frontalZ,frontalEase);
          cameraLookX=approachFocusX;
          cameraLookY=approachFocusY;
          cameraLookZ=approachFocusZ;
        }
        targetFov=THREE.MathUtils.lerp(
          targetFov,
          isMobile?47.5:44.5,
          smoother(THREE.MathUtils.clamp((brainApproachProgress-.3)/.7,0,1))
        );
      }
      if(Math.abs(targetFov-lastCameraFov)>.015){
        camera.fov=targetFov;
        camera.updateProjectionMatrix();
        lastCameraFov=targetFov;
      }
      world.rotation.y = 0;
      world.position.y = 0;
      camera.position.set(cameraX,cameraY,cameraZ);
      camera.lookAt(cameraLookX,cameraLookY,cameraLookZ);
      // Die fünf Texte bleiben vollständig an ihren Weltstationen. Nur ihre
      // Materialwirkung folgt der echten Kameradistanz: der nächstgelegene
      // Text bleibt klar, alle übrigen werden weich, dunkel und zunehmend
      // transparent. Das ist kein CSS-Overlay, sondern ein Shader direkt auf
      // dem Canvas-Texture-Material der bestehenden Meshes.
      var closestText=null, closestTextDistance=Infinity;
      for(var introDistanceIndex=0;introDistanceIndex<introSprites.length;introDistanceIndex++){
        var distanceSprite=introSprites[introDistanceIndex];
        distanceSprite.getWorldPosition(textWorldPosition);
        var distanceToCamera=camera.position.distanceTo(textWorldPosition);
        if(distanceToCamera<closestTextDistance){
          closestTextDistance=distanceToCamera;
          closestText=distanceSprite;
        }
      }
      for(var introFocusIndex=0;introFocusIndex<introSprites.length;introFocusIndex++){
        var introSprite=introSprites[introFocusIndex];
        var introUniforms=introSprite.userData.textUniforms;
        introSprite.getWorldPosition(textWorldPosition);
        var textDistance=camera.position.distanceTo(textWorldPosition);
        var distanceFade=THREE.MathUtils.clamp((textDistance-4.4)/10.5,0,1);
        var isFocused=introSprite===closestText;
        var targetOpacity=isFocused?1:Math.max(0,.23*(1-distanceFade)*(1-distanceFade));
        var targetBlur=isFocused?0:(.0035+distanceFade*.0062);
        var targetBrightness=isFocused?1.05:.42+.18*(1-distanceFade);
        introUniforms.uOpacity.value+=(targetOpacity-introUniforms.uOpacity.value)*(1-Math.exp(-dt*7.2));
        introUniforms.uBlur.value+=(targetBlur-introUniforms.uBlur.value)*(1-Math.exp(-dt*6.4));
        introUniforms.uBrightness.value+=(targetBrightness-introUniforms.uBrightness.value)*(1-Math.exp(-dt*5.8));
        // Limitiertes Billboard: Der Text bleibt Teil der Spirale und dreht
        // sich maximal wenige Grad zur Kamera, statt ihr wie ein HUD zu folgen.
        if(!reduced){
          var desiredTextYaw=Math.atan2(camera.position.x-textWorldPosition.x,camera.position.z-textWorldPosition.z);
          var yawDelta=THREE.MathUtils.euclideanModulo(desiredTextYaw-introSprite.userData.baseRotY+Math.PI,Math.PI*2)-Math.PI;
          var limitedTextYaw=introSprite.userData.baseRotY+THREE.MathUtils.clamp(yawDelta,-.12,.12);
          introSprite.rotation.y+=(limitedTextYaw-introSprite.rotation.y)*(1-Math.exp(-dt*3.2));
        }
      }
      // Live-Kamerastatus veröffentlichen, damit DOM-Elemente ausserhalb der
      // WebGL-Szene (z. B. die Kartengruppe in page.tsx) sich Frame für
      // Frame exakt an derselben, bereits gedämpften Kameraposition
      // ausrichten können, statt eine zweite, unabhängige Scroll-/
      // Kamera-Berechnung zu duplizieren.
      if (typeof window !== 'undefined') {
        window.__cardsCameraState = {
          orbit: orbit, cameraY: cameraY, cameraLookY: cameraLookY,
          cameraRadius: cameraRadius, fov: camera.fov, aspect: camera.aspect,
          cameraX: cameraX, cameraZ: cameraZ,
          cameraLookX: cameraLookX, cameraLookZ: cameraLookZ,
          // Der Ausfahrfortschritt ist die gemeinsame Quelle für alle
          // Weltobjekte hinter der Kartenstation. DOM-Szenen können damit
          // exakt auf dieselbe gedämpfte Kamerafahrt reagieren, ohne den
          // Scrollstand ein zweites Mal zu berechnen.
          exitProgress: chapterTransitionProgress,
          approachProgress: brainApproachProgress,
          cameraProgress: cameraProgress,
        };
      }
      renderer.render(scene, camera);
    }
    rafId = requestAnimationFrame(tick);

    return () => {
      oceanWaveAnimationDisposed=true;
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('pointerdown', onGoldPointerDown, true);
      window.removeEventListener('pointermove', onGoldPointerMove, true);
      window.removeEventListener('pointerup', onGoldPointerUp, true);
      window.removeEventListener('pointercancel', onGoldPointerUp, true);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      neuralGlassGeometry.dispose();
      neuralGlassMaterial.dispose();
      neuralGlassGlowGeometry.dispose();
      neuralGlassGlowMaterial.dispose();
      if(neuralParticleOcean){
        neuralParticleOcean.points.geometry.dispose();
        neuralParticleOcean.material.dispose();
      }
      if(oceanImmersionHalo){
        oceanImmersionHalo.points.geometry.dispose();
        oceanImmersionHalo.material.dispose();
      }
      renderer.dispose();
      renderer.forceContextLoss();
      document.body.style.cursor='';
      if(goldDragHandle&&goldDragHandle.parent) goldDragHandle.parent.remove(goldDragHandle);
      if(goldDragHandleMaterial) goldDragHandleMaterial.dispose();
      if (tunePanel && tunePanel.parentNode) tunePanel.parentNode.removeChild(tunePanel);
      if (tuneLauncher && tuneLauncher.parentNode) tuneLauncher.parentNode.removeChild(tuneLauncher);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}
    />
  );
}
