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
    // Schmales Mobile-Sichtfeld (kleines aspect) macht das horizontale FOV
    // viel enger als auf Desktop — Kamera etwas weiter zurücksetzen, damit
    // neben dem Haupt-Gehirn auch Platz für die 3 Satelliten-Gehirne bleibt.
    var MOBILE_RADIUS_SCALE = isMobile ? 1.34 : 1;
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
  var BRAIN_BASE_Y=-.5;
  var brain=new THREE.Group(); brain.position.y=BRAIN_BASE_Y; brain.scale.setScalar(3.2775); world.add(brain);
  var introTextGroup=new THREE.Group(); world.add(introTextGroup);
  var introSprites=[];
  var floatingObjects=[];
  // HELIX_STEP/TEXT_START_Y kommen jetzt aus der gemeinsamen Geometrie-Datei
  // (app/lib/helixGeometry.ts) statt hier lokal dupliziert zu sein — dieselbe
  // Quelle wird auch von der Kartengruppe in page.tsx verwendet.
  var placeholderCards=[1,2,3,4].map(function(number){
    return {code:'P'+number,title:'Platzhalter'+number,body:'Weitere Inhalte folgen.',accent:'#c89a3d'};
  });
  var totalWorldStops=introTexts.length+serviceCards.length+placeholderCards.length;
  var cameraTargetStart=CAMERA_TARGET_START;
  var cameraTravel=computeCameraTravel(totalWorldStops);
  var cameraTargetEnd=cameraTargetStart-cameraTravel;
  var SCENE_MOTION=false;
  var OBJECT_FLOATING=true;
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

  // Dieselbe 3D-Scroll-Spirale wie am Desktop läuft jetzt auch auf Mobile
  // (.spiral-mobile-Fallback ist deaktiviert), daher werden die schwebenden
  // WebGL-Textkarten auf allen Geräten gebaut.
  introTexts.forEach(buildIntroSprite);

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

  if(!isMobile){
    // Alle 4 Leistungskarten werden durch die DOM-Kartenstationen (Neural
    // Glass Panels) ersetzt und hier bewusst ausgelassen — die Helix-
    // Positionen/Kamera-Slots (inkl. Platzhalterkarten danach) bleiben
    // exakt unverändert, nur diese eine Mesh-Erzeugung wird übersprungen.
    placeholderCards.forEach(function(card,index){ buildServiceCard(card,index,introTexts.length+serviceCards.length+index); });
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
    blue:{ deep:new THREE.Color(0x102a4a), primary:new THREE.Color(0x244d82), light:new THREE.Color(0x8ebef2) }
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
  }

  // Fünf feste räumliche Ebenen: Die Partikel bewegen sich nicht selbst,
  // erzeugen durch die vorbeifliegende Kamera aber permanenten Vorder- und Hintergrund-Flow.
  addDepthLayer(isMobile?24:52,1.4,3.6,.055,.16,0xe7c56a,0xf6e3a1);
  addDepthLayer(isMobile?34:72,3.7,6.8,.075,.11,0xc89a3d,0xf6e3a1);
  addDepthLayer(isMobile?42:92,6.9,10.5,.11,.075,0xb8862b,0xe7c56a);
  addDepthLayer(isMobile?34:76,10.6,16.5,.16,.045,0x7c5a1a,0xc89a3d);
  addDepthLayer(isMobile?16:36,16.6,23,.42,.02,0x7c5a1a,0xb8862b);

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
  }
  addStardustField(isMobile?1300:4200,.09,.85);

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
  }
  var BLUE_ORB_SHADES=[new THREE.Color(0x4d7fbf),new THREE.Color(0x8ebef2),new THREE.Color(0xc4e3ff),new THREE.Color(0x244d82)];
  var RED_ORB_SHADES=[new THREE.Color(0xa6425c),new THREE.Color(0xd9788a),new THREE.Color(0xf3b0b9),new THREE.Color(0x6a263b)];
  var coloredOrbCount=isMobile?325:1050;
  addColoredOrbField(coloredOrbCount,.27,1.35,.8,.13,BLUE_ORB_SHADES,2,55,14);
  addColoredOrbField(coloredOrbCount,.27,1.35,.8,.13,RED_ORB_SHADES,2,55,14);

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
  var SBASE_X=BR.stumpCenter[0], SBASE_Y=BR.stumpCenter[1], SBASE_Z=BR.stumpCenter[2];
  var stumpCenterLocal=new THREE.Vector3(SBASE_X,SBASE_Y,SBASE_Z);
  var stumpCenterOffset=new THREE.Vector3();
  var strandInverseRotation=new THREE.Quaternion();
  var worldVerticalInStrandLocal=new THREE.Vector3();
  var roots=[];
  for(var ri=0;ri<BR.stumpRing.length;ri+=3){
    roots.push(new THREE.Vector3(BR.stumpRing[ri],BR.stumpRing[ri+1],BR.stumpRing[ri+2]));
  }
  var SP={ length:9.05, rStr:0.08, gather:0.25, taper:0.24,
           curve:0, twist:5.2, jitter:0, ptSize:0.044, spacing:0.06,
           ringSpread:0.1, offX:0, offY:0, offZ:0,
           droop:1.5, frayStart:0.98, fraySpread:0.12 };
  // Trichter: Jede Faser startet an einem echten goldenen Vertex im Stumpf-
  // Bereich, läuft über einen organischen Fächer zu einem individuellen Punkt
  // auf dem unteren Auslassring und ordnet sich erst danach weich im Bündel.
  var FN={ count:isMobile?96:220, anchorRadius:0.59, funnelHeight:0.19, funnelSegs:3, convergePull:0.65,
           outletRadius:0.16, outletHeightSpread:0.22, randomness:1 };
  var MP={ moveLeft:0, moveRight:0, moveForward:0, moveBack:0, moveVertical:0.01 };
  var WIND={ sway:0.04, speed:0.37, wave:0.036, waveFrequency:9 };
  var GOLD_RENDER={ intensity:1, lineOpacity:.34, pointOpacity:.36 };
  var GOLD_STRAND_TUNING={
    topThickness:1,
    bottomThickness:1,
    escapeAmount:0,
    escapeAmplitude:1,
    escapeFrequency:1,
    escapeWavelength:1,
    escapeSpeed:1,
    colorHue:0,
    colorSaturation:1,
    colorLightness:1,
    colorIntensity:1,
    topBrightness:1,
    bottomBrightness:1
  };
  function moveX(){ return SP.offX + MP.moveRight - MP.moveLeft; }
  function moveY(){ return SP.offY + MP.moveVertical; }
  function moveZ(){ return SP.offZ + MP.moveForward - MP.moveBack; }
  function rnd(){return Math.random();}
  function smooth(x){x=x<0?0:x>1?1:x;return x*x*(3-2*x);}
  var STRAND_ON = !(typeof window!=='undefined' && new URLSearchParams(window.location.search).get('nostrand')==='1');
  var sBase=[], sMeta=[], sFibers=[], vc=0;
  var wobbleLineRefs=[], wobblePtsRefs=[];
  var wobbleX=new Float32Array(0), wobbleZ=new Float32Array(0);
  var goldEscapeWeights=[], goldEscapePhases=[], goldEscapeFrequencies=[], goldEscapeSpeeds=[];
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
  try {
    var savedGoldEnd=JSON.parse(window.localStorage.getItem(GOLD_STRAND_END_KEY)||'null');
    if(savedGoldEnd&&Number.isFinite(savedGoldEnd.x)&&Number.isFinite(savedGoldEnd.y)&&Number.isFinite(savedGoldEnd.z)) {
      strandEndTargetWorld=new THREE.Vector3(savedGoldEnd.x,savedGoldEnd.y,savedGoldEnd.z);
    }
  } catch(_) {}
  // gemeinsame Durchhang-Richtung (Schwerkraft): leicht nach vorne/unten,
  // nicht rein vertikal, wirkt organischer als ein reiner Y-Fall
  var DROOP_DX=0, DROOP_DZ=0;
  function genStrandInto(outPos,outCol,outPtsPos,outPtsCol){
    sBase=[]; sMeta=[]; sFibers=[]; vc=0; wobbleLineRefs=[]; wobblePtsRefs=[];
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
          var ang=a0+btv*tw;
          var bundleScale=1-SP.taper*btv;
          var thicknessScale=GOLD_STRAND_TUNING.topThickness+(GOLD_STRAND_TUNING.bottomThickness-GOLD_STRAND_TUNING.topThickness)*btv;
          var swirl=SP.rStr*smooth(Math.min(1,btv/Math.max(SP.gather,.001)))*thicknessScale;
          var frayEnv=smooth(Math.max(0,(btv-SP.frayStart)/Math.max(.001,1-SP.frayStart)));
          var fraySpread=frayEnv*SP.fraySpread*frayJitter*thicknessScale;
          var escapeEnvelope=smooth((btv-.08)/.2)*smooth((.96-btv)/.18);
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
  }

  function resetWobbleBuffers(){
    wobbleX=new Float32Array(vc);
    wobbleZ=new Float32Array(vc);
    goldEscapeWeights=new Float32Array(goldEscapeWeights);
    goldEscapePhases=new Float32Array(goldEscapePhases);
    goldEscapeFrequencies=new Float32Array(goldEscapeFrequencies);
    goldEscapeSpeeds=new Float32Array(goldEscapeSpeeds);
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

  var lgeo=new THREE.BufferGeometry();
  lgeo.setAttribute('position',new THREE.Float32BufferAttribute(lpos,3));
  lgeo.setAttribute('color',new THREE.Float32BufferAttribute(lcol,3));
  var linesObj=new THREE.LineSegments(lgeo,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:GOLD_RENDER.lineOpacity,blending:THREE.NormalBlending,depthWrite:false}));
  linesObj.name='neural-lines';
  brain.add(dbgHide('walks',linesObj));
  var wptsObj=pointsObj(wpos,wcol,SP.ptSize,GOLD_RENDER.pointOpacity);
  wptsObj.name='neural-points';
  brain.add(dbgHide('wpts',wptsObj));
  var goldLineBaseColors=linesObj.geometry.attributes.color.array.slice();
  var goldPointBaseColors=wptsObj.geometry.attributes.color.array.slice();

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
    var fusionAmount=smooth((sMeta[vertexIndex*2]-.93)/.07)*.72;
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
    if(includeEndOffset&&strandEndTargetWorld){
      out.addScaledVector(strandEndOffsetLocal,goldStrandBendWeight(sMeta[vertexIndex*2]));
    }
    return out;
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

  function updateGoldStrandGeometry(time){
    if(!STRAND_ON||!vc) return;
    for(var strandVertexIndex=0;strandVertexIndex<vc;strandVertexIndex++){
      var strandProgress=sMeta[strandVertexIndex*2], strandPhase=sMeta[strandVertexIndex*2+1];
      wobbleX[strandVertexIndex]=Math.sin(time*WIND.speed*2.95+strandProgress*WIND.waveFrequency+strandPhase)*WIND.wave*strandProgress*strandProgress
        +Math.sin(time*WIND.speed*1.31+strandPhase)*WIND.sway*.08*strandProgress*strandProgress;
      wobbleZ[strandVertexIndex]=Math.cos(time*WIND.speed*2.43+strandProgress*WIND.waveFrequency*.78+strandPhase)*WIND.wave*.82*strandProgress*strandProgress
        +Math.cos(time*WIND.speed*1.07+strandPhase)*WIND.sway*.06*strandProgress*strandProgress;
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
    linesObj.geometry.attributes.position.needsUpdate=true;
    linesObj.geometry.attributes.color.needsUpdate=true;
    var pointPositionArray=wptsObj.geometry.attributes.position.array;
    var pointColorArray=wptsObj.geometry.attributes.color.array;
    for(var pointReferenceIndex=0;pointReferenceIndex<wobblePtsRefs.length;pointReferenceIndex++){
      var pointReference=wobblePtsRefs[pointReferenceIndex];
      goldStrandVertexLocal(pointReference.srcV,goldDragScratch,true);
      pointPositionArray[pointReference.off]=goldDragScratch.x;
      pointPositionArray[pointReference.off+1]=goldDragScratch.y;
      pointPositionArray[pointReference.off+2]=goldDragScratch.z;
      updateGoldFusionColor(pointColorArray,goldPointBaseColors,pointReference.off,pointReference.srcV);
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
    satellite.scale.setScalar(isMobile?0.8:1.76);
    satellite.position.set(x,y,z);
    satellite.rotation.set(BASE_X,BASE_Y,0);
    satellite.userData={baseX:x,baseY:y,baseZ:z,baseRotY:BASE_Y,phase:phase};
    world.add(satellite);
    satelliteBrains.push(satellite);
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
    // 78% der sichtbaren Halbbreite nutzen: Satelliten schweben nah am
    // Bildschirmrand statt zentral über dem Text zu verschmelzen, mit
    // Rand zur Bildschirmkante damit nichts angeschnitten wird.
    var satelliteX=visibleHalfWidthAtSat*.78;
    addSatelliteBrain(-satelliteX,.32,satelliteZ,.35,SATELLITE_METALS.red);
    addSatelliteBrain(satelliteX,.46,satelliteZ-.2,2.7,SATELLITE_METALS.blue);
  } else {
    addSatelliteBrain(-5.7,-.62,-.7,.35,SATELLITE_METALS.red);
    addSatelliteBrain(5.7,-.44,-.9,2.7,SATELLITE_METALS.blue);
  }

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
      fiberAmount:isMobile?.42:.58,
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
      escapeAmount:.54,
      escapeAmplitude:1,
      escapeFrequency:1,
      escapeWavelength:1,
      escapeSpeed:1,
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
  RED_STRAND.baseBrightness=.95;
  RED_STRAND.pulseStrength=.14;
  BLUE_STRAND.baseBrightness=.95;
  BLUE_STRAND.pulseStrength=.14;
  var secondaryMergeTargetWorld=new THREE.Vector3();
  var secondarySatelliteWorld=new THREE.Vector3();
  var secondaryRenderPoint=new THREE.Vector3();

  function makeSecondaryFiberShape(){
    return {
      phaseOffset:(Math.random()-.5)*.22,
      radiusOffset:(Math.random()-.5)*.07,
      firstDroop:.92+Math.random()*.18,
      secondDroop:1.08+Math.random()*.2,
      firstSway:(Math.random()-.5)*.2,
      secondSway:(Math.random()-.5)*.15,
      windPhase:Math.random()*Math.PI*2,
      funnelVariation:.82+Math.random()*.36
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
      fibers.push({
        sourceAngle:sourceAngle,
        sourceRadius:.035+radialDistribution*.345,
        sourceDrop:.04+Math.random()*.16,
        len:fiberSegments,
        pointOffset:pointValueCount,
        lineOffset:lineValueCount,
        shape:makeSecondaryFiberShape(),
        metallicPhase:Math.random()*Math.PI*2,
        edgeWeight:smooth((radialDistribution-.52)/.48),
        branchPhase:Math.random()*Math.PI*2,
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
      pointValueCount+=fiberSegments*3;
      lineValueCount+=Math.max(0,fiberSegments-1)*6;
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

  function useExistingSatelliteStrand(satellite,phase,palette,flowDirection,sideSign,params){
    hideSatelliteTail(satellite);
    var tailGroup=new THREE.Group();
    tailGroup.name='secondary-energy-strand';
    var lineGeometry=new THREE.BufferGeometry();
    lineGeometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(0),3));
    lineGeometry.setAttribute('color',new THREE.BufferAttribute(new Float32Array(0),3));
    var lineMesh=new THREE.LineSegments(lineGeometry,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:GOLD_RENDER.lineOpacity,blending:THREE.NormalBlending,depthWrite:false}));
    lineMesh.frustumCulled=false;
    lineMesh.renderOrder=4;
    tailGroup.add(lineMesh);
    var pointGeometry=new THREE.BufferGeometry();
    pointGeometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(0),3));
    pointGeometry.setAttribute('color',new THREE.BufferAttribute(new Float32Array(0),3));
    var pointMesh=new THREE.Points(pointGeometry,new THREE.PointsMaterial({size:SP.ptSize,map:sprite,transparent:true,opacity:GOLD_RENDER.pointOpacity,vertexColors:true,color:0xffffff,blending:THREE.NormalBlending,depthWrite:false}));
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
    strand.lineColors.fill(0);
    strand.pointColors.fill(0);
    var mergeX=secondaryMergeTargetWorld.x;
    var mergeY=secondaryMergeTargetWorld.y;
    var mergeZ=secondaryMergeTargetWorld.z;
    updateSecondaryMetal(strand);
    // Der goldene Trichter arbeitet mit einem breiten Faserursprung, drei
    // weichen Sammelstufen (.34/.38/.28) und einer relativ langen
    // Wurzelzone. Die roten/blauen Trichter nutzen exakt diese Logik, nur
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
    var funnelEnd=.27;
    // Nach der langen, frei hängenden Diagonale organisieren sich beide
    // Faserbündel um den mittigen Goldkern. Die Phasen liegen über
    // strand.phase exakt 180° auseinander (Rot = π, Blau = 0), daher bleiben
    // sie permanent auf gegenüberliegenden Seiten der Achse.
    var helixStart=.58;
    var helixTurns=3.15;
    for(var fiberIndex=0;fiberIndex<strand.fibers.length;fiberIndex++){
      var fiber=strand.fibers[fiberIndex], fiberShape=fiber.shape;
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
        var helixBlend=smooth((progress-helixStart)/(1-helixStart));
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
        var looseSpread=(.005+fiber.sourceRadius*.15+params.funnelSpread*.008)*sagEnvelope*(1-helixBlend*.82)*thicknessScale;
        var windEnvelope=sagEnvelope*(1-helixBlend*.88);
        var windSide=Math.sin(flowTime*.64+pathProgress*5.4+fiberShape.windPhase)*params.sway*.045*windEnvelope;
        var windDepth=Math.cos(flowTime*.49+pathProgress*4.1+fiberShape.windPhase*1.37)*params.sway*.022*windEnvelope;
        // Nur die lockeren äusseren Fasern dürfen sichtbar aus dem dichten
        // Kern ausbrechen. Ihre Wellen sind phasenverschoben, damit keine
        // dekorative Parallelwelle entsteht.
        var edgeWaveEnvelope=sagEnvelope*(.28+.72*(1-helixBlend));
        var escapeEnvelope=smooth((pathProgress-.06)/.2)*smooth((.94-pathProgress)/.2)*(1-helixBlend*.72);
        var edgeWave=(.014+edgeWeight*.11+fiber.escapeWeight*.235)*edgeWaveEnvelope*thicknessScale*params.escapeAmplitude;
        var edgeWaveSide=Math.sin(pathProgress*(7.4+edgeWeight*5.1)+fiber.branchPhase+flowTime*.31)*edgeWave;
        var edgeWaveDepth=Math.cos(pathProgress*(6.2+edgeWeight*4.3)+fiber.branchPhase*1.43+flowTime*.24)*edgeWave*.72;
        var travellingWave=pathProgress*fiber.escapeFrequency*params.escapeFrequency/params.escapeWavelength-flowTime*fiber.escapeSpeed*params.escapeSpeed;
        var escapeSide=(Math.sin(travellingWave+fiber.branchPhase*2.1)+Math.sin(travellingWave*1.73+fiber.branchPhase*.47)*.38)*fiber.escapeWeight*.245*escapeEnvelope*thicknessScale*params.escapeAmplitude;
        var escapeDepth=(Math.cos(travellingWave*.89+fiber.branchPhase*.71)+Math.sin(travellingWave*1.41+fiber.branchPhase*1.8)*.32)*fiber.escapeWeight*.175*escapeEnvelope*thicknessScale*params.escapeAmplitude;
        var manualEnvelope=sagEnvelope*(1-helixBlend*.88);
        var endSpread=(.008+Math.abs(fiberShape.radiusOffset)*.022)*(1-helixBlend*.84);
        var endOffsetX=Math.cos(fiberAngle)*endSpread;
        var endOffsetZ=Math.sin(fiberAngle)*endSpread;
        var manualVertical=params.posY*manualEnvelope;
        var pathX=funnelOutletX+(mergeX-funnelOutletX)*pathProgress;
        var pathY=funnelOutletY+(mergeY-funnelOutletY)*pathProgress-hangingSag-manualVertical;
        var pathZ=funnelOutletZ+(mergeZ-funnelOutletZ)*pathProgress;
        // Im Trichter nur die drei Referenzstufen. Danach folgt zuerst die
        // hängende Diagonale, anschliessend eine sauber geführte Doppelhelix
        // um die Goldachse: keine freie Wellenlinie, kein Kreuzen der Fasern.
        var funnelRelease=1-smooth(progress/funnelEnd);
        x=pathX+(funnelX-pathX)*funnelRelease;
        y=pathY+(funnelY-pathY)*funnelRelease;
        z=pathZ+(funnelZ-pathZ)*funnelRelease;
        x+=sideX*(Math.cos(fiberAngle)*looseSpread+windSide+edgeWaveSide+escapeSide+params.posX*manualEnvelope+endOffsetX)
          +depthX*(Math.sin(fiberAngle)*looseSpread+windDepth+edgeWaveDepth+escapeDepth+params.posZ*manualEnvelope+endOffsetZ);
        z+=sideZ*(Math.cos(fiberAngle)*looseSpread+windSide+edgeWaveSide+escapeSide+params.posX*manualEnvelope+endOffsetX)
          +depthZ*(Math.sin(fiberAngle)*looseSpread+windDepth+edgeWaveDepth+escapeDepth+params.posZ*manualEnvelope+endOffsetZ);
        if(helixBlend>0){
          var helixAngle=strand.phase+helixBlend*Math.PI*2*helixTurns+fiberShape.phaseOffset*.48;
          var helixRadius=(.09+Math.abs(fiberShape.radiusOffset)*.25)*(1-helixBlend*.18)*thicknessScale;
          var helixX=mergeX+Math.cos(helixAngle)*helixRadius;
          var helixZ=mergeZ+Math.sin(helixAngle)*helixRadius;
          x+=(helixX-x)*helixBlend;
          z+=(helixZ-z)*helixBlend;
        }
        var pulse=Math.max(0,Math.sin(flowTime*params.pulseSpeed*strand.flowDirection-progress*20*strand.flowDirection+fiberShape.phaseOffset));
        var verticalBrightness=params.topBrightness+(params.bottomBrightness-params.topBrightness)*pathProgress;
        var brightness=(params.baseBrightness+pulse*params.pulseStrength)*params.intensity*params.colorIntensity*verticalBrightness;
        // Jede Faser bleibt innerhalb ihrer eigenen Metallic-Palette. Der
        // Verlauf verschiebt sich sanft, ohne Rot und Blau zu vermischen.
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

  if(satelliteBrains.length>1){
    useExistingSatelliteStrand(satelliteBrains[0],Math.PI,SATELLITE_METALS.red,1,-1,RED_STRAND);
    useExistingSatelliteStrand(satelliteBrains[1],0,SATELLITE_METALS.blue,-1,1,BLUE_STRAND);
  }

  // Zentraler Controller für alle drei Gehirne. Er benutzt ausschliesslich
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
    var wanderHops=kind==='gold'?Math.max(5,Math.round(hops*.58)):hops;
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
    if(kind==='gold'&&neuralConvergenceNodeIndex>=0){
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
    this.trailMaterial=new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
    this.trail=new THREE.Line(trailGeometry,this.trailMaterial);
    this.trail.frustumCulled=false;
    parentGroup.add(this.trail);
    this.coreMaterial=new THREE.SpriteMaterial({map:sprite,color:palette.highlight,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
    this.core=new THREE.Sprite(this.coreMaterial);
    this.core.frustumCulled=false;
    parentGroup.add(this.core);
    this.glowMaterial=new THREE.SpriteMaterial({map:sprite,color:palette.primary,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
    this.glow=new THREE.Sprite(this.glowMaterial);
    this.glow.frustumCulled=false;
    parentGroup.add(this.glow);
    this.nodeGlows=[];
    for(var glowIndex=0;glowIndex<3;glowIndex++){
      var material=new THREE.SpriteMaterial({map:sprite,color:palette.light,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
      var node=new THREE.Sprite(material);
      node.frustumCulled=false;
      parentGroup.add(node);
      this.nodeGlows.push({node:node,material:material,life:0});
    }
    this.palette=palette;
    this.samplePoint=new THREE.Vector3();
    this.active=false;
  }
  NeuralImpulse.prototype.begin=function(route,duration,onComplete){
    if(route.length<2) return false;
    this.route=route;
    this.duration=duration;
    this.elapsed=0;
    this.lastNode=-1;
    this.onComplete=onComplete||null;
    this.active=true;
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
      var glowFade=Math.max(0,glow.life/.36);
      glow.material.opacity=.07*NEURAL_IMPULSE_INTENSITY*glowFade*glowFade;
      var glowSize=(.07+(.11*(1-glowFade)))*Math.sqrt(NEURAL_IMPULSE_INTENSITY/5);
      glow.node.scale.set(glowSize,glowSize,1);
    }
    if(!this.active) return;
    this.elapsed+=dt;
    var progress=THREE.MathUtils.clamp(this.elapsed/this.duration,0,1);
    var envelope=Math.sin(progress*Math.PI);
    var head=this.sample(progress,this.samplePoint);
    if(head.nodeIndex!==this.lastNode){
      this.lastNode=head.nodeIndex;
      var nodeGlow=this.nodeGlows[head.nodeIndex%this.nodeGlows.length];
      nodeGlow.node.position.copy(pts[head.nodeIndex]);
      nodeGlow.life=.36;
    }
    this.core.position.copy(head.point);
    this.glow.position.copy(head.point);
    var coreSize=(.042+envelope*.022)*Math.sqrt(NEURAL_IMPULSE_INTENSITY/5);
    this.core.scale.set(coreSize,coreSize,1);
    this.glow.scale.set(coreSize*2.5,coreSize*2.5,1);
    this.coreMaterial.opacity=.32*NEURAL_IMPULSE_INTENSITY*envelope;
    this.glowMaterial.opacity=.045*NEURAL_IMPULSE_INTENSITY*envelope;
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
    this.trailMaterial.opacity=.23*NEURAL_IMPULSE_INTENSITY*envelope;
    if(progress>=1){
      this.active=false;
      this.trailMaterial.opacity=0;
      this.coreMaterial.opacity=0;
      this.glowMaterial.opacity=0;
      var onComplete=this.onComplete;
      this.onComplete=null;
      if(onComplete) onComplete();
    }
  };
  function NeuralConvergenceNode(parentGroup){
    this.maxCharge=7;
    this.charge=0;
    this.pendingDischarge=0;
    this.dischargeCycle=0;
    this.nextChargeTarget=4;
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
        this.nextChargeTarget=4+Math.floor(neuralHash(this.dischargeCycle*5.91)*4);
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
    this.impulses={
      gold:new NeuralImpulse(brain,{primary:GOLD.primary,light:GOLD.light,highlight:GOLD.highlight}),
      red:new NeuralImpulse(satelliteBrains[0],{primary:SATELLITE_METALS.red.primary,light:SATELLITE_METALS.red.light,highlight:new THREE.Color(0xf3b0b9)}),
      blue:new NeuralImpulse(satelliteBrains[1],{primary:SATELLITE_METALS.blue.primary,light:SATELLITE_METALS.blue.light,highlight:new THREE.Color(0xc4e3ff)})
    };
    this.goldEcho=new NeuralImpulse(brain,{primary:GOLD.primary,light:GOLD.light,highlight:GOLD.highlight});
    this.sequenceIndex=0;
    this.sequenceTime=0;
    this.cooldown=.85;
    this.steps=[];
    this.goldConvergence=new NeuralConvergenceNode(brain);
    this.sequences=[
      [{actor:'gold',delay:0,hops:14,duration:2.05},{actor:'red',delay:.86,hops:11,duration:2.25}],
      [{actor:'gold',delay:0,hops:13,duration:1.95},{actor:'blue',delay:.78,hops:12,duration:1.85}],
      [{actor:'gold',delay:0,hops:11,duration:1.9},{actor:'red',delay:.7,hops:10,duration:2.1},{actor:'blue',delay:1.58,hops:12,duration:1.8},{actor:'gold',delay:2.35,hops:8,duration:1.45}]
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
    this.impulses.gold.update(dt);
    this.goldEcho.update(dt);
    this.impulses.red.update(dt);
    this.impulses.blue.update(dt);
    this.goldConvergence.update(dt);
    if(this.cooldown>0){
      this.cooldown-=dt;
      if(this.cooldown<=0) this.startSequence();
      return;
    }
    this.sequenceTime+=dt;
    var allStarted=true;
    for(var stepIndex=0;stepIndex<this.steps.length;stepIndex++){
      var step=this.steps[stepIndex];
      if(step.started) continue;
      allStarted=false;
      if(this.sequenceTime<step.delay) continue;
      var impulse=this.impulses[step.actor];
      if(step.actor==='gold'?(impulse.active||this.goldEcho.active):impulse.active) continue;
      var seed=this.sequenceIndex*31+stepIndex*7+(step.actor==='gold'?1:step.actor==='red'?2:3);
      var controller=this;
      if(step.actor==='gold'){
        impulse.begin(buildNeuralRoute(seed,'gold',step.hops),step.duration,function(){ controller.goldConvergence.addCharge(); });
        this.goldEcho.begin(buildNeuralRoute(seed+17,'gold',step.hops+2),step.duration*.84,function(){ controller.goldConvergence.addCharge(); });
      } else {
        impulse.begin(buildNeuralRoute(seed,step.actor,step.hops),step.duration,null);
      }
      step.started=true;
    }
    if(allStarted&&!this.impulses.gold.active&&!this.goldEcho.active&&!this.impulses.red.active&&!this.impulses.blue.active) this.cooldown=1.1+(this.sequenceIndex%4)*.24;
  };
  var neuralActivityController=new NeuralActivityController();

  // --- Tuning-Panel: Regler für die Nervenstrang-Parameter. ?tune=1
  // öffnet es direkt; ansonsten über den sichtbaren Button. ---
  var tunePanel=null, tuneLauncher=null;
  var tuneStartsOpen=typeof window!=='undefined' && new URLSearchParams(window.location.search).get('tune')==='1';
  if (typeof window!=='undefined') {
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
      ['length','Länge',2,15,0.05],
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

    appendSecondaryControls('Rot • linker Strang',satelliteStrands[0],'#d9788a');
    appendSecondaryControls('Blau • rechter Strang',satelliteStrands[1],'#8ebef2');
    sectionLabel('Gold • Interaktives Ende','#f6e3a1');
    var resetGoldEndBtn=document.createElement('button');
    resetGoldEndBtn.type='button';
    resetGoldEndBtn.textContent='Gezogenes Ende zurücksetzen';
    resetGoldEndBtn.style.cssText='width:100%;padding:7px;background:rgba(231,197,106,.12);color:#f6e3a1;'
      +'border:1px solid rgba(231,197,106,.52);border-radius:5px;font-weight:bold;cursor:pointer;';
    resetGoldEndBtn.onclick=resetGoldStrandEnd;
    tunePanel.appendChild(resetGoldEndBtn);
    window.__strandTuning={SP:SP,FN:FN,MP:MP,WIND:WIND,GOLD_RENDER:GOLD_RENDER,GOLD_STRAND_TUNING:GOLD_STRAND_TUNING,RED_STRAND:RED_STRAND,BLUE_STRAND:BLUE_STRAND,resetGoldEnd:resetGoldStrandEnd};
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
        +'GOLD_END='+(strandEndTargetWorld?JSON.stringify({x:strandEndTargetWorld.x,y:strandEndTargetWorld.y,z:strandEndTargetWorld.z}):'null')+'\n'
        +'RED_STRAND='+JSON.stringify(RED_STRAND)+'\n'
        +'BLUE_STRAND='+JSON.stringify(BLUE_STRAND);
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
      var distance=Math.max(1,journey.offsetHeight);
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
      for (var satelliteIndex=0;satelliteIndex<satelliteBrains.length;satelliteIndex++) {
        var satelliteBrain=satelliteBrains[satelliteIndex];
        var satelliteData=satelliteBrain.userData;
        var satelliteTime=t*.31+satelliteData.phase;
        satelliteBrain.position.x=satelliteData.baseX+Math.sin(satelliteTime)*.16;
        satelliteBrain.position.y=satelliteData.baseY+Math.cos(satelliteTime*1.17)*.13;
        satelliteBrain.position.z=satelliteData.baseZ+Math.sin(satelliteTime*1.43+1.4)*.12;
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
      if (!reduced && SCENE_MOTION) {
        if (vc > 0 && now - lastWobbleUpdate > 32) {
          lastWobbleUpdate = now;
          var linePosArr = linesObj.geometry.attributes.position.array;
          var ptsPosArr = wptsObj.geometry.attributes.position.array;
          for (var v = 0; v < vc; v++) {
            var tv = sMeta[v * 2], ph = sMeta[v * 2 + 1];
            wobbleX[v] = Math.sin(t*WIND.speed*2.95+tv*WIND.waveFrequency+ph)*WIND.wave*tv*tv
              +Math.sin(t*WIND.speed*1.31+ph)*WIND.sway*.08*tv*tv;
            wobbleZ[v] = Math.cos(t*WIND.speed*2.43+tv*WIND.waveFrequency*.78+ph)*WIND.wave*.82*tv*tv
              +Math.cos(t*WIND.speed*1.07+ph)*WIND.sway*.06*tv*tv;
          }
          for (var wr = 0; wr < wobbleLineRefs.length; wr++) {
            var refL = wobbleLineRefs[wr], svL = refL.srcV, oL = refL.off;
            var strandDyL=sBase[svL*3+1]-SBASE_Y;
            linePosArr[oL]     = SBASE_X+(sBase[svL*3]-SBASE_X)+worldVerticalInStrandLocal.x*strandDyL+wobbleX[svL];
            linePosArr[oL + 1] = SBASE_Y+worldVerticalInStrandLocal.y*strandDyL;
            linePosArr[oL + 2] = SBASE_Z+(sBase[svL*3+2]-SBASE_Z)+worldVerticalInStrandLocal.z*strandDyL+wobbleZ[svL];
          }
          linesObj.geometry.attributes.position.needsUpdate = true;
          for (var wp = 0; wp < wobblePtsRefs.length; wp++) {
            var refP = wobblePtsRefs[wp], svP = refP.srcV, oP = refP.off;
            var strandDyP=sBase[svP*3+1]-SBASE_Y;
            ptsPosArr[oP]     = SBASE_X+(sBase[svP*3]-SBASE_X)+worldVerticalInStrandLocal.x*strandDyP+wobbleX[svP];
            ptsPosArr[oP + 1] = SBASE_Y+worldVerticalInStrandLocal.y*strandDyP;
            ptsPosArr[oP + 2] = SBASE_Z+(sBase[svP*3+2]-SBASE_Z)+worldVerticalInStrandLocal.z*strandDyP+wobbleZ[svP];
          }
          wptsObj.geometry.attributes.position.needsUpdate = true;
        }
      }
      if(STRAND_ON&&vc>0){
        var goldUpdateInterval=goldDragActive?16:40;
        if(now-lastGoldStrandUpdate>goldUpdateInterval){
          lastGoldStrandUpdate=now;
          updateGoldStrandGeometry(t);
        }
      }
      if (NEURAL_INFORMATION_ACTIVE && !reduced) neuralActivityController.update(dt);
      nodesP.material.opacity = .44;
      var railSlowdown=cameraRailSlowdown(cameraProgress);
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
      var orbit=sf*Math.PI*2;
      var lookY=cameraTargetStart-sf*cameraTravel;
      var heroPerspective=Math.max(0,1-sf/.11);
      var cameraY=lookY+.24+heroPerspective*.16;
      var desiredCameraLookY=lookY-heroPerspective*.1-cameraVelocity*.55;
      var aimEase=1-Math.exp(-dt*5.4);
      cameraAimY+=(desiredCameraLookY-cameraAimY)*aimEase;
      var cameraRadius=(8.78
        +Math.sin(sf*Math.PI*2*3.15+.6)*.46
        +Math.sin(sf*Math.PI*2*6.4+1.7)*.22)*MOBILE_RADIUS_SCALE;
      var targetFov=53+Math.sin(sf*Math.PI*2*2.15+.45)*1.65;
      if(Math.abs(targetFov-lastCameraFov)>.015){
        camera.fov=targetFov;
        camera.updateProjectionMatrix();
        lastCameraFov=targetFov;
      }
      world.rotation.y = 0;
      world.position.y = 0;
      camera.position.set(Math.sin(orbit)*cameraRadius, cameraY, Math.cos(orbit)*cameraRadius);
      camera.lookAt(0, cameraAimY, 0);
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
          orbit: orbit, cameraY: cameraY, cameraLookY: cameraAimY,
          cameraRadius: cameraRadius, fov: camera.fov, aspect: camera.aspect,
        };
      }
      renderer.render(scene, camera);
    }
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('pointerdown', onGoldPointerDown, true);
      window.removeEventListener('pointermove', onGoldPointerMove, true);
      window.removeEventListener('pointerup', onGoldPointerUp, true);
      window.removeEventListener('pointercancel', onGoldPointerUp, true);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibilityChange);
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
