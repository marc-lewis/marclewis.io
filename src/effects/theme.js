/*
 * Colour change (idea 3).
 *
 * A palette brick. Click it and the whole wall changes clothes:
 * dark mode, blueprint, terminal, and back to classic. The theme
 * is site state, not effect state - it outlives games, quakes and
 * ripples, and only a reload returns the wall to classic.
 */

const themes = [
    { ink: '#333333', page: '#ffffff', dug: '#f0f0f0' },                 // classic
    { ink: '#eeeeee', page: '#111111', dug: '#1c1c1c', dark: true },    // dark
    { ink: '#d7e3f4', page: '#16324f', dug: '#1d3d63', dark: true },    // blueprint
    { ink: '#9ece6a', page: '#0d0d0d', dug: '#161616', dark: true },    // terminal
];

let current = 0;

export const meta = {
    id: 'theme',
    name: 'Colour change',
    label: '\u{1F3A8}',
    placement: 'spiral',
};

export function run(ctx) {
    current = (current + 1) % themes.length;
    ctx.theme.set(themes[current]);
    // the palette stays; the button is immediately re-clickable
    setTimeout(ctx.done, 50);
    return null;
}