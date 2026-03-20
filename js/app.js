import { Camera } from './camera.js';
import { Pipeline } from './pipeline.js';
import { Renderer } from './renderer.js';
import { AsciiConverter } from './converters/ascii.js';
import { PetsciiConverter } from './converters/petscii.js';
import { PetsciiFullConverter } from './converters/petscii-full.js';
import { loadCharset } from './converters/charset-loader.js';
import { NoneEffect } from './effects/none.js';
import { EdgeEffect } from './effects/edge.js';
import { InvertEffect } from './effects/invert.js';
import { ThresholdEffect } from './effects/threshold.js';
import { NoiseEffect } from './effects/noise.js';
import { StreakEffect } from './effects/streak.js';
import { WarholEffect } from './effects/warhol.js';
import { AgingEffect } from './effects/aging.js';
import { BrokenEffect } from './effects/broken.js';
import { MatrixEffect } from './effects/matrix.js';
import { FireEffect } from './effects/fire.js';
import { PredatorEffect } from './effects/predator.js';
import { MosaicEffect } from './effects/mosaic.js';
import { DizzyEffect } from './effects/dizzy.js';

const camera = new Camera();
const canvas = document.getElementById('display');
const renderer = new Renderer(canvas);
const pipeline = new Pipeline(camera, renderer);

const petsciiFullColor = new PetsciiFullConverter();
petsciiFullColor.setMode(true);
const petsciiFullBw = new PetsciiFullConverter();
petsciiFullBw.setMode(false);

const converters = {
  ascii: new AsciiConverter(),
  petscii: new PetsciiConverter(),
  'petscii-full-color': petsciiFullColor,
  'petscii-full-bw': petsciiFullBw,
};

const effects = {
  none: new NoneEffect(),
  edge: new EdgeEffect(),
  invert: new InvertEffect(),
  threshold: new ThresholdEffect(),
  noise: new NoiseEffect(),
  streak: new StreakEffect(),
  warhol: new WarholEffect(),
  aging: new AgingEffect(),
  broken: new BrokenEffect(),
  matrix: new MatrixEffect(),
  fire: new FireEffect(),
  predator: new PredatorEffect(),
  mosaic: new MosaicEffect(),
  dizzy: new DizzyEffect(),
};

let currentMode = 'petscii-color';
let currentEffect = 'none';
let currentCols = 80;

function updateConverter() {
  if (currentMode === 'ascii') {
    pipeline.setConverter(converters.ascii);
  } else if (currentMode === 'petscii-full-color' || currentMode === 'petscii-full-bw') {
    pipeline.setConverter(converters[currentMode]);
  } else {
    converters.petscii.setMode(currentMode === 'petscii-color');
    pipeline.setConverter(converters.petscii);
  }
}

function updateEffect() {
  pipeline.setEffect(currentEffect === 'none' ? null : effects[currentEffect]);
}

function updateGrid() {
  if (!camera.width) return;
  const rows = Math.round(currentCols * camera.height / camera.width);
  pipeline.setGridSize(currentCols, Math.max(1, rows));
}

function bindSelector(id, key, callback) {
  document.getElementById(id).addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    document.querySelectorAll(`#${id} button`).forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    callback(btn.dataset[key]);
  });
}

function setupUI() {
  bindSelector('mode-selector', 'mode', (mode) => {
    currentMode = mode;
    updateConverter();
  });

  bindSelector('effect-selector', 'effect', (effect) => {
    currentEffect = effect;
    updateEffect();
  });

  bindSelector('grid-selector', 'cols', (cols) => {
    currentCols = parseInt(cols);
    updateGrid();
  });

  document.getElementById('mirror').addEventListener('change', (e) => {
    pipeline.mirror = e.target.checked;
  });

  pipeline.onFps = (fps) => {
    document.getElementById('fps').textContent = `${fps} FPS`;
  };

  // Screenshot
  document.getElementById('btn-screenshot').addEventListener('click', () => {
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const link = document.createElement('a');
    link.download = `petsciicam-${ts}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  });

  // Video recording
  const btnRecord = document.getElementById('btn-record');
  const recordStatus = document.getElementById('record-status');
  let mediaRecorder = null;
  let recordedChunks = [];

  btnRecord.addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      return;
    }
    recordedChunks = [];
    const stream = canvas.captureStream(24);
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };
    mediaRecorder.onstop = () => {
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const link = document.createElement('a');
      link.download = `petsciicam-${ts}.webm`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
      btnRecord.textContent = 'Record Video';
      btnRecord.classList.remove('recording');
      recordStatus.textContent = '';
    };
    mediaRecorder.start();
    btnRecord.textContent = 'Stop Recording';
    btnRecord.classList.add('recording');
    recordStatus.textContent = 'Recording...';
  });
}

async function init() {
  setupUI();
  try {
    await camera.start();
    updateConverter();
    updateEffect();
    updateGrid();
    pipeline.start();
  } catch (err) {
    document.getElementById('viewport').innerHTML =
      `<p class="error">Camera access required.<br>Please allow camera access and reload.<br><br>${err.message}</p>`;
  }

  // Load full PETSCII charset in the background
  try {
    const bitmaps = await loadCharset('assets/charsets/standard256-upper.png');
    petsciiFullColor.setCharset(bitmaps);
    petsciiFullBw.setCharset(bitmaps);
    document.querySelectorAll('[data-mode^="petscii-full"]').forEach(b => { b.disabled = false; });
    const loading = document.getElementById('charset-loading');
    if (loading) loading.remove();
  } catch (e) {
    const loading = document.getElementById('charset-loading');
    if (loading) loading.textContent = 'Charset load failed';
  }
}

init();
