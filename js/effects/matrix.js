export class MatrixEffect {
  constructor() {
    this.columns = null;
    this.speeds = null;
  }

  process(imageData) {
    const { width, height, data: d } = imageData;

    if (!this.columns || this.columns.length !== width) {
      this.columns = new Float32Array(width);
      this.speeds = new Float32Array(width);
      for (let x = 0; x < width; x++) {
        this.columns[x] = Math.random() * height;
        this.speeds[x] = 0.3 + Math.random() * 0.7;
      }
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const lum = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
        const head = this.columns[x];
        const dist = ((y - head) % height + height) % height;
        const trail = Math.max(0, 1 - dist / (height * 0.4));
        const brightness = Math.min(255, lum * 0.3 + trail * 200);

        d[i]   = 0;
        d[i+1] = brightness;
        d[i+2] = brightness * 0.3;
      }
    }

    for (let x = 0; x < width; x++) {
      this.columns[x] = (this.columns[x] + this.speeds[x]) % height;
    }

    return imageData;
  }
}
