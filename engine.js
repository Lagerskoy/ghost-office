/* A task-flow simulation. Workers are scripted state machines, not LLM agents. */
(function(root){
  'use strict';
  const DT=1/30, ROLES=['SCOUT','BUILDER','RUNNER','REVIEWER','WRITER'];
  function random(seed){let s=seed>>>0;return()=>{s=(Math.imul(1664525,s)+1013904223)>>>0;return s/4294967296;};}
  class Office{
    constructor({seed=731,batch=12}={}){
      if(!Number.isInteger(batch)||batch<1||batch>50)throw Error('Batch must be 1–50.');
      this.config={seed:seed>>>0,batch};this.rng=random(seed);this.t=0;this.tick=0;this.done=0;this.handoffs=0;this.events=[];this.history=[];
      this.desks=Array.from({length:10},(_,id)=>({x:110+(id%5)*165,y:id<5?185:475}));
      this.workers=this.desks.map((p,id)=>({id,role:id%5,x:p.x,y:p.y,home:p,state:'idle',job:null,remaining:0,total:1,path:[]}));
      this.jobs=Array.from({length:batch},(_,id)=>({id:id+1,stage:0,status:'queued',worker:null}));
      this.log('SYSTEM',`${batch} briefs queued. Ten ghosts clocked in.`);
    }
    log(role,message){this.events.push({tick:this.tick,time:+this.t.toFixed(2),role,message});}
    route(w,to){
      // Desks sit above/below a central aisle. Travel stays on this orthogonal corridor.
      w.path=[{x:w.x,y:330},{x:to.x,y:330},{x:to.x,y:to.y}];
    }
    step(){
      if(this.done===this.config.batch)return;
      this.tick++;this.t=this.tick*DT;
      for(const w of this.workers){
        if(w.state==='idle'){
          const job=this.jobs.find(j=>j.status==='queued'&&j.stage===w.role);
          if(job){job.status='working';job.worker=w.id;w.job=job.id;w.state='working';w.total=w.remaining=1.6+this.rng()*2.8;this.log(ROLES[w.role],`#${job.id.toString().padStart(2,'0')} started`);}
        }else if(w.state==='working'){
          w.remaining=Math.max(0,w.remaining-DT);
          if(!w.remaining){
            const job=this.jobs[w.job-1];
            if(w.role===4){job.status='done';job.worker=null;this.done++;this.log('SHIPPED',`#${job.id.toString().padStart(2,'0')} approved and delivered`);w.state='idle';w.job=null;}
            else{job.status='in transit';w.state='delivering';const destination=this.desks[(w.id<5?5:0)+w.role+1];this.route(w,destination);this.log(ROLES[w.role],`#${job.id.toString().padStart(2,'0')} → ${ROLES[w.role+1]}`);}
          }
        }else{
          const target=w.path[0];
          if(target){
            const dx=target.x-w.x,dy=target.y-w.y,d=Math.hypot(dx,dy),step=96*DT;
            if(d<=step){w.x=target.x;w.y=target.y;w.path.shift();}else{w.x+=dx/d*step;w.y+=dy/d*step;}
          }
          if(!w.path.length){
            if(w.state==='delivering'){
              const job=this.jobs[w.job-1];job.stage++;job.status='queued';job.worker=null;this.handoffs++;
              this.log('HANDOFF',`#${job.id.toString().padStart(2,'0')} received by ${ROLES[job.stage]}`);
              w.job=null;w.state='returning';this.route(w,w.home);
            }else w.state='idle';
          }
        }
      }
      if(this.tick%30===0)this.history.push({time:Math.round(this.t),done:this.done,working:this.workers.filter(w=>w.state==='working').length,walking:this.workers.filter(w=>w.path.length).length});
      if(this.done===this.config.batch)this.log('SYSTEM','Inbox zero. Nobody believes it.');
    }
    export(){return{disclosure:'Local, seeded task-flow simulation. No AI services or API calls.',config:this.config,time:this.t,done:this.done,handoffs:this.handoffs,jobs:this.jobs,events:this.events,history:this.history};}
  }
  const api={Office,DT,ROLES};if(typeof module!=='undefined')module.exports=api;else root.OfficeEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
