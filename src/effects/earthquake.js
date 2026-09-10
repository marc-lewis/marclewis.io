/*
 * Earthquake (idea 6).
 *
 * A scenery brick, found somewhere in the wall. Click it and the
 * camera shakes, every button rattles on its own short delay, and a
 * few bricks near the epicentre end up cracked a degree or two.
 * The wall settles slightly wrong, forever.
 *
 * The quake is over in under two seconds, when it calls ctx.done():
 * the runner tears it down and the brick can quake again. Starting
 * another effect mid-quake cancels it the usual way.
 */

export const meta = {
    id: 'earthquake',
    name: 'Earthquake',
    label: '\u{1F4F3}',
    placement: 'spiral', // winds outward from the middle, always on screen
};

export function run(ctx) {
    const { buttons, origin } = ctx;
    let shake = null;
    let rattles = [];

    if (!ctx.reduceMotion) {
        // camera shake: the field jitters, not the sheet, so the bond
        // geometry and the island maths are untouched
        shake = ctx.field.animate([
            { transform: 'translate(0, 0)' },
            { transform: 'translate(-7px, 4px)' },
            { transform: 'translate(6px, -5px)' },
            { transform: 'translate(-5px, -4px)' },
            { transform: 'translate(7px, 3px)' },
            { transform: 'translate(-3px, 5px)' },
            { transform: 'translate(0, 0)' },
        ], { duration: 1000, easing: 'ease-in-out' });

        // every brick rattles, each on its own short delay
        rattles = buttons.map((cell) => cell.el.animate([
            { transform: 'translate(0, 0)' },
            { transform: `translate(${Math.round(Math.random() * 6 - 3)}px, ${Math.round(Math.random() * 6 - 3)}px)` },
            { transform: 'translate(0, 0)' },
        ], {
            delay: Math.random() * 500,
            duration: 500,
            iterations: 2,
            easing: 'ease-in-out',
        }));
    }

    // a few bricks near the epicentre end up cracked, forever
    const near = buttons
        .filter((cell) => !cell.island && !cell.effect)
        .map((cell) => ({
            cell,
            distance: Math.hypot(
                cell.el.offsetLeft - origin.el.offsetLeft,
                cell.el.offsetTop - origin.el.offsetTop
            ),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 10);
    const crackCount = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < crackCount && near.length; i += 1) {
        const pick = near.splice(Math.floor(Math.random() * near.length), 1)[0];
        const angle = (1 + Math.random()) * (Math.random() < 0.5 ? -1 : 1);
        pick.cell.el.style.transform = `rotate(${angle.toFixed(2)}deg)`;
    }

    // the quake is over; hand the wall back
    setTimeout(ctx.done, 1700);

    return () => {
        if (shake) shake.cancel();
        rattles.forEach((animation) => animation.cancel());
    };
}