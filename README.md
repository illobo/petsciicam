# PETSCIICam

A real time webcam viewer that renders your camera feed as PETSCII art, ASCII art, or through a variety of retro video effects inspired by [EffecTV](https://github.com/fukuchi/EffecTV/).

The star of the show is the PETSCII Color mode, which maps each cell of the video to the Commodore 64's 16 color palette using diagonal dither tricks for smooth shading. The result looks like authentic C64 character art, updated live from your webcam.

**[Live Demo](https://illobo.github.io/petsciicam/)**

## Rendering Modes

**PETSCII Color** renders each cell by finding the best two color pair from the C64 palette and selecting from a 5 level dither ramp (space, quarter block, checkerboard, three quarter block, solid block). Adjacent cells alternate checkerboard phase based on position, creating diagonal dither patterns that break up the character grid and produce smooth gradients. This technique is described in detail in [PETSCII Diagonal Dither Tricks](https://wbochar.com/petscii-diagonal-dither-tricks-pddt/).

**PETSCII B/W** uses the same dither ramp with a green phosphor on black look, like a classic monochrome CRT terminal.

**ASCII** maps brightness to a traditional character ramp and preserves the original pixel colors for a colorful ASCII art look.

## Effects

All effects are applied to the raw pixel data before character conversion, so they compose freely with any rendering mode.

| Effect | Description |
|--------|-------------|
| Edge Detect | Sobel edge detection, highlights contours |
| Invert | Negative image |
| Threshold | Posterize to a few color levels |
| Noise | Stochastic dot dither, bright pixels survive randomly |
| Streak | Frame accumulation with decay, creates motion trails |
| Warhol | Pop art color mapping with posterization |
| Aging | Old film look with scratches, dust, and flicker |
| Broken TV | Scanline displacement, vertical roll, signal noise |
| Matrix | Falling green column trails over the video |
| Fire | Bottom up fire propagation mapped to a flame palette |
| Predator | Thermal vision false color palette |
| Mosaic | Block averaging for an extra pixelated look |
| Dizzy | Shuffles nearby tiles for a disoriented feel |

## How It Works

The pipeline runs entirely in the browser with no server, no dependencies, and no build step.

```
Webcam capture
    |
    v
Downsample to grid (e.g. 80x60)
    |
    v
Effect chain (pixel manipulation)
    |
    v
Converter (PETSCII or ASCII)
    |
    v
8x8 bitmap renderer via ImageData
    |
    v
Display canvas (pixelated upscale)
```

PETSCII characters are defined as hardcoded 8x8 bitmaps (block elements, checkerboards, quarter blocks) so no font files are needed. The renderer writes directly to an ImageData pixel buffer for maximum performance. ASCII glyphs are generated at startup by rasterizing a monospace font to 8x8 bitmaps.

## Running Locally

Serve the directory over HTTP (required for ES modules):

```
python3 -m http.server 8080
```

Then open http://localhost:8080 in your browser and allow camera access.

## Grid Sizes

Three column presets are available: 40, 80, and 120. Row count is computed automatically from your webcam's aspect ratio. At 80 columns with 8x8 pixel cells, the native canvas is 640x400, scaled up with nearest neighbor interpolation for that crispy pixel look.

## Tech

Vanilla JavaScript with ES modules. No frameworks, no bundler, no dependencies. Works in any modern browser that supports getUserMedia and Canvas 2D.

## Credits

PETSCII dithering techniques based on the work documented at [wbochar.com](https://wbochar.com/petscii-diagonal-dither-tricks-pddt/). Video effects inspired by [EffecTV](https://github.com/fukuchi/EffecTV/) by Kentaro Fukuchi. The C64 color palette values follow the canonical c64 wiki reference.

## License

This project is licensed under the GNU General Public License v2.0. See the [LICENSE](LICENSE) file for details.
