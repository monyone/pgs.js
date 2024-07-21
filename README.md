# pgs.js

## Feature

* HTML5 Canvas based PGS (Presentation Graphic Stream) rendering

## Getting Started

### PreCondition: Wrapping Element Needed!

```html
<div style="position: relative; display: inline-block;"> <!-- This Relative Wrapping Needed! -->
  <video></video>
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
