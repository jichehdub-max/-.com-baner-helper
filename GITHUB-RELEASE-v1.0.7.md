# 🎉 Release v1.0.7

**Дата релиза:** 11 февраля 2026

## 🎬 MP4 поддержка и увеличенный лимит файлов

- ✅ Полная поддержка MP4 видео в баннерах (наравне с GIF)
- ✅ Убраны ограничения на размер файла - теперь до 50+ МБ
- ✅ Автоопределение типа файла (GIF или MP4)
- ✅ Динамическое имя файла (banner.gif или banner.mp4)
- ✅ Предупреждения для больших файлов (>20 МБ, >50 МБ)

## 🐍 Python скрипты для сжатия GIF

### compress-gif.py (базовый)
- Использует Pillow для простого сжатия
- Параметры: quality, max-size, width, height, fps
- Красивый вывод с эмодзи и прогресс-баром

### compress-gif-advanced.py (продвинутый)
- Использует ffmpeg + gifsicle для лучшего качества
- Режимы качества: low, medium, high, ultra
- Двухпроходное сжатие для оптимального результата

**Примеры:**
```bash
# Базовый
py compress-gif.py input.gif output.gif --quality 85 --width 800

# Продвинутый
py compress-gif-advanced.py input.gif output.gif --quality high --fps 24
```

## 🔤 Кастомные шрифты

- ✅ Загрузка TTF шрифтов через drag & drop
- ✅ Сохранение шрифта в base64 в chrome.storage
- ✅ Применение ко всему сайту через @font-face
- ✅ Автоматическая загрузка при старте

## ✨ Улучшенная поддержка Shadertoy шейдеров

### WebGL 2.0 поддержка
- Приоритет WebGL 2.0, fallback на WebGL 1.0
- Автоопределение версии и логирование
- Включение расширений для WebGL 1.0

### Все Shadertoy uniforms
- `iTime`, `iResolution`, `iMouse`, `iDate`
- `iTimeDelta`, `iFrame`, `iChannelTime[4]`
- `iChannelResolution[4]`, `iSampleRate`

### Noise текстура
- Автоматическая генерация 256x256 random noise
- Привязка к iChannel0-3

## 🔥 Multipass рендеринг

- Поддержка Buffer A/B/C/D и Image шейдеров
- Парсинг Shadertoy кода с маркерами `// Buffer A`, `// Image`
- Ping-pong framebuffers для temporal reprojection
- Buffer outputs доступны в iChannel0-3 для Image шейдера
- Предыдущий кадр буфера доступен в iChannel0

**Пример:**
```glsl
// Buffer A
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec4 prev = texture(iChannel0, uv); // Предыдущий кадр
    fragColor = prev * 0.98 + vec4(sin(iTime), cos(iTime), 0.5, 1.0) * 0.02;
}

// Image
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec4 bufferA = texture(iChannel0, uv); // Результат Buffer A
    fragColor = bufferA;
}
```

## 🎨 Прозрачность фона для кастомных тем

- ✅ Чекбокс "Прозрачный фон" в разделе кастомных тем
- ✅ Применяется к градиентному и обычному фону
- ✅ Сохраняется вместе с темой
- ✅ Независимое управление прозрачностью

## 🐛 Исправления

- Исправлена ошибка "gifBlob is not defined" → переименовано в fileBlob
- Исправлена ошибка несовпадения версий шейдеров
- Улучшена обработка больших файлов
- Исправлены проблемы с WebGL контекстом

## 📚 Документация

- Добавлен `GIF-COMPRESSION-GUIDE.md` - подробная инструкция по сжатию GIF
- Обновлен `README.md` с описанием всех новых функций
- Добавлены примеры использования Python скриптов

## 🔄 Совместимость

- ✅ Chrome 88+
- ✅ Edge 88+
- ✅ Opera 74+
- ✅ Полная обратная совместимость с v1.0.6

## 📦 Установка

1. Скачайте релиз
2. Распакуйте архив
3. Откройте `chrome://extensions`
4. Включите "Режим разработчика"
5. Нажмите "Загрузить распакованное расширение"
6. Выберите папку с плагином

## 🙏 Благодарности

Спасибо всем, кто тестировал и предлагал улучшения!

---

**Полный список изменений:** См. [CHANGELOG.md](CHANGELOG.md)  
**Подробные release notes:** См. [RELEASE-NOTES-v1.0.7.md](RELEASE-NOTES-v1.0.7.md)
