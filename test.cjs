const assert=require('node:assert/strict');const {Office}=require('./engine.js');
function run(batch,seed=731){const sim=new Office({batch,seed});for(let i=0;i<30000&&sim.done<batch;i++){
  const before=sim.workers.map(w=>({x:w.x,y:w.y}));sim.step();
  sim.workers.forEach((w,id)=>assert(Math.hypot(w.x-before[id].x,w.y-before[id].y)<=3.20001,'No teleporting'));
  const claimed=sim.workers.filter(w=>w.job!==null).map(w=>w.job);assert.equal(new Set(claimed).size,claimed.length,'Single owner per brief');
}assert.equal(sim.done,batch);assert.equal(sim.handoffs,batch*4);assert(sim.jobs.every(j=>j.status==='done'&&j.stage===4));return sim;}
assert.deepEqual(run(12).export(),run(12).export());for(const batch of [1,2,25,50])run(batch);
assert.throws(()=>new Office({batch:0}));assert.throws(()=>new Office({batch:51}));
console.log('PASS: reproducibility, five complete batches, exact handoffs, single ownership and continuous movement.');
