// C64 16-color palette
const C64 = [
  [0x00,0x00,0x00],[0xFF,0xFF,0xFF],[0x88,0x00,0x00],[0xAA,0xFF,0xEE],
  [0xCC,0x44,0xCC],[0x00,0xCC,0x55],[0x00,0x00,0xAA],[0xEE,0xEE,0x77],
  [0xDD,0x88,0x55],[0x66,0x44,0x00],[0xFF,0x77,0x77],[0x33,0x33,0x33],
  [0x77,0x77,0x77],[0xAA,0xFF,0x66],[0x00,0x88,0xFF],[0xBB,0xBB,0xBB],
];

/**
 * Hybrid converter — best of both worlds:
 *   - blockSize=1: each output cell maps to a single input pixel (fine-grained
 *     per-cell color dithering, like the original PetsciiConverter).
 *   - Full 256-char charset: far more visual variety than 8 block bitmaps.
 *
 * Color algorithm:
 *   For each pixel, find the top 4 nearest C64 colors. For each of the 6
 *   unordered pairs (both orientations), find the optimal bit-count density
 *   by iterating the 65 possible levels (0..64 set bits). The average rendered
 *   color of a char with bc set bits and (fg, bg) colors is:
 *     avg = bc/64 * fg + (64-bc)/64 * bg
 *   Pick the (pair, density) with minimum squared distance to the source pixel.
 *   Among all chars at the winning density, vary by position (gx, gy) so that
 *   adjacent cells use different patterns — creating rich texture.
 *
 * B/W algorithm: find the char whose bit count best matches lum/255*64,
 * again varied by position for texture diversity.
 */
export class HybridConverter {
  constructor() {
    this.bitmaps = null;
    this.colored = true;
    this.fgColor = [0, 255, 0];
    this.bgColor = [0, 0, 0];
    this.blockSize = 1;

    this._charsByBitCount = null; // Array[65] of char index lists
    this._closestBC = null;       // Uint8Array[65]: nearest available bc per target
  }

  get ready() { return this.bitmaps !== null; }

  setCharset(bitmaps) {
    this.bitmaps = bitmaps;

    // Count set bits for each char
    const bitCount = bitmaps.map(bmp => {
      let n = 0;
      for (const byte of bmp) { let b = byte; while (b) { n += b & 1; b >>>= 1; } }
      return n;
    });

    // Group char indices by bit count
    const byBC = Array.from({ length: 65 }, () => []);
    bitCount.forEach((bc, ci) => byBC[bc].push(ci));
    this._charsByBitCount = byBC;

    // Precompute nearest available bit count for each target 0..64
    const closestBC = new Uint8Array(65);
    for (let t = 0; t <= 64; t++) {
      let bestBC = 0, bestDiff = Infinity;
      for (let bc = 0; bc <= 64; bc++) {
        if (byBC[bc].length === 0) continue;
        const d = Math.abs(bc - t);
        if (d < bestDiff) { bestDiff = d; bestBC = bc; }
      }
      closestBC[t] = bestBC;
    }
    this._closestBC = closestBC;
  }

  setMode(colored) { this.colored = colored; }

  convert(imageData) {
    if (!this.bitmaps) return null;
    const { width: gridW, height: gridH, data } = imageData;
    const cells = new Array(gridW * gridH);
    if (this.colored) {
      this._color(data, cells, gridW, gridH);
    } else {
      this._bw(data, cells, gridW, gridH);
    }
    return cells;
  }

  _color(data, cells, gridW, gridH) {
    const { bitmaps, _charsByBitCount: byBC, _closestBC: closestBC } = this;

    for (let gy = 0; gy < gridH; gy++) {
      for (let gx = 0; gx < gridW; gx++) {
        const idx = (gy * gridW + gx) * 4;
        const pr = data[idx], pg = data[idx + 1], pb = data[idx + 2];

        // Find top 4 nearest C64 colors
        let c0=-1,c1=-1,c2=-1,c3=-1;
        let d0=1e9,d1=1e9,d2=1e9,d3=1e9;
        for (let c = 0; c < 16; c++) {
          const dr = pr-C64[c][0], dg = pg-C64[c][1], db = pb-C64[c][2];
          const d = dr*dr + dg*dg + db*db;
          if (d < d0)      { d3=d2;c3=c2; d2=d1;c2=c1; d1=d0;c1=c0; d0=d;c0=c; }
          else if (d < d1) { d3=d2;c3=c2; d2=d1;c2=c1; d1=d;c1=c; }
          else if (d < d2) { d3=d2;c3=c2; d2=d;c2=c; }
          else if (d < d3) { d3=d;c3=c; }
        }
        const top = [c0, c1, c2, c3];

        let bestDist = Infinity, bestFg = c0, bestBg = c0, bestBC = 64;

        // Test all 6 unordered pairs, both orientations, all 65 bit densities
        for (let a = 0; a < 4; a++) {
          if (top[a] < 0) continue;
          for (let b = a + 1; b < 4; b++) {
            if (top[b] < 0) continue;
            for (let swap = 0; swap < 2; swap++) {
              const fgIdx = swap === 0 ? top[a] : top[b];
              const bgIdx = swap === 0 ? top[b] : top[a];
              const fgR = C64[fgIdx][0], fgG = C64[fgIdx][1], fgB = C64[fgIdx][2];
              const bgR = C64[bgIdx][0], bgG = C64[bgIdx][1], bgB = C64[bgIdx][2];
              const dR = fgR - bgR, dG = fgG - bgG, dB = fgB - bgB;

              for (let bc = 0; bc <= 64; bc++) {
                if (byBC[bc].length === 0) continue;
                // avg rendered = bc/64 * fg + (64-bc)/64 * bg
                const mr = bgR + ((bc * dR) >> 6);
                const mg = bgG + ((bc * dG) >> 6);
                const mb = bgB + ((bc * dB) >> 6);
                const dr = pr - mr, dg = pg - mg, db = pb - mb;
                const dist = dr * dr + dg * dg + db * db;
                if (dist < bestDist) {
                  bestDist = dist; bestFg = fgIdx; bestBg = bgIdx; bestBC = bc;
                }
              }
            }
          }
        }

        // Among chars at winning density, vary by position for texture
        const candidates = byBC[closestBC[bestBC]];
        const picked = candidates[(gx * 3 + gy * 7) % candidates.length];
        cells[gy * gridW + gx] = {
          bitmap: bitmaps[picked],
          fg: C64[bestFg],
          bg: C64[bestBg],
        };
      }
    }
  }

  _bw(data, cells, gridW, gridH) {
    const { bitmaps, _charsByBitCount: byBC, _closestBC: closestBC } = this;
    const fg = this.fgColor, bg = this.bgColor;

    for (let gy = 0; gy < gridH; gy++) {
      for (let gx = 0; gx < gridW; gx++) {
        const i = gy * gridW + gx;
        const idx = i * 4;
        const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        const target = Math.min(64, Math.round(lum / 255 * 64));
        const bc = closestBC[target];
        const candidates = byBC[bc];
        const picked = candidates[(gx * 3 + gy * 7) % candidates.length];
        cells[i] = { bitmap: bitmaps[picked], fg, bg };
      }
    }
  }
}
