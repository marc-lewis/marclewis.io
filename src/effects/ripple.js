/*
 * Ripple wave (idea 1).
 *
 * The load wave with its origin moved: click and the whole wall
 * leaps in sequence, spreading outward from here like a ripple
 * through water. Over in a moment, then ctx.done() hands the wall
 * back so the button can fire again.
 */

export const meta = {
    id: 'ripple',
    name: 'Ripple wave',
    label: '\u{1F30A}',
    placement: 'spiral',
};

export function run(ctx) {
    let cancel = null;

    if (!ctx.reduceMotion) {
        cancel = ctx.stagger(ctx.buttons, { from: ctx.origin });

        // let the wave cross the whole wall, then hand back
        const far = ctx.buttons.reduce((max, cell) => Math.max(max, Math.hypot(
            cell.el.offsetLeft - ctx.origin.el.offsetLeft,
            cell.el.offsetTop - ctx.origin.el.offsetTop
        )), 0);
        setTimeout(ctx.done, Math.round(far) + 800);
    } else {
        // a ripple with no wave is just a moment of calm
        setTimeout(ctx.done, 50);
    }

    return () => {
        if (cancel) cancel();
    };
}