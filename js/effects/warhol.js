export class WarholEffect {
  process(imageData) {
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      const lum = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
      if (lum < 64) {
        d[i] = 32; d[i+1] = 0;   d[i+2] = 64;  // deep purple
      } else if (lum < 128) {
        d[i] = 255; d[i+1] = 0;   d[i+2] = 128; // hot pink
      } else if (lum < 192) {
        d[i] = 255; d[i+1] = 200; d[i+2] = 0;   // golden
      } else {
        d[i] = 0;   d[i+1] = 255; d[i+2] = 200; // cyan
      }
    }
    return imageData;
  }
}
