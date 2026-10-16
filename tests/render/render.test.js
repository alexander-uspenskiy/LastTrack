import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { buildCarMesh, CAR_IDS } from '../../src/render/carModel.js';
import { buildTrackGeometry, buildTrackMesh } from '../../src/render/trackMesh.js';
import { buildScenery } from '../../src/render/scenery.js';
import { buildTrack } from '../../src/core/trackModel.js';
import { TRACKS } from '../../src/data/tracks/index.js';
import { MeshBuilder } from '../../src/render/geomUtil.js';
import { portraitPixels, drawPortrait } from '../../src/render/portraits.js';
import { DRIVERS } from '../../src/data/drivers.js';
import { chasePose, chaseFov, smoothAngle, nextCameraMode, CameraRig } from '../../src/render/cameras.js';
import { computeMapTransform, createMinimap } from '../../src/render/minimap.js';
import { PALETTE_FRAG } from '../../src/render/palettePass.js';
import { PALETTE } from '../../src/render/paletteRef.js';
import { createAudioEngine, engineModel, distanceGain } from '../../src/audio/audioEngine.js';
import { createEffects } from '../../src/render/effects.js';
import { buildSky } from '../../src/render/raceController.js';

const track = buildTrack(TRACKS[0]);

test('car meshes: 3 distinct silhouettes, 4 wheels, finite geometry', () => {
  const sizes = new Set();
  for (const id of CAR_IDS) {
    const g = buildCarMesh({ carId: id, color: 8, helmetColor: 10 });
    assert.equal(g.userData.wheels.length, 4);
    assert.equal(g.userData.frontPivots.length, 2);
    assert.ok(g.userData.body.geometry.attributes.position.array.every(Number.isFinite));
    const bb = new THREE.Box3().setFromObject(g);
    sizes.add([bb.max.y.toFixed(1), (bb.max.z - bb.min.z).toFixed(1), (bb.max.x - bb.min.x).toFixed(1)].join('/'));
    assert.ok(bb.max.x > 1.5 && bb.min.x < -1.5, 'long axis is X');
  }
  assert.equal(sizes.size, 3);
  assert.equal(buildCarMesh({ carId: 'hammer', wrecked: true }).userData.wrecked, true);
  assert.equal(buildCarMesh({ carId: 'nope' }).userData.carId, 'wasp');
});

test('MeshBuilder solids have outward-facing normals', () => {
  const g = new MeshBuilder().box(0, 0, 0, 2, 2, 2, 8).build();
  const p = g.attributes.position, n = g.attributes.normal;
  for (let i = 0; i < p.count; i++) assert.ok(p.getX(i) * n.getX(i) + p.getY(i) * n.getY(i) + p.getZ(i) * n.getZ(i) > 0.9);
});

test('track geometry for every track is finite and non-empty', () => {
  for (const def of TRACKS) {
    const t = buildTrack(def);
    const g = buildTrackGeometry(t);
    for (const k of ['road', 'kerbs', 'walls', 'ground']) {
      const a = g[k].attributes.position.array;
      assert.ok(a.length > 0 && a.every(Number.isFinite), k);
    }
    const m = buildTrackMesh(t);
    assert.equal(m.group.children.length, 4);
    m.dispose();
  }
});

test('scenery: themed, deterministic, non-trivial', () => {
  const seen = new Set();
  for (const def of TRACKS) {
    const t = buildTrack(def);
    const a = buildScenery(t), b = buildScenery(t);
    assert.equal(a.kind, def.theme.scenery);
    assert.equal(a.tris, b.tris);
    assert.ok(a.count > 20);
    seen.add(a.kind);
  }
  assert.equal(seen.size, TRACKS.length);
});

test('sky dome builds with banded vertex colours', () => {
  const s = buildSky(TRACKS[0].theme);
  assert.ok(s.geometry.attributes.color.count > 0);
});

test('portraits: deterministic 16-colour pixels, distinct per driver', () => {
  const imgs = DRIVERS.map((d) => portraitPixels(d));
  imgs.forEach((px) => { assert.equal(px.length, 48 * 48); assert.ok(px.every((v) => v >= 0 && v < 16)); });
  assert.deepEqual([...portraitPixels(DRIVERS[0])], [...imgs[0]]);
  assert.equal(new Set(imgs.map((p) => Buffer.from(p).toString('base64'))).size, DRIVERS.length);
  let n = 0;
  drawPortrait({ canvas: { width: 96, height: 96 }, fillRect: () => { n++; }, fillStyle: '' }, DRIVERS[0]);
  assert.ok(n >= 48 * 48);
});

