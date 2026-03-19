export class StreakEffect {
  constructor() {
    this.buffer = null;
    this.decay = 0.85;
  }

  process(imageData) {
    const d = imageData.data;
    if (!this.buffer || this.buffer.length !== d.length) {
      this.buffer = new Float32Array(d.length);
      for (let i = 0; i < d.length; i++) this.buffer[i] = d[i];
    }

    for (let i = 0; i < d.length; i += 4) {
      this.buffer[i]   = Math.max(d[i],   this.buffer[i]   * this.decay);
      this.buffer[i+1] = Math.max(d[i+1], this.buffer[i+1] * this.decay);
      this.buffer[i+2] = Math.max(d[i+2], this.buffer[i+2] * this.decay);
      d[i]   = this.buffer[i];
      d[i+1] = this.buffer[i+1];
      d[i+2] = this.buffer[i+2];
    }
    return imageData;
  }
}
