'use client';
// @ts-nocheck
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import brainData from './brainData.json';

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
    var renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.1 : 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 200);
    camera.position.set(0, 0.4, 9.2);
    camera.lookAt(0, 0.5, 0);
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
  var brain=new THREE.Group(); brain.position.y=BRAIN_BASE_Y; brain.scale.setScalar(4.37); world.add(brain);
  var introTextGroup=new THREE.Group(); world.add(introTextGroup);
  var introSprites=[];
  var floatingObjects=[];
  var HELIX_STEP=4.2;
  var TEXT_START_Y=-5;
  var placeholderCards=[1,2,3,4].map(function(number){
    return {code:'P'+number,title:'Platzhalter'+number,body:'Weitere Inhalte folgen.',accent:'#d6b75a'};
  });
  var totalWorldStops=introTexts.length+serviceCards.length+placeholderCards.length;
  var cameraTargetStart=0;
  var cameraTargetEnd=TEXT_START_Y-(totalWorldStops-1)*HELIX_STEP-2.1;
  var cameraTravel=cameraTargetStart-cameraTargetEnd;
  var SCENE_MOTION=false;
  var OBJECT_FLOATING=true;
  var NEURAL_ACTIVITY=true;
  var lastCameraFov=camera.fov;

  function helixAngle(worldIndex){
    var stopY=TEXT_START_Y-worldIndex*HELIX_STEP;
    return Math.PI*2*(cameraTargetStart-stopY)/cameraTravel;
  }

  function cameraRailSlowdown(progress){
    var focusWindow=.028, slowdown=1;
    for(var stopIndex=0;stopIndex<totalWorldStops;stopIndex++){
      var stopY=TEXT_START_Y-stopIndex*HELIX_STEP;
      var stopProgress=(cameraTargetStart-stopY)/cameraTravel;
      var distance=Math.abs(progress-stopProgress);
      if(distance>=focusWindow) continue;
      var proximity=1-distance/focusWindow;
      slowdown=Math.min(slowdown,.3+.7*(1-proximity)*(1-proximity));
    }
    return slowdown;
  }

  function buildIntroSprite(label,index){
    var textCanvas=document.createElement('canvas');
    textCanvas.width=1536; textCanvas.height=512;
    var context=textCanvas.getContext('2d');
    if(!context) return;
    var textLines=label.split('\n');
    context.clearRect(0,0,textCanvas.width,textCanvas.height);
    context.fillStyle='rgba(222,185,82,.92)';
    context.font='700 30px Arial, sans-serif';
    context.letterSpacing='10px';
    context.fillText(('0'+(index+1)).slice(-2),80,74);
    context.fillStyle='rgba(255,255,255,.98)';
    context.font='900 102px Arial, sans-serif';
    context.shadowColor='rgba(255,199,65,.36)';
    context.shadowBlur=24;
    var lineOffsets=[[0,78,24],[94,8,116],[28,112,4],[86,0,62],[10,96,38]][index%5];
    textLines.forEach(function(line,lineIndex){
      context.fillText(line,80+(lineOffsets[lineIndex]||0),190+lineIndex*112);
    });
    context.shadowBlur=0;
    var texture=new THREE.CanvasTexture(textCanvas);
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.minFilter=THREE.LinearFilter;
    var material=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,depthTest:true,opacity:.98,side:THREE.FrontSide});
    var textSprite=new THREE.Mesh(new THREE.PlaneGeometry(isMobile?3.77:5.65,isMobile?1.25:1.88),material);
    var textAngle=helixAngle(index);
    var textRadius=2.65;
    textSprite.position.set(Math.sin(textAngle)*textRadius,TEXT_START_Y-index*HELIX_STEP,Math.cos(textAngle)*textRadius);
    textSprite.rotation.y=textAngle;
    textSprite.userData={baseX:textSprite.position.x,baseY:textSprite.position.y,baseZ:textSprite.position.z,baseRotY:textAngle,phase:index*1.37};
    introTextGroup.add(textSprite);
    introSprites.push(textSprite);
    floatingObjects.push(textSprite);
  }

  introTexts.forEach(buildIntroSprite);

  function buildServiceCard(card,index,worldIndex){
    var cardCanvas=document.createElement('canvas');
    cardCanvas.width=1536; cardCanvas.height=864;
    var context=cardCanvas.getContext('2d');
    if(!context) return;
    var cardGradient=context.createLinearGradient(0,0,1536,864);
    cardGradient.addColorStop(0,'rgba(22,19,11,.94)');
    cardGradient.addColorStop(1,'rgba(8,7,5,.8)');
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
    var material=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,depthTest:true,opacity:.98,side:THREE.FrontSide});
    var cardMesh=new THREE.Mesh(new THREE.PlaneGeometry(isMobile?3.23:4.85,isMobile?1.82:2.73),material);
    var cardAngle=helixAngle(worldIndex);
    cardMesh.position.set(Math.sin(cardAngle)*1.68,-2.2-index*4.2,Math.cos(cardAngle)*1.68);
    cardMesh.position.y=TEXT_START_Y-worldIndex*HELIX_STEP;
    cardMesh.rotation.y=cardAngle;
    cardMesh.userData={baseX:cardMesh.position.x,baseY:cardMesh.position.y,baseZ:cardMesh.position.z,baseRotY:cardAngle,phase:worldIndex*1.37+.52};
    introTextGroup.add(cardMesh);
    floatingObjects.push(cardMesh);
  }

  serviceCards.forEach(function(card,index){ buildServiceCard(card,index,introTexts.length+index); });
  placeholderCards.forEach(function(card,index){ buildServiceCard(card,index,introTexts.length+serviceCards.length+index); });

  var BASE_Y=Math.PI/2+0.15, BASE_X=0.22; /* Front, leicht nach vorne geneigt: Oberseite mit Hirnstruktur sichtbar */
  var GOLD={
    deep:new THREE.Color(0xff8a00),
    core:new THREE.Color(0xffb000),
    line:new THREE.Color(0xffd15a),
    hot:new THREE.Color(0xffee8a),
    white:new THREE.Color(0xffffcf)
  };
  var golds=[GOLD.core,GOLD.line,GOLD.hot,GOLD.white,GOLD.deep];
  var cc=new THREE.Color();
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

  function pointsObj(arr,cols,size,op){
    var g2=new THREE.BufferGeometry();
    g2.setAttribute('position',new THREE.Float32BufferAttribute(arr,3));
    if(cols) g2.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));
    var m2=new THREE.PointsMaterial({size:size,map:sprite,transparent:true,opacity:op,
      vertexColors:!!cols,color:cols?0xffffff:0xffd15a,blending:THREE.AdditiveBlending,depthWrite:false});
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
    var depthPoints=pointsObj(positions,colors,size,opacity);
    depthPoints.frustumCulled=false;
    world.add(depthPoints);
  }

  // Fünf feste räumliche Ebenen: Die Partikel bewegen sich nicht selbst,
  // erzeugen durch die vorbeifliegende Kamera aber permanenten Vorder- und Hintergrund-Flow.
  addDepthLayer(isMobile?24:52,1.4,3.6,.055,.42,0xffd76a,0xffffff);
  addDepthLayer(isMobile?34:72,3.7,6.8,.075,.32,0xffa92f,0xffed9a);
  addDepthLayer(isMobile?42:92,6.9,10.5,.11,.22,0x9d6b24,0xffd76a);
  addDepthLayer(isMobile?34:76,10.6,16.5,.16,.14,0x5f4218,0xd6b75a);
  addDepthLayer(isMobile?16:36,16.6,23,.42,.06,0x3d2a10,0xa8792b);

  var BR=brainData;

  var __hideSet = (typeof window!=='undefined' ? new URLSearchParams(window.location.search).get('hide')||'' : '').split(',');
  function dbgHide(key,obj){ if(__hideSet.indexOf(key)!==-1) obj.visible=false; return obj; }
  var pts=[], ppos=[], pcol=[];
  var sca=BR.scatter;
  for(var i=0;i<sca.length;i+=3){
    var vx=sca[i],vy=sca[i+1],vz=sca[i+2];
    pts.push(new THREE.Vector3(vx,vy,vz));
    ppos.push(vx,vy,vz);
    cc.copy(golds[Math.floor(Math.random()*golds.length)]).multiplyScalar(taperFade(vy));
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
      var fw=taperFade(y);
      wcol.push(cc.r*fw,cc.g*fw,cc.b*fw);
      path.push(new THREE.Vector3(x,y,z));
      if(k>0){
        var px=flat[(k-1)*3],py=flat[(k-1)*3+1],pz=flat[(k-1)*3+2];
        lpos.push(px,py,pz,x,y,z);
        var fa=taperFade(py), fb=taperFade(y);
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
           curve:0, twist:5.2, jitter:0, rungs:0.68, ptSize:0.03, spacing:0.06,
           ringSpread:0.1, offX:0, offY:0, offZ:0,
           droop:1.5, frayStart:0.98, fraySpread:0.12 };
  // Trichter: jede Faser startet an einem echten goldenen Vertex im Stumpf-
  // Bereich und läuft über eine kurze, sanft gekrümmte Kurve zu einem
  // Konvergenzpunkt auf der Mittelachse, bevor sie in das bestehende
  // Bündel (Taper/Droop/Fray) übergeht.
  var FN={ count:isMobile?96:220, anchorRadius:0.59, funnelHeight:0.19, funnelSegs:3, convergePull:0.65, randomness:1 };
  var MP={ moveLeft:0, moveRight:0, moveForward:0, moveBack:0, moveVertical:0.01 };
  var WIND={ sway:0.04, speed:0.37, wave:0.036, waveFrequency:9 };
  function moveX(){ return SP.offX + MP.moveRight - MP.moveLeft; }
  function moveY(){ return SP.offY + MP.moveVertical; }
  function moveZ(){ return SP.offZ + MP.moveForward - MP.moveBack; }
  function rnd(){return Math.random();}
  function smooth(x){x=x<0?0:x>1?1:x;return x*x*(3-2*x);}
  var STRAND_ON = !(typeof window!=='undefined' && new URLSearchParams(window.location.search).get('nostrand')==='1');
  var sBase=[], sMeta=[], sFibers=[], vc=0;
  var wobbleLineRefs=[], wobblePtsRefs=[];
  var wobbleX=new Float32Array(0), wobbleZ=new Float32Array(0);
  // gemeinsame Durchhang-Richtung (Schwerkraft): leicht nach vorne/unten,
  // nicht rein vertikal, wirkt organischer als ein reiner Y-Fall
  var DROOP_DX=0, DROOP_DZ=0;
  function genStrandInto(outPos,outCol,outPtsPos,outPtsCol){
    sBase=[]; sMeta=[]; sFibers=[]; vc=0; wobbleLineRefs=[]; wobblePtsRefs=[];
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
    var fiberCount=FN.count;
    for(var f=0;f<fiberCount;f++){
      // Ankerpunkt: ein echter goldener Vertex aus dem Stumpf-Bereich,
      // gleichmässig durchgemischt über alle verfügbaren Punkte zyklisch.
      var anchorRaw=stumpAnchorPts[anchorOrder[f%anchorOrder.length]];
      var anchor=new THREE.Vector3(anchorRaw.x+mx,anchorRaw.y+my,anchorRaw.z+mz);
      // Konvergenzpunkt auf der Mittelachse, mit leichter Höhen-Streuung pro
      // Faser (organisch statt mathematisch perfekt)
      var convY=SBASE_Y+my-FN.funnelHeight*(0.7+rnd()*0.6);
      var converge=new THREE.Vector3(SBASE_X+mx,convY,SBASE_Z+mz);
      // Bezier-Kontrollpunkt: zieht die Kurve zur Achse, mit Zufalls-Schwung
      // statt einer geraden Linie
      var pull=FN.convergePull*(0.75+rnd()*0.5);
      var ctrl=anchor.clone().lerp(converge,pull);
      ctrl.x+=(rnd()-0.5)*FN.randomness*0.3;
      ctrl.z+=(rnd()-0.5)*FN.randomness*0.3;
      ctrl.y+=(rnd()-0.5)*FN.randomness*0.08;

      var a0=rnd()*6.283, tw=(rnd()-0.5)*SP.twist;
      var frayJitter=0.4+rnd()*0.6; // per-fiber Streuung fürs Auffransen unten
      var endF=(f%4)?0.9+0.1*rnd():0.6+0.3*rnd();
      var bundleSteps=Math.round(N*endF);
      var funnelSegs=Math.max(3,Math.round(FN.funnelSegs));
      var steps=funnelSegs+bundleSteps, base=vc;
      sFibers.push({start:base, len:steps});
      var fiberCol=golds[Math.floor(rnd()*golds.length)];
      for(var r=0;r<steps;r++){
        var tv=r/(steps-1); // globaler Fortschritt: 0 am Node-Anker, 1 an der Faserspitze
        var px,py,pz;
        if(r<funnelSegs){
          // Trichter-Phase: quadratische Bezier vom Anker zum Konvergenz-
          // punkt, sanftes Ease-in statt gerader Linie
          var ft=smooth(r/funnelSegs);
          var it=1-ft;
          px=it*it*anchor.x+2*it*ft*ctrl.x+ft*ft*converge.x;
          py=it*it*anchor.y+2*it*ft*ctrl.y+ft*ft*converge.y;
          pz=it*it*anchor.z+2*it*ft*ctrl.z+ft*ft*converge.z;
        } else {
          // Bündel-Phase: bestehende Swirl/Taper/Droop/Fray-Formeln, jetzt
          // ab dem Konvergenzpunkt statt ab dem Ring
          var br=r-funnelSegs;
          var btv=bundleSteps>1?br/(bundleSteps-1):0;
          var ang=a0+btv*tw;
          var bundleScale=1-SP.taper*btv;
          var swirl=SP.rStr*smooth(Math.min(1,btv/Math.max(SP.gather,.001)));
          var frayEnv=smooth(Math.max(0,(btv-SP.frayStart)/Math.max(.001,1-SP.frayStart)));
          var fraySpread=frayEnv*SP.fraySpread*frayJitter;
          var droop=SP.droop*btv*btv;
          px=converge.x+SP.curve*Math.sin(btv*2.1)+Math.cos(ang)*(swirl+fraySpread)+droop*DROOP_DX;
          pz=converge.z+0.7*SP.curve*Math.sin(btv*1.6+1.0)+Math.sin(ang)*(swirl+fraySpread)+droop*DROOP_DZ;
          py=converge.y-br*SP.spacing*bundleScale;
        }
        // sanftes Ausblenden im letzten Abschnitt statt hartem Ende
        var endFade=1-smooth(Math.max(0,(tv-0.86)/0.14));
        px+=(rnd()-0.5)*SP.jitter; py+=(rnd()-0.5)*SP.jitter; pz+=(rnd()-0.5)*SP.jitter;
        var v=vc;
        sBase.push(px,py,pz);
        sMeta.push(tv,a0);
        cc.copy(fiberCol).multiplyScalar(0.35+0.65*endFade);
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
    var stepsSpan=Math.round(SP.length/SP.spacing);
    for(var i2=0;i2<vc;i2+=2){
      var j2=i2+stepsSpan;
      if(j2>=0&&j2<vc&&sMeta[i2*2]>SP.gather&&Math.abs(sBase[i2*3+1]-sBase[j2*3+1])<0.1){
        var dx=sBase[i2*3]-sBase[j2*3], dz=sBase[i2*3+2]-sBase[j2*3+2];
        if(Math.sqrt(dx*dx+dz*dz)<0.05&&rnd()<SP.rungs){
          cc.copy(golds[Math.floor(rnd()*golds.length)]);
          var rOff=outPos.length;
          outPos.push(sBase[i2*3],sBase[i2*3+1],sBase[i2*3+2],sBase[j2*3],sBase[j2*3+1],sBase[j2*3+2]);
          outCol.push(cc.r,cc.g,cc.b,cc.r,cc.g,cc.b);
          wobbleLineRefs.push({off:rOff,srcV:i2});
          wobbleLineRefs.push({off:rOff+3,srcV:j2});
        }
      }
    }
  }

  function resetWobbleBuffers(){
    wobbleX=new Float32Array(vc);
    wobbleZ=new Float32Array(vc);
  }

  var baseLinePos=lpos.slice(), baseLineCol=lcol.slice();
  var baseWPos=wpos.slice(), baseWCol=wcol.slice();
  if(STRAND_ON) genStrandInto(lpos,lcol,wpos,wcol);
  resetWobbleBuffers();

  var lgeo=new THREE.BufferGeometry();
  lgeo.setAttribute('position',new THREE.Float32BufferAttribute(lpos,3));
  lgeo.setAttribute('color',new THREE.Float32BufferAttribute(lcol,3));
  var linesObj=new THREE.LineSegments(lgeo,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.52,blending:THREE.NormalBlending,depthWrite:false}));
  linesObj.name='neural-lines';
  brain.add(dbgHide('walks',linesObj));
  var wptsObj=pointsObj(wpos,wcol,.044,.6);
  wptsObj.name='neural-points';
  brain.add(dbgHide('wpts',wptsObj));

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
  brain.add(dbgHide('cross',new THREE.LineSegments(xgeo,new THREE.LineBasicMaterial({color:0xffc23a,transparent:true,opacity:.3,blending:THREE.AdditiveBlending,depthWrite:false}))));

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
        var ffa=taperFade(pts[i].y), ffb=taperFade(pts[jf].y);
        fineCol.push(cc.r*ffa,cc.g*ffa,cc.b*ffa,cc.r*ffb,cc.g*ffb,cc.b*ffb);
        pairs.push([i,jf]);
        degFine[i]++; degFine[jf]++;
      }
    }
  }
  var fgeo=new THREE.BufferGeometry();
  fgeo.setAttribute('position',new THREE.Float32BufferAttribute(finePos,3));
  fgeo.setAttribute('color',new THREE.Float32BufferAttribute(fineCol,3));
  brain.add(dbgHide('fine',new THREE.LineSegments(fgeo,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.24,blending:THREE.AdditiveBlending,depthWrite:false}))));

  // --- Verbindungsgraph aller goldenen Linien (Walks + Cross-Links + Feingewebe),
  // dient den blauen Nervenblitzen als Wegenetz zum "Entlangfolgen" ---
  var graphAdj=[]; for(i=0;i<pts.length;i++) graphAdj.push([]);
  pairs.forEach(function(p){ graphAdj[p[0]].push(p[1]); graphAdj[p[1]].push(p[0]); });

  var npos=BR.nodes;
  var nodesP=pointsObj(npos,null,.21,1);
  brain.add(dbgHide('nodes',nodesP));

  function halo(sc,op,hy){
    var sm=new THREE.SpriteMaterial({map:sprite,color:0xffb000,transparent:true,opacity:op,blending:THREE.AdditiveBlending,depthWrite:false});
    var sp=new THREE.Sprite(sm); sp.scale.set(sc,sc,1); sp.position.y=hy; brain.add(sp);
  }
  if (typeof window==='undefined' || new URLSearchParams(window.location.search).get('nohalo')!=='1') {
    halo(6.2,.22,0); halo(3.7,.3,.1); halo(1.9,.42,.2);
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
  function tintSatelliteBrain(satellite,colorHex){
    var tintColor=new THREE.Color(colorHex);
    satellite.traverse(function(part){
      if(part.geometry&&part.geometry.attributes&&part.geometry.attributes.color){
        var tintedGeometry=part.geometry.clone();
        var colorAttribute=tintedGeometry.attributes.color;
        for(var colorIndex=0;colorIndex<colorAttribute.count;colorIndex++){
          var brightness=Math.max(colorAttribute.getX(colorIndex),colorAttribute.getY(colorIndex),colorAttribute.getZ(colorIndex));
          colorAttribute.setXYZ(colorIndex,tintColor.r*brightness,tintColor.g*brightness,tintColor.b*brightness);
        }
        colorAttribute.needsUpdate=true;
        part.geometry=tintedGeometry;
      }
      if(part.material){
        var tintedMaterial=part.material.clone();
        if(tintedMaterial.color){
          if(tintedMaterial.vertexColors) tintedMaterial.color.set(0xffffff);
          else tintedMaterial.color.copy(tintColor);
        }
        part.material=tintedMaterial;
      }
    });
  }
  function addSatelliteBrain(x,y,z,phase,colorHex){
    var satellite=brain.clone(true);
    tintSatelliteBrain(satellite,colorHex);
    hideSatelliteTail(satellite);
    satellite.scale.setScalar(1.32);
    satellite.position.set(x,y,z);
    satellite.rotation.set(BASE_X,BASE_Y,0);
    satellite.userData={baseX:x,baseY:y,baseZ:z,baseRotY:BASE_Y,phase:phase};
    world.add(satellite);
    satelliteBrains.push(satellite);
  }
  addSatelliteBrain(-5.7,-.62,-.7,.35,'#ff4d6d');
  addSatelliteBrain(5.7,-.44,-.9,2.7,'#4dd2ff');

  var satelliteStrands=[];
  var satelliteTargetWorld=new THREE.Vector3();
  var satelliteTargetLocal=new THREE.Vector3();
  var satelliteInverseMatrix=new THREE.Matrix4();
  var satelliteWorldX=new THREE.Vector3();
  var satelliteWorldZ=new THREE.Vector3();
  var satelliteWorldDown=new THREE.Vector3();
  function useExistingSatelliteStrand(satellite,phase,colorHex,flowDirection){
    var fiberShapes=[];
    for(var fiberShapeIndex=0;fiberShapeIndex<sFibers.length;fiberShapeIndex++){
      fiberShapes.push({
        phaseOffset:(Math.random()-.5)*.22,
        radiusOffset:(Math.random()-.5)*.07,
        firstDroop:1.72+Math.random()*.34,
        secondDroop:1.3+Math.random()*.28,
        firstSway:(Math.random()-.5)*.2,
        secondSway:(Math.random()-.5)*.15
      });
    }
    var satelliteLines=satellite.getObjectByName('neural-lines');
    var satellitePoints=satellite.getObjectByName('neural-points');
    satelliteLines.material.blending=THREE.AdditiveBlending;
    satelliteLines.material.opacity=.92;
    satellitePoints.material.opacity=.9;
    satellitePoints.material.size=.066;
    satelliteLines.frustumCulled=false;
    satellitePoints.frustumCulled=false;
    satelliteStrands.push({
      satellite:satellite,
      phase:phase,
      color:new THREE.Color(colorHex),
      flowDirection:flowDirection,
      fiberShapes:fiberShapes,
      linePositions:satelliteLines.geometry.attributes.position.array,
      pointPositions:satellitePoints.geometry.attributes.position.array,
      lineColors:satelliteLines.geometry.attributes.color.array,
      pointColors:satellitePoints.geometry.attributes.color.array
    });
  }
  useExistingSatelliteStrand(satelliteBrains[0],Math.PI,'#e46d62',1);
  useExistingSatelliteStrand(satelliteBrains[1],0,'#39bfe9',-1);

  function curveExistingSatelliteStrand(strand,flowTime){
    satelliteTargetWorld.copy(stumpCenterLocal);
    brain.localToWorld(satelliteTargetWorld);
    satellite.worldToLocal(satelliteTargetLocal.copy(satelliteTargetWorld));
    satelliteInverseMatrix.copy(strand.satellite.matrixWorld).invert();
    satelliteWorldX.set(1,0,0).transformDirection(satelliteInverseMatrix);
    satelliteWorldZ.set(0,0,1).transformDirection(satelliteInverseMatrix);
    satelliteWorldDown.set(0,-1,0).transformDirection(satelliteInverseMatrix);
    var lineOffset=baseLinePos.length, pointOffset=baseWPos.length;
    var connectorShare=.46, helixLength=25.5, helixTurns=3.8, helixRotation=flowTime*.075;
    for(var fiberIndex=0;fiberIndex<sFibers.length;fiberIndex++){
      var fiber=sFibers[fiberIndex], start=fiber.start, fiberShape=strand.fiberShapes[fiberIndex];
      var startX=sBase[start*3], startY=sBase[start*3+1], startZ=sBase[start*3+2];
      var joinAngle=strand.phase+helixRotation+fiberShape.phaseOffset;
      var joinRadius=.46+fiberShape.radiusOffset;
      var joinX=satelliteTargetLocal.x+satelliteWorldX.x*Math.cos(joinAngle)*joinRadius+satelliteWorldZ.x*Math.sin(joinAngle)*joinRadius;
      var joinY=satelliteTargetLocal.y+satelliteWorldX.y*Math.cos(joinAngle)*joinRadius+satelliteWorldZ.y*Math.sin(joinAngle)*joinRadius;
      var joinZ=satelliteTargetLocal.z+satelliteWorldX.z*Math.cos(joinAngle)*joinRadius+satelliteWorldZ.z*Math.sin(joinAngle)*joinRadius;
      var sideSign=startX<joinX?-1:1;
      var controlOneX=startX+(joinX-startX)*.23+satelliteWorldDown.x*fiberShape.firstDroop+satelliteWorldZ.x*fiberShape.firstSway+satelliteWorldX.x*sideSign*.42;
      var controlOneY=startY+(joinY-startY)*.23+satelliteWorldDown.y*fiberShape.firstDroop+satelliteWorldZ.y*fiberShape.firstSway+satelliteWorldX.y*sideSign*.42;
      var controlOneZ=startZ+(joinZ-startZ)*.23+satelliteWorldDown.z*fiberShape.firstDroop+satelliteWorldZ.z*fiberShape.firstSway+satelliteWorldX.z*sideSign*.42;
      var controlTwoX=startX+(joinX-startX)*.77+satelliteWorldDown.x*fiberShape.secondDroop+satelliteWorldZ.x*fiberShape.secondSway+satelliteWorldX.x*sideSign*.16;
      var controlTwoY=startY+(joinY-startY)*.77+satelliteWorldDown.y*fiberShape.secondDroop+satelliteWorldZ.y*fiberShape.secondSway+satelliteWorldX.y*sideSign*.16;
      var controlTwoZ=startZ+(joinZ-startZ)*.77+satelliteWorldDown.z*fiberShape.secondDroop+satelliteWorldZ.z*fiberShape.secondSway+satelliteWorldX.z*sideSign*.16;
      var previousX=startX, previousY=startY, previousZ=startZ;
      var previousR=0, previousG=0, previousB=0;
      for(var step=0;step<fiber.len;step++){
        var progress=fiber.len>1?step/(fiber.len-1):0, x,y,z, helixProgress;
        if(progress<connectorShare){
          var connectorProgress=progress/connectorShare, inverse=1-connectorProgress;
          x=inverse*inverse*inverse*startX+3*inverse*inverse*connectorProgress*controlOneX+3*inverse*connectorProgress*connectorProgress*controlTwoX+connectorProgress*connectorProgress*connectorProgress*joinX;
          y=inverse*inverse*inverse*startY+3*inverse*inverse*connectorProgress*controlOneY+3*inverse*connectorProgress*connectorProgress*controlTwoY+connectorProgress*connectorProgress*connectorProgress*joinY;
          z=inverse*inverse*inverse*startZ+3*inverse*inverse*connectorProgress*controlOneZ+3*inverse*connectorProgress*connectorProgress*controlTwoZ+connectorProgress*connectorProgress*connectorProgress*joinZ;
          helixProgress=0;
        } else {
          helixProgress=(progress-connectorShare)/(1-connectorShare);
          var helixAngle=strand.phase+helixRotation+helixProgress*Math.PI*2*helixTurns+fiberShape.phaseOffset;
          var helixRadius=.46+fiberShape.radiusOffset+Math.sin(helixProgress*Math.PI*4+fiberShape.phaseOffset)*.012;
          var centerX=satelliteTargetLocal.x+satelliteWorldDown.x*helixProgress*helixLength;
          var centerY=satelliteTargetLocal.y+satelliteWorldDown.y*helixProgress*helixLength;
          var centerZ=satelliteTargetLocal.z+satelliteWorldDown.z*helixProgress*helixLength;
          x=centerX+satelliteWorldX.x*Math.cos(helixAngle)*helixRadius+satelliteWorldZ.x*Math.sin(helixAngle)*helixRadius;
          y=centerY+satelliteWorldX.y*Math.cos(helixAngle)*helixRadius+satelliteWorldZ.y*Math.sin(helixAngle)*helixRadius;
          z=centerZ+satelliteWorldX.z*Math.cos(helixAngle)*helixRadius+satelliteWorldZ.z*Math.sin(helixAngle)*helixRadius;
        }
        var pulse=Math.max(0,Math.sin(flowTime*3.4*strand.flowDirection-progress*20*strand.flowDirection+fiberShape.phaseOffset));
        var brightness=.48+pulse*.75;
        var colorR=strand.color.r*brightness, colorG=strand.color.g*brightness, colorB=strand.color.b*brightness;
        var pointIndex=pointOffset+(start+step)*3;
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
    strand.satellite.getObjectByName('neural-lines').geometry.attributes.position.needsUpdate=true;
    strand.satellite.getObjectByName('neural-points').geometry.attributes.position.needsUpdate=true;
    strand.satellite.getObjectByName('neural-lines').geometry.attributes.color.needsUpdate=true;
    strand.satellite.getObjectByName('neural-points').geometry.attributes.color.needsUpdate=true;
  }

  // Sichtbare Sekundärenergie: Beide farbigen Faserbündel starten an den
  // kleinen Gehirnen, hängen locker zur Mittelachse und umschlingen danach
  // den goldenen Kern als phasenstabile Doppelhelix.
  var secondaryEnergyGroup=new THREE.Group();
  secondaryEnergyGroup.renderOrder=3;
  world.add(secondaryEnergyGroup);
  var secondaryMainAnchor=new THREE.Vector3();
  var secondarySatelliteAnchor=new THREE.Vector3();
  var secondaryEnergyBundles=[];

  function createSecondaryEnergyBundle(satellite,side,phase,colorHex,flowDirection){
    var fiberCount=isMobile?48:144, segments=isMobile?66:104;
    var pointCount=fiberCount*(segments+1), lineCount=fiberCount*segments;
    var linePositions=new Float32Array(lineCount*6);
    var lineColors=new Float32Array(lineCount*6);
    var pointPositions=new Float32Array(pointCount*3);
    var pointColors=new Float32Array(pointCount*3);
    var lineGeometry=new THREE.BufferGeometry();
    lineGeometry.setAttribute('position',new THREE.BufferAttribute(linePositions,3));
    lineGeometry.setAttribute('color',new THREE.BufferAttribute(lineColors,3));
    var pointGeometry=new THREE.BufferGeometry();
    pointGeometry.setAttribute('position',new THREE.BufferAttribute(pointPositions,3));
    pointGeometry.setAttribute('color',new THREE.BufferAttribute(pointColors,3));
    var fiberLines=new THREE.LineSegments(lineGeometry,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.92,blending:THREE.AdditiveBlending,depthWrite:false}));
    var fiberPoints=new THREE.Points(pointGeometry,new THREE.PointsMaterial({size:isMobile?.045:.058,map:sprite,transparent:true,opacity:.9,vertexColors:true,blending:THREE.AdditiveBlending,depthWrite:false}));
    fiberLines.frustumCulled=false;
    fiberPoints.frustumCulled=false;
    fiberLines.renderOrder=3;
    fiberPoints.renderOrder=4;
    secondaryEnergyGroup.add(fiberLines);
    secondaryEnergyGroup.add(fiberPoints);
    var fibers=[];
    for(var fiberIndex=0;fiberIndex<fiberCount;fiberIndex++){
      fibers.push({
        rootAngle:Math.random()*Math.PI*2,
        rootRadius:.045+Math.random()*.16,
        laneOffset:(Math.random()-.5)*.25,
        radiusOffset:(Math.random()-.5)*.08,
        sag:1.22+Math.random()*.45,
        microPhase:Math.random()*Math.PI*2
      });
    }
    secondaryEnergyBundles.push({
      satellite:satellite,
      side:side,
      phase:phase,
      flowDirection:flowDirection,
      color:new THREE.Color(colorHex),
      fibers:fibers,
      segments:segments,
      linePositions:linePositions,
      lineColors:lineColors,
      pointPositions:pointPositions,
      pointColors:pointColors,
      lineGeometry:lineGeometry,
      pointGeometry:pointGeometry
    });
  }

  createSecondaryEnergyBundle(satelliteBrains[0],-1,Math.PI,'#ff4d6d',1);
  createSecondaryEnergyBundle(satelliteBrains[1],1,0,'#4dd2ff',-1);

  function updateSecondaryEnergyBundle(bundle,flowTime){
    secondarySatelliteAnchor.copy(stumpCenterLocal);
    bundle.satellite.localToWorld(secondarySatelliteAnchor);
    var coreX=secondaryMainAnchor.x, coreY=secondaryMainAnchor.y-.16, coreZ=secondaryMainAnchor.z;
    var connectorShare=.35, helixLength=34, helixTurns=3.75, helixRotation=flowTime*.055;
    for(var fiberIndex=0;fiberIndex<bundle.fibers.length;fiberIndex++){
      var fiber=bundle.fibers[fiberIndex];
      var rootX=secondarySatelliteAnchor.x+Math.cos(fiber.rootAngle)*fiber.rootRadius;
      var rootY=secondarySatelliteAnchor.y+Math.sin(fiber.rootAngle*.7)*fiber.rootRadius*.4;
      var rootZ=secondarySatelliteAnchor.z+Math.sin(fiber.rootAngle)*fiber.rootRadius;
      var joinAngle=bundle.phase+helixRotation+fiber.laneOffset;
      var joinRadius=.46+fiber.radiusOffset;
      var joinX=coreX+Math.cos(joinAngle)*joinRadius;
      var joinY=coreY;
      var joinZ=coreZ+Math.sin(joinAngle)*joinRadius;
      var controlOneX=rootX+(joinX-rootX)*.24+bundle.side*.55;
      var controlOneY=rootY-fiber.sag;
      var controlOneZ=rootZ+(joinZ-rootZ)*.16;
      var controlTwoX=rootX+(joinX-rootX)*.76+bundle.side*.18;
      var controlTwoY=joinY-fiber.sag*.72;
      var controlTwoZ=rootZ+(joinZ-rootZ)*.78;
      var previousX=0, previousY=0, previousZ=0, previousR=0, previousG=0, previousB=0;
      for(var segmentIndex=0;segmentIndex<=bundle.segments;segmentIndex++){
        var progress=segmentIndex/bundle.segments, x,y,z;
        if(progress<connectorShare){
          var connectorProgress=progress/connectorShare, inverse=1-connectorProgress;
          x=inverse*inverse*inverse*rootX+3*inverse*inverse*connectorProgress*controlOneX+3*inverse*connectorProgress*connectorProgress*controlTwoX+connectorProgress*connectorProgress*connectorProgress*joinX;
          y=inverse*inverse*inverse*rootY+3*inverse*inverse*connectorProgress*controlOneY+3*inverse*connectorProgress*connectorProgress*controlTwoY+connectorProgress*connectorProgress*connectorProgress*joinY;
          z=inverse*inverse*inverse*rootZ+3*inverse*inverse*connectorProgress*controlOneZ+3*inverse*connectorProgress*connectorProgress*controlTwoZ+connectorProgress*connectorProgress*connectorProgress*joinZ;
        } else {
          var helixProgress=(progress-connectorShare)/(1-connectorShare);
          var helixAngle=bundle.phase+helixRotation+helixProgress*Math.PI*2*helixTurns+fiber.laneOffset;
          var microAngle=fiber.microPhase+helixProgress*Math.PI*2*.45*bundle.flowDirection;
          var radius=.46+fiber.radiusOffset+Math.cos(microAngle)*.045;
          x=coreX+Math.cos(helixAngle)*radius;
          y=coreY-helixProgress*helixLength+Math.sin(microAngle)*.035;
          z=coreZ+Math.sin(helixAngle)*radius;
        }
        var pulse=Math.max(0,Math.sin(flowTime*3.8*bundle.flowDirection-progress*24*bundle.flowDirection+fiber.microPhase));
        var brightness=.42+pulse*.9;
        var red=bundle.color.r*brightness, green=bundle.color.g*brightness, blue=bundle.color.b*brightness;
        var pointOffset=(fiberIndex*(bundle.segments+1)+segmentIndex)*3;
        bundle.pointPositions[pointOffset]=x;
        bundle.pointPositions[pointOffset+1]=y;
        bundle.pointPositions[pointOffset+2]=z;
        bundle.pointColors[pointOffset]=red;
        bundle.pointColors[pointOffset+1]=green;
        bundle.pointColors[pointOffset+2]=blue;
        if(segmentIndex>0){
          var lineOffset=(fiberIndex*bundle.segments+segmentIndex-1)*6;
          bundle.linePositions[lineOffset]=previousX;
          bundle.linePositions[lineOffset+1]=previousY;
          bundle.linePositions[lineOffset+2]=previousZ;
          bundle.linePositions[lineOffset+3]=x;
          bundle.linePositions[lineOffset+4]=y;
          bundle.linePositions[lineOffset+5]=z;
          bundle.lineColors[lineOffset]=previousR;
          bundle.lineColors[lineOffset+1]=previousG;
          bundle.lineColors[lineOffset+2]=previousB;
          bundle.lineColors[lineOffset+3]=red;
          bundle.lineColors[lineOffset+4]=green;
          bundle.lineColors[lineOffset+5]=blue;
        }
        previousX=x;
        previousY=y;
        previousZ=z;
        previousR=red;
        previousG=green;
        previousB=blue;
      }
    }
    bundle.lineGeometry.attributes.position.needsUpdate=true;
    bundle.lineGeometry.attributes.color.needsUpdate=true;
    bundle.pointGeometry.attributes.position.needsUpdate=true;
    bundle.pointGeometry.attributes.color.needsUpdate=true;
  }

  function updateSecondaryEnergySystem(flowTime){
    secondaryMainAnchor.copy(stumpCenterLocal);
    brain.localToWorld(secondaryMainAnchor);
    for(var bundleIndex=0;bundleIndex<secondaryEnergyBundles.length;bundleIndex++) updateSecondaryEnergyBundle(secondaryEnergyBundles[bundleIndex],flowTime);
  }

  function Spark(){
    var g3=new THREE.BufferGeometry();
    this.arr=new Float32Array(7*3);
    g3.setAttribute('position',new THREE.BufferAttribute(this.arr,3));
    this.mat=new THREE.LineBasicMaterial({color:0xffffb0,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
    this.line=new THREE.Line(g3,this.mat);
    this.line.frustumCulled=false;
    this.life=0; this.wait=Math.random()*1.5;
    brain.add(this.line);
  }
  Spark.prototype.spawn=function(){
    var pr=pairs[Math.floor(Math.random()*pairs.length)];
    var a=pts[pr[0]], b=pts[pr[1]];
    for(var k=0;k<7;k++){
      var tt=k/6, jag=(k>0&&k<6)?1:0;
      this.arr[k*3]  =a.x+(b.x-a.x)*tt+jag*(Math.random()-.5)*.09;
      this.arr[k*3+1]=a.y+(b.y-a.y)*tt+jag*(Math.random()-.5)*.09;
      this.arr[k*3+2]=a.z+(b.z-a.z)*tt+jag*(Math.random()-.5)*.09;
    }
    this.line.geometry.attributes.position.needsUpdate=true;
    this.life=.12+Math.random()*.18;
  };
  Spark.prototype.update=function(dt){
    if(this.life>0){
      this.life-=dt;
      this.mat.opacity=this.life>0?.5+Math.random()*.8:0;
      if(this.life<=0){this.mat.opacity=0;this.wait=.4+Math.random()*1.6;}
    } else { this.wait-=dt; if(this.wait<=0) this.spawn(); }
  };
  var sparks=[], SPN=isMobile?6:12;
  for(i=0;i<SPN;i++) sparks.push(new Spark());

  // --- Blaue Nerven-Glitzer: feine, langsame Impulse, die entlang der goldenen
  // Linien bzw. am Nervenstrang hoch/runter gleiten (statt zu blitzen) ---
  var BLUE=new THREE.Color(0x2fb3ff);
  function smootherstep(x){x=x<0?0:x>1?1:x;return x*x*x*(x*(x*6-15)+10);}

  function GlidePulse(kind){
    this.kind=kind; // 'golden' | 'strand'
    this.winPts=6;
    var g4=new THREE.BufferGeometry();
    this.posArr=new Float32Array(this.winPts*3);
    this.colArr=new Float32Array(this.winPts*3);
    g4.setAttribute('position',new THREE.BufferAttribute(this.posArr,3));
    g4.setAttribute('color',new THREE.BufferAttribute(this.colArr,3));
    this.mat=new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
    this.line=new THREE.Line(g4,this.mat);
    this.line.frustumCulled=false;
    brain.add(this.line);
    this.active=false;
    this.wait=2+Math.random()*5;
  }
  GlidePulse.prototype.activate=function(){
    this.dir=Math.random()<0.5?1:-1;
    this.duration=5+Math.random()*5;
    this.progress=0;
    if(this.kind==='golden'){
      this.path=walkPaths[Math.floor(Math.random()*walkPaths.length)];
    } else {
      this.fiber=sFibers[Math.floor(Math.random()*sFibers.length)];
    }
    this.active=true;
  };
  GlidePulse.prototype.sample=function(idxFloat){
    var N, gx,gy,gz;
    if(this.kind==='golden'){
      N=this.path.length;
      var i0=Math.max(0,Math.min(N-1,Math.floor(idxFloat)));
      var i1=Math.min(N-1,i0+1);
      var lt=idxFloat-i0;
      var a=this.path[i0], b=this.path[i1];
      gx=a.x+(b.x-a.x)*lt; gy=a.y+(b.y-a.y)*lt; gz=a.z+(b.z-a.z)*lt;
    } else {
      N=this.fiber.len;
      var j0=Math.max(0,Math.min(N-1,Math.floor(idxFloat)));
      var j1=Math.min(N-1,j0+1);
      var lt2=idxFloat-j0;
      var base=this.fiber.start, pa2=sBase;
      var ax=pa2[(base+j0)*3],ay=pa2[(base+j0)*3+1],az=pa2[(base+j0)*3+2];
      var bx=pa2[(base+j1)*3],by=pa2[(base+j1)*3+1],bz=pa2[(base+j1)*3+2];
      gx=ax+(bx-ax)*lt2; gy=ay+(by-ay)*lt2; gz=az+(bz-az)*lt2;
    }
    return [gx,gy,gz];
  };
  GlidePulse.prototype.update=function(dt){
    if(!this.active){
      this.wait-=dt;
      if(this.wait<=0) this.activate();
      return;
    }
    this.progress+=dt/this.duration;
    if(this.progress>=1){
      this.active=false;
      this.mat.opacity=0;
      this.wait=3+Math.random()*7;
      return;
    }
    var N=this.kind==='golden'?this.path.length:this.fiber.len;
    var headIdx=this.dir>0?this.progress*(N-1):(N-1)-this.progress*(N-1);
    var step=this.dir*1.1;
    var envelope=Math.min(1,this.progress*6,(1-this.progress)*6);
    for(var k=0;k<this.winPts;k++){
      var idxFloat=headIdx-(this.winPts-1-k)*step;
      var frac=k/(this.winPts-1);
      var alpha=smootherstep(frac)*envelope;
      var pXyz=this.sample(idxFloat);
      this.posArr[k*3]=pXyz[0]; this.posArr[k*3+1]=pXyz[1]; this.posArr[k*3+2]=pXyz[2];
      this.colArr[k*3]=BLUE.r*alpha; this.colArr[k*3+1]=BLUE.g*alpha; this.colArr[k*3+2]=BLUE.b*alpha;
    }
    this.line.geometry.attributes.position.needsUpdate=true;
    this.line.geometry.attributes.color.needsUpdate=true;
    this.mat.opacity=.85;
  };

  // --- Nervenblitze: hüpfen live über das Liniennetz (echte Graph-Kanten),
  // ein kurzer heller Kopf mit ausblassender Schweifspur, folgt zufällig ---
  function NerveBolt(parentGroup){
    this.maxTrail=10;
    this.stride=5; // Graph-Kanten pro sichtbarem Hop, macht die Bewegung über die feinen Mesh-Kanten sichtbar
    var g5=new THREE.BufferGeometry();
    this.posArr=new Float32Array(this.maxTrail*3);
    this.colArr=new Float32Array(this.maxTrail*3);
    g5.setAttribute('position',new THREE.BufferAttribute(this.posArr,3));
    g5.setAttribute('color',new THREE.BufferAttribute(this.colArr,3));
    this.mat=new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
    this.line=new THREE.Line(g5,this.mat);
    this.line.frustumCulled=false;
    parentGroup.add(this.line);
    var gh=new THREE.BufferGeometry();
    this.headArr=new Float32Array(3);
    gh.setAttribute('position',new THREE.BufferAttribute(this.headArr,3));
    this.headMat=new THREE.PointsMaterial({size:.052,map:sprite,transparent:true,opacity:0,color:0x9fe0ff,blending:THREE.AdditiveBlending,depthWrite:false});
    this.headPt=new THREE.Points(gh,this.headMat);
    this.headPt.frustumCulled=false;
    parentGroup.add(this.headPt);
    this.trail=[];
    this.alive=false;
    this.wait=Math.random()*1.2;
  }
  NerveBolt.prototype.startChain=function(){
    var s=0, tries=0;
    do{ s=Math.floor(Math.random()*graphAdj.length); tries++; }while(graphAdj[s].length===0&&tries<60);
    if(!graphAdj[s].length){ this.alive=false; this.wait=.5+Math.random()*1.5; return; }
    this.cur=s;
    this.prev=-1;
    this.trail=[pts[s]];
    this.hopsLeft=16+Math.floor(Math.random()*14);
    this.hopTimer=.05+Math.random()*.07;
    this.alive=true;
    this.headMat.opacity=.65;
  };
  NerveBolt.prototype.stepOnce=function(){
    var neigh=graphAdj[this.cur];
    if(!neigh.length) return false;
    var forward=neigh.filter(function(n){return n!==this.prev;},this);
    var pool=forward.length?forward:neigh;
    this.prev=this.cur;
    this.cur=pool[Math.floor(Math.random()*pool.length)];
    return true;
  };
  NerveBolt.prototype.update=function(dt){
    if(!this.alive){
      this.wait-=dt;
      if(this.wait<=0) this.startChain();
      return;
    }
    this.hopTimer-=dt;
    if(this.hopTimer<=0){
      if(this.hopsLeft<=0||!graphAdj[this.cur].length){
        this.alive=false;
        this.mat.opacity=0;
        this.headMat.opacity=0;
        this.wait=.8+Math.random()*2.2;
        return;
      }
      for(var s2=0;s2<this.stride;s2++){ if(!this.stepOnce()) break; }
      this.trail.push(pts[this.cur]);
      if(this.trail.length>this.maxTrail) this.trail.shift();
      this.hopsLeft--;
      this.hopTimer=.05+Math.random()*.08;
    }
    var n=this.trail.length;
    for(var k=0;k<this.maxTrail;k++){
      var srcIdx=k-(this.maxTrail-n);
      if(srcIdx<0){
        var p0=this.trail[0];
        this.posArr[k*3]=p0.x; this.posArr[k*3+1]=p0.y; this.posArr[k*3+2]=p0.z;
        this.colArr[k*3]=0; this.colArr[k*3+1]=0; this.colArr[k*3+2]=0;
      } else {
        var p=this.trail[srcIdx];
        var frac=n>1?srcIdx/(n-1):1;
        var alpha=Math.sqrt(frac);
        this.posArr[k*3]=p.x; this.posArr[k*3+1]=p.y; this.posArr[k*3+2]=p.z;
        this.colArr[k*3]=BLUE.r*alpha; this.colArr[k*3+1]=BLUE.g*alpha; this.colArr[k*3+2]=BLUE.b*alpha;
      }
    }
    this.line.geometry.attributes.position.needsUpdate=true;
    this.line.geometry.attributes.color.needsUpdate=true;
    this.mat.opacity=.62;
    var head=this.trail[this.trail.length-1];
    this.headArr[0]=head.x; this.headArr[1]=head.y; this.headArr[2]=head.z;
    this.headPt.geometry.attributes.position.needsUpdate=true;
  };
  var nerveBolts=[], NBN=isMobile?10:28;
  for(i=0;i<NBN;i++) nerveBolts.push(new NerveBolt(brain));
  var satelliteNerveBolts=[];
  satelliteBrains.forEach(function(satellite){
    for(var satelliteBoltIndex=0;satelliteBoltIndex<(isMobile?3:5);satelliteBoltIndex++) satelliteNerveBolts.push(new NerveBolt(satellite));
  });

  function BlueOrb(parentGroup){
    this.coreMat=new THREE.SpriteMaterial({map:sprite,color:0xb9ecff,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
    this.core=new THREE.Sprite(this.coreMat);
    this.haloMat=new THREE.SpriteMaterial({map:sprite,color:0x168cff,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
    this.halo=new THREE.Sprite(this.haloMat);
    var arcGeometry=new THREE.BufferGeometry();
    this.arcArr=new Float32Array(6*3);
    arcGeometry.setAttribute('position',new THREE.BufferAttribute(this.arcArr,3));
    this.arcMat=new THREE.LineBasicMaterial({color:0x8edcff,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
    this.arc=new THREE.Line(arcGeometry,this.arcMat);
    this.arc.frustumCulled=false;
    parentGroup.add(this.arc); parentGroup.add(this.halo); parentGroup.add(this.core);
    this.active=false;
    this.wait=Math.random()*1.6;
    this.life=0;
    this.baseSize=.027+Math.random()*.025;
    this.from=new THREE.Vector3();
    this.to=new THREE.Vector3();
    this.position=new THREE.Vector3();
  }
  BlueOrb.prototype.activate=function(){
    var start=0, tries=0;
    do { start=Math.floor(Math.random()*graphAdj.length); tries++; } while((!graphAdj[start].length||pts[start].y<-.25)&&tries<80);
    if(!graphAdj[start].length){ this.wait=.4+Math.random(); return; }
    this.cur=start;
    this.prev=-1;
    this.hopsLeft=5+Math.floor(Math.random()*8);
    this.life=.85+Math.random()*1.25;
    this.elapsed=0;
    this.advanceEdge();
    this.active=true;
  };
  BlueOrb.prototype.advanceEdge=function(){
    var neighbors=graphAdj[this.cur];
    if(!neighbors.length){ this.hopsLeft=0; return; }
    var forward=neighbors.filter(function(nodeIndex){ return nodeIndex!==this.prev; },this);
    var options=forward.length?forward:neighbors;
    var next=options[Math.floor(Math.random()*options.length)];
    this.prev=this.cur;
    this.cur=next;
    this.from.copy(pts[this.prev]);
    this.to.copy(pts[this.cur]);
    this.edgeProgress=0;
    this.edgeDuration=.1+Math.random()*.14;
  };
  BlueOrb.prototype.update=function(dt){
    if(!this.active){
      this.wait-=dt;
      if(this.wait<=0) this.activate();
      return;
    }
    this.elapsed+=dt;
    var progress=this.elapsed/this.life;
    if(progress>=1){
      this.active=false;
      this.coreMat.opacity=0;
      this.haloMat.opacity=0;
      this.arcMat.opacity=0;
      this.wait=.28+Math.random()*1.35;
      return;
    }
    this.edgeProgress+=dt/this.edgeDuration;
    if(this.edgeProgress>=1){
      this.hopsLeft--;
      if(this.hopsLeft<=0){
        this.elapsed=this.life;
        this.edgeProgress=1;
      } else this.advanceEdge();
    }
    var envelope=Math.sin(progress*Math.PI);
    this.position.copy(this.from).lerp(this.to,Math.min(1,this.edgeProgress));
    this.core.position.copy(this.position);
    this.halo.position.copy(this.core.position);
    var coreScale=this.baseSize*(.7+envelope*1.35);
    var haloScale=coreScale*(3.1+envelope*1.9);
    this.core.scale.set(coreScale,coreScale,1);
    this.halo.scale.set(haloScale,haloScale,1);
    this.coreMat.opacity=.55*envelope;
    this.haloMat.opacity=.11*envelope;
    var directionX=this.to.x-this.from.x, directionY=this.to.y-this.from.y, directionZ=this.to.z-this.from.z;
    var directionLength=Math.sqrt(directionX*directionX+directionY*directionY+directionZ*directionZ)||1;
    directionX/=directionLength; directionY/=directionLength; directionZ/=directionLength;
    for(var arcIndex=0;arcIndex<6;arcIndex++){
      var arcStep=arcIndex/5;
      var trailDistance=arcStep*.15;
      var flickerAmount=arcIndex===0?0:.011*(1-arcStep)*envelope;
      var flickerPhase=this.elapsed*58+arcIndex*4.37;
      this.arcArr[arcIndex*3]=this.position.x-directionX*trailDistance+Math.sin(flickerPhase)*flickerAmount;
      this.arcArr[arcIndex*3+1]=this.position.y-directionY*trailDistance+Math.cos(flickerPhase*1.23)*flickerAmount;
      this.arcArr[arcIndex*3+2]=this.position.z-directionZ*trailDistance+Math.sin(flickerPhase*.81+1.5)*flickerAmount;
    }
    this.arc.geometry.attributes.position.needsUpdate=true;
    this.arcMat.opacity=(.18+.38*Math.abs(Math.sin(this.elapsed*37)))*envelope;
  };
  var blueOrbs=[], BON=isMobile?5:12;
  for(i=0;i<BON;i++) blueOrbs.push(new BlueOrb(brain));
  var satelliteBlueOrbs=[];
  satelliteBrains.forEach(function(satellite){
    for(var satelliteOrbIndex=0;satelliteOrbIndex<(isMobile?1:2);satelliteOrbIndex++) satelliteBlueOrbs.push(new BlueOrb(satellite));
  });

  // --- Tuning-Panel: Regler für die Nervenstrang-Parameter, nur mit ?tune=1
  // in der URL sichtbar. Werte lassen sich live anpassen und als Code-
  // Snippet kopieren, um sie mir zu schicken. ---
  var tunePanel=null;
  if (typeof window!=='undefined' && new URLSearchParams(window.location.search).get('tune')==='1') {
    function sectionLabel(text){
      var s=document.createElement('div');
      s.textContent=text;
      s.style.cssText='margin:12px 0 7px;color:#ffcf4a;font-weight:bold;letter-spacing:.08em;text-transform:uppercase;';
      tunePanel.appendChild(s);
    }
    function addSlider(def,target,shouldRebuild){
      var key=def[0], label=def[1], min=def[2], max=def[3], step=def[4];
      var row=document.createElement('div'); row.style.cssText='margin-bottom:6px;';
      var lab=document.createElement('div');
      lab.style.cssText='display:flex;justify-content:space-between;margin-bottom:2px;';
      var labName=document.createElement('span'); labName.textContent=label;
      var labVal=document.createElement('span'); labVal.textContent=String(target[key]);
      lab.appendChild(labName); lab.appendChild(labVal);
      var input=document.createElement('input');
      input.type='range'; input.min=String(min); input.max=String(max); input.step=String(step);
      input.value=String(target[key]); input.style.cssText='width:100%;accent-color:#ffb000;';
      input.oninput=function(){
        target[key]=parseFloat(input.value);
        labVal.textContent=target[key].toFixed(step>=1?0:3);
        if(shouldRebuild!==false) rebuildStrand();
      };
      row.appendChild(lab); row.appendChild(input);
      tunePanel.appendChild(row);
    }
    var SLIDERS=[
      ['length','Länge',2,15,0.05],
      ['rStr','Wirbel-Radius',0,0.08,0.002],
      ['gather','Wirbel-Einsetzpunkt',0.02,0.9,0.01],
      ['taper','Bündel-Verjüngung',0,0.6,0.01],
      ['curve','Schwung',0,0.15,0.005],
      ['twist','Verdrehung',0,10,0.1],
      ['jitter','Zittern',0,0.03,0.001],
      ['rungs','Quersprossen',0,1,0.02],
      ['spacing','Punktabstand',0.015,0.06,0.001],
      ['ptSize','Punktgröße',0.004,0.03,0.001],
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
    tunePanel=document.createElement('div');
    tunePanel.style.cssText='position:fixed;top:80px;right:10px;z-index:99999;'
      +'background:rgba(10,10,10,.88);color:#fff;font:11px/1.4 monospace;padding:12px;border-radius:8px;'
      +'max-height:80vh;overflow:auto;width:230px;box-shadow:0 4px 20px rgba(0,0,0,.5);';
    var title=document.createElement('div');
    title.textContent='☰ Nervenstrang-Tuning';
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
      function onUp(){ dragging=false; }
      handle.addEventListener('mousedown',function(e){ e.preventDefault(); onDown(e.clientX,e.clientY); });
      window.addEventListener('mousemove',function(e){ if(dragging) onMove(e.clientX,e.clientY); });
      window.addEventListener('mouseup',onUp);
      handle.addEventListener('touchstart',function(e){ var t=e.touches[0]; onDown(t.clientX,t.clientY); },{passive:true});
      window.addEventListener('touchmove',function(e){ if(dragging){ var t=e.touches[0]; onMove(t.clientX,t.clientY); } },{passive:true});
      window.addEventListener('touchend',onUp);
    })(title,tunePanel);
    sectionLabel('Gesamtposition');
    MOVE_SLIDERS.forEach(function(def){ addSlider(def,MP); });
    sectionLabel('Trichter (Gehirn-Anbindung)');
    FUNNEL_SLIDERS.forEach(function(def){ addSlider(def,FN); });
    sectionLabel('Luftzug & Wellen');
    WIND_SLIDERS.forEach(function(def){ addSlider(def,WIND,false); });
    sectionLabel('Hauptstrang');
    SLIDERS.forEach(function(def){ addSlider(def,SP); });
    var copyBtn=document.createElement('button');
    copyBtn.textContent='Werte kopieren';
    copyBtn.style.cssText='margin-top:8px;width:100%;padding:6px;background:#ffb000;color:#000;'
      +'border:none;border-radius:5px;font-weight:bold;cursor:pointer;';
    var out=document.createElement('textarea');
    out.style.cssText='width:100%;height:110px;margin-top:6px;font:10px/1.3 monospace;background:#111;color:#0f0;'
      +'border:1px solid #444;border-radius:4px;padding:4px;';
    copyBtn.onclick=function(){
      var snippet='SP={ length:'+SP.length+', rStr:'+SP.rStr+', gather:'+SP.gather
        +', taper:'+SP.taper+', curve:'+SP.curve+', twist:'+SP.twist+', jitter:'+SP.jitter
        +', rungs:'+SP.rungs+', ptSize:'+SP.ptSize+', spacing:'+SP.spacing
        +', ringSpread:'+SP.ringSpread+', offX:'+SP.offX+', offY:'+SP.offY+', offZ:'+SP.offZ
        +', droop:'+SP.droop+', frayStart:'+SP.frayStart+', fraySpread:'+SP.fraySpread+' }\\n'
        +'FN={ count:'+FN.count+', anchorRadius:'+FN.anchorRadius+', funnelHeight:'+FN.funnelHeight
        +', funnelSegs:'+FN.funnelSegs+', convergePull:'+FN.convergePull+', randomness:'+FN.randomness+' }\\n'
        +'MP={ moveLeft:'+MP.moveLeft+', moveRight:'+MP.moveRight+', moveForward:'+MP.moveForward
        +', moveBack:'+MP.moveBack+', moveVertical:'+MP.moveVertical+' }\\n'
        +'WIND={ sway:'+WIND.sway+', speed:'+WIND.speed+', wave:'+WIND.wave+', waveFrequency:'+WIND.waveFrequency+' }\\n'
        +'stumpCenter=['+SBASE_X+','+SBASE_Y+','+SBASE_Z+']';
      out.value=snippet;
      out.select();
      if(navigator.clipboard) navigator.clipboard.writeText(snippet).catch(function(){});
    };
    tunePanel.appendChild(copyBtn);
    tunePanel.appendChild(out);
    document.body.appendChild(tunePanel);
  }

  var goldenPulses=[], strandPulses=[];
  var GPN=isMobile?2:4, SPULN=isMobile?2:3;
  for(i=0;i<GPN;i++) goldenPulses.push(new GlidePulse('golden'));
  if(STRAND_ON&&sFibers.length) for(i=0;i<SPULN;i++) strandPulses.push(new GlidePulse('strand'));

    var mouseX = 0, mouseY = 0;
    const onMouse = (e) => { mouseX = (e.clientX / innerWidth - 0.5) * 2; mouseY = (e.clientY / innerHeight - 0.5) * 2; };
    const resize = () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); };
    var scrollP = 0, targetScrollP = 0;
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
    window.addEventListener('resize', resize);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);
    resize(); onScroll();
    renderer.render(scene, camera);

    var t = 0, last = 0, rafId = 0, lastWobbleUpdate = 0, lastSatelliteStrandUpdate = 0;
    function tick(now) {
      rafId = requestAnimationFrame(tick);
      if (!documentVisible) return;
      var dt = Math.min((now - last) / 1000 || 0.016, 0.05); last = now;
      if (SCENE_MOTION || OBJECT_FLOATING) t += dt;
      var brainSway=Math.sin(t*.08)*Math.PI/6;
      brain.rotation.y = BASE_Y+brainSway;
      brain.rotation.x = BASE_X+Math.sin(t*.23)*.012;
      brain.rotation.z = Math.cos(t*.19+1.1)*.014;
      stumpCenterOffset.copy(stumpCenterLocal).applyEuler(brain.rotation).multiplyScalar(brain.scale.x);
      brain.position.x = -stumpCenterOffset.x;
      brain.position.z = -stumpCenterOffset.z;
      brain.position.y = BRAIN_BASE_Y+Math.sin(t*.38)*.11;
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
        satelliteBrain.rotation.y=satelliteData.baseRotY+brainSway;
        satelliteBrain.rotation.z=Math.sin(satelliteTime*.92+1.2)*.022;
      }
      if(now-lastSatelliteStrandUpdate>48){
        lastSatelliteStrandUpdate=now;
        brain.updateWorldMatrix(true,false);
        for(var secondarySatelliteIndex=0;secondarySatelliteIndex<satelliteBrains.length;secondarySatelliteIndex++) satelliteBrains[secondarySatelliteIndex].updateWorldMatrix(true,false);
        updateSecondaryEnergySystem(t);
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
        for (var si = 0; si < sparks.length; si++) sparks[si].update(dt);
        if (vc > 0 && now - lastWobbleUpdate > 32) {
          lastWobbleUpdate = now;
          var linePosArr = linesObj.geometry.attributes.position.array;
          var ptsPosArr = wptsObj.geometry.attributes.position.array;
          var airSwayX=Math.sin(t*WIND.speed)*WIND.sway*.65+Math.sin(t*WIND.speed*.43+1.2)*WIND.sway*.35;
          var airSwayZ=Math.cos(t*WIND.speed*.84)*WIND.sway*.52+Math.sin(t*WIND.speed*.51+.7)*WIND.sway*.3;
          for (var v = 0; v < vc; v++) {
            var tv = sMeta[v * 2], ph = sMeta[v * 2 + 1];
            wobbleX[v] = Math.sin(t*WIND.speed*2.95+tv*WIND.waveFrequency+ph)*WIND.wave*tv*tv+airSwayX*tv;
            wobbleZ[v] = Math.cos(t*WIND.speed*2.43+tv*WIND.waveFrequency*.78+ph)*WIND.wave*.82*tv*tv+airSwayZ*tv;
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
        for (var gi = 0; gi < goldenPulses.length; gi++) goldenPulses[gi].update(dt);
        for (var pi = 0; pi < strandPulses.length; pi++) strandPulses[pi].update(dt);
      }
      if (NEURAL_ACTIVITY) {
        for (var neuralIndex = 0; neuralIndex < nerveBolts.length; neuralIndex++) {
          nerveBolts[neuralIndex].update(dt);
        }
        for (var satelliteNeuralIndex = 0; satelliteNeuralIndex < satelliteNerveBolts.length; satelliteNeuralIndex++) {
          satelliteNerveBolts[satelliteNeuralIndex].update(dt);
        }
        for (var orbIndex = 0; orbIndex < blueOrbs.length; orbIndex++) {
          blueOrbs[orbIndex].update(dt);
        }
        for (var satelliteOrbUpdateIndex = 0; satelliteOrbUpdateIndex < satelliteBlueOrbs.length; satelliteOrbUpdateIndex++) {
          satelliteBlueOrbs[satelliteOrbUpdateIndex].update(dt);
        }
      }
      nodesP.material.opacity = .95;
      var railSlowdown=cameraRailSlowdown(scrollP);
      var cameraInertia=1-Math.exp(-dt*7.2*railSlowdown);
      scrollP+=(targetScrollP-scrollP)*cameraInertia;
      if(Math.abs(targetScrollP-scrollP)<.00008) scrollP=targetScrollP;
      var sf = scrollP;
      var orbit=sf*Math.PI*2;
      var lookY=cameraTargetStart-sf*cameraTravel;
      var cameraY=lookY+.24;
      var cameraRadius=8.78
        +Math.sin(sf*Math.PI*2*3.15+.6)*.46
        +Math.sin(sf*Math.PI*2*6.4+1.7)*.22;
      var targetFov=53+Math.sin(sf*Math.PI*2*2.15+.45)*1.65;
      if(Math.abs(targetFov-lastCameraFov)>.015){
        camera.fov=targetFov;
        camera.updateProjectionMatrix();
        lastCameraFov=targetFov;
      }
      world.rotation.y = 0;
      world.position.y = 0;
      camera.position.set(Math.sin(orbit)*cameraRadius, cameraY, Math.cos(orbit)*cameraRadius);
      camera.lookAt(0, lookY, 0);
      renderer.render(scene, camera);
    }
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      renderer.dispose();
      renderer.forceContextLoss();
      if (tunePanel && tunePanel.parentNode) tunePanel.parentNode.removeChild(tunePanel);
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
