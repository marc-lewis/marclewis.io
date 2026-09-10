/*
 * The site. The wall is scenery; buttons are inert until an effect is
 * assigned to them. Effects are self-contained files in src/effects/:
 * drop one in and it gets discovered, placed, and given a button.
 */

import { build } from './board.js';

const LINK = 'https://www.linkedin.com/in/marc-lewis-58a2b37b/';
const root = document.documentElement;
const field = document.querySelector('.field');
const sheet = document.querySelector('.field__sheet');

// plugin discovery: every file in src/effects/ is an effect.
// files starting with _ are skipped (templates, helpers).
const modules = import.meta.glob(['./effects/*.js', '!./effects/_*.js'], { eager: true });
const effects = Object.entries(modules)
    .map(([path, mod]) => {
        if (!mod.meta || typeof mod.run !== 'function') {
            console.warn('effect skipped, invalid shape:', path);
            return null;
        }
        return mod;
    })
    .filter(Boolean);

let board = build(sheet, root);

let active = null; // { mod, origin, ctx, cleanup }
let dimmed = false;

// a square spiral walk from the island centre: the order new buttons
// claim as they are activated, winding outward from the middle
const spiralFromCentre = () => {
    const island = board.cells.filter((cell) => cell.island);
    const centre = island[Math.floor(island.length / 2)];
    const order = [];
    const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    let row = centre.row;
    let col = centre.col;
    let dir = 0;
    let step = 1;
    let walked = 0;
    const push = () => {
        if (row >= 0 && col >= 0 && row < board.rows && col < board.cols) {
            order.push(board.cells[row * board.cols + col]);
        }
    };
    push();
    while (order.length < board.cells.length && walked < board.cells.length * 8) {
        for (let leg = 0; leg < 2; leg += 1) {
            for (let s = 0; s < step; s += 1) {
                row += dirs[dir][0];
                col += dirs[dir][1];
                walked += 1;
                push();
            }
            dir = (dir + 1) % 4;
        }
        step += 1;
    }
    return order;
};

// placements resolve effect metadata to cells; first come, first served
const makeAssigner = () => {
    let spiral = null;
    let spiralAt = 0;
    return {
        centre: () => {
            const island = board.cells.filter((cell) => cell.island);
            return island[Math.floor(island.length / 2)];
        },
        random: (mod) => {
            const wantIsland = mod.meta.zone === 'island';
            const wantRing = mod.meta.zone === 'ring';
            const pool = board.cells.filter((cell) => !cell.effect
                && (!wantIsland || cell.island)
                && (!wantRing || !cell.island));
            return pool[Math.floor(Math.random() * pool.length)];
        },
        // wind outward from the middle, claiming only cells that are
        // fully on screen, so every special is findable
        spiral: () => {
            if (!spiral) {
                spiral = spiralFromCentre().filter((cell) => {
                    if (cell.effect) return false;
                    const rect = cell.el.getBoundingClientRect();
                    return rect.x >= 0 && rect.y >= 0
                        && rect.right <= innerWidth && rect.bottom <= innerHeight;
                });
            }
            while (spiralAt < spiral.length && spiral[spiralAt].effect) spiralAt += 1;
            const cell = spiral[spiralAt] || null;
            if (cell) spiralAt += 1;
            return cell;
        },
    };
};

const assignEffects = () => {
    const placements = makeAssigner();
    // anchors claim before wanderers, so fixed spots are never taken
    const priority = { centre: 0, spiral: 1, random: 2 };
    [...effects]
        .sort((a, b) => (priority[a.meta.placement] ?? 9) - (priority[b.meta.placement] ?? 9))
        .forEach((mod) => {
            const resolve = placements[mod.meta.placement];
            if (!resolve) {
                console.warn('effect placement unknown:', mod.meta.id, mod.meta.placement);
                return;
            }
            const cell = resolve(mod);
            if (!cell || cell.effect) {
                console.warn('effect has no free slot:', mod.meta.id);
                return;
            }
            cell.effect = mod;
            cell.wall = true; // monuments: never part of the minefield
            cell.el.textContent = mod.meta.label;
        });
};
assignEffects();

