import fs from 'node:fs';

const sourcePath=process.argv[2];
const outputPath=process.argv[3];
if(!sourcePath||!outputPath){
  throw new Error('Usage: node scripts/extract-ocean-wave-animation.mjs source.glb output.json');
}

const glb=fs.readFileSync(sourcePath);
if(glb.toString('ascii',0,4)!=='glTF') throw new Error('Not a GLB file');
const jsonLength=glb.readUInt32LE(12);
const json=JSON.parse(glb.toString('utf8',20,20+jsonLength).replace(/\0+$/,''));
const binaryHeaderOffset=20+jsonLength;
const binaryLength=glb.readUInt32LE(binaryHeaderOffset);
const binaryOffset=binaryHeaderOffset+8;
const binary=glb.subarray(binaryOffset,binaryOffset+binaryLength);

function accessorValues(index){
  const accessor=json.accessors[index];
  const view=json.bufferViews[accessor.bufferView];
  if(accessor.componentType!==5126) throw new Error(`Accessor ${index} is not FLOAT`);
  const components={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16}[accessor.type];
  const stride=view.byteStride||components*4;
  const start=(view.byteOffset||0)+(accessor.byteOffset||0);
  const values=new Float32Array(accessor.count*components);
  for(let row=0;row<accessor.count;row++){
    for(let component=0;component<components;component++){
      values[row*components+component]=binary.readFloatLE(start+row*stride+component*4);
    }
  }
  return {values,count:accessor.count,components};
}

const clip=json.animations[0];
const translationChannels=clip.channels
  .map(channel=>({channel,sampler:clip.samplers[channel.sampler]}))
  .filter(entry=>entry.channel.target.path==='translation')
  .map(entry=>{
    const times=accessorValues(entry.sampler.input);
    const output=accessorValues(entry.sampler.output);
    return {
      node:entry.channel.target.node,
      name:json.nodes[entry.channel.target.node]?.name||`node-${entry.channel.target.node}`,
      times:times.values,
      values:output.values
    };
  })
  // Nur die eigentlichen Wasser-Steuerknochen übernehmen. Rettungsinsel,
  // Flasche und Boot besitzen eigene Bewegungen, würden aber als vermeintliche
  // Wellenpunkte unnatürliche tiefe Löcher in die Partikeloberfläche ziehen.
  .filter(channel=>/^(control_wave|wave[-_]|Wave_)/.test(channel.name));

const rotationByNode=new Map(
  clip.channels
    .map(channel=>({channel,sampler:clip.samplers[channel.sampler]}))
    .filter(entry=>entry.channel.target.path==='rotation')
    .map(entry=>[
      entry.channel.target.node,
      {
        times:accessorValues(entry.sampler.input).values,
        values:accessorValues(entry.sampler.output).values
      }
    ])
);

const duration=Math.max(...translationChannels.map(channel=>channel.times[channel.times.length-1]));
const fps=12;
const frameCount=Math.floor(duration*fps)+1;

function sample(channel,time,out,components){
  const times=channel.times;
  let low=0;
  let high=times.length-1;
  while(low+1<high){
    const middle=(low+high)>>1;
    if(times[middle]<=time) low=middle;
    else high=middle;
  }
  const startTime=times[low];
  const endTime=times[Math.min(high,times.length-1)];
  const blend=endTime>startTime?(time-startTime)/(endTime-startTime):0;
  const start=low*components;
  const end=Math.min(high,times.length-1)*components;
  for(let component=0;component<components;component++){
    out[component]=channel.values[start+component]
      +(channel.values[end+component]-channel.values[start+component])*blend;
  }
  if(components===4){
    const length=Math.hypot(out[0],out[1],out[2],out[3])||1;
    for(let component=0;component<4;component++) out[component]/=length;
  }
}

function relativeQuaternion(current,base,out){
  const ax=current[0], ay=current[1], az=current[2], aw=current[3];
  const bx=-base[0], by=-base[1], bz=-base[2], bw=base[3];
  out[0]=aw*bx+ax*bw+ay*bz-az*by;
  out[1]=aw*by-ax*bz+ay*bw+az*bx;
  out[2]=aw*bz+ax*by-ay*bx+az*bw;
  out[3]=aw*bw-ax*bx-ay*by-az*bz;
  const length=Math.hypot(out[0],out[1],out[2],out[3])||1;
  for(let component=0;component<4;component++) out[component]/=length;
}

const frames=[];
const scratch=[0,0,0];
const rotationScratch=[0,0,0,1];
const relativeRotation=[0,0,0,1];
const baseRotations=translationChannels.map(channel=>{
  const rotation=rotationByNode.get(channel.node);
  const base=[0,0,0,1];
  if(rotation) sample(rotation,0,base,4);
  return base;
});
const meanZ=new Array(translationChannels.length).fill(0);
for(let frame=0;frame<frameCount;frame++){
  const time=Math.min(duration,frame/fps);
  const values=[];
  for(let control=0;control<translationChannels.length;control++){
    const channel=translationChannels[control];
    sample(channel,time,scratch,3);
    const rotation=rotationByNode.get(channel.node);
    let slopeX=0;
    let slopeY=0;
    if(rotation){
      sample(rotation,time,rotationScratch,4);
      relativeQuaternion(rotationScratch,baseRotations[control],relativeRotation);
      const [qx,qy,qz,qw]=relativeRotation;
      // Z-Zeile der relativen Rotationsmatrix: Höhenänderung einer lokalen
      // XY-Oberfläche pro Einheit Abstand zum jeweiligen Steuerknochen.
      slopeX=2*(qx*qz-qw*qy);
      slopeY=2*(qy*qz+qw*qx);
    }
    values.push(
      Math.round(scratch[0]*10000)/10000,
      Math.round(scratch[1]*10000)/10000,
      Math.round(scratch[2]*10000)/10000,
      Math.round(slopeX*10000)/10000,
      Math.round(slopeY*10000)/10000
    );
    meanZ[control]+=scratch[2];
  }
  frames.push(values);
}
for(let index=0;index<meanZ.length;index++){
  meanZ[index]=Math.round(meanZ[index]/frameCount*10000)/10000;
}

const result={
  source:{
    title:json.asset?.extras?.title||'Free Ocean wave animation',
    author:json.asset?.extras?.author||'',
    license:json.asset?.extras?.license||'',
    url:json.asset?.extras?.source||''
  },
  clip:clip.name,
  duration:Math.round(duration*1000)/1000,
  fps,
  controls:translationChannels.map((channel,index)=>({node:channel.node,name:channel.name,meanZ:meanZ[index]})),
  frames
};

fs.writeFileSync(outputPath,`${JSON.stringify(result)}\n`);
console.log(`Wrote ${frameCount} frames × ${translationChannels.length} controls to ${outputPath}`);
