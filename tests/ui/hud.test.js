import { test } from 'node:test';
import assert from 'node:assert/strict';
import { armorColorIndex, feedLine, standings } from '../../src/ui/hud.js';
import { ordinal, fmtMoney, fmtTime, kph } from '../../src/ui/dom.js';

test('armor colour thresholds', () => {
  assert.equal(armorColorIndex(1), 11);
  assert.equal(armorColorIndex(0.5), 10);
  assert.equal(armorColorIndex(0.3), 9);
  assert.equal(armorColorIndex(0.1), 8);
  assert.equal(armorColorIndex(0), 8);
});

test('kill feed lines', () => {
  const names = ['YOU', 'Vex', 'Kane'];
  assert.equal(feedLine({ type: 'wreck', carId: 1, byId: 0 }, names), 'YOU ✕ Vex');
  assert.equal(feedLine({ type: 'wreck', carId: 2 }, names), 'Kane wrecked');
  assert.equal(feedLine({ type: 'wreck', carId: 2, byId: 2 }, names), 'Kane wrecked');
  assert.equal(feedLine({ type: 'hit' }, names), null);
});

test('standings sorted by position without mutating the snapshot', () => {
  const snap = { cars: [{ id: 0, position: 3 }, { id: 1, position: 1 }, { id: 2, position: 2 }] };
  assert.deepEqual(standings(snap).map((c) => c.id), [1, 2, 0]);
  assert.equal(snap.cars[0].id, 0);
});

test('formatters', () => {
  assert.equal(ordinal(1), '1st'); assert.equal(ordinal(2), '2nd'); assert.equal(ordinal(3), '3rd'); assert.equal(ordinal(11), '11th');
  assert.equal(fmtMoney(5000), '$5,000'); assert.equal(fmtMoney(NaN), '$0');
  assert.equal(fmtTime(65.4321), '1:05.43'); assert.equal(fmtTime(null), '--:--.--');
  assert.equal(kph(10), 36);
});
