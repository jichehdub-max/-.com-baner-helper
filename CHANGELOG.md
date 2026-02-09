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

## [1.0.4] - 2026-02-09

### Added
- 🎨 Система кастомных тем с возможностью создания собственных цветовых схем
- ✨ Поддержка Shadertoy шейдеров - анимированные фоны из GLSL кода
- 🎨 3 встроенные темы: Default, Dark Purple, Neon Cyan
- ✨ 5 примеров шейдеров: Plasma Wave, Tunnel Effect, Color Waves, Neon Grid, Starfield
- 💾 Автоматическое сохранение тем и шейдеров в chrome.storage
- 🔧 WebGL рендеринг шейдеров с поддержкой iTime, iResolution, iMouse
- 📚 Подробная документация в README-THEMES.md

### Changed
- Обновлен popup интерфейс с новыми секциями для тем и шейдеров
- Улучшен CSS с анимациями и градиентами
- Версия расширения обновлена до 1.0.4

### Technical
- Добавлен themes/themes.js - основная система тем и шейдеров
- Добавлен themes/shadertoy-examples.js - библиотека примеров
- Расширен popup.js с функциями управления темами
- Обновлен manifest.json для загрузки новых скриптов

## [1.0.5] - 2026-02-09

### Added
- 🔍 Кнопка "Тест системы тем" в popup для быстрой диагностики
- ⚡ Кнопка "Быстрый тест шейдера" для мгновенного применения Plasma шейдера
- 📊 Автоматическая проверка: theme system, div.layout, стили, шейдер canvas
- 🎯 Улучшенное применение тем к div.layout на итд.com
- 👁️ MutationObserver для отслеживания динамической загрузки div.layout
- 📝 Файлы для отладки: test-extension.js, DEBUG.md

### Changed
- Оптимизированы CSS селекторы для точного применения к div.layout
- Улучшены логи инициализации системы тем
- Декоративный overlay теперь через ::before с position: fixed

### Fixed
- Исправлено применение тем к SvelteKit приложению (итд.com)
- Убраны лишние поля debugMode и debugData из конструктора
- Улучшена обработка случаев когда div.layout загружается динамически
