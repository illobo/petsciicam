export class NoiseEffect {
  process(imageData) {
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      const lum = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
      if (Math.random() * 255 > lum) {
        d[i] = d[i+1] = d[i+2] = 0;
      }
    }
    return imageData;
  }
}
