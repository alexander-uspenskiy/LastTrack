import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameConfig } from '../../src/data/sliceConfig.js';
import { defaultSave } from '../../src/data/saveStore.js';
import { createRaceSim } from '../../src/sim/raceSim.js';

const FIELD = ['vex', 'fuse', 'kane', 'cinder', 'rust'];   // the racers drawn when the track was chosen

test('the race runs the field the track was chosen with, in the order drawn', () => {
  const cfg = createGameConfig({ mode: 'race', trackId: 'neonloop', save: defaultSave(), seed: 3, field: FIELD });
  assert.deepEqual(cfg.rivals.map((r) => r.driverId), FIELD);
});

test('a wreck the player is credited with names that racer in the result', () => {
  const cfg = createGameConfig({ mode: 'race', trackId: 'neonloop', save: { ...defaultSave(), carId: 'hammer' }, seed: 11, field: FIELD });
  const sim = createRaceSim(cfg);
  const credited = [];
  sim.events.on('wreck', (ev) => { if (ev.byId === 0) credited.push(sim.cars[ev.carId].driverId); });
  const idle = { throttle: 0, brake: 0, steer: 0, fire: false, cycleWeapon: false, selectWeapon: null, handbrake: false };
  const fire = { throttle: 1, brake: 0, steer: 0, fire: true, cycleWeapon: false, selectWeapon: null, handbrake: false };
  for (let i = 0; i < 120 * 10 && sim.phase !== 'racing'; i++) sim.step(idle);
  // a fragile rival right in front of the player: one burst of machine-gun fire wrecks it
  const player = sim.cars[0], rival = sim.cars[1];
  rival.armor = 1;
  rival.x = player.x + Math.cos(player.heading) * 14; rival.y = player.y + Math.sin(player.heading) * 14;
  for (let i = 0; i < 120 * 20 && !sim.isOver() && credited.length === 0; i++) sim.step(fire);
  assert.deepEqual(credited, [FIELD[0]], 'the sim credits the player with the rival it wrecked');
  assert.deepEqual(sim.result().player.wrecks, [FIELD[0]], 'and the result names that racer');
});
