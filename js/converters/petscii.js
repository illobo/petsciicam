// C64 16-color palette
const C64 = [
  [0x00,0x00,0x00],[0xFF,0xFF,0xFF],[0x88,0x00,0x00],[0xAA,0xFF,0xEE],
  [0xCC,0x44,0xCC],[0x00,0xCC,0x55],[0x00,0x00,0xAA],[0xEE,0xEE,0x77],
  [0xDD,0x88,0x55],[0x66,0x44,0x00],[0xFF,0x77,0x77],[0x33,0x33,0x33],
  [0x77,0x77,0x77],[0xAA,0xFF,0x66],[0x00,0x88,0xFF],[0xBB,0xBB,0xBB],
];
const C64_LUM = C64.map(([r,g,b]) => 0.299*r + 0.587*g + 0.114*b);

// PETSCII block bitmaps (8 bytes each, MSB = leftmost pixel)
const BMP = {
  space:      [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
  solid:      [0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF],
  checker_a:  [0xAA,0x55,0xAA,0x55,0xAA,0x55,0xAA,0x55],
  checker_b:  [0x55,0xAA,0x55,0xAA,0x55,0xAA,0x55,0xAA],
  quarter_ul: [0xF0,0xF0,0xF0,0xF0,0x00,0x00,0x00,0x00],
  quarter_lr: [0x00,0x00,0x00,0x00,0x0F,0x0F,0x0F,0x0F],
  three_q_a:  [0x0F,0x0F,0x0F,0x0F,0xFF,0xFF,0xFF,0xFF],
  three_q_b:  [0xFF,0xFF,0xFF,0xFF,0xF0,0xF0,0xF0,0xF0],
};

function pickBitmap(level, x, y) {
  const phase = (x + y) & 1;
  switch (level) {
    case 0: return BMP.space;
    case 1: return phase ? BMP.quarter_lr : BMP.quarter_ul;
    case 2: return phase ? BMP.checker_b  : BMP.checker_a;
    case 3: return phase ? BMP.three_q_b  : BMP.three_q_a;
    case 4: return BMP.solid;
  }
  return BMP.space;
}

export class PetsciiConverter {
  constructor() {
    this.colored = true;
    this.fgColor = [0, 255, 0]; // phosphor green
    this.bgColor = [0, 0, 0];
  }

  setMode(colored) { this.colored = colored; }

  convert(imageData) {
    const { width, height, data } = imageData;
    const cells = new Array(width * height);
    if (this.colored) {
      this._color(data, cells, width, height);
    } else {
      this._bw(data, cells, width, height);
    }
    return cells;
  }

  _bw(data, cells, w, h) {
    const fg = this.fgColor, bg = this.bgColor;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const lum = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
        const level = Math.min(4, Math.round(lum / 255 * 4));
        cells[y * w + x] = { bitmap: pickBitmap(level, x, y), fg, bg };
      }
    }
  }

  _color(data, cells, w, h) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const pr = data[i], pg = data[i+1], pb = data[i+2];

        // Find top 4 closest palette colors
        let c0=-1,c1=-1,c2=-1,c3=-1;
        let d0=1e9,d1=1e9,d2=1e9,d3=1e9;
        for (let c = 0; c < 16; c++) {
          const cr = C64[c][0], cg = C64[c][1], cb = C64[c][2];
          const d = (pr-cr)*(pr-cr) + (pg-cg)*(pg-cg) + (pb-cb)*(pb-cb);
          if (d < d0)      { d3=d2;c3=c2; d2=d1;c2=c1; d1=d0;c1=c0; d0=d;c0=c; }
          else if (d < d1) { d3=d2;c3=c2; d2=d1;c2=c1; d1=d;c1=c; }
          else if (d < d2) { d3=d2;c3=c2; d2=d;c2=c; }
          else if (d < d3) { d3=d;c3=c; }
        }

        // Check all pairs from top 4, at 5 dither levels
        let bestDist = 1e9, bestFg = c0, bestBg = 0, bestLevel = 4;
        const top = [c0, c1, c2, c3];

        for (let a = 0; a < 4; a++) {
          if (top[a] < 0) continue;
          for (let b = a + 1; b < 4; b++) {
            if (top[b] < 0) continue;
            const fc = C64[top[a]], bc = C64[top[b]];
            for (let lv = 0; lv < 5; lv++) {
              const t = lv * 0.25;
              const mr = bc[0] + t * (fc[0] - bc[0]);
              const mg = bc[1] + t * (fc[1] - bc[1]);
              const mb = bc[2] + t * (fc[2] - bc[2]);
              const dr = pr - mr, dg = pg - mg, db = pb - mb;
              const dist = dr*dr + dg*dg + db*db;
              if (dist < bestDist) {
                bestDist = dist;
                bestFg = top[a];
                bestBg = top[b];
                bestLevel = lv;
              }
            }
          }
        }

        // Also check single-color match (solid or space)
        if (d0 < bestDist) {
          bestDist = d0;
          bestFg = c0;
          bestBg = c0;
          bestLevel = 4;
        }

        cells[y * w + x] = {
          bitmap: pickBitmap(bestLevel, x, y),
          fg: C64[bestFg],
          bg: C64[bestBg],
        };
      }
    }
  }
}
