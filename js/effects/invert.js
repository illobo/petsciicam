export class InvertEffect {
  process(imageData) {
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i]   = 255 - d[i];
      d[i+1] = 255 - d[i+1];
      d[i+2] = 255 - d[i+2];
    }
    return imageData;
  }
}
