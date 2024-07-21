# pgs.js

## Feature

* HTML5 Canvas based PGS (Presentation Graphic Stream) rendering

## Getting Started

### PreCondition: Wrapping

```html
<div style="width: 960px; height: 540px; position: relative; display: inline-block;"> <!-- This Wrapping Needed! -->
  <video id="video" controls style="position: absolute; left: 0; top: 0; width: 100%; height: 100%;"></video>
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
