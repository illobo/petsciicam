export class PredatorEffect {
  process(imageData) {
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      const lum = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
      let r, g, b;
      if (lum < 42) {
        const t = lum / 42;
        r = 0; g = 0; b = t * 128;
      } else if (lum < 85) {
        const t = (lum - 42) / 43;
        r = t * 128; g = 0; b = 128 + t * 127;
      } else if (lum < 128) {
        const t = (lum - 85) / 43;
        r = 128 + t * 127; g = 0; b = 255 - t * 128;
      } else if (lum < 170) {
        const t = (lum - 128) / 42;
        r = 255; g = t * 128; b = 128 - t * 128;
      } else if (lum < 213) {
        const t = (lum - 170) / 43;
        r = 255; g = 128 + t * 127; b = 0;
      } else {
        const t = (lum - 213) / 42;
        r = 255; g = 255; b = t * 255;
      }
      d[i] = r; d[i+1] = g; d[i+2] = b;
    }
    return imageData;
  }
}
