# marclewis.io
domain homepage

The homepage is a wall of linkedin buttons in running bond, rotated
-5deg. The wall is scenery; buttons are inert until an effect is
assigned to them. The one live button is the bomb: click it and the
minesweeper island wakes up out of the wall. Boom or a full clear both
end the only way anything ends here: LinkedIn.

- `index.html` - the shell
- `src/board.js` - the wall: bond geometry, island sizing, load wipe
- `src/effects/` - self-contained effects; drop a file in and it gets picked up
- `src/main.js` - boot, effect discovery, the runner

Dev: `npm run dev` (hot reload). Build: `npm run build` - emits a single
self-contained `dist/index.html`, so the site stays one file.

Effects export `meta` (id, name, label, placement) and `run(ctx)`, and
`run` returns a cleanup function. The context hands effects the button
grid, cell activation, click/flag routing, the stagger helper, the theme
setter, `leave()`, and `done()` for transient effects that finish on their
own. One effect runs at a time; starting a new one cleans up the old. Full plan: `plans/2026-09-09-button-plugin-system.md`. Idea
backlog: `button_ideas.md` and `button_ideas_big_list.md`.