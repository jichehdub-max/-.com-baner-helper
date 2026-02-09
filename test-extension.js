// Скрипт для тестирования расширения в консоли браузера
// Скопируйте и вставьте в консоль на странице итд.com

console.log("=== ITD Theme System Test ===");

// 1. Проверка загрузки системы
if (window.itdThemeSystem) {
  console.log("✓ Theme system loaded");
  console.log("  Initialized:", window.itdThemeSystem.initialized);
  console.log("  Active theme:", window.itdThemeSystem.activeTheme);
} else {
  console.error("✗ Theme system NOT loaded");
  console.log("  Убедитесь что расширение установлено и активно");
}

// 2. Проверка div.layout
const layout = document.querySelector('div.layout');
if (layout) {
  console.log("✓ div.layout found");
  const styles = window.getComputedStyle(layout);
  console.log("  Background:", styles.background.substring(0, 50) + "...");
} else {
  console.error("✗ div.layout NOT found");
  console.log("  Возможно страница ещё загружается");
}

// 3. Проверка стилей темы
const themeStyle = document.getElementById('itd-custom-theme-style');
if (themeStyle) {
  console.log("✓ Theme styles injected");
  console.log("  Theme:", themeStyle.getAttribute('data-theme'));
  console.log("  CSS length:", themeStyle.textContent.length, "chars");
} else {
  console.error("✗ Theme styles NOT found");
}

// 4. Проверка шейдера
const shaderCanvas = document.getElementById('itd-shader-canvas');
if (shaderCanvas) {
  console.log("✓ Shader canvas found");
  console.log("  Size:", shaderCanvas.width, "x", shaderCanvas.height);
  console.log("  Visible:", shaderCanvas.style.display !== 'none');
} else {
  console.log("○ Shader not active (это нормально если не применён)");
}

// 5. Функции для быстрого тестирования
window.testTheme = function(themeId) {
  if (!window.itdThemeSystem) {
    console.error("Theme system not loaded");
    return;
  }
  console.log("Applying theme:", themeId);
  const success = window.itdThemeSystem.setActiveTheme(themeId);
  console.log(success ? "✓ Theme applied" : "✗ Failed to apply theme");
};

window.testShader = function(shaderName) {
  if (!window.itdThemeSystem) {
    console.error("Theme system not loaded");
    return;
  }
  
  const shaders = {
    plasma: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord / iResolution.xy;
  vec3 col = 0.5 + 0.5 * cos(iTime + uv.xyx + vec3(0, 2, 4));
  fragColor = vec4(col, 1.0);
}`,
    tunnel: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;
  float d = length(uv);
  float a = atan(uv.y, uv.x);
  vec2 p = vec2(a / 3.14159, 1.0 / d);
  p.y += iTime * 0.5;
  vec3 col = 0.5 + 0.5 * cos(p.y * 3.0 + vec3(0, 2, 4));
  col *= smoothstep(0.1, 0.0, abs(fract(p.x * 8.0) - 0.5));
  fragColor = vec4(col, 1.0);
}`
  };
  
  if (!shaders[shaderName]) {
    console.error("Unknown shader:", shaderName);
    console.log("Available:", Object.keys(shaders).join(", "));
    return;
  }
  
  console.log("Applying shader:", shaderName);
  window.itdThemeSystem.setShader(shaders[shaderName]);
  console.log("✓ Shader applied");
};

window.clearTestShader = function() {
  if (!window.itdThemeSystem) {
    console.error("Theme system not loaded");
    return;
  }
  console.log("Clearing shader...");
  window.itdThemeSystem.clearShader();
  console.log("✓ Shader cleared");
};

console.log("\n=== Доступные команды ===");
console.log("testTheme('default')  - применить тему Default");
console.log("testTheme('dark')     - применить тему Dark Purple");
console.log("testTheme('neon')     - применить тему Neon Cyan");
console.log("testShader('plasma')  - применить Plasma шейдер");
console.log("testShader('tunnel')  - применить Tunnel шейдер");
console.log("clearTestShader()     - очистить шейдер");
console.log("\n=== Конец теста ===");
