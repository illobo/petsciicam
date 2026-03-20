// C64 16-color palette (same as petscii.js)
const C64 = [
  [0x00,0x00,0x00],[0xFF,0xFF,0xFF],[0x88,0x00,0x00],[0xAA,0xFF,0xEE],
  [0xCC,0x44,0xCC],[0x00,0xCC,0x55],[0x00,0x00,0xAA],[0xEE,0xEE,0x77],
  [0xDD,0x88,0x55],[0x66,0x44,0x00],[0xFF,0x77,0x77],[0x33,0x33,0x33],
  [0x77,0x77,0x77],[0xAA,0xFF,0x66],[0x00,0x88,0xFF],[0xBB,0xBB,0xBB],
];

/**
 * Full 256-character PETSCII converter.
 *
 * Requires blockSize=8: the pipeline captures at gridW*8 × gridH*8 pixels,
 * giving one 8×8 source block per output character cell.
 *
 * Algorithm (color mode):
 *   1. For each 8×8 block, compute the average RGB and find the 2 nearest C64 colors.
 *   2. Precompute per-pixel squared-distance delta: diff[p] = fgScore[p] - bgScore[p].
 *   3. For each of 256 chars: score = totalBgScore + Σ(bit_p × diff[p]).
 *      This is a fast dot-product — no multiply inside the char loop.
 *   4. Swap fg/bg and repeat; keep the global minimum.
 */
export class PetsciiFullConverter {
  constructor() {
    this.bitmaps = null;
    this.colored = true;
    this.fgColor = [0, 255, 0];
    this.bgColor = [0, 0, 0];
    this.blockSize = 8; // tells pipeline to capture at 8× resolution

    // Reusable typed arrays — allocated once
    this._diff = new Int32Array(64);
    this._blockR = new Uint8Array(64);
    this._blockG = new Uint8Array(64);
    this._blockB = new Uint8Array(64);
  }

  get ready() { return this.bitmaps !== null; }

  setCharset(bitmaps) { this.bitmaps = bitmaps; }
  setMode(colored) { this.colored = colored; }

  convert(imageData) {
    if (!this.bitmaps) return null;
    const { width, height } = imageData;
    const gridW = (width / 8) | 0;
    const gridH = (height / 8) | 0;
    const cells = new Array(gridW * gridH);
    if (this.colored) {
      this._color(imageData.data, cells, gridW, gridH, width);
    } else {
      this._bw(imageData.data, cells, gridW, gridH, width);
    }
    return cells;
  }

