export class AgingEffect {
  process(imageData) {
    const { width, height, data: d } = imageData;

    // Sepia tone
    for (let i = 0; i < d.length; i += 4) {
      const lum = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
      d[i]   = Math.min(255, lum + 40);
      d[i+1] = Math.min(255, lum + 20);
      d[i+2] = lum;
    }

    // Random scratches
    for (let s = 0; s < 3; s++) {
      if (Math.random() > 0.4) continue;
      const sx = Math.floor(Math.random() * width);
      for (let y = 0; y < height; y++) {
        const i = (y * width + sx) * 4;
        d[i] = Math.min(255, d[i] + 100);
        d[i+1] = Math.min(255, d[i+1] + 100);
        d[i+2] = Math.min(255, d[i+2] + 100);
      }
    }

    // Dust spots
    for (let s = 0; s < 5; s++) {
      if (Math.random() > 0.5) continue;
      const i = (Math.floor(Math.random() * height) * width + Math.floor(Math.random() * width)) * 4;
      d[i] = d[i+1] = d[i+2] = 255;
    }

    // Brightness flicker
    const flicker = 0.9 + Math.random() * 0.2;
    for (let i = 0; i < d.length; i += 4) {
      d[i]   = Math.min(255, d[i]   * flicker);
      d[i+1] = Math.min(255, d[i+1] * flicker);
      d[i+2] = Math.min(255, d[i+2] * flicker);
    }

    return imageData;
  }
}
