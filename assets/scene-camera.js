/* Static scene projection. The complete source image fills the viewport.
 * Background, polygons and markers share the same two-axis mapping.
 * There is no camera offset, cropping, panning or user zoom in the game. */
(() => {
  'use strict';
  const finite = (value, fallback) =>
    typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  const size = (value) => Math.max(1, finite(value, 1));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const percent = (point, axis) => clamp(finite(point?.[axis], 50), 0, 100);
  function create(width, height, imageWidth = 1672, imageHeight = 941) {
    width = size(width);
    height = size(height);
    imageWidth = size(imageWidth);
    imageHeight = size(imageHeight);
    return Object.freeze({
      width,
      height,
      imageWidth,
      imageHeight,
      scaleX: width / imageWidth,
      scaleY: height / imageHeight,
      tx: 0,
      ty: 0,
    });
  }
  function screen(frame, point) {
    return [(frame.width * percent(point, 0)) / 100, (frame.height * percent(point, 1)) / 100];
  }
  function viewBox(frame) {
    return `0 0 ${frame.imageWidth} ${frame.imageHeight}`;
  }
  function resize(frame, width, height) {
    return create(width, height, frame.imageWidth, frame.imageHeight);
  }
  function marker(frame, point, padding = 24) {
    const [x, y] = screen(frame, point);
    const mx = Math.min(Math.max(0, finite(padding, 24)), frame.width / 2);
    const my = Math.min(Math.max(0, finite(padding, 24)), frame.height / 2);
    return [clamp(x, mx, frame.width - mx), clamp(y, my, frame.height - my)];
  }
  window.TIME_CAMERA = Object.freeze({ create, screen, viewBox, resize, marker });
})();