  _color(data, cells, gridW, gridH, W) {
    const { _diff: diff, _blockR: blockR, _blockG: blockG, _blockB: blockB, bitmaps } = this;

    for (let gy = 0; gy < gridH; gy++) {
      for (let gx = 0; gx < gridW; gx++) {
        // Extract 8×8 block and compute average color
        let sumR = 0, sumG = 0, sumB = 0;
        for (let py = 0; py < 8; py++) {
          for (let px = 0; px < 8; px++) {
            const src = ((gy * 8 + py) * W + (gx * 8 + px)) * 4;
            const p = py * 8 + px;
            blockR[p] = data[src];
            blockG[p] = data[src + 1];
            blockB[p] = data[src + 2];
            sumR += blockR[p]; sumG += blockG[p]; sumB += blockB[p];
          }
        }
        const avgR = (sumR / 64) | 0;
        const avgG = (sumG / 64) | 0;
        const avgB = (sumB / 64) | 0;

        // Find 2 nearest C64 colors to block average
        let c0 = 0, c1 = 1, d0 = 1e9, d1 = 1e9;
        for (let c = 0; c < 16; c++) {
          const dr = avgR - C64[c][0], dg = avgG - C64[c][1], db = avgB - C64[c][2];
          const d = dr * dr + dg * dg + db * db;
          if (d < d0) { d1 = d0; c1 = c0; d0 = d; c0 = c; }
          else if (d < d1) { d1 = d; c1 = c; }
        }

        let bestScore = Infinity, bestChar = 0, bestFg = c0, bestBg = c1;

        // Test both color assignments: (c0=fg, c1=bg) and swapped
        for (let swap = 0; swap < 2; swap++) {
          const fgIdx = swap === 0 ? c0 : c1;
          const bgIdx = swap === 0 ? c1 : c0;
          const fgR = C64[fgIdx][0], fgG = C64[fgIdx][1], fgB = C64[fgIdx][2];
          const bgR = C64[bgIdx][0], bgG = C64[bgIdx][1], bgB = C64[bgIdx][2];

          // Precompute per-pixel score delta and total background score
          let totalBg = 0;
          for (let p = 0; p < 64; p++) {
            const drf = blockR[p] - fgR, dgf = blockG[p] - fgG, dbf = blockB[p] - fgB;
            const drb = blockR[p] - bgR, dgb = blockG[p] - bgG, dbb = blockB[p] - bgB;
            const fs = drf * drf + dgf * dgf + dbf * dbf;
            const bs = drb * drb + dgb * dgb + dbb * dbb;
            diff[p] = fs - bs;
            totalBg += bs;
          }

          // Score each character via fast dot-product (no multiplications in inner loop)
          for (let ci = 0; ci < bitmaps.length; ci++) {
            const bmp = bitmaps[ci];
            let score = totalBg;
            for (let row = 0; row < 8; row++) {
              const byte = bmp[row];
              const base = row * 8;
              if (byte & 0x80) score += diff[base];
              if (byte & 0x40) score += diff[base + 1];
              if (byte & 0x20) score += diff[base + 2];
              if (byte & 0x10) score += diff[base + 3];
              if (byte & 0x08) score += diff[base + 4];
              if (byte & 0x04) score += diff[base + 5];
              if (byte & 0x02) score += diff[base + 6];
              if (byte & 0x01) score += diff[base + 7];
            }
            if (score < bestScore) {
              bestScore = score;
              bestChar = ci;
              bestFg = fgIdx;
              bestBg = bgIdx;
            }
          }
        }

        cells[gy * gridW + gx] = {
          bitmap: bitmaps[bestChar],
          fg: C64[bestFg],
          bg: C64[bestBg],
        };
      }
    }
  }

  _bw(data, cells, gridW, gridH, W) {
    const { _diff: diff, bitmaps } = this;
    const fg = this.fgColor;
    const bg = this.bgColor;

    for (let gy = 0; gy < gridH; gy++) {
      for (let gx = 0; gx < gridW; gx++) {
        // Precompute per-pixel luma diff vs white(255) / black(0)
        // diff[p] = (lum-255)² - lum² = 65025 - 510*lum
        let totalBg = 0;
        for (let py = 0; py < 8; py++) {
          for (let px = 0; px < 8; px++) {
            const src = ((gy * 8 + py) * W + (gx * 8 + px)) * 4;
            const l = (0.299 * data[src] + 0.587 * data[src + 1] + 0.114 * data[src + 2]) | 0;
            diff[py * 8 + px] = 65025 - 510 * l;
            totalBg += l * l;
          }
        }

        let bestScore = Infinity, bestChar = 0;
        for (let ci = 0; ci < bitmaps.length; ci++) {
          const bmp = bitmaps[ci];
          let score = totalBg;
          for (let row = 0; row < 8; row++) {
            const byte = bmp[row];
            const base = row * 8;
            if (byte & 0x80) score += diff[base];
            if (byte & 0x40) score += diff[base + 1];
            if (byte & 0x20) score += diff[base + 2];
            if (byte & 0x10) score += diff[base + 3];
            if (byte & 0x08) score += diff[base + 4];
            if (byte & 0x04) score += diff[base + 5];
            if (byte & 0x02) score += diff[base + 6];
            if (byte & 0x01) score += diff[base + 7];
          }
          if (score < bestScore) { bestScore = score; bestChar = ci; }
        }

        cells[gy * gridW + gx] = { bitmap: bitmaps[bestChar], fg, bg };
      }
    }
  }
}
