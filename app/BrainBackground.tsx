'use client';
// @ts-nocheck
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import brainData from './brainData.json';

export default function BrainBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var isMobile = innerWidth < 700;
    var renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.15 : 2));
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
  var brain=new THREE.Group(); brain.position.y=1.38; brain.scale.setScalar(2.73); world.add(brain);
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
  var roots=[];
  for(var ri=0;ri<BR.stumpRing.length;ri+=3){
    roots.push(new THREE.Vector3(BR.stumpRing[ri],BR.stumpRing[ri+1],BR.stumpRing[ri+2]));
  }
  var SP={ fibers:120, length:8.75, rStr:0.026, gather:0.22, taper:0.24,
           curve:0.018, twist:1.65, jitter:0.01, rungs:0.62, ptSize:0.021, spacing:0.045,
           ringSpread:1, offX:0, offY:0, offZ:0,
           topBend:0, topBendExtent:0.08, topFunnel:0.78, topFunnelExtent:0.46 };
  function rnd(){return Math.random();}
  function smooth(x){x=x<0?0:x>1?1:x;return x*x*(3-2*x);}
  function stumpAnchor(rawRoot, liftMax){
    var radial=Math.sqrt(rnd())*0.88;
    var angle=rnd()*6.283;
    var ringDx=rawRoot.x-SBASE_X, ringDz=rawRoot.z-SBASE_Z;
    var ringR=Math.max(0.001,Math.sqrt(ringDx*ringDx+ringDz*ringDz));
    var sideJitter=ringR*0.16*rnd();
    return new THREE.Vector3(
      SBASE_X+ringDx*radial+Math.cos(angle)*sideJitter,
      rawRoot.y+rnd()*liftMax,
      SBASE_Z+ringDz*radial+Math.sin(angle)*sideJitter
    );
  }
  var STRAND_ON = !(typeof window!=='undefined' && new URLSearchParams(window.location.search).get('nostrand')==='1');
  var HAIR_COUNT=isMobile?36:64, HAIR_SEGS=40;
  var sBase=[], sMeta=[], sFibers=[], vc=0;
  var wobbleLineRefs=[], wobblePtsRefs=[];
  function genStrandInto(outPos,outCol,outPtsPos,outPtsCol){
    sBase=[]; sMeta=[]; sFibers=[]; vc=0; wobbleLineRefs=[]; wobblePtsRefs=[];
    var N=Math.max(20,Math.round(SP.length/SP.spacing));
    for(var cr=0;cr<roots.length;cr++){
      var rr=roots[cr], rn=roots[(cr+1)%roots.length]||rr;
      cc.copy(golds[cr%golds.length]);
      outPos.push(rr.x,rr.y,rr.z,rn.x,rn.y,rn.z);
      outCol.push(cc.r,cc.g,cc.b,cc.r,cc.g,cc.b);
      var sx=SBASE_X+(rr.x-SBASE_X)*0.42;
      var sz=SBASE_Z+(rr.z-SBASE_Z)*0.42;
      var sy=rr.y-0.18;
      outPos.push(rr.x,rr.y,rr.z,sx,sy,sz);
      outCol.push(cc.r,cc.g,cc.b,cc.r,cc.g,cc.b);
      outPtsPos.push(rr.x,rr.y,rr.z,sx,sy,sz);
      outPtsCol.push(cc.r,cc.g,cc.b,cc.r,cc.g,cc.b);
    }
    for(var ca=0;ca<Math.min(SP.fibers, roots.length*3);ca++){
      var ringRoot=roots.length?roots[ca%roots.length]:new THREE.Vector3(SBASE_X,-0.6,SBASE_Z);
      var inner=stumpAnchor(ringRoot,0.32);
      var lower=new THREE.Vector3(
        SBASE_X+(inner.x-SBASE_X)*0.62,
        ringRoot.y-0.18-rnd()*0.18,
        SBASE_Z+(inner.z-SBASE_Z)*0.62
      );
      cc.copy(golds[ca%golds.length]);
      outPos.push(inner.x,inner.y,inner.z,lower.x,lower.y,lower.z);
      outCol.push(cc.r,cc.g,cc.b,cc.r,cc.g,cc.b);
      outPtsPos.push(inner.x,inner.y,inner.z,lower.x,lower.y,lower.z);
      outPtsCol.push(cc.r,cc.g,cc.b,cc.r,cc.g,cc.b);
    }
    var rootOrder=roots.map(function(_,ix){return ix;});
    for(var sh=rootOrder.length-1;sh>0;sh--){ var jx=Math.floor(rnd()*(sh+1)); var tmp=rootOrder[sh]; rootOrder[sh]=rootOrder[jx]; rootOrder[jx]=tmp; }
    for(var f=0;f<SP.fibers;f++){
      // cycle evenly through every point on the stump ring (shuffled per build)
      // instead of random picks, so fibers spread all the way around it
      var rawRoot=roots.length?roots[rootOrder[f%rootOrder.length]]:new THREE.Vector3(SBASE_X,-0.6,SBASE_Z);
      var root=stumpAnchor(rawRoot,0.34);
      var relX=root.x-SBASE_X-SP.offX, relZ=root.z-SBASE_Z-SP.offZ;
      var a0=rnd()*6.283, tw=(rnd()-0.5)*SP.twist;
      var endF=(f%4)?0.9+0.1*rnd():0.6+0.3*rnd();
      var steps=Math.round(N*endF), base=vc;
      sFibers.push({start:base, len:steps});
      var fiberCol=golds[Math.floor(rnd()*golds.length)];
      for(var r=0;r<steps;r++){
        var tv=r/N;
        var ang=a0+tv*tw;
        var bundleScale=1-SP.taper*tv;
        var swirl=SP.rStr*smooth(Math.min(1,tv/Math.max(SP.gather,.001)));
        var gatherEnv=smooth(Math.min(1,tv/Math.max(SP.topFunnelExtent,.001)));
        var relScale=(1-SP.topFunnel*gatherEnv)*bundleScale;
        var bendEnv=1-smooth(Math.min(1,tv/Math.max(SP.topBendExtent,.001)));
        var cx=SBASE_X+SP.offX+relX*relScale+SP.curve*Math.sin(tv*2.1)+Math.cos(ang)*swirl+SP.topBend*bendEnv;
        var cz=SBASE_Z+SP.offZ+relZ*relScale+0.7*SP.curve*Math.sin(tv*1.6+1.0)+Math.sin(ang)*swirl;
        var cy=root.y - r*SP.spacing;
        var px=cx+(rnd()-0.5)*SP.jitter, py=cy+(rnd()-0.5)*SP.jitter, pz=cz+(rnd()-0.5)*SP.jitter;
        var v=vc;
        sBase.push(px,py,pz);
        sMeta.push(tv,a0);
        cc.copy(fiberCol);
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
    // Haar-ähnliche Faserstruktur um den Stumpf: viele einzelne, sanft
    // wellenförmige Stränge, statisch (ohne Wobble-Animation).
    for(var h=0;h<HAIR_COUNT;h++){
      var rawRootH=roots.length?roots[h%roots.length]:new THREE.Vector3(SBASE_X,-0.6,SBASE_Z);
      var rootH=stumpAnchor(rawRootH,0.26);
      var relXH=rootH.x-SBASE_X-SP.offX, relZH=rootH.z-SBASE_Z-SP.offZ;
      var freq1=0.7+rnd()*1.1, freq2=2.2+rnd()*2.2;
      var amp1=0.03+rnd()*0.045, amp2=0.008+rnd()*0.016;
      var ph1=rnd()*6.283, ph2=rnd()*6.283;
      var hairLen=SP.length*(0.65+0.35*rnd());
      cc.copy(golds[Math.floor(rnd()*golds.length)]);
      var prevX=0,prevY=0,prevZ=0;
      for(var s=0;s<=HAIR_SEGS;s++){
        var tvh=s/HAIR_SEGS;
        var bundleScaleH=1-SP.taper*tvh;
        var wx=Math.sin(tvh*freq1*Math.PI+ph1)*amp1+Math.sin(tvh*freq2*Math.PI+ph2)*amp2;
        var wz=Math.cos(tvh*freq1*Math.PI+ph1*1.3)*amp1*0.7+Math.cos(tvh*freq2*Math.PI+ph2)*amp2*0.7;
        var cxh=SBASE_X+SP.offX+relXH*bundleScaleH+wx;
        var czh=SBASE_Z+SP.offZ+relZH*bundleScaleH+wz;
        var cyh=rootH.y-tvh*hairLen;
        var b=.55+.45*(0.5+0.5*Math.sin(tvh*freq1*Math.PI+ph1));
        if(s>0){
          outPos.push(prevX,prevY,prevZ,cxh,cyh,czh);
          outCol.push(cc.r*b,cc.g*b,cc.b*b,cc.r*b,cc.g*b,cc.b*b);
        }
        prevX=cxh; prevY=cyh; prevZ=czh;
      }
    }
  }

  var baseLinePos=lpos.slice(), baseLineCol=lcol.slice();
  var baseWPos=wpos.slice(), baseWCol=wcol.slice();
  if(STRAND_ON) genStrandInto(lpos,lcol,wpos,wcol);

  var lgeo=new THREE.BufferGeometry();
  lgeo.setAttribute('position',new THREE.Float32BufferAttribute(lpos,3));
  lgeo.setAttribute('color',new THREE.Float32BufferAttribute(lcol,3));
  var linesObj=new THREE.LineSegments(lgeo,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.52,blending:THREE.NormalBlending,depthWrite:false}));
  brain.add(dbgHide('walks',linesObj));
  var wptsObj=pointsObj(wpos,wcol,.044,.6);
  brain.add(dbgHide('wpts',wptsObj));

  function rebuildStrand(){
    var newLPos=baseLinePos.slice(), newLCol=baseLineCol.slice();
    var newWPos=baseWPos.slice(), newWCol=baseWCol.slice();
    if(STRAND_ON) genStrandInto(newLPos,newLCol,newWPos,newWCol);
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
  function NerveBolt(){
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
    brain.add(this.line);
    var gh=new THREE.BufferGeometry();
    this.headArr=new Float32Array(3);
    gh.setAttribute('position',new THREE.BufferAttribute(this.headArr,3));
    this.headMat=new THREE.PointsMaterial({size:.16,map:sprite,transparent:true,opacity:0,color:0x9fe0ff,blending:THREE.AdditiveBlending,depthWrite:false});
    this.headPt=new THREE.Points(gh,this.headMat);
    this.headPt.frustumCulled=false;
    brain.add(this.headPt);
    this.trail=[];
    this.alive=false;
    this.wait=Math.random()*2;
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
    this.headMat.opacity=1;
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
    this.mat.opacity=1;
    var head=this.trail[this.trail.length-1];
    this.headArr[0]=head.x; this.headArr[1]=head.y; this.headArr[2]=head.z;
    this.headPt.geometry.attributes.position.needsUpdate=true;
  };
  var nerveBolts=[], NBN=isMobile?12:26;
  for(i=0;i<NBN;i++) nerveBolts.push(new NerveBolt());

  // --- Tuning-Panel: Regler für die Nervenstrang-Parameter, nur mit ?tune=1
  // in der URL sichtbar. Werte lassen sich live anpassen und als Code-
  // Snippet kopieren, um sie mir zu schicken. ---
  var tunePanel=null;
  if (typeof window!=='undefined' && new URLSearchParams(window.location.search).get('tune')==='1') {
    var SLIDERS=[
      ['fibers','Fasern',10,150,1],
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
      ['offX','Versatz X',-0.3,0.3,0.005],
      ['offY','Versatz Y',-0.3,0.3,0.005],
      ['offZ','Versatz Z',-0.3,0.3,0.005],
      ['topBend','Neigung oben',-0.4,0.4,0.005],
      ['topBendExtent','Neigung Reichweite',0.02,0.6,0.01],
      ['topFunnel','Trichterform oben',-0.9,3,0.02],
      ['topFunnelExtent','Trichter Reichweite',0.02,0.5,0.01]
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
    SLIDERS.forEach(function(def){
      var key=def[0], label=def[1], min=def[2], max=def[3], step=def[4];
      var row=document.createElement('div'); row.style.cssText='margin-bottom:6px;';
      var lab=document.createElement('div');
      lab.style.cssText='display:flex;justify-content:space-between;margin-bottom:2px;';
      var labName=document.createElement('span'); labName.textContent=label;
      var labVal=document.createElement('span'); labVal.textContent=String(SP[key]);
      lab.appendChild(labName); lab.appendChild(labVal);
      var input=document.createElement('input');
      input.type='range'; input.min=String(min); input.max=String(max); input.step=String(step);
      input.value=String(SP[key]); input.style.cssText='width:100%;';
      input.oninput=function(){
        SP[key]=parseFloat(input.value);
        labVal.textContent=SP[key].toFixed(3);
        rebuildStrand();
      };
      row.appendChild(lab); row.appendChild(input);
      tunePanel.appendChild(row);
    });
    var copyBtn=document.createElement('button');
    copyBtn.textContent='Werte kopieren';
    copyBtn.style.cssText='margin-top:8px;width:100%;padding:6px;background:#ffb000;color:#000;'
      +'border:none;border-radius:5px;font-weight:bold;cursor:pointer;';
    var out=document.createElement('textarea');
    out.style.cssText='width:100%;height:110px;margin-top:6px;font:10px/1.3 monospace;background:#111;color:#0f0;'
      +'border:1px solid #444;border-radius:4px;padding:4px;';
    copyBtn.onclick=function(){
      var snippet='{ fibers:'+SP.fibers+', length:'+SP.length+', rStr:'+SP.rStr+', gather:'+SP.gather
        +', taper:'+SP.taper+', curve:'+SP.curve+', twist:'+SP.twist+', jitter:'+SP.jitter
        +', rungs:'+SP.rungs+', ptSize:'+SP.ptSize+', spacing:'+SP.spacing
        +', ringSpread:'+SP.ringSpread+', offX:'+SP.offX+', offY:'+SP.offY+', offZ:'+SP.offZ
        +', topBend:'+SP.topBend+', topBendExtent:'+SP.topBendExtent
        +', topFunnel:'+SP.topFunnel+', topFunnelExtent:'+SP.topFunnelExtent+' }';
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

  var d1=[], d2b=[];
  for(i=0;i<(isMobile?70:170);i++) d1.push((Math.random()-.5)*14, 4-Math.random()*22, -3+Math.random()*5);
  for(i=0;i<(isMobile?45:115);i++)  d2b.push((Math.random()-.5)*16, 4-Math.random()*22, -4+Math.random()*5);
  world.add(pointsObj(d1,null,.32,.2));
  world.add(pointsObj(d2b,null,.78,.13));

    var mouseX = 0, mouseY = 0;
    const onMouse = (e) => { mouseX = (e.clientX / innerWidth - 0.5) * 2; mouseY = (e.clientY / innerHeight - 0.5) * 2; };
    const resize = () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); };
    var scrollP = 0;
    const onScroll = () => { var max = document.documentElement.scrollHeight - innerHeight; scrollP = max > 0 ? scrollY / max : 0; };
    window.addEventListener('mousemove', onMouse);
    window.addEventListener('resize', resize);
    window.addEventListener('scroll', onScroll, { passive: true });
    resize(); onScroll();
    renderer.render(scene, camera);

    var t = 0, DROP = 20, last = 0, rafId = 0;
    function tick(now) {
      rafId = requestAnimationFrame(tick);
      var dt = Math.min((now - last) / 1000 || 0.016, 0.05); last = now;
      if (!reduced) {
        t += dt;
        for (var si = 0; si < sparks.length; si++) sparks[si].update(dt);
        if (vc > 0) {
          var linePosArr = linesObj.geometry.attributes.position.array;
          var ptsPosArr = wptsObj.geometry.attributes.position.array;
          var wobX = new Float32Array(vc), wobZ = new Float32Array(vc);
          for (var v = 0; v < vc; v++) {
            var tv = sMeta[v * 2], ph = sMeta[v * 2 + 1];
            wobX[v] = Math.sin(t * 1.1 + tv * 9 + ph) * 0.06 * tv * tv;
            wobZ[v] = Math.cos(t * 0.9 + tv * 7 + ph) * 0.05 * tv * tv;
          }
          for (var wr = 0; wr < wobbleLineRefs.length; wr++) {
            var refL = wobbleLineRefs[wr], svL = refL.srcV, oL = refL.off;
            linePosArr[oL]     = sBase[svL * 3]     + wobX[svL];
            linePosArr[oL + 2] = sBase[svL * 3 + 2] + wobZ[svL];
          }
          linesObj.geometry.attributes.position.needsUpdate = true;
          for (var wp = 0; wp < wobblePtsRefs.length; wp++) {
            var refP = wobblePtsRefs[wp], svP = refP.srcV, oP = refP.off;
            ptsPosArr[oP]     = sBase[svP * 3]     + wobX[svP];
            ptsPosArr[oP + 2] = sBase[svP * 3 + 2] + wobZ[svP];
          }
          wptsObj.geometry.attributes.position.needsUpdate = true;
        }
        for (var gi = 0; gi < goldenPulses.length; gi++) goldenPulses[gi].update(dt);
        for (var pi = 0; pi < strandPulses.length; pi++) strandPulses[pi].update(dt);
        for (var ni = 0; ni < nerveBolts.length; ni++) nerveBolts[ni].update(dt);
      }
      var rotTarget = BASE_Y + mouseX * 0.5 + Math.sin(t * 0.15) * 0.07;
      brain.rotation.y += (rotTarget - brain.rotation.y) * 0.05;
      brain.rotation.x += ((BASE_X + mouseY * 0.2) - brain.rotation.x) * 0.05;
      brain.position.y = 1.38 + Math.sin(t * 0.8) * 0.08;
      nodesP.material.opacity = 0.95 + 0.2 * Math.sin(t * 2.6) + 0.08 * Math.sin(t * 13);
      var sf = scrollP;
      world.rotation.y = sf * Math.PI * 2;
      world.position.y = sf * DROP;
      camera.position.x += ((mouseX * 0.3) - camera.position.x) * 0.05;
      renderer.render(scene, camera);
    }
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
      renderer.dispose();
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
