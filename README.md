# pgs.js

## Feature

* HTML5 Canvas based PGS (Presentation Graphic Stream) rendering

## Options

### PGSController

```ts
export type PGSControllerOption = {
  renderOption: {
    objectFit: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'; // objectFit for PGS Image (default: 'fill')
    webWorker: boolean; // use WebWorker for rendering (default: false)
  }
}
```

### PGSSupFeeder

```ts
export type PGSSupFeederOption = {
  timeshift: number; // offset for time (default: 0)
  preload: boolean; // prelodd rgba data (default: false)
}
```

## Getting Started

### Requirements: Wrapping Relative Element Needed!

```html
<div style="position: relative; display: inline-block;"> <!-- This Relative Wrapping Needed! -->
  <video id="video"></video>
</div>
```

### Work with SUP file

```html
<script type="module">
  import { PGSController, PGSSupFeeder } from "pgs.js"; // Please Specify ImportMap!
  const res = await fetch('./something.sup');
  const sup = await res.arrayBuffer();

  const video = document.getElementById('video');

  const controller = new PGSController();
  const feeder = new PGSSupFeeder(sup);

  controller.attachFeeder(feeder);
  controller.attachMedia(video)
</script>
```

## Build

```bash
yarn
yarn build
```
