import test from 'node:test';
import assert from 'node:assert/strict';
import { CONTRACT_PATRONS, CONTRACT_MAX_QUOTA, offersFor, quotaFor, contractProgress } from '../../src/data/contracts.js';
import { acceptContract, settleContract } from '../../src/data/economy.js';
import { defaultSave, createSaveStore, SAVE_KEY } from '../../src/data/saveStore.js';
import { createMemoryStorage } from '../../src/core/storage.js';

const military = CONTRACT_PATRONS.find((p) => p.id === 'military');
const mafia = CONTRACT_PATRONS.find((p) => p.id === 'mafia');
const withContract = (save, quota, patron = 'military') => ({ ...save, contract: { patron, quota } });

test('the board: one bid per patron, quota 1..3 rotating with races run, bounty = quota x per-kill', () => {
  for (let races = 0; races < 7; races++) {
    const offers = offersFor({ ...defaultSave(), races });
    assert.deepEqual(offers.map((o) => o.patron), ['military', 'mafia']);
    for (const o of offers) {
      const p = CONTRACT_PATRONS.find((x) => x.id === o.patron);
      assert.ok(o.quota >= 1 && o.quota <= CONTRACT_MAX_QUOTA, `quota ${o.quota}`);
      assert.equal(o.bounty, o.quota * p.perKill);
      assert.equal(o.penalty, p.penalty);
    }
  }
  assert.deepEqual(offersFor({ ...defaultSave(), races: 0 }).map((o) => o.quota), [1, 2]);
  assert.deepEqual(offersFor({ ...defaultSave(), races: 2 }).map((o) => o.quota), [3, 1]);
  assert.equal(quotaFor({ races: 5 }, military), 3);
  // the penalty is the small one: well under a single kill's bounty
  assert.ok(CONTRACT_PATRONS.every((p) => p.penalty < p.perKill));
});

test('accepting locks the board quota in; one contract at a time; unknown patrons are refused', () => {
  const save = defaultSave();
  const r = acceptContract(save, 'mafia');
  assert.equal(r.ok, true);
  assert.deepEqual(r.save.contract, { patron: 'mafia', quota: quotaFor(save, mafia) });
  assert.equal(save.contract, null, 'input untouched');
  assert.deepEqual(acceptContract(r.save, 'military'), { ok: false, save: r.save, error: 'contract-active' });
  assert.equal(acceptContract(save, 'nobody').error, 'unknown-patron');
});

test('settling: quota met pays the bounty and clears the contract; kills above the quota still count', () => {
  const save = { ...withContract(defaultSave(), 2), cash: 5000 };
  const win = settleContract(save, { mode: 'race', kills: 2 });
  assert.equal(win.save.cash, 5000 + 2 * military.perKill);
  assert.equal(win.save.contract, null);
  assert.equal(win.settled.complete, true);
  assert.equal(win.settled.bounty, 2000); assert.equal(win.settled.penalty, 0); assert.equal(win.settled.net, 2000);
  assert.equal(settleContract(save, { mode: 'race', kills: 5 }).settled.complete, true);
});

test('settling: quota missed (or the race was left early) takes the small penalty, never below zero', () => {
  const save = { ...withContract(defaultSave(), 2), cash: 5000 };
  const miss = settleContract(save, { mode: 'race', kills: 1 });
  assert.equal(miss.save.cash, 5000 - military.penalty);
  assert.equal(miss.save.contract, null);
  assert.deepEqual([miss.settled.complete, miss.settled.bounty, miss.settled.penalty, miss.settled.net], [false, 0, military.penalty, -military.penalty]);
  const broke = settleContract({ ...save, cash: 120 }, { mode: 'race', kills: 0 });
  assert.equal(broke.save.cash, 0); assert.equal(broke.settled.penalty, 120); assert.equal(broke.settled.net, -120);
});

test('practice and no-contract races leave everything alone', () => {
  const save = withContract(defaultSave(), 1, 'mafia');
  const prac = settleContract(save, { mode: 'practice', kills: 3 });
  assert.equal(prac.settled, null); assert.deepEqual(prac.save, save);
  const none = settleContract(defaultSave(), { mode: 'race', kills: 3 });
  assert.equal(none.settled, null);
});

test('HUD progress caps at the quota', () => {
  const c = { patron: 'mafia', quota: 2 };
  assert.equal(contractProgress(c, 0), 'WRECK 0/2');
  assert.equal(contractProgress(c, 1), 'WRECK 1/2');
  assert.equal(contractProgress(c, 9), 'WRECK 2/2');
  assert.equal(contractProgress(null, 4), '');
});

test('save: a valid contract survives a round trip; malformed ones are dropped', () => {
  const store = createSaveStore(createMemoryStorage());
  store.save(withContract(defaultSave(), 3, 'military'));
  assert.deepEqual(store.load().contract, { patron: 'military', quota: 3 });
  const bad = [{ patron: 'nobody', quota: 1 }, { patron: 'mafia', quota: 0 }, { patron: 'mafia', quota: 4 }, { patron: 'mafia' }, 'mafia', null];
  for (const c of bad) {
    const st = createMemoryStorage();
    st.setItem(SAVE_KEY, JSON.stringify({ ...defaultSave(), contract: c }));
    assert.equal(createSaveStore(st).load().contract, null, JSON.stringify(c));
  }
  assert.equal(defaultSave().contract, null);
});

