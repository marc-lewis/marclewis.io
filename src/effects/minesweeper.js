/*
 * Minesweeper, the first plugin.
 *
 * The wall is scenery until this button wakes the island: the field
 * blooms out of the wall and the game begins. The bomb button itself
 * stays a monument - never a cell to dig - and clicking it mid-game
 * does nothing at all.
 *
 * Numbers count only the bricks that truly touch: six neighbours on
 * the running bond. The first dig is always safe and always clears a
 * pocket. Boom or a full clear both end the only way anything ends
 * here: LinkedIn.
 */

export const meta = {
    id: 'minesweeper',
    name: 'Minesweeper',
    label: '\u{1F4A3}',
    placement: 'centre', // resolves to the island centre at build time
    zone: 'island',
};

export function run(ctx) {
    const { buttons, grid } = ctx;
    const origin = ctx.origin;

    // the bomb button is a monument, not a cell
    origin.wall = true;

    // wake the island: it blooms out of the scenery
    const field = buttons.filter((cell) => cell.island && !cell.wall);
    field.forEach((cell) => ctx.activate(cell));

    // six visual neighbours, as the bond dictates
    const neighbours = (cell) => {
        const around = [];
        const cross = cell.row % 2 === 0 ? [-1, 0] : [0, 1];
        const push = (row, col) => {
            if (row < 0 || col < 0 || row >= grid.rows || col >= grid.cols) return;
            const n = buttons[row * grid.cols + col];
            if (!n.wall) around.push(n);
        };
        push(cell.row - 1, cell.col + cross[0]);
        push(cell.row - 1, cell.col + cross[1]);
        push(cell.row + 1, cell.col + cross[0]);
        push(cell.row + 1, cell.col + cross[1]);
        push(cell.row, cell.col - 1);
        push(cell.row, cell.col + 1);
        return around;
    };

    const mineCount = Math.max(1, Math.round(field.length * 0.15));
    let minesPlaced = false;
    let opened = 0;
    let over = false;

    // mines go in after the first dig, kept out of a pocket around the
    // opening click: the first dig is always safe, and always clears
    const placeMines = (first) => {
        const safe = new Set([first.i, ...neighbours(first).map((n) => n.i)]);
        let placed = 0;
        let attempts = 0;
        while (placed < mineCount && attempts < buttons.length * 20) {
            attempts += 1;
            const i = Math.floor(Math.random() * buttons.length);
            const cell = buttons[i];
            if (cell.wall || safe.has(i) || cell.mine) continue;
            cell.mine = true;
            placed += 1;
        }
        buttons.forEach((cell) => {
            if (!cell.wall) cell.count = neighbours(cell).filter((n) => n.mine).length;
        });
        minesPlaced = true;
    };

    const revealCell = (cell) => {
        if (over || cell.open || cell.flag || cell.wall) return;
        if (!minesPlaced) placeMines(cell);

        cell.open = true;
        opened += 1;
        cell.el.classList.add('cell--open');

        if (cell.mine) {
            boom(cell);
            return;
        }

        if (cell.count) {
            cell.el.textContent = cell.count;
            cell.el.classList.add('cell--n' + cell.count);
        } else {
            // a space, not an empty string: an empty cell has no line
            // box and the button would shrink
            cell.el.textContent = '\u00a0';
            neighbours(cell).forEach(revealCell);
        }

        if (opened === field.length - mineCount) win();
    };

    const toggleFlag = (cell) => {
        if (over || cell.open || cell.wall) return;
        cell.flag = !cell.flag;
        cell.el.classList.toggle('cell--flag', cell.flag);
    };

    // clicking a revealed number with its flags placed digs the rest
    const chord = (cell) => {
        const around = neighbours(cell);
        if (around.filter((n) => n.flag).length !== cell.count) return;
        around.forEach((n) => {
            if (!n.flag && !n.open) revealCell(n);
        });
    };

    const leave = () => {
        over = true;
        ctx.leave();
    };

    const boom = (cell) => {
        cell.el.textContent = 'boom';
        cell.el.classList.add('cell--boom');
        buttons.forEach((c) => {
            if (c.mine && !c.flag) c.el.classList.add('cell--bomb');
        });
        leave();
    };

    const win = () => {
        buttons.forEach((c) => { c.el.textContent = 'linkedin'; });
        ctx.field.classList.add('field--won');
        leave();
    };

    ctx.onClick((cell) => {
        if (over) return;
        if (cell.open) chord(cell);
        else revealCell(cell);
    });

    ctx.onFlag((cell) => {
        if (!over) toggleFlag(cell);
    });

    return () => {
        // full reset: the game can be cancelled mid-run by another
        // effect, and the bomb must be able to start it fresh
        over = true;
        opened = 0;
        minesPlaced = false;
        field.forEach((cell) => {
            cell.mine = false;
            cell.count = 0;
            cell.open = false;
            cell.flag = false;
            cell.el.classList.remove('cell--open', 'cell--flag', 'cell--bomb', 'cell--boom',
                'cell--n1', 'cell--n2', 'cell--n3', 'cell--n4', 'cell--n5', 'cell--n6');
            cell.el.textContent = 'linkedin';
            ctx.deactivate(cell);
        });
        ctx.field.classList.remove('field--won');
    };
}