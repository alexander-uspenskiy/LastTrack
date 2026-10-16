// Headless check of the hero slice: Neon Loop, player Hammer (AI-driven) vs 4 enemy Hammers. Usage: node tools/sliceCheck.mjs [seeds=4] [playerSkill=0.85]
import { createRaceSim } from '../src/sim/raceSim.js';
import { createSliceConfig } from '../src/data/sliceConfig.js';
import { defaultSave } from '../src/data/saveStore.js';
const seeds = +process.argv[2] || 4, pskill = +process.argv[3] || 0.85;
const NO = { throttle: 0, brake: 0, steer: 0, fire: false, cycleWeapon: false, selectWeapon: null, handbrake: false };
const tot = { shots: {}, hits: {}, wrecks: 0, finish: 0, n: 0, dnf: 0, winT: [] };
for (let s = 0; s < seeds; s++) {
  const save = { ...defaultSave(), carId: 'hammer', weapons: [{ id: 'machinegun', ammo: 200 }] };
  const sim = createRaceSim(createSliceConfig({ save, seed: 500 + s }), { aiPlayer: true, aiSkill: pskill });
  sim.events.on('shot', (e) => { tot.shots[e.carId] = (tot.shots[e.carId] || 0) + 1; });
  sim.events.on('hit', (e) => { if (e.byId != null && e.byId !== e.carId && e.weaponId !== 'wall' && e.weaponId !== 'ram') tot.hits[e.byId] = (tot.hits[e.byId] || 0) + 1; });
  sim.events.on('wreck', () => { tot.wrecks++; });
  let n = 0; while (!sim.isOver() && n++ < 120 * 600) sim.step(NO);
  const r = sim.result(); tot.n++;
  tot.finish += r.finishOrder.filter((f) => f.time != null).length; tot.dnf += r.finishOrder.filter((f) => f.time == null).length;
  const w = r.finishOrder[0]; if (w.time) tot.winT.push(w.time);
  console.log(`seed ${s}: ${r.finishOrder.map((f) => (f.isPlayer ? 'P' : f.driverId) + (f.time ? ' ' + f.time.toFixed(0) + 's' : f.wrecked ? ' WRECK' : ' DNF')).join(' | ')}  sim ${(n / 120).toFixed(0)}s`);
}
console.log('track length', createRaceSim(createSliceConfig({ save: defaultSave(), seed: 1 }), {}).track.length.toFixed(0), 'm');
console.log('shots by car', JSON.stringify(tot.shots), 'hits by car', JSON.stringify(tot.hits));
console.log(`finishers ${tot.finish}/${tot.n * 5}  dnf ${tot.dnf}  wrecks ${tot.wrecks}  avg win time ${(tot.winT.reduce((a, b) => a + b, 0) / Math.max(1, tot.winT.length)).toFixed(0)}s`);
