import test from 'node:test';
import assert from 'node:assert/strict';
import { bidSummary } from '../../src/ui/screens/raceSettings.js';
import { createFlowMachine } from '../../src/ui/flowMachine.js';
import { defaultSave } from '../../src/data/saveStore.js';

const race = { mode: 'race', bid: 'military' };

test('bid line: none, race with a bid, practice with a bid, and a contract already running', () => {
  const save = { ...defaultSave(), races: 1 };   // the board asks for 2 racers from Federal Motor Corps after one race
  assert.equal(bidSummary({ mode: 'race', bid: null }, save), 'No bid: prize and kill bonus only.');
  assert.match(bidSummary(race, save), /^Federal Motor Corps: wreck 2 racers for \+\$2,000, or −\$300 if you miss\.$/);
  assert.match(bidSummary({ mode: 'practice', bid: 'mafia' }, save), /Practice ignores bids, so this one is not taken\.$/);
  assert.match(bidSummary(race, { ...save, contract: { patron: 'mafia', quota: 1 } }), /already running/);
});

test('the wizard sits between track select and the race: track, then settings, then loading', () => {
  const f = createFlowMachine({ initial: 'garage' });
  for (const s of ['trackSelect', 'raceSettings', 'loading', 'race']) assert.equal(f.transition(s), true, s);
  assert.equal(createFlowMachine({ initial: 'raceSettings' }).canTransition('shop'), false);
});
