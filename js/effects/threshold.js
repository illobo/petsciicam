export class ThresholdEffect {
  constructor() { this.levels = 4; }

  process(imageData) {
    const d = imageData.data;
    const step = 255 / (this.levels - 1);
    for (let i = 0; i < d.length; i += 4) {
      d[i]   = Math.round(d[i]   / step) * step;
      d[i+1] = Math.round(d[i+1] / step) * step;
      d[i+2] = Math.round(d[i+2] / step) * step;
    }
    return imageData;
  }
}
