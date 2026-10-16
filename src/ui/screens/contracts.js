import { h, button, screenHeader, fmtMoney, attachMenuKeys, clear } from '../dom.js';
import { icon } from '../icons.js';
import { offersFor, getPatron } from '../../data/contracts.js';

/** The board: one bid per patron. Accepting locks it in for the next race; one contract at a time. */
export function createContractsScreen({ game, flow }) {
  let detach = null;
  const active = h('div.panel.contract-active');
  const grid = h('div.contract-grid');
  const msg = h('p.msg.muted');
  const say = (t, bad = false) => { msg.textContent = t; msg.classList.toggle('bad', bad); };

  function render() {
    const save = game.getSave();
    const cur = save.contract ? getPatron(save.contract.patron) : null;
    active.replaceChildren(h('div.panel-title', 'ACTIVE CONTRACT'),
      cur
        ? h('p', h('b', cur.name), ` · ${cur.org}`, h('br'),
          h('span.muted', `Wreck ${save.contract.quota} racer${save.contract.quota > 1 ? 's' : ''} in your next race. Miss it and you pay ${fmtMoney(cur.penalty)}.`))
        : h('p.muted', 'None. Take a bid below. Kills in your next race count toward it.'));
    clear(grid);
    for (const o of offersFor(save)) {
      const p = getPatron(o.patron);
      const taken = !!save.contract && save.contract.patron === p.id;
      const accept = button(taken ? 'ACCEPTED' : 'ACCEPT', () => {
        const r = game.acceptContract(p.id);
        if (!r.ok) say(r.error || 'Cannot accept.', true);
        else say(`${p.org} bid accepted. Wreck ${o.quota} racer${o.quota > 1 ? 's' : ''} in your next race.`);
        render();
      }, 'btn-primary btn-small');
      accept.disabled = !!save.contract;
      grid.append(h('div.panel.contract-card' + (taken ? '.taken' : ''),
        h('div.contract-head', icon(p.icon, { size: 26 }), h('div', h('h3', p.name), h('p.small.muted', p.org))),
        h('p.contract-line', `“${p.line}”`),
        h('div.contract-terms',
          h('div.term', h('span.small.muted', 'WRECK'), h('b', `${o.quota} racer${o.quota > 1 ? 's' : ''}`)),
          h('div.term', h('span.small.muted', 'ON THE FLAG'), h('b.good', '+' + fmtMoney(o.bounty))),
          h('div.term', h('span.small.muted', 'IF YOU MISS'), h('b.bad', '−' + fmtMoney(o.penalty)))),
        accept));
    }
  }

  const el = h('section.screen.screen-contracts',
    screenHeader('THE BOARD', 'Bids from people who do not put their names on paper.'),
    h('div.screen-body', h('div.contracts-wrap', active, grid, msg)),
    h('footer.screen-foot', button('BACK', () => flow.transition('garage'), 'btn-back')));
  return {
    el,
    show() { detach = attachMenuKeys(el); say(''); render(); el.querySelector('.screen-body').scrollTop = 0; },
    hide() { detach?.(); },
  };
}
