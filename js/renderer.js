export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.imageData = null;
    this.canvasW = 0;
    this.canvasH = 0;
  }

  draw(cells, gridWidth, gridHeight) {
    const cw = gridWidth * 8;
    const ch = gridHeight * 8;

    if (this.canvasW !== cw || this.canvasH !== ch) {
      this.canvas.width = cw;
      this.canvas.height = ch;
      this.canvasW = cw;
      this.canvasH = ch;
      this.imageData = this.ctx.createImageData(cw, ch);
    }

    const pixels = this.imageData.data;

    for (let gy = 0; gy < gridHeight; gy++) {
      for (let gx = 0; gx < gridWidth; gx++) {
        const cell = cells[gy * gridWidth + gx];
        const bmp = cell.bitmap;
        const fgR = cell.fg[0], fgG = cell.fg[1], fgB = cell.fg[2];
        const bgR = cell.bg[0], bgG = cell.bg[1], bgB = cell.bg[2];

        for (let py = 0; py < 8; py++) {
          const row = bmp[py];
          const baseIdx = ((gy * 8 + py) * cw + gx * 8) * 4;
          for (let px = 0; px < 8; px++) {
            const idx = baseIdx + px * 4;
            if ((row >> (7 - px)) & 1) {
              pixels[idx] = fgR;
              pixels[idx + 1] = fgG;
              pixels[idx + 2] = fgB;
            } else {
              pixels[idx] = bgR;
              pixels[idx + 1] = bgG;
              pixels[idx + 2] = bgB;
            }
            pixels[idx + 3] = 255;
          }
        }
      }
    }

    this.ctx.putImageData(this.imageData, 0, 0);
  }
}
