export class Pipeline {
  constructor(camera, renderer) {
    this.camera = camera;
    this.renderer = renderer;
    this.converter = null;
    this.effects = [];
    this.running = false;
    this.targetFps = 24;
    this.mirror = true;
    this.gridWidth = 80;
    this.gridHeight = 60;
    this.onFps = null;

    this._lastFrame = 0;
    this._frameCount = 0;
    this._fpsTime = 0;

    this._captureCanvas = document.createElement('canvas');
    this._captureCtx = this._captureCanvas.getContext('2d', { willReadFrequently: true });
  }

  setGridSize(width, height) {
    this.gridWidth = width;
    this.gridHeight = height;
    this._updateCaptureSize();
  }

  setConverter(converter) {
    this.converter = converter;
    this._updateCaptureSize();
  }

  _updateCaptureSize() {
    const bs = this.converter?.blockSize ?? 1;
    this._captureCanvas.width = this.gridWidth * bs;
    this._captureCanvas.height = this.gridHeight * bs;
  }

  setEffect(effect) {
    this.effects = effect ? [effect] : [];
  }

  start() {
    this.running = true;
    this._loop(performance.now());
  }

  stop() {
    this.running = false;
  }

  _loop(timestamp) {
    if (!this.running) return;
    requestAnimationFrame(t => this._loop(t));

    const elapsed = timestamp - this._lastFrame;
    if (elapsed < 1000 / this.targetFps) return;
    this._lastFrame = timestamp;

    // FPS counter
    this._frameCount++;
    if (timestamp - this._fpsTime >= 1000) {
      if (this.onFps) this.onFps(this._frameCount);
      this._frameCount = 0;
      this._fpsTime = timestamp;
    }

    if (!this.camera.ready || !this.converter) return;

    const { _captureCtx: ctx, _captureCanvas: cvs, gridWidth: gw, gridHeight: gh } = this;
    const cw = cvs.width, ch = cvs.height; // may be gw*blockSize × gh*blockSize

    // Capture frame (optionally mirrored)
    if (this.mirror) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(this.camera.element, -cw, 0, cw, ch);
      ctx.restore();
    } else {
      ctx.drawImage(this.camera.element, 0, 0, cw, ch);
    }

    let frame = ctx.getImageData(0, 0, cw, ch);

    // Apply effects
    for (const effect of this.effects) {
      frame = effect.process(frame);
    }

    // Convert to cells
    const cells = this.converter.convert(frame);
    if (!cells) return;

    // Render
    this.renderer.draw(cells, gw, gh);
  }
}
