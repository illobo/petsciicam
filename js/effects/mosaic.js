export class MosaicEffect {
  constructor() { this.blockSize = 4; }

  process(imageData) {
    const { width, height, data: d } = imageData;
    const bs = this.blockSize;

    for (let by = 0; by < height; by += bs) {
      for (let bx = 0; bx < width; bx += bs) {
        let r = 0, g = 0, b = 0, count = 0;
        for (let dy = 0; dy < bs && by + dy < height; dy++) {
          for (let dx = 0; dx < bs && bx + dx < width; dx++) {
            const i = ((by + dy) * width + (bx + dx)) * 4;
            r += d[i]; g += d[i+1]; b += d[i+2];
            count++;
          }
        }
        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);
        for (let dy = 0; dy < bs && by + dy < height; dy++) {
          for (let dx = 0; dx < bs && bx + dx < width; dx++) {
            const i = ((by + dy) * width + (bx + dx)) * 4;
            d[i] = r; d[i+1] = g; d[i+2] = b;
          }
        }
      }
    }
    return imageData;
  }
}