test('cameras: pose maths and rig placement', () => {
  const o = {};
  chasePose(o, 10, 20, 0);
  assert.ok(o.px < 10 && o.lx > 10 && Math.abs(o.pz - 20) < 1e-9);
  chasePose(o, 0, 0, Math.PI / 2);
  assert.ok(o.pz < 0 && Math.abs(o.px) < 1e-9);
  assert.ok(chaseFov(60) > chaseFov(0) && chaseFov(1e6) <= 85);
  assert.ok(Math.abs(smoothAngle(3.1, -3.1, 1e3, 1) - -3.1) < 1e-3);
  assert.equal(nextCameraMode('top'), 'chase');
  const cam = new THREE.PerspectiveCamera();
  const rig = new CameraRig(cam);
  rig.update(0.016, { x: 100, y: 50, heading: 0, speed: 30 }, 'racing', 0);
  assert.ok(cam.position.x < 100 && cam.position.y > 1 && Math.abs(cam.position.z - 50) < 0.1);
  rig.update(0.016, { x: NaN, y: 0, heading: 0 }, 'racing', 0);
  assert.ok(Number.isFinite(cam.position.x));
  rig.setMode('top');
  for (let i = 0; i < 40; i++) rig.update(0.05, { x: 100, y: 50, heading: 0, speed: 0 }, 'racing', 0);
  assert.ok(cam.position.y > 50);
});

test('minimap transform fits the box; draw is a no-op without a canvas', () => {
  const t = computeMapTransform({ minX: 0, maxX: 1000, minY: 0, maxY: 500 }, 200, 200, 10);
  assert.ok(Math.abs(t.scale - 0.18) < 1e-9);
  assert.ok(t.ox >= 10 - 1e-9 && 1000 * t.scale + t.ox <= 190 + 1e-9);
  createMinimap(null, track).draw({ cars: [] });
});

test('palette pass shader uses the 16-colour table', () => {
  assert.equal(PALETTE.length, 16);
  assert.match(PALETTE_FRAG, /uPal\[16\]/);
});

test('audio engine is inert outside the browser; pure helpers behave', () => {
  const a = createAudioEngine();
  a.resume(); a.startRace(); a.update({ cars: [], events: [], phase: 'racing', countdown: 0, tick: 1 }, 0.016);
  a.setMuted(true); a.setVolume(0.3); a.stop(); a.dispose();
  assert.ok(engineModel(0).freq < engineModel(30).freq);
  assert.ok(engineModel(5).gear === 1 && engineModel(60).gear === 5);
  assert.ok(distanceGain(0) > distanceGain(100) && distanceGain(500) === 0);
});

test('effects consume a snapshot (events, projectiles, hazards) without WebGL', () => {
  const scene = new THREE.Scene();
  const fx = createEffects(scene);
  const car = { id: 0, x: 0, y: 0, heading: 0, vx: 20, vy: 8, speed: 21, wrecked: false, smoke: true, burning: true, tyresPopped: true, isPlayer: true };
  const snap = (tick) => ({
    tick, cars: [car],
    projectiles: [{ id: 1, type: 'rocket', x: 5, y: 0, heading: 0, ownerId: 0 }],
    hazards: [{ id: 2, type: 'caltrops', x: 9, y: 1, heading: 0 }, { id: 3, type: 'wreck', x: 20, y: 1, heading: 0 }],
    pickups: [{ id: 4, type: 'ammo', x: 3, y: 3, active: true }],
    events: [{ type: 'shot', carId: 0, weaponId: 'machinegun' }, { type: 'shot', carId: 0, weaponId: 'rocket' }, { type: 'explosion', x: 4, y: 4, radius: 6 },
      { type: 'wreck', carId: 0 }, { type: 'hit', carId: 0, x: 1, y: 1 }, { type: 'bump', carId: 0, strength: 1 }, { type: 'pickup', carId: 0, pickupType: 'repair' }],
  });
  for (let i = 0; i < 30; i++) { car.x = i * 0.4; fx.update(snap(i), 1 / 60); }
  assert.ok(fx.particles.active > 0);
  assert.ok(fx.skids.count > 0);
  fx.update({ ...snap(31), projectiles: [], hazards: [] }, 1 / 60);
  fx.dispose();
});
