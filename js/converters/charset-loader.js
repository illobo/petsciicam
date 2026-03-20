/**
 * Loads a PETSCII charset PNG sprite sheet and returns an array of 8-byte bitmaps.
 * Sprite sheet layout: charsPerRow chars per row, each char is 8×8 pixels.
 * Lit pixels (R > 127) → set bit (MSB = leftmost).
 */
export function loadCharset(url, charCount = 256, charsPerRow = 32) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const cvs = document.createElement('canvas');
      cvs.width = img.width;
      cvs.height = img.height;
      const ctx = cvs.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const pixels = ctx.getImageData(0, 0, img.width, img.height).data;
      const W = img.width;

      const bitmaps = new Array(charCount);
      for (let i = 0; i < charCount; i++) {
        const cx = (i % charsPerRow) * 8;
        const cy = Math.floor(i / charsPerRow) * 8;
        const bmp = new Uint8Array(8);
        for (let row = 0; row < 8; row++) {
          let byte = 0;
          for (let col = 0; col < 8; col++) {
            if (pixels[((cy + row) * W + (cx + col)) * 4] > 127) {
              byte |= 1 << (7 - col);
            }
          }
          bmp[row] = byte;
        }
        bitmaps[i] = bmp;
      }
      resolve(bitmaps);
    };
    img.onerror = () => reject(new Error(`Failed to load charset: ${url}`));
    img.src = url;
  });
}
