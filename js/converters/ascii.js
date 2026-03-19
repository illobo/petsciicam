const CHAR_RAMP = ' .,:;i1tfLCG08@';

export class AsciiConverter {
  constructor() {
    this.bitmaps = null;
  }

  convert(imageData) {
    if (!this.bitmaps) this.bitmaps = buildBitmaps();
    const { width, height, data } = imageData;
    const len = width * height;
    const cells = new Array(len);
    const rampLen = CHAR_RAMP.length;

    for (let i = 0; i < len; i++) {
      const idx = i * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const ci = Math.min(Math.floor(lum / 256 * rampLen), rampLen - 1);
      cells[i] = { bitmap: this.bitmaps[ci], fg: [r, g, b], bg: [0, 0, 0] };
    }
    return cells;
  }
}

function buildBitmaps() {
  const cvs = document.createElement('canvas');
  cvs.width = 8;
  cvs.height = 8;
  const ctx = cvs.getContext('2d');

  return CHAR_RAMP.split('').map(ch => {
    ctx.clearRect(0, 0, 8, 8);
    if (ch !== ' ') {
      ctx.fillStyle = '#fff';
      ctx.font = '8px monospace';
      ctx.textBaseline = 'top';
      ctx.textAlign = 'center';
      ctx.fillText(ch, 4, 0);
    }
    const d = ctx.getImageData(0, 0, 8, 8).data;
    const bitmap = new Uint8Array(8);
    for (let y = 0; y < 8; y++) {
      let row = 0;
      for (let x = 0; x < 8; x++) {
        if (d[(y * 8 + x) * 4 + 3] > 64) row |= (1 << (7 - x));
      }
      bitmap[y] = row;
    }
    return bitmap;
  });
}