// once the load wave has passed, the wall settles into scenery;
// buttons with effects assigned stay awake
const dimWall = () => {
    board.cells.forEach((cell) => {
        if (!cell.effect && !cell.live) cell.el.classList.add('cell--off');
    });
    dimmed = true;
};
setTimeout(dimWall, 2400);

const makeContext = (origin) => {
    const listeners = [];
    const routing = new Set();
    let clickHandler = null;
    let flagHandler = null;

    const ctx = {
        origin,
        buttons: board.cells,
        grid: { cols: board.cols, rows: board.rows },
        field,
        sheet,
        reduceMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,

        activate: (cell) => {
            routing.add(cell);
            cell.live = true;
            cell.el.classList.remove('cell--off');
        },
        deactivate: (cell) => {
            routing.delete(cell);
            cell.live = false;
            cell.el.classList.add('cell--off');
        },
        onClick: (fn) => { clickHandler = fn; },
        onFlag: (fn) => { flagHandler = fn; },
        listen: (target, type, fn, options) => {
            target.addEventListener(type, fn, options);
            listeners.push([target, type, fn, options]);
        },
        // replay the load wave with its origin moved; returns cancel
        stagger: (cells, opts = {}) => {
            const from = opts.from || origin;
            const speed = opts.speed === undefined ? 1 : opts.speed;
            cells.forEach((cell) => {
                const distance = Math.hypot(
                    cell.el.offsetLeft - from.el.offsetLeft,
                    cell.el.offsetTop - from.el.offsetTop
                ) * speed;
                cell.el.style.setProperty('--d', Math.round(distance) + 'ms');
                cell.el.classList.add('btn--still');
            });
            requestAnimationFrame(() => {
                cells.forEach((cell) => cell.el.classList.remove('btn--still'));
            });
            return () => {
                // stop any in-flight replay: freeze the cells where they
                // are; the next stagger or rebuild releases them
                cells.forEach((cell) => cell.el.classList.add('btn--still'));
            };
        },
        leave: () => {
            setTimeout(() => { window.location.href = LINK; }, 1600);
        },
        // transient effects call this when they are finished: the
        // runner cleans up, clears the active slot, and the button
        // can fire again. guards against a stale done after a swap.
        done: () => {
            if (active && active.ctx === ctx) {
                if (active.cleanup) active.cleanup();
                active.ctx._teardown();
                active = null;
            }
        },
    };

    ctx._handle = (type, cell) => {
        if (type === 'click' && clickHandler) clickHandler(cell);
        if (type === 'flag' && flagHandler) flagHandler(cell);
    };

    ctx._teardown = () => {
        listeners.forEach(([target, type, fn, options]) => {
            target.removeEventListener(type, fn, options);
        });
        listeners.length = 0;
        routing.forEach((cell) => { cell.live = false; });
        routing.clear();
    };

    return ctx;
};

const startEffect = (cell) => {
    if (active) {
        if (active.cleanup) active.cleanup();
        active.ctx._teardown();
    }
    const ctx = makeContext(cell);
    const cleanup = cell.effect.run(ctx) || null;
    active = { mod: cell.effect, origin: cell, ctx, cleanup };
};

// playing, not leaving: clicks on the wall stay on the page.
// every route to LinkedIn is earned now.
sheet.addEventListener('click', (event) => {
    const el = event.target.closest('a.btn');
    if (!el) return;
    event.preventDefault();
    const cell = board.cells[el.dataset.i];
    if (!cell) return;
    if (active && cell.live) {
        active.ctx._handle('click', cell);
        return;
    }
    if (cell.effect && (!active || active.origin !== cell)) startEffect(cell);
});

sheet.addEventListener('contextmenu', (event) => {
    const el = event.target.closest('a.btn');
    if (!el) return;
    event.preventDefault(); // long-press on touch lands here too
    const cell = board.cells[el.dataset.i];
    if (active && cell.live) active.ctx._handle('flag', cell);
});

sheet.addEventListener('auxclick', (event) => event.preventDefault());

// a resize rebuilds the wall, but never mid-game
let rebuild;
addEventListener('resize', () => {
    clearTimeout(rebuild);
    rebuild = setTimeout(() => {
        if (active) return;
        field.classList.add('field--instant');
        board = build(sheet, root);
        assignEffects();
        if (dimmed) dimWall();
    }, 150);
});