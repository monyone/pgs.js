# pgs.js

## Feature

* HTML5 Canvas based PGS (Presentation Graphic Stream) rendering

## Options

### PGSController

```ts
export type PGSControllerOption = {
  renderOption: {
    preferHTMLCanvasElement: boolean; // preffer HTMLCanvasElement in Main Thread. (default: false, recommended firefox is true)
    webWorker: boolean; // use WebWorker for rendering (default: false)
  }
}
```

### PGSSupFeeder/PGSAsyncSupFeeder

```ts
export type PGSSupFeederOption = {
  timeshift: number; // offset for time (default: 0)
  preload: 'none' | 'decode' | 'render' ; // prelodd rgba data (default: none)
}
```

## Getting Started

### Requirements: Wrapping Relative Element Needed!

```html
<div style="position: relative; display: inline-block;"> <!-- This Relative Wrapping Needed! -->
  <video id="video"></video>
</div>
```

### Work with SUP file (sync)

```html
<script type="module">
  import { PGSController, PGSSupFeeder } from "pgs.js";
  const res = await fetch('./something.sup');
  const sup = await res.arrayBuffer();

  const video = document.getElementById('video');

  const controller = new PGSController();
  const feeder = new PGSSupFeeder(sup);

  controller.attachFeeder(feeder);
  controller.attachMedia(video)
</script>
```

### Work with SUP file (async)

```html
<script type="module">
  import { PGSController, PGSAsyncSupFeeder } from "pgs.js";
  const res = await fetch('./something.sup');

  const video = document.getElementById('video');

  const controller = new PGSController();
  const feeder = new PGSAsyncSupFeeder(res.body);
  // use `feeder.done` for wait loading

  controller.attachFeeder(feeder);
  controller.attachMedia(video)
</script>
```

### Work with M2TS

```html
<script type="module">
  import { PGSController, PGSMpegTsFeeder } from "pgs.js";
  const video = document.getElementById('video');

  const controller = new PGSController();
  const feeder = new PGSMpegTsFeeder();
  // call `feeder.feed(arraybuffer, pts, dts, timescale)` for insert PES

  controller.attachFeeder(feeder);
  controller.attachMedia(video)
</script>
```

## Build

```bash
yarn
yarn build
```
