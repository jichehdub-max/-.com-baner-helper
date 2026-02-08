# Changelog

## 1.0.3 - 2026-02-08

- Added AI post generation block in popup: configurable endpoint, model, prompt, and generated text output.
- Added one-click insertion of generated text into itd.com post composer (`Что у вас нового?`).
- Prioritized direct insertion into `textarea.wall-post-form__textarea` / `.wall-post-form__content` composer.
- Added resilient composer detection in content script (textarea/contenteditable + publish area heuristics).
- Improved default AI preset loading in popup initialization.
- Improved AI response parsing compatibility across different OpenAI-style payload formats.
- Added AI streaming generation with fallback to non-stream mode for broader API compatibility.
- AI text is now inserted into post composer automatically after generation; manual insert button removed.
- Added popup fallback insertion path if page has outdated content-script command set.
- Added custom AI API key input in popup settings.
- Improved stream parser for non-standard SSE/JSON chunk formats from compatible providers.
- Filtered out model reasoning artifacts from generated post before auto-insert.
- Updated popup styles for text/password/textarea controls.

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
