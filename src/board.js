/*
 * The wall. Pure geometry: the brick bond, the island that fits the
 * viewport, and the diagonal load wipe. Buttons are created here, but
 * they know nothing about games or effects - those live in src/effects/.
 */

const LINK = 'https://www.linkedin.com/in/marc-lewis-58a2b37b/';

const cssNumber = (root, name) =>
    parseFloat(getComputedStyle(root).getPropertyValue(name));

const makeCell = (i, row, col) => {
    const el = document.createElement('a');
    el.className = 'btn';
    el.dataset.i = String(i);
    el.href = LINK;
    el.tabIndex = -1;
    el.textContent = 'linkedin';
    return { el, i, row, col, island: false, wall: true };
};

export const build = (sheet, root) => {
    const probe = sheet.appendChild(makeCell(0, 0, 0).el);
    const gap = cssNumber(root, '--gap');
    const across = probe.offsetWidth + gap;
    const down = probe.offsetHeight + gap;
    probe.remove();
    const half = across / 2; // the running bond offset

    // the wall fills the oversized sheet
    const cols = Math.max(3, Math.floor(sheet.offsetWidth / across));
    const rows = Math.max(3, Math.floor(sheet.offsetHeight / down));

    // the island: the largest region whose rotated box fits the viewport
    const tilt = 5 * Math.PI / 180;
    const margin = 24;
    const fits = (c, r) => {
        const w = c * across - gap + half; // odd courses reach half a button further
        const h = r * down - gap;
        return w * Math.cos(tilt) + h * Math.sin(tilt) <= innerWidth - 2 * margin
            && w * Math.sin(tilt) + h * Math.cos(tilt) <= innerHeight - 2 * margin;
    };

    let boardCols = 3;
    let boardRows = 3;
    outer:
    for (let c = Math.min(cols, Math.floor(innerWidth / across)); c >= 3; c -= 1) {
        for (let r = Math.min(rows, Math.floor(innerHeight / down)); r >= 3; r -= 1) {
            if (fits(c, r)) {
                boardCols = c;
                boardRows = r;
                break outer;
            }
        }
    }
    boardCols = Math.min(boardCols, cols);
    boardRows = Math.min(boardRows, rows);
    const startCol = Math.floor((cols - boardCols) / 2);
    const startRow = Math.floor((rows - boardRows) / 2);

    // centre the island's true bounding box on the sheet's centre,
    // so the rotated field sits centred in the viewport
    const islandW = boardCols * across - gap + half;
    const islandH = boardRows * down - gap;
    const originX = sheet.offsetWidth / 2 - startCol * across - islandW / 2;
    const originY = sheet.offsetHeight / 2 - startRow * down - islandH / 2;

    // the wipe runs diagonally from top left to bottom right: each
    // button waits in proportion to its travel along that diagonal
    const scale = cssNumber(root, '--wipe-sweep') / Math.max(1, (cols - 1) * across + (rows - 1) * down);

    const cells = [];
    for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
            const cell = makeCell(cells.length, row, col);
            cell.el.style.left = (originX + col * across + (row % 2 ? half : 0)) + 'px';
            cell.el.style.top = (originY + row * down) + 'px';
            cell.el.style.setProperty('--d', Math.round((col * across + row * down) * scale) + 'ms');
            cell.island = col >= startCol && col < startCol + boardCols
                && row >= startRow && row < startRow + boardRows;
            cell.wall = !cell.island;
            cells.push(cell);
        }
    }
    sheet.replaceChildren(...cells.map((cell) => cell.el));

    return { cells, cols, rows };
};