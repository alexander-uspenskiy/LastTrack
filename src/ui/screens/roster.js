import { h, button, screenHeader, attachMenuKeys } from '../dom.js';
import { DRIVERS } from '../../data/drivers.js';
import { TRACKS, getTrack } from '../../data/tracks/index.js';
import { DRIVERS_BY_DIFFICULTY, tracksFor } from '../../data/raceConfig.js';
import { getCar } from '../../data/cars.js';
import { getWeapon } from '../../data/weapons.js';
import { drawPortrait } from '../../render/portraits.js';
import { weaponIcon } from '../icons.js';
import { rating } from '../menuLogic.js';
import { uiHex } from '../colors.js';

const miniBar = (label, v, color) => [h('span', label), h('div.bar-track', h('div.bar-fill', { style: { width: rating(v) + '%', background: color } }))];

export function createRosterScreen({ game, flow }) {
  let detach = null;
  const grid = h('div.roster-grid');
  DRIVERS_BY_DIFFICULTY.forEach((d, i) => {
    const c = h('canvas.portrait', { width: 224, height: 224, dataset: { driver: d.id }, role: 'img', 'aria-label': `Portrait of ${d.name}` });
    try { drawPortrait(c.getContext('2d'), d); } catch (e) { game.reportError(e); }
    const fav = getWeapon(d.favoriteWeapon);
    grid.append(h('div.panel.driver', { style: { '--accent': uiHex(d.color) } },
      c,
      h('div.driver-info', h('h3', d.name), h('p.nick', `"${d.nickname}"`), h('p.bio', d.bio),
        h('div.driver-tags',
          h('span.wchip', weaponIcon(d.favoriteWeapon, { size: 18 }), fav?.name ?? d.favoriteWeapon),
          h('span.chip', getCar(d.carId)?.name ?? d.carId)),
        h('p.small.muted.races', `RACES ON ${tracksFor(d.id).map((id) => getTrack(id)?.name ?? id).join(' · ') || '—'}`),
        h('div.mini-bars', ...miniBar('SKILL', d.skill, 'linear-gradient(90deg,var(--cyan),var(--violet))'), ...miniBar('AGGRESSION', d.aggression, 'linear-gradient(90deg,var(--amber),var(--red))'))),
      h('span.rank-badge', `#${i + 1}`)));
  });
  const el = h('section.screen.screen-roster',
    screenHeader('THE FIELD', `${DRIVERS.length} drivers, ${TRACKS.length} tracks. Four of them race you on each. Easiest first.`),
    h('div.screen-body', grid),
    h('footer.screen-foot', button('BACK', () => flow.transition('garage'), 'btn-back'), h('span.spacer'), button('ARMORY', () => flow.transition('shop'))));
  return { el, show() { detach = attachMenuKeys(el); el.querySelector('.screen-body').scrollTop = 0; }, hide() { detach?.(); } };
}
