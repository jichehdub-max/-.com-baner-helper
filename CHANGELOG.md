# Changelog

## 1.0.2 - 2026-02-08

- Improved popup-to-page connection recovery: if content script is missing, popup now reinjects script/CSS and retries.
- Improved preview lifecycle handling when drawing modal closes.
- Improved mouse drag behavior for preview positioning.

## 1.0.1 - 2026-02-08

- Fixed preview overlay persistence after closing the drawing modal: preview now hides when target canvas is removed or hidden.
- Added drag-and-drop positioning for preview image with mouse hold (updates `offsetX/offsetY` live).
- Improved pointer behavior for preview interaction (`grab/grabbing`, corrected `pointer-events`).

## 1.0.0 - 2026-02-08

- Initial stable release of ITD Banner Redraw Helper.
