export class DizzyEffect {
  constructor() { this.blockSize = 6; }

  process(imageData) {
    const { width, height, data: dst } = imageData;
    const src = new Uint8ClampedArray(dst);
    const bs = this.blockSize;
    const cols = Math.floor(width / bs);
    const rows = Math.floor(height / bs);
    const n = cols * rows;

    // Build shuffled tile index (nearby swaps)
    const tiles = new Array(n);
    for (let i = 0; i < n; i++) tiles[i] = i;
    for (let i = n - 1; i > 0; i--) {
      const range = Math.min(5, i);
      const j = i - Math.floor(Math.random() * range);
      const tmp = tiles[i]; tiles[i] = tiles[j]; tiles[j] = tmp;
    }

    for (let t = 0; t < n; t++) {
      const srcTile = tiles[t];
      const dstCol = t % cols,        dstRow = Math.floor(t / cols);
      const srcCol = srcTile % cols, srcRow = Math.floor(srcTile / cols);

      for (let dy = 0; dy < bs; dy++) {
        for (let dx = 0; dx < bs; dx++) {
          const sy = srcRow * bs + dy, sx = srcCol * bs + dx;
          const ey = dstRow * bs + dy, ex = dstCol * bs + dx;
          if (sy >= height || sx >= width || ey >= height || ex >= width) continue;
          const si = (sy * width + sx) * 4;
          const di = (ey * width + ex) * 4;
          dst[di] = src[si]; dst[di+1] = src[si+1]; dst[di+2] = src[si+2];
        }
      }
    }
    return imageData;
  }
}
