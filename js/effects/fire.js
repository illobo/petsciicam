export class FireEffect {
  constructor() {
    this.buffer = null;
    this.palette = [];
    for (let i = 0; i < 256; i++) {
      this.palette.push([
        Math.min(255, i * 3),
        Math.min(255, Math.max(0, i * 3 - 255)),
        Math.min(255, Math.max(0, i * 3 - 510)),
      ]);
    }
  }

  process(imageData) {
    const { width, height, data: d } = imageData;
    const size = width * height;

    if (!this.buffer || this.buffer.length !== size) {
      this.buffer = new Float32Array(size);
    }

    // Seed bottom row from image brightness
    for (let x = 0; x < width; x++) {
      const i = ((height - 1) * width + x) * 4;
      const lum = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
      this.buffer[(height - 1) * width + x] = lum + Math.random() * 60;
    }

    // Propagate fire upward
    for (let y = 0; y < height - 1; y++) {
      for (let x = 0; x < width; x++) {
        const below = y + 1;
        const avg = (
          this.buffer[below * width + Math.max(0, x - 1)] +
          this.buffer[below * width + x] +
          this.buffer[below * width + Math.min(width - 1, x + 1)] +
          this.buffer[Math.min(y + 2, height - 1) * width + x]
        ) / 4.05;
        this.buffer[y * width + x] = avg;
      }
    }

    // Apply fire palette
    for (let i = 0; i < size; i++) {
      const val = Math.min(255, Math.max(0, Math.floor(this.buffer[i])));
      const c = this.palette[val];
      const di = i * 4;
      d[di] = c[0]; d[di+1] = c[1]; d[di+2] = c[2];
    }

    return imageData;
  }
}
