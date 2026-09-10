# Plan: button effects as a plugin system

Goal: effects for the wall become self-contained files dropped into a
directory, discovered and wired to buttons automatically. The site keeps
its soul: zero runtime dependencies, and (the important part) the
deployed artefact stays a single HTML file.

Date: 2026-09-09

## The constraint that decides everything

A browser cannot list a directory. "Pop a file in a folder and it gets
picked up" therefore requires a glob at build time (or a directory-
listing server, which static hosting won't do). So the real question is
not "which framework" but "which build step", and the lightest one that
does plugin-style discovery is Vite:

`import.meta.glob('./effects/*.js', { eager: true })`

Any file in `src/effects/` is auto-discovered at build time. No manifest
to maintain, no registration code. This is the entire mechanism the
plugin system needs - and it does not require React, Vue, or any UI
framework to work.

## Three paths considered

**A. No build at all (status quo plus hand registration).** Effects
live in the one HTML file and you add them by hand. Zero tooling, but
no auto-discovery - it isn't actually the plugin system requested.

**B. Vite + vanilla JS (recommended).** Keep the current vanilla
architecture, which is small, tested and well suited to 400 absolutely
positioned DOM nodes. Add Vite purely as the discovery and dev
workflow. UI frameworks add nothing here: the wall is not stateful UI,
it is an animation surface; React's diffing would buy nothing and cost
a rewrite of working, tested game code.

**C. Full framework (Svelte or React).** The game state (mines, flags,
reveals) would live in framework state and the wall re-renders. Fine,
but a rewrite of everything that currently works, a heavier output,
and the plugin system would still be Vite's glob. If a framework is
ever wanted, Svelte fits the site best (tiny output, no virtual DOM);
React fits the CV best. Neither is recommended now.

## Recommended architecture (Path B)

```
marclewis.io/
  index.html            shell: meta, favicon, one module script tag
  vite.config.js        singlefile plugin + glob
  src/
    main.js             boot: build board, wire game, resolve placements
    board.js            wall construction: bond, island, wipe stagger
    game.js             minesweeper logic (extracted from main, unchanged)
    context.js          the effects API + runner
    effects/
      _template.js      commented starter for new effects
      ripple.js
      earthquake.js
      theme-flip.js
      ...
  dist/index.html       build output: still ONE self-contained file
```

Key: `vite-plugin-singlefile` inlines all JS and CSS into one
`dist/index.html`. The joke in the ideas list ("the entire site is one
HTML file") survives the modernisation. Runtime dependencies: zero.
Dev dependencies: two (vite, the singlefile plugin).

## The effect contract

Each file is self-contained: it carries its own metadata and exports a
single run function. No registration anywhere else - this is what
makes it a plugin and not a module.

```js
// src/effects/ripple.js
export const meta = {
  id: 'ripple',
  name: 'Ripple wave',
  placement: 'centre',   // 'centre' | 'random' | {row, col} | 'ring'
  zone: 'island',         // 'island' | 'ring' | 'anywhere'
  repeatable: true,       // false = one-shot, becomes a normal button after
  exits: false,           // true = the effect leaves the page (redirects)
};

export function run(ctx) {
  // return a cleanup function to become cancellable
  return ctx.stagger(ctx.buttons, { from: ctx.origin, speed: 1.2 });
}
```

## The context API (ctx)

The runner hands each effect a stable, narrow API so effects can be
written without touching internals:

- `buttons` - grid records: `{el, row, col, x, y, island, open, flag}`
- `origin` - the button that was clicked
- `stagger(cells, {from, speed})` - distance-based pop scheduling;
  returns cancel. The ripple, earthquake, slow clap and about thirty
  other ideas are this one helper wearing different hats
- `theme.set({ink, page, accent})` / `theme.reset()` - writes CSS vars
- `toast(text)` / `overlay(html)` - ephemeral UI, auto-cleaned
- `leave()` - the LinkedIn exit, so no effect hardcodes the URL
- `game` - read-only state plus `initiate()`, for effects like the
  cheat button (idea 13)
- `reduceMotion` - boolean; effects honour it, runner enforces it
- `onDispose(fn)` - register cleanup alongside the return value

## Runner rules

1. **One active effect.** Starting a new one calls the previous
   cleanup. This keeps the wall sane when players mash several special
   buttons, and makes looping effects (breathing wall, metronome)
   cancellable by design.
2. **Effects auto-cancel** on boom, on win, and before unload.
3. **Effects never initiate the minefield.** The game starts only from
   a plain button (settles design question 1 from button_ideas.md).
4. **Island placement is safe and diggable.** An effect button placed
   in the island is guaranteed not to be a mine, reveals as a normal
   blank cell, counts toward the win, and fires its effect on first
   click. The board stays clearable no matter how many effects exist.
5. **Exit effects (`exits: true`) are placed in the ring only**, so
   rickroll and friends can never break a game in progress.
6. **Conflict resolution:** two effects claiming the same fixed
   placement - deterministic order (filename sort), last one wins;
   Vite warns in dev. Random placements are seeded per load, distinct
   by construction.
7. **Per-load cap:** a configurable maximum of active specials per
   load (default ~6 random + all fixed placements), so the wall never
   becomes more surprise than game as the directory grows.

## Dev workflow and testing

- `npm run dev` - Vite dev server with HMR; editing an effect updates
  live, adding a new file triggers an automatic reload (glob updates)
- `npm run build` - emits the single `dist/index.html`
- `?effect=ripple` query param (dev only) force-fires an effect in
  isolation for testing
- The seeded-random Playwright suite carries over unchanged; add one
  smoke test per effect: fire it, assert its DOM signature, assert
  cleanup ran (click a second effect, assert the first fully reverted)
- Every effect file is a natural unit for review: one file, one idea,
  self-describing

## Deployment

GitHub Pages needs the build step now. Standard workflow: on push to
master, an Action runs `npm run build` and publishes `dist/` (about 20
lines of YAML). The live site remains one static file.

## Migration phases

**Phase 0 - restructure, no behaviour change.** Move the inline CSS and
JS into `src/`, install Vite + singlefile, verify the built page passes
the existing Playwright suite bit-for-bit. Acceptance: identical
behaviour, `dist/index.html` stands alone.

**Phase 1 - extract the contract.** Split `game.js`, `board.js`,
`context.js`; implement the runner with the cancellation rules. Port
exactly one effect (ripple - it is the load wave with a moved origin,
so `stagger()` falls out of code the site already has). Acceptance:
ripple fires from the centre button, cancels cleanly, game unaffected.

**Phase 2 - assignment.** Placement resolution, island safety rules,
per-load cap, exit-effect ring placement. Port earthquake and theme
flip to exercise fixed, random and stateful effects. Acceptance:
seeded tests for boom and win still pass with specials present.

**Phase 3 - docs and template.** `_template.js` with the contract
commented, `EFFECTS.md` (recipes: how to write a motion effect, a theme
effect, an overlay joke), and the first batch from the ideas list.

**Phase 4 - the backlog.** Effects get built one file at a time from
button_ideas.md as chosen, each with its smoke test.

## Open questions for Marc

1. Framework or no framework - Path B is the recommendation, but if
   the itch is "I want to learn a framework on this site", Svelte is
   the one that suits it, and this plan ports to it cleanly later
2. Per-load cap on random specials - 6 feel right, tastes vary
3. Should specials get a subtle hover tell (button_ideas.md question 4)
   or stay perfectly disguised
4. The one-file identity: worth preserving via the singlefile plugin,
   or happy for the site to become normal static assets