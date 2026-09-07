'use strict';
const canvas=document.querySelector('#scene'),ctx=canvas.getContext('2d'),$=id=>document.getElementById(id);
let sim,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,accumulator=0,previous=0,lastEventCount=-1;
const ghost=new Image();ghost.src='mascot.jpg';ghost.onerror=()=>{$('notice').textContent='Mascot image missing. Keep mascot.jpg beside index.html.';};
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h);}
function text(s,x,y,size=12,c='#a1a8b7'){ctx.fillStyle=c;ctx.font=`${size}px ui-monospace,Consolas,monospace`;ctx.fillText(s,x,y);}
function line(a,b,c,width=1){ctx.strokeStyle=c;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();}
function draw(){
  rect(0,0,900,660,'#101217');text('NORTH WING / RESEARCH & PRODUCTION',30,30,10);text('SEED '+sim.config.seed,745,30,10);
  rect(25,53,850,520,'#15181f');
  for(let x=25;x<875;x+=35)line([x,53],[x,573],'#1d2129');
  for(let y=53;y<573;y+=35)line([25,y],[875,y],'#1d2129');
  rect(25,281,850,98,'#111419');ctx.setLineDash([8,12]);line([40,330],[860,330],'#303641');ctx.setLineDash([]);
  text('SHARED AISLE',385,354,9,'#454e60');
  for(const d of sim.desks){
    const top=d.y<330,dy=top?d.y-58:d.y+25;
    rect(d.x-57,dy+6,114,38,'#080a0f');rect(d.x-57,dy,114,38,'#363d4b');rect(d.x-53,dy,106,3,'#565f72');
    rect(d.x-22,dy+5,42,22,'#0a0e14');rect(d.x-18,dy+9,34,14,'#1b2533');
    for(let n=0;n<3;n++)rect(d.x-15,dy+11+n*4,12+((n+Math.floor(sim.t*2))%3)*7,1,'#7b8ca5');
    rect(d.x+31,dy+13,7,9,'#b7bdc9');rect(d.x-16,d.y+14,32,9,'#262c39');
  }
  for(let role=0;role<5;role++){
    text(OfficeEngine.ROLES[role],75+role*165,82,10,'#d4d8e1');text(OfficeEngine.ROLES[role],75+role*165,559,10,'#939db0');
  }
  for(const w of [...sim.workers].sort((a,b)=>a.y-b.y)){
    const walking=w.path.length>0,bob=walking?Math.sin(sim.t*13+w.id)*1.7:0;
    rect(w.x-16,w.y+17,32,5,'#090b10');
    if(ghost.complete&&ghost.naturalWidth){ctx.save();ctx.globalCompositeOperation='screen';ctx.imageSmoothingEnabled=false;ctx.drawImage(ghost,w.x-30,w.y-30+bob,60,60);ctx.restore();}
    else{rect(w.x-10,w.y-12,20,27,'#e1e4ea');text('..',w.x-8,w.y,12,'#161920');}
    if(w.state==='delivering'){rect(w.x+13,w.y-2,10,12,'#929fb7');rect(w.x+15,w.y+1,5,1,'#303949');}
    if(w.state==='working'){rect(w.x-19,w.y+28,38,3,'#323846');rect(w.x-19,w.y+28,38*(1-w.remaining/w.total),3,'#c7cfdf');}
    text(String(w.id+1).padStart(2,'0'),w.x-7,w.y-31,8,'#8390a5');
  }
  rect(0,592,900,68,'#13161c');text('WORKFLOW / LIVE QUEUE',23,615,9);
  for(let i=0;i<5;i++){
    const x=240+i*127,n=sim.jobs.filter(j=>j.stage===i&&j.status!=='done').length;
    if(i<4)line([x+75,628],[x+120,628],'#4a566a');
    rect(x,608,78,38,n?'#333d4f':'#1f2531');text(OfficeEngine.ROLES[i],x+8,623,8,'#c5cddd');text(String(n).padStart(2,'0')+' BRIEFS',x+8,638,8);
  }
  $('shipped').textContent=sim.done+' / '+sim.config.batch;$('handoffs').textContent=sim.handoffs;$('walking').textContent=sim.workers.filter(w=>w.path.length).length;
  $('status').textContent=(sim.done===sim.config.batch?'INBOX ZERO':paused?'PAUSED':'OFFICE OPEN')+' · '+sim.t.toFixed(1)+'s';
  if(lastEventCount!==sim.events.length){
    $('events').replaceChildren(...sim.events.slice(-6).reverse().map(e=>{const li=document.createElement('li');li.textContent=e.time.toFixed(1)+'s · '+e.role+' / '+e.message;return li;}));
    $('queue').replaceChildren(...OfficeEngine.ROLES.map((role,i)=>{const p=document.createElement('div');p.textContent=role.padEnd(10,' ')+' '+String(sim.jobs.filter(j=>j.stage===i&&j.status!=='done').length).padStart(2,'0');return p;}));lastEventCount=sim.events.length;
  }
}
function reset(){sim=new OfficeEngine.Office({seed:Number($('seed').value),batch:Number($('batch').value)});accumulator=0;lastEventCount=-1;draw();}
$('settings').onsubmit=e=>{e.preventDefault();reset();};$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'Resume':'Pause';draw();};
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('save').onclick=()=>download(new Blob([JSON.stringify(sim.export(),null,2)],{type:'application/json'}),`ghost-office-${sim.config.seed}.json`);
$('record').onclick=()=>{
  if(!canvas.captureStream||typeof MediaRecorder==='undefined'){$('notice').textContent='Recording is not supported in this browser. Try Chrome or Edge.';return;}
  let stream,rec;const chunks=[];
  try{stream=canvas.captureStream(30);rec=new MediaRecorder(stream,{mimeType:'video/webm'});}catch{if(stream)stream.getTracks().forEach(t=>t.stop());$('notice').textContent='Use the local server described in README for recording.';return;}
  $('record').disabled=true;$('notice').textContent='Recording 15 seconds. Keep the tab active; no audio is recorded.';
  rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};rec.onstop=()=>{stream.getTracks().forEach(t=>t.stop());download(new Blob(chunks,{type:'video/webm'}),'ghost-office.webm');$('record').disabled=false;$('notice').textContent='Recording saved.';};rec.start();setTimeout(()=>{if(rec.state==='recording')rec.stop();},15000);
};
reset();$('pause').textContent=paused?'Resume':'Pause';function animate(now){const elapsed=previous?Math.min(.1,(now-previous)/1000):0;previous=now;if(!paused&&!document.hidden){accumulator+=elapsed*Number($('speed').value);while(accumulator>=OfficeEngine.DT){sim.step();accumulator-=OfficeEngine.DT;}}draw();requestAnimationFrame(animate);}requestAnimationFrame(animate);
