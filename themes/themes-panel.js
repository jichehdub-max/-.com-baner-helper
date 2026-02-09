// Встроенная панель тем для итд.com - АВТОЗАГРУЗКА
console.log("[ITD Panel] Script starting...");
console.log("[ITD Panel] URL:", window.location.href);
console.log("[ITD Panel] Hostname:", window.location.hostname);

(function() {
  // Проверка что мы на итд.com
  const hostname = location.hostname;
  const href = location.href;
  console.log("[ITD Panel] Current hostname:", hostname);
  console.log("[ITD Panel] Current href:", href);
  
  // Более широкая проверка для итд.com
  const isItdSite = hostname.includes('xn--d1ah4a.com') || 
                    hostname.includes('итд.com') || 
                    href.includes('xn--d1ah4a.com') ||
                    href.includes('итд.com');
  
  if (!isItdSite) {
    console.log("[ITD Panel] Not on итд.com, skipping");
    return;
  }
  
  console.log("[ITD Panel] On итд.com - initializing...");
  
  // Проверка что не загружено уже
  if (window.__itdPanelLoaded) {
    console.log("[ITD Panel] Already loaded, skipping");
    return;
  }
  window.__itdPanelLoaded = true;
  
  const THEME_KEY = "itdCustomTheme";
  const SHADER_KEY = "itdShaderCode";
  const AUTO_THEME_KEY = "itdAutoTheme";
  const AUTO_SHADER_KEY = "itdAutoShader";
  
  let currentTheme = "default";
  let shaderCanvas = null;
  let shaderContext = null;
  let animationFrame = null;
  let panelOpen = false;
  let autoTheme = true;
  let autoShader = true;
  
  const shaderExamples = {
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
}`,
    waves: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord / iResolution.xy;
  float t = iTime * 0.5;
  vec3 col = vec3(0.0);
  for (float i = 0.0; i < 3.0; i++) {
    float wave = sin(uv.x * 10.0 + t + i * 2.0) * 0.5 + 0.5;
    wave *= sin(uv.y * 10.0 + t * 0.7 + i * 1.5) * 0.5 + 0.5;
    col[int(i)] = wave;
  }
  fragColor = vec4(col, 1.0);
}`
  };
  
  // Применить тему
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-itd-custom-theme', theme);
    currentTheme = theme;
    chrome.storage.local.set({ [THEME_KEY]: theme });
    console.log("[ITD Panel] Applied theme:", theme);
  }
  
  // Сохранить настройки автозапуска
  function saveAutoSettings() {
    chrome.storage.local.set({ 
      [AUTO_THEME_KEY]: autoTheme,
      [AUTO_SHADER_KEY]: autoShader
    });
    console.log("[ITD Panel] Auto settings saved - Theme:", autoTheme, "Shader:", autoShader);
  }
  
  // Применить шейдер
  function applyShader(code) {
    clearShader();
    if (!code) return;
    
    console.log("[ITD Panel] Applying shader...");
    
    shaderCanvas = document.createElement("canvas");
    shaderCanvas.id = "itd-shader-canvas";
    shaderCanvas.width = window.innerWidth;
    shaderCanvas.height = window.innerHeight;
    document.body.appendChild(shaderCanvas);
    
    const gl = shaderCanvas.getContext("webgl") || shaderCanvas.getContext("experimental-webgl");
    if (!gl) {
      console.error("[ITD Panel] WebGL not supported");
      return;
    }
    
    shaderContext = gl;
    
    try {
      const vs = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vs, `attribute vec2 p; void main(){gl_Position=vec4(p,0.,1.);}`);
      gl.compileShader(vs);
      
      const fs = gl.createShader(gl.FRAGMENT_SHADER);
      const wrapped = `precision mediump float;uniform float iTime;uniform vec3 iResolution;${code}void main(){mainImage(gl_FragColor,gl_FragCoord.xy);}`;
      gl.shaderSource(fs, wrapped);
      gl.compileShader(fs);
      
      if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
        console.error("[ITD Panel] Shader error:", gl.getShaderInfoLog(fs));
        alert("Ошибка компиляции шейдера:\n" + gl.getShaderInfoLog(fs));
        return;
      }
      
      const prog = gl.createProgram();
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      gl.useProgram(prog);
      
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
      
      const pos = gl.getAttribLocation(prog, "p");
      gl.enableVertexAttribArray(pos);
      gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
      
      const uTime = gl.getUniformLocation(prog, "iTime");
      const uRes = gl.getUniformLocation(prog, "iResolution");
      const start = Date.now();
      
      function render() {
        if (!shaderCanvas) return;
        shaderCanvas.width = window.innerWidth;
        shaderCanvas.height = window.innerHeight;
        gl.viewport(0, 0, shaderCanvas.width, shaderCanvas.height);
        gl.uniform1f(uTime, (Date.now() - start) / 1000);
        gl.uniform3f(uRes, shaderCanvas.width, shaderCanvas.height, 1);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        animationFrame = requestAnimationFrame(render);
      }
      
      render();
      chrome.storage.local.set({ [SHADER_KEY]: code });
      console.log("[ITD Panel] Shader applied");
    } catch (err) {
      console.error("[ITD Panel] Shader error:", err);
      alert("Ошибка шейдера: " + err.message);
    }
  }
  
  // Очистить шейдер
  function clearShader() {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    if (shaderCanvas) shaderCanvas.remove();
    shaderCanvas = null;
    shaderContext = null;
    animationFrame = null;
    chrome.storage.local.remove(SHADER_KEY);
  }
  
  // Создать UI немедленно
  function createUI() {
    console.log("[ITD Panel] Creating UI...");
    
    // Проверить что UI не создан уже
    if (document.getElementById('itd-theme-btn')) {
      console.log("[ITD Panel] UI already exists");
      return;
    }
    
    // Floating button
    const btn = document.createElement('button');
    btn.id = 'itd-theme-btn';
    btn.innerHTML = '🎨';
    btn.title = 'Открыть панель тем';
    document.body.appendChild(btn);
    console.log("[ITD Panel] Button created");
    
    // Panel
    const panel = document.createElement('div');
    panel.id = 'itd-theme-panel';
    panel.innerHTML = `
      <div class="itd-panel-header">
        <h3>🎨 Темы и шейдеры</h3>
        <button class="itd-panel-close">✕</button>
      </div>
      
      <div class="itd-panel-content">
        <div class="itd-section">
          <label>Тема:</label>
          <select id="itd-theme-select">
            <option value="default">Default (оригинальные цвета сайта)</option>
            <option value="blue">Blue</option>
            <option value="purple">Purple</option>
            <option value="cyan">Cyan</option>
            <option value="green">Green</option>
            <option value="red">Red</option>
          </select>
          <label class="itd-checkbox">
            <input type="checkbox" id="itd-auto-theme" checked>
            <span>Автозапуск темы при заходе на сайт</span>
          </label>
        </div>
        
        <div class="itd-section">
          <label>Примеры шейдеров:</label>
          <select id="itd-shader-example">
            <option value="">-- Выбрать --</option>
            <option value="plasma">Plasma Wave</option>
            <option value="tunnel">Tunnel Effect</option>
            <option value="waves">Color Waves</option>
          </select>
        </div>
        
        <div class="itd-section">
          <label>Код шейдера (GLSL):</label>
          <textarea id="itd-shader-code" placeholder="void mainImage(out vec4 fragColor, in vec2 fragCoord) { ... }"></textarea>
          <label class="itd-checkbox">
            <input type="checkbox" id="itd-auto-shader" checked>
            <span>Автозапуск шейдера при заходе на сайт</span>
          </label>
        </div>
        
        <div class="itd-actions">
          <button id="itd-apply-shader" class="itd-btn itd-btn-primary">Применить шейдер</button>
          <button id="itd-clear-shader" class="itd-btn">Очистить</button>
        </div>
      </div>
    `;
    document.body.appendChild(panel);
    
    // Events
    btn.addEventListener('click', () => {
      panelOpen = !panelOpen;
      panel.classList.toggle('open', panelOpen);
    });
    
    panel.querySelector('.itd-panel-close').addEventListener('click', () => {
      panelOpen = false;
      panel.classList.remove('open');
    });
    
    const themeSelect = document.getElementById('itd-theme-select');
    const autoThemeCheck = document.getElementById('itd-auto-theme');
    const autoShaderCheck = document.getElementById('itd-auto-shader');
    
    themeSelect.value = currentTheme;
    autoThemeCheck.checked = autoTheme;
    autoShaderCheck.checked = autoShader;
    
    themeSelect.addEventListener('change', () => {
      applyTheme(themeSelect.value);
    });
    
    autoThemeCheck.addEventListener('change', () => {
      autoTheme = autoThemeCheck.checked;
      saveAutoSettings();
    });
    
    autoShaderCheck.addEventListener('change', () => {
      autoShader = autoShaderCheck.checked;
      saveAutoSettings();
    });
    
    const exampleSelect = document.getElementById('itd-shader-example');
    const codeArea = document.getElementById('itd-shader-code');
    
    exampleSelect.addEventListener('change', () => {
      if (exampleSelect.value && shaderExamples[exampleSelect.value]) {
        codeArea.value = shaderExamples[exampleSelect.value];
      }
    });
    
    document.getElementById('itd-apply-shader').addEventListener('click', () => {
      const code = codeArea.value.trim();
      if (code) {
        applyShader(code);
      }
    });
    
    document.getElementById('itd-clear-shader').addEventListener('click', () => {
      clearShader();
      codeArea.value = '';
      exampleSelect.value = '';
    });
    
    // Load saved shader
    chrome.storage.local.get(SHADER_KEY, (data) => {
      if (data[SHADER_KEY]) {
        codeArea.value = data[SHADER_KEY];
      }
    });
    
    console.log("[ITD Panel] UI created successfully");
  }
  
  // Инициализация с задержкой для загрузки DOM
  function initializePanel() {
    console.log("[ITD Panel] Initializing panel...");
    
    // Добавить индикатор загрузки в консоль
    console.log("[ITD Panel] DOM state:", document.readyState);
    console.log("[ITD Panel] Body exists:", !!document.body);
    console.log("[ITD Panel] Head exists:", !!document.head);
    
    chrome.storage.local.get([THEME_KEY, SHADER_KEY, AUTO_THEME_KEY, AUTO_SHADER_KEY], (data) => {
      // Загрузить настройки автозапуска
      autoTheme = data[AUTO_THEME_KEY] !== undefined ? data[AUTO_THEME_KEY] : true;
      autoShader = data[AUTO_SHADER_KEY] !== undefined ? data[AUTO_SHADER_KEY] : true;
      
      console.log("[ITD Panel] Auto settings - Theme:", autoTheme, "Shader:", autoShader);
      
      // Применить сохранённую тему (если автозапуск включен)
      currentTheme = data[THEME_KEY] || "default";
      if (autoTheme) {
        console.log("[ITD Panel] Auto-applying theme:", currentTheme);
        applyTheme(currentTheme);
      } else {
        console.log("[ITD Panel] Theme auto-start disabled");
      }
      
      // Создать UI
      createUI();
      
      // Применить сохранённый шейдер (если автозапуск включен)
      if (autoShader && data[SHADER_KEY]) {
        console.log("[ITD Panel] Auto-applying shader...");
        setTimeout(() => {
          applyShader(data[SHADER_KEY]);
          console.log("[ITD Panel] Shader auto-applied");
        }, 1000);
      } else if (!autoShader) {
        console.log("[ITD Panel] Shader auto-start disabled");
      } else {
        console.log("[ITD Panel] No saved shader");
      }
    });
  }
  
  // Запуск инициализации
  if (document.readyState === 'loading') {
    console.log("[ITD Panel] DOM loading, waiting...");
    document.addEventListener('DOMContentLoaded', () => {
      console.log("[ITD Panel] DOM loaded, initializing...");
      setTimeout(initializePanel, 100);
    });
  } else {
    console.log("[ITD Panel] DOM ready, initializing immediately...");
    // Применить тему сразу, не дожидаясь полной инициализации
    chrome.storage.local.get([THEME_KEY, AUTO_THEME_KEY], (data) => {
      const savedTheme = data[THEME_KEY] || "default";
      const autoThemeEnabled = data[AUTO_THEME_KEY] !== undefined ? data[AUTO_THEME_KEY] : true;
      
      if (autoThemeEnabled) {
        console.log("[ITD Panel] Quick-applying theme:", savedTheme);
        document.documentElement.setAttribute('data-itd-custom-theme', savedTheme);
      }
    });
    
    setTimeout(initializePanel, 100);
  }
  
  console.log("[ITD Panel] Script loaded successfully");
  
  // Установить глобальный флаг для проверки из popup
  window.__itdThemePanelLoaded = true;
  window.__itdThemePanelVersion = "1.0.6";
  
  // Уведомить background worker что панель загружена
  try {
    chrome.runtime.sendMessage({ type: 'ITD_PANEL_LOADED' }, (response) => {
      if (response && response.ok) {
        console.log("[ITD Panel] Background worker notified");
      }
    });
  } catch (err) {
    console.log("[ITD Panel] Could not notify background worker:", err.message);
  }
})();
