export class EdgeEffect {
  process(imageData) {
    const { width, height, data } = imageData;
    const src = new Uint8ClampedArray(data);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const tl = lum(src, ((y-1)*width+(x-1))*4);
        const t  = lum(src, ((y-1)*width+x)*4);
        const tr = lum(src, ((y-1)*width+(x+1))*4);
        const l  = lum(src, (y*width+(x-1))*4);
        const r  = lum(src, (y*width+(x+1))*4);
        const bl = lum(src, ((y+1)*width+(x-1))*4);
        const b  = lum(src, ((y+1)*width+x)*4);
        const br = lum(src, ((y+1)*width+(x+1))*4);

        const gx = -tl + tr - 2*l + 2*r - bl + br;
        const gy = -tl - 2*t - tr + bl + 2*b + br;
        const mag = Math.min(255, Math.sqrt(gx*gx + gy*gy));

        data[idx] = data[idx+1] = data[idx+2] = mag;
      }
    }
    return imageData;
  }
}

function lum(d, i) { return 0.299*d[i] + 0.587*d[i+1] + 0.114*d[i+2]; }
