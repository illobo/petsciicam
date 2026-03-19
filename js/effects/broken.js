export class BrokenEffect {
  constructor() {
    this.roll = 0;
    this.rollSpeed = 0.3;
  }

  process(imageData) {
    const { width, height, data: dst } = imageData;
    const src = new Uint8ClampedArray(dst);

    this.roll = (this.roll + this.rollSpeed) % height;

    for (let y = 0; y < height; y++) {
      const srcY = (y + Math.floor(this.roll)) % height;
      const offset = Math.floor(Math.sin(y * 0.5 + this.roll * 0.3) * 3 + (Math.random() - 0.5) * 2);

      for (let x = 0; x < width; x++) {
        const srcX = ((x + offset) % width + width) % width;
        const si = (srcY * width + srcX) * 4;
        const di = (y * width + x) * 4;
        dst[di]   = src[si];
        dst[di+1] = src[si+1];
        dst[di+2] = src[si+2];
      }
    }

    // Noise scanlines
    for (let y = 0; y < height; y++) {
      if (Math.random() > 0.95) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          const n = Math.random() * 255;
          dst[i] = n; dst[i+1] = n; dst[i+2] = n;
        }
      }
    }

    return imageData;
  }
}
