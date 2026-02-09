# 🐛 Отладка системы тем

## Быстрая проверка

1. **Перезагрузите расширение:**
   ```
   chrome://extensions → найдите "ITD Banner Redraw Helper" → нажмите 🔄
   ```

2. **Откройте итд.com**

3. **Откройте консоль (F12)**

4. **Скопируйте и вставьте содержимое `test-extension.js` в консоль**

5. **Проверьте вывод:**
   ```
   ✓ Theme system loaded
   ✓ div.layout found
   ✓ Theme styles injected
   ```

## Ожидаемые логи при загрузке

```
[ITD Themes] Initializing theme system...
[ITD Themes] Starting initialization...
[ITD Themes] Loaded custom themes: {...}
[ITD Themes] Active theme: default
[ITD Themes] Applying theme: default {...}
[ITD Themes] ✓ Found div.layout, theme applied
[ITD Themes] Theme styles injected successfully
[ITD Themes] Initialization complete
[ITD Themes] Theme system loaded successfully
```

## Если div.layout не найден сразу

```
[ITD Themes] ⚠ div.layout not found yet, styles will apply when it appears
[ITD Themes] Watching for div.layout to appear...
[ITD Themes] div.layout appeared, reapplying theme
```

## Проверка в консоли

### Проверить систему:
```javascript
window.itdThemeSystem
// Должен вернуть объект ThemeSystem

window.itdThemeSystem.initialized
// Должен вернуть true

window.itdThemeSystem.activeTheme
// Должен вернуть "default" или другую тему
```

### Проверить div.layout:
```javascript
document.querySelector('div.layout')
// Должен вернуть элемент <div class="layout">

window.getComputedStyle(document.querySelector('div.layout')).background
// Должен показать градиент с цветами темы
```

### Проверить стили:
```javascript
document.getElementById('itd-custom-theme-style')
// Должен вернуть <style> элемент

document.getElementById('itd-custom-theme-style').textContent
// Должен показать CSS код темы
```

### Проверить шейдер:
```javascript
document.getElementById('itd-shader-canvas')
// Должен вернуть <canvas> если шейдер активен, или null
```

## Быстрое тестирование тем

В консоли после вставки `test-extension.js`:

```javascript
// Применить темы
testTheme('default')
testTheme('dark')
testTheme('neon')

// Применить шейдеры
testShader('plasma')
testShader('tunnel')

// Очистить шейдер
clearTestShader()
```

## Типичные проблемы

### 1. "Theme system NOT loaded"

**Причина:** Расширение не загружено или скрипт не выполнился

**Решение:**
- Проверьте что расширение активно в `chrome://extensions`
- Перезагрузите расширение (кнопка 🔄)
- Перезагрузите страницу итд.com
- Проверьте консоль на ошибки JavaScript

### 2. "div.layout NOT found"

**Причина:** Страница ещё загружается или структура сайта изменилась

**Решение:**
- Подождите 2-3 секунды и проверьте снова
- Проверьте что вы на правильном сайте (итд.com)
- Проверьте структуру через DevTools → Elements

### 3. "Theme styles NOT found"

**Причина:** Стили не были применены

**Решение:**
- Проверьте логи в консоли
- Попробуйте переключить тему через popup
- Вызовите `window.itdThemeSystem.applyTheme()` вручную

### 4. Тема не видна визуально

**Причина:** Стили применены, но не видны из-за других CSS

**Решение:**
- Проверьте что стили имеют `!important`
- Проверьте z-index элементов
- Проверьте что `div.layout` существует и видим

### 5. Шейдер не отображается

**Причина:** WebGL не поддерживается или ошибка в коде шейдера

**Решение:**
- Откройте https://get.webgl.org/ - должна быть зелёная галочка
- Проверьте консоль на ошибки компиляции GLSL
- Попробуйте простой шейдер из примеров

## Проверка WebGL

```javascript
// В консоли
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl');
console.log('WebGL supported:', !!gl);
```

## Ручное применение темы

```javascript
// Если автоматическое применение не работает
window.itdThemeSystem.setActiveTheme('dark');
window.itdThemeSystem.applyTheme();
```

## Ручное применение шейдера

```javascript
const shader = `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord / iResolution.xy;
  vec3 col = vec3(uv.x, uv.y, 0.5);
  fragColor = vec4(col, 1.0);
}`;

window.itdThemeSystem.setShader(shader);
```

## Сброс всех настроек

```javascript
// Очистить все данные расширения
chrome.storage.local.clear(() => {
  console.log('Storage cleared');
  location.reload();
});
```

## Экспорт логов

```javascript
// Скопировать все логи для отчёта об ошибке
copy(console.log.toString());
```

## Структура файлов

```
themes/
  themes.js          - Основная система тем и шейдеров
  shadertoy-examples.js - Примеры шейдеров (не используется в popup)

popup/
  popup.js           - Логика popup интерфейса
  popup.html         - HTML popup
  popup.css          - Стили popup

content/
  content.js         - Основной content script
  content.css        - Стили расширения

manifest.json        - Манифест расширения
```

## Полезные команды

### Проверить все темы:
```javascript
Object.keys(window.itdThemeSystem.getThemes())
```

### Получить текущую тему:
```javascript
window.itdThemeSystem.getActiveTheme()
```

### Получить код шейдера:
```javascript
window.itdThemeSystem.getShader()
```

### Проверить storage:
```javascript
chrome.storage.local.get(null, (data) => console.log(data));
```

## Контакты для помощи

Если ничего не помогло:
1. Скопируйте все логи из консоли
2. Сделайте скриншот DevTools → Elements (покажите структуру div.layout)
3. Укажите версию браузера и ОС
