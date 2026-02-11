// Плавающая панель кнопок для итд.com
console.log("[ITD Floating Panel] Script starting...");

(function() {
  // Проверка что мы на итд.com
  const hostname = location.hostname;
  const href = location.href;
  console.log("[ITD Floating Panel] Current hostname:", hostname);
  
  const isItdSite = hostname.includes('xn--d1ah4a.com') || 
                    hostname.includes('итд.com') || 
                    href.includes('xn--d1ah4a.com') ||
                    href.includes('итд.com');
  
  if (!isItdSite) {
    console.log("[ITD Floating Panel] Not on итд.com, skipping");
    return;
  }
  
  console.log("[ITD Floating Panel] On итд.com - initializing...");
  
  // Проверка что не загружено уже
  if (window.__itdFloatingPanelLoaded) {
    console.log("[ITD Floating Panel] Already loaded, skipping");
    return;
  }
  window.__itdFloatingPanelLoaded = true;
  
  // Состояние панелей
  const state = {
    activePanel: null,
    panels: {}
  };
  
  // Создать плавающую панель кнопок
  function createFloatingButtons() {
    console.log("[ITD Floating Panel] Creating floating buttons...");
    
    const container = document.createElement('div');
    container.id = 'itd-floating-panel';
    container.innerHTML = `
      <div class="itd-floating-buttons">
        <button class="itd-float-btn" data-panel="themes" title="Темы">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
          </svg>
        </button>
        
        <button class="itd-float-btn" data-panel="ai" title="AI Генератор">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
            <line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
        </button>
        
        <button class="itd-float-btn" data-panel="banner" title="Баннер хелпер">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </button>
        
        <button class="itd-float-btn" data-panel="settings" title="Настройки">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m-2 2l-4.2 4.2M23 12h-6m-6 0H1m18.2 5.2l-4.2-4.2m-2-2l-4.2-4.2"/>
          </svg>
        </button>
        
        <button class="itd-float-btn" data-panel="debug" title="Debug">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
      </div>
    `;
    
    document.body.appendChild(container);
    
    // Добавить обработчики кликов
    const buttons = container.querySelectorAll('.itd-float-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const panelName = btn.dataset.panel;
        togglePanel(panelName, btn);
      });
    });
    
    console.log("[ITD Floating Panel] Buttons created");
  }
  
  // Переключить панель
  function togglePanel(panelName, button) {
    console.log("[ITD Floating Panel] Toggle panel:", panelName);
    
    // Если панель уже открыта - закрыть
    if (state.activePanel === panelName) {
      closePanel(panelName);
      button.classList.remove('active');
      state.activePanel = null;
      return;
    }
    
    // Закрыть предыдущую панель
    if (state.activePanel) {
      closePanel(state.activePanel);
      const prevBtn = document.querySelector(`[data-panel="${state.activePanel}"]`);
      if (prevBtn) prevBtn.classList.remove('active');
    }
    
    // Открыть новую панель
    openPanel(panelName);
    button.classList.add('active');
    state.activePanel = panelName;
  }
  
  // Открыть панель
  function openPanel(panelName) {
    // Если панель уже существует - показать
    if (state.panels[panelName]) {
      state.panels[panelName].classList.add('open');
      return;
    }
    
    // Создать новую панель
    let panel;
    switch(panelName) {
      case 'themes':
        panel = createThemesPanel();
        break;
      case 'ai':
        panel = createAIPanel();
        break;
      case 'banner':
        panel = createBannerPanel();
        break;
      case 'settings':
        panel = createSettingsPanel();
        break;
      case 'debug':
        panel = createDebugPanel();
        break;
      default:
        console.warn("[ITD Floating Panel] Unknown panel:", panelName);
        return;
    }
    
    if (panel) {
      document.body.appendChild(panel);
      state.panels[panelName] = panel;
      // Небольшая задержка для плавной анимации
      requestAnimationFrame(() => {
        panel.classList.add('open');
      });
    }
  }
  
  // Закрыть панель
  function closePanel(panelName) {
    const panel = state.panels[panelName];
    if (panel) {
      panel.classList.remove('open');
    }
  }
  
  // Создать панель тем
  function createThemesPanel() {
    const panel = document.createElement('div');
    panel.className = 'itd-side-panel';
    panel.id = 'itd-themes-panel';
    panel.innerHTML = `
      <div class="itd-panel-header">
        <h3>🎨 Темы и Шейдеры</h3>
        <button class="itd-panel-close">✕</button>
      </div>
      <div class="itd-panel-tabs">
        <button class="itd-tab active" data-tab="themes">Темы</button>
        <button class="itd-tab" data-tab="shaders">Шейдеры</button>
      </div>
      <div class="itd-panel-content">
        <!-- Вкладка Темы -->
        <div class="itd-tab-content active" data-tab-content="themes">
          <div class="itd-section">
            <label>Готовые темы:</label>
            <select id="itd-theme-select">
              <option value="default">Default (оригинал)</option>
              <option value="blue">Blue</option>
              <option value="purple">Purple</option>
              <option value="cyan">Cyan</option>
              <option value="green">Green</option>
              <option value="red">Red</option>
            </select>
            <label class="itd-checkbox">
              <input type="checkbox" id="itd-auto-theme" checked>
              <span>Автозапуск темы</span>
            </label>
          </div>
          
          <div class="itd-section">
            <h4>Создать кастомную тему</h4>
            <label>Название темы:</label>
            <input type="text" id="itd-custom-theme-name" placeholder="Моя тема">
          </div>
          
          <div class="itd-section">
            <label>Основной цвет:</label>
            <input type="color" id="itd-custom-primary" value="#667eea">
          </div>
          
          <div class="itd-section">
            <label>Вторичный цвет:</label>
            <input type="color" id="itd-custom-secondary" value="#764ba2">
          </div>
          
          <div class="itd-section">
            <label>Цвет фона:</label>
            <input type="color" id="itd-custom-bg" value="#0a0e1a">
          </div>
          
          <div class="itd-section">
            <label>Прозрачность фона: <span id="itd-bg-opacity-value">80%</span></label>
            <input type="range" id="itd-custom-bg-opacity" min="0" max="100" value="80" step="5">
            <p class="itd-hint">0% = полностью прозрачный, 100% = непрозрачный</p>
          </div>
          
          <div class="itd-section">
            <label class="itd-checkbox">
              <input type="checkbox" id="itd-custom-gradient">
              <span>Градиентный режим</span>
            </label>
            <p class="itd-hint">Создаёт плавный градиент между основным и вторичным цветом</p>
          </div>
          
          <div class="itd-section">
            <label class="itd-checkbox">
              <input type="checkbox" id="itd-custom-font-enabled">
              <span>Кастомный шрифт</span>
            </label>
            <p class="itd-hint">Перетащите TTF файл в окно плагина для загрузки шрифта</p>
            <div id="itd-font-drop-zone" class="itd-drop-zone" style="display: none;">
              <p>📁 Перетащите .ttf файл сюда</p>
              <p class="itd-font-name"></p>
            </div>
          </div>
          
          <div class="itd-section">
            <label>Сохранённые кастомные темы:</label>
            <select id="itd-saved-custom-themes">
              <option value="">-- Выбрать --</option>
            </select>
            <div class="itd-shader-actions">
              <button id="itd-load-custom-theme" class="itd-btn">Загрузить</button>
              <button id="itd-delete-custom-theme" class="itd-btn">Удалить</button>
            </div>
          </div>
          
          <div class="itd-actions">
            <button id="itd-save-custom-theme" class="itd-btn itd-btn-primary">Сохранить тему</button>
            <button id="itd-apply-custom-theme" class="itd-btn">Применить</button>
          </div>
        </div>
        
        <!-- Вкладка Шейдеры -->
        <div class="itd-tab-content" data-tab-content="shaders">
          <div class="itd-section">
            <label>Сохранённые шейдеры:</label>
            <select id="itd-saved-shaders">
              <option value="">-- Выбрать --</option>
            </select>
            <div class="itd-shader-actions">
              <button id="itd-load-shader" class="itd-btn">Загрузить</button>
              <button id="itd-delete-shader" class="itd-btn">Удалить</button>
            </div>
          </div>
          
          <div class="itd-section">
            <label>Примеры шейдеров:</label>
            <select id="itd-shader-example">
              <option value="">-- Выбрать --</option>
              <option value="darkhole">The Big Bang</option>
              <option value="stars">Fractal Pyramid</option>
              <option value="sky">Realistic Clouds</option>
              <option value="sea">Seascape</option>
              <option value="tunnel">Tunnel Effect</option>
              <option value="space">Starfield</option>
            </select>
          </div>
          
          <div class="itd-section">
            <label>Название шейдера:</label>
            <input type="text" id="itd-shader-name" placeholder="Мой шейдер">
          </div>
          
          <div class="itd-section">
            <label>Код шейдера (GLSL):</label>
            <textarea id="itd-shader-code" placeholder="void mainImage(out vec4 fragColor, in vec2 fragCoord) { ... }"></textarea>
            <label class="itd-checkbox">
              <input type="checkbox" id="itd-auto-shader" checked>
              <span>Автозапуск шейдера</span>
            </label>
          </div>
          
          <div class="itd-actions">
            <button id="itd-save-shader" class="itd-btn itd-btn-primary">Сохранить шейдер</button>
            <button id="itd-apply-shader" class="itd-btn">Применить</button>
            <button id="itd-clear-shader" class="itd-btn">Очистить</button>
          </div>
        </div>
      </div>
    `;
    
    // Добавить обработчики
    setupThemesPanel(panel);
    
    return panel;
  }
  
  // Создать панель AI
  function createAIPanel() {
    const panel = document.createElement('div');
    panel.className = 'itd-side-panel';
    panel.id = 'itd-ai-panel';
    panel.innerHTML = `
      <div class="itd-panel-header">
        <h3>🤖 AI Генератор</h3>
        <button class="itd-panel-close">✕</button>
      </div>
      <div class="itd-panel-content">
        <div class="itd-section">
          <label>API Endpoint:</label>
          <input type="text" id="itd-ai-endpoint" placeholder="https://ai.megallm.io/v1/chat/completions">
        </div>
        
        <div class="itd-section">
          <label>API Key:</label>
          <input type="password" id="itd-ai-key" placeholder="sk-...">
        </div>
        
        <div class="itd-section">
          <label>Модель:</label>
          <input type="text" id="itd-ai-model" value="openai-gpt-oss-20b" readonly disabled style="opacity: 0.6; cursor: not-allowed;">
          <p class="itd-hint">Используется бесплатная модель openai-gpt-oss-20b</p>
        </div>
        
        <div class="itd-section">
          <label>Тема поста:</label>
          <textarea id="itd-ai-prompt" rows="4" placeholder="О чем написать пост?"></textarea>
        </div>
        
        <div class="itd-section">
          <label>Результат:</label>
          <textarea id="itd-ai-result" rows="6" readonly placeholder="Сгенерированный текст появится здесь..."></textarea>
        </div>
        
        <div class="itd-actions">
          <button id="itd-ai-generate" class="itd-btn itd-btn-primary">Сгенерировать</button>
          <button id="itd-ai-insert" class="itd-btn">Вставить в пост</button>
        </div>
      </div>
    `;
    
    setupAIPanel(panel);
    
    return panel;
  }
  
  // Создать панель баннера
  function createBannerPanel() {
    const panel = document.createElement('div');
    panel.className = 'itd-side-panel';
    panel.id = 'itd-banner-panel';
    panel.innerHTML = `
      <div class="itd-panel-header">
        <h3>🖼️ Баннер хелпер</h3>
        <button class="itd-panel-close">✕</button>
      </div>
      <div class="itd-panel-content">
        <div class="itd-section">
          <button id="itd-detect-canvas" class="itd-btn itd-btn-primary">Найти canvas</button>
          <button id="itd-select-area" class="itd-btn">Выбрать область</button>
        </div>
        
        <div class="itd-section">
          <label>Изображение:</label>
          <input type="file" id="itd-image-input" accept="image/*" multiple>
          <p class="itd-hint" id="itd-image-meta">Файл не выбран</p>
        </div>
        
        <div class="itd-section">
          <label>Режим:</label>
          <select id="itd-fit-mode">
            <option value="cover">Cover (заполнить)</option>
            <option value="contain">Contain (вместить)</option>
            <option value="stretch">Stretch (растянуть)</option>
          </select>
        </div>
        
        <div class="itd-section">
          <label>Масштаб: <span id="itd-scale-value">100%</span></label>
          <input type="range" id="itd-scale" min="20" max="300" value="100">
        </div>
        
        <div class="itd-section">
          <label>Сдвиг X: <span id="itd-offset-x-value">0px</span></label>
          <input type="range" id="itd-offset-x" min="-400" max="400" value="0">
        </div>
        
        <div class="itd-section">
          <label>Сдвиг Y: <span id="itd-offset-y-value">0px</span></label>
          <input type="range" id="itd-offset-y" min="-300" max="300" value="0">
        </div>
        
        <div class="itd-actions">
          <button id="itd-apply-banner" class="itd-btn itd-btn-primary">Применить</button>
          <button id="itd-export-banner" class="itd-btn">Экспорт PNG</button>
          <button id="itd-export-gif" class="itd-btn">Сохранить как GIF</button>
        </div>
      </div>
    `;
    
    setupBannerPanel(panel);
    
    return panel;
  }
  
  // Создать панель настроек
  function createSettingsPanel() {
    const panel = document.createElement('div');
    panel.className = 'itd-side-panel';
    panel.id = 'itd-settings-panel';
    panel.innerHTML = `
      <div class="itd-panel-header">
        <h3>⚙️ Настройки</h3>
        <button class="itd-panel-close">✕</button>
      </div>
      <div class="itd-panel-content">
        <div class="itd-section">
          <h4>Общие настройки</h4>
          <label class="itd-checkbox">
            <input type="checkbox" id="itd-setting-auto-load" checked>
            <span>Автозагрузка панели</span>
          </label>
          <label class="itd-checkbox">
            <input type="checkbox" id="itd-setting-notifications" checked>
            <span>Показывать уведомления</span>
          </label>
        </div>
        
        <div class="itd-section">
          <h4>Информация</h4>
          <p class="itd-hint">Версия: 1.0.7</p>
          <p class="itd-hint">Расширение: ITD Helper</p>
          <p class="itd-hint">Панель: Справа (фиксировано)</p>
        </div>
        
        <div class="itd-actions">
          <button id="itd-reset-settings" class="itd-btn itd-btn-danger">Сбросить настройки</button>
        </div>
      </div>
    `;
    
    setupSettingsPanel(panel);
    
    return panel;
  }
  
  // Создать панель дебага
  function createDebugPanel() {
    const panel = document.createElement('div');
    panel.className = 'itd-side-panel';
    panel.id = 'itd-debug-panel';
    panel.innerHTML = `
      <div class="itd-panel-header">
        <h3>🐛 Debug</h3>
        <button class="itd-panel-close">✕</button>
      </div>
      <div class="itd-panel-content">
        <div class="itd-section">
          <h4>Статус системы</h4>
          <div id="itd-debug-status" class="itd-debug-info">
            <p>Загрузка...</p>
          </div>
        </div>
        
        <div class="itd-section">
          <h4>Логи</h4>
          <textarea id="itd-debug-logs" rows="10" readonly></textarea>
        </div>
        
        <div class="itd-actions">
          <button id="itd-debug-refresh" class="itd-btn itd-btn-primary">Обновить</button>
          <button id="itd-debug-copy" class="itd-btn">Копировать</button>
          <button id="itd-debug-clear" class="itd-btn">Очистить</button>
        </div>
      </div>
    `;
    
    setupDebugPanel(panel);
    
    return panel;
  }
  
  // Настройка панели тем
  function setupThemesPanel(panel) {
    const closeBtn = panel.querySelector('.itd-panel-close');
    closeBtn.addEventListener('click', () => {
      closePanel('themes');
      const btn = document.querySelector('[data-panel="themes"]');
      if (btn) btn.classList.remove('active');
      state.activePanel = null;
    });
    
    // Переключение вкладок
    const tabs = panel.querySelectorAll('.itd-tab');
    const tabContents = panel.querySelectorAll('.itd-tab-content');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const tabName = tab.dataset.tab;
        
        console.log('[ITD] Switching to tab:', tabName);
        
        // Убрать активность со всех вкладок
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(tc => tc.classList.remove('active'));
        
        // Активировать выбранную вкладку
        tab.classList.add('active');
        const content = panel.querySelector(`[data-tab-content="${tabName}"]`);
        if (content) {
          content.classList.add('active');
          console.log('[ITD] Tab activated:', tabName);
        }
      });
    });
    
    // Загрузить сохранённые данные
    chrome.storage.local.get(['itdCustomTheme', 'itdAutoTheme', 'itdShaderCode', 'itdAutoShader', 'itdSavedShaders', 'itdActiveShader', 'itdSavedCustomThemes', 'itdActiveCustomTheme'], (data) => {
      const themeSelect = panel.querySelector('#itd-theme-select');
      const autoThemeCheck = panel.querySelector('#itd-auto-theme');
      const shaderCode = panel.querySelector('#itd-shader-code');
      const autoShaderCheck = panel.querySelector('#itd-auto-shader');
      const savedShadersSelect = panel.querySelector('#itd-saved-shaders');
      const savedCustomThemesSelect = panel.querySelector('#itd-saved-custom-themes');
      
      // Установить сохранённые значения
      if (data.itdCustomTheme) {
        themeSelect.value = data.itdCustomTheme;
      }
      if (data.itdAutoTheme !== undefined) {
        autoThemeCheck.checked = data.itdAutoTheme;
      }
      if (data.itdShaderCode) {
        shaderCode.value = data.itdShaderCode;
      }
      if (data.itdAutoShader !== undefined) {
        autoShaderCheck.checked = data.itdAutoShader;
      }
      
      // Загрузить список сохранённых шейдеров
      if (data.itdSavedShaders) {
        loadSavedShadersList(savedShadersSelect, data.itdSavedShaders, data.itdActiveShader);
      }
      
      // Загрузить список кастомных тем
      if (data.itdSavedCustomThemes) {
        loadSavedCustomThemesList(savedCustomThemesSelect, data.itdSavedCustomThemes, data.itdActiveCustomTheme);
      }
    });
    
    // Обработчик выбора темы
    const themeSelect = panel.querySelector('#itd-theme-select');
    themeSelect.addEventListener('change', () => {
      const theme = themeSelect.value;
      applyTheme(theme);
      chrome.storage.local.set({ itdCustomTheme: theme });
      console.log("[ITD Floating Panel] Theme changed to:", theme);
    });
    
    // Обработчик автозапуска темы
    const autoThemeCheck = panel.querySelector('#itd-auto-theme');
    autoThemeCheck.addEventListener('change', () => {
      chrome.storage.local.set({ itdAutoTheme: autoThemeCheck.checked });
      console.log("[ITD Floating Panel] Auto theme:", autoThemeCheck.checked);
    });
    
    // Обработчик автозапуска шейдера
    const autoShaderCheck = panel.querySelector('#itd-auto-shader');
    autoShaderCheck.addEventListener('change', () => {
      chrome.storage.local.set({ itdAutoShader: autoShaderCheck.checked });
      console.log("[ITD Floating Panel] Auto shader:", autoShaderCheck.checked);
    });
    
    // Примеры шейдеров
    const shaderExamples = {
      darkhole: `// The Big Bang - https://www.shadertoy.com/view/MdXSzS
void mainImage( out vec4 fragColor, in vec2 fragCoord ){
vec2 uv = (fragCoord.xy / iResolution.xy) - .5;
float t = iTime * .1 + ((.25 + .05 * sin(iTime * .1))/(length(uv.xy) + .07)) * 2.2;
float si = sin(t);
float co = cos(t);
mat2 ma = mat2(co, si, -si, co);
float v1, v2, v3;
v1 = v2 = v3 = 0.0;
float s = 0.0;
for (int i = 0; i < 90; i++){
vec3 p = s * vec3(uv, 0.0);
p.xy *= ma;
p += vec3(.22, .3, s - 1.5 - sin(iTime * .13) * .1);
for (int i = 0; i < 8; i++) p = abs(p) / dot(p,p) - 0.659;
v1 += dot(p,p) * .0015 * (1.8 + sin(length(uv.xy * 13.0) + .5  - iTime * .2));
v2 += dot(p,p) * .0013 * (1.5 + sin(length(uv.xy * 14.5) + 1.2 - iTime * .3));
v3 += length(p.xy*10.) * .0003;
s  += .035;
}
float len = length(uv);
v1 *= smoothstep(.7, .0, len);
v2 *= smoothstep(.5, .0, len);
v3 *= smoothstep(.9, .0, len);
vec3 col = vec3( v3 * (1.5 + sin(iTime * .2) * .4),(v1 + v3) * .3,v2) + smoothstep(0.2, .0, len) * .85 + smoothstep(.0, .6, v3) * .3;
fragColor=vec4(min(pow(abs(col), vec3(1.2)), 1.0), 1.0);
}`,
      stars: `vec3 palette(float d){return mix(vec3(0.2,0.7,0.9),vec3(1.,0.,1.),d);}vec2 rotate(vec2 p,float a){float c = cos(a);float s = sin(a);return p*mat2(c,s,-s,c);}float map(vec3 p){for( int i = 0; i<8; ++i){float t = iTime*0.2;p.xz =rotate(p.xz,t);p.xy =rotate(p.xy,t*1.89);p.xz = abs(p.xz);p.xz-=.5;}return dot(sign(p),p)/5.;}vec4 rm (vec3 ro, vec3 rd){float t = 0.;vec3 col = vec3(0.);float d;for(float i =0.; i<64.; i++){vec3 p = ro + rd*t;d = map(p)*.5;if(d<0.02){break;}if(d>100.){break;}col+=palette(length(p)*.1)/(400.*(d));t+=d;}return vec4(col,1./(d*100.));}void mainImage( out vec4 fragColor, in vec2 fragCoord ){vec2 uv = (fragCoord-(iResolution.xy/2.))/iResolution.x;vec3 ro = vec3(0.,0.,-50.);ro.xz = rotate(ro.xz,iTime);vec3 cf = normalize(-ro);vec3 cs = normalize(cross(cf,vec3(0.,1.,0.)));vec3 cu = normalize(cross(cf,cs));vec3 uuv = ro+cf*3. + uv.x*cs + uv.y*cu;vec3 rd = normalize(uuv-ro);vec4 col = rm(ro,rd);fragColor = col;}`,
      sky: `const float cloudscale = 1.1;
const float speed = 0.03;
const float clouddark = 0.5;
const float cloudlight = 0.3;
const float cloudcover = 0.2;
const float cloudalpha = 8.0;
const float skytint = 0.5;
const vec3 skycolour1 = vec3(0.2, 0.4, 0.6);
const vec3 skycolour2 = vec3(0.4, 0.7, 1.0);
const mat2 m = mat2( 1.6,  1.2, -1.2,  1.6 );
vec2 hash( vec2 p ) {
p = vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)));
return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}
float noise( in vec2 p ) {
const float K1 = 0.366025404;
const float K2 = 0.211324865;
vec2 i = floor(p + (p.x+p.y)*K1);
vec2 a = p - i + (i.x+i.y)*K2;
vec2 o = (a.x>a.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
vec2 b = a - o + K2;
vec2 c = a - 1.0 + 2.0*K2;
vec3 h = max(0.5-vec3(dot(a,a), dot(b,b), dot(c,c) ), 0.0 );
vec3 n = h*h*h*h*vec3( dot(a,hash(i+0.0)), dot(b,hash(i+o)), dot(c,hash(i+1.0)));
return dot(n, vec3(70.0));
}
float fbm(vec2 n) {
float total = 0.0, amplitude = 0.1;
for (int i = 0; i < 7; i++) {
total += noise(n) * amplitude;
n = m * n;
amplitude *= 0.4;
}
return total;
}
void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
vec2 p = fragCoord.xy / iResolution.xy;
vec2 uv = p*vec2(iResolution.x/iResolution.y,1.0);
float time = iTime * speed;
float q = fbm(uv * cloudscale * 0.5);
float r = 0.0;
uv *= cloudscale;
uv -= q - time;
float weight = 0.8;
for (int i=0; i<8; i++){
r += abs(weight*noise( uv ));
uv = m*uv + time;
weight *= 0.7;
}
float f = 0.0;
uv = p*vec2(iResolution.x/iResolution.y,1.0);
uv *= cloudscale;
uv -= q - time;
weight = 0.7;
for (int i=0; i<8; i++){
f += weight*noise( uv );
uv = m*uv + time;
weight *= 0.6;
}
f *= r + f;
float c = 0.0;
time = iTime * speed * 2.0;
uv = p*vec2(iResolution.x/iResolution.y,1.0);
uv *= cloudscale*2.0;
uv -= q - time;
weight = 0.4;
for (int i=0; i<7; i++){
c += weight*noise( uv );
uv = m*uv + time;
weight *= 0.6;
}
float c1 = 0.0;
time = iTime * speed * 3.0;
uv = p*vec2(iResolution.x/iResolution.y,1.0);
uv *= cloudscale*3.0;
uv -= q - time;
weight = 0.4;
for (int i=0; i<7; i++){
c1 += abs(weight*noise( uv ));
uv = m*uv + time;
weight *= 0.6;
}
c += c1;
vec3 skycolour = mix(skycolour2, skycolour1, p.y);
vec3 cloudcolour = vec3(1.1, 1.1, 0.9) * clamp((clouddark + cloudlight*c), 0.0, 1.0);
f = cloudcover + cloudalpha*f*r;
vec3 result = mix(skycolour, clamp(skytint * skycolour + cloudcolour, 0.0, 1.0), clamp(f + c, 0.0, 1.0));
fragColor = vec4( result, 1.0 );
}`,
      sea: `// Created by inigo quilez - iq/2014
//   https://www.youtube.com/c/InigoQuilez
//   https://iquilezles.org/
// A simple and cheap 2D shader to accompany the Pirates of the Caribean music.
float fbm( vec2 p ){
return 0.5000*texture( iChannel1, p*1.00 ).x + 0.2500*texture( iChannel1, p*2.02 ).x + 0.1250*texture( iChannel1, p*4.03 ).x + 0.0625*texture( iChannel1, p*8.04 ).x;
}
void mainImage( out vec4 fragColor, in vec2 fragCoord ){
float time = mod( iTime, 60.0 );
vec2 p = (2.0*fragCoord-iResolution.xy) / iResolution.y;
vec2 i = p;
// camera
p += vec2(1.0,3.0)*0.001*2.0*cos( iTime*5.0 + vec2(0.0,1.5) );    
p += vec2(1.0,3.0)*0.001*1.0*cos( iTime*9.0 + vec2(1.0,4.5) );    
float an = 0.3*sin( 0.1*time );
float co = cos(an);
float si = sin(an);
p = mat2( co, -si, si, co )*p*0.85;
// water
vec2 q = vec2(p.x,1.0)/p.y;
q.y -= 0.9*time;    
vec2 off = texture( iChannel0, 0.1*q*vec2(1.0,2.0) - vec2(0.0,0.007*iTime) ).xy;
q += 0.4*(-1.0 + 2.0*off);
vec3 col = 0.2*sqrt(texture( iChannel0, 0.05*q *vec2(1.0,4.0) + vec2(0.0,0.01*iTime) ).zyx);
float re = 1.0-smoothstep( 0.0, 0.7, abs(p.x-0.6) - abs(p.y)*0.5+0.2 );
col += 1.0*vec3(1.0,0.9,0.73)*re*0.2*(0.1+0.9*off.y)*5.0*(1.0-col.x);
float re2 = 1.0-smoothstep( 0.0, 2.0, abs(p.x-0.6) - abs(p.y)*0.85 );
col += 0.7*re2*smoothstep(0.35,1.0,texture( iChannel1, 0.075*q *vec2(1.0,4.0) ).x);
// sky
vec3 sky = vec3(0.0,0.05,0.1)*1.4;
// stars    
sky += 0.5*smoothstep( 0.95,1.00,texture( iChannel1, 0.25*p ).x);
sky += 0.5*smoothstep( 0.85,1.0,texture( iChannel1, 0.25*p ).x);
sky += 0.2*pow(1.0-max(0.0,p.y),2.0);
// clouds    
float f = fbm( 0.002*vec2(p.x,1.0)/p.y );
vec3 cloud = vec3(0.3,0.4,0.5)*0.7*(1.0-0.85*smoothstep(0.4,1.0,f));
sky = mix( sky, cloud, 0.95*smoothstep( 0.4, 0.6, f ) );
sky = mix( sky, vec3(0.33,0.34,0.35), pow(1.0-max(0.0,p.y),2.0) );
col = mix( col, sky, smoothstep(0.0,0.1,p.y) );
// horizon
col += 0.1*pow(clamp(1.0-abs(p.y),0.0,1.0),9.0);
// moon
float d = length(p-vec2(0.6,0.5));
vec3 moon = vec3(0.98,0.97,0.95)*(1.0-0.1*smoothstep(0.2,0.5,f));
col += 0.8*moon*exp(-4.0*d)*vec3(1.1,1.0,0.8);
col += 0.2*moon*exp(-2.0*d);
moon *= 0.85+0.15*smoothstep(0.25,0.7,fbm(0.05*p+0.3));
col = mix( col, moon, 1.0-smoothstep(0.2,0.22,d) );
// postprocess
col = pow( 1.4*col, vec3(1.5,1.2,1.0) );    
col *= clamp(1.0-0.3*length(i), 0.0, 1.0 );
// fade
col *=       smoothstep( 3.0, 6.0,time);
col *= 1.0 - smoothstep(44.0,50.0,time);
fragColor = vec4( col, 1.0 );
}`,
      tunnel: `// Buffer A
/* Shading constants */
/* --------------------- */
const vec3 LP = vec3(0, 0, 0);  // light position
const vec3 LC = vec3(.85,0.80,0.70);    // light colour
const vec3 HC1 = vec3(.5, .4, .3);      // hemisphere light colour 1
const vec3 HC2 = vec3(0.1,.1,.6)*.5;    // hemisphere light colour 2
const vec3 HLD = vec3(0,1,0);           // hemisphere light direction
const vec3 BC = vec3(0.25,0.25,0.25);   // back light colour
const vec3 FC = vec3(1.30,1.20,1.00);   // fresnel colour
const float AS = .5;                    // ambient light strength
const float DS = 1.;                    // diffuse light strength
const float BS = .3;                    // back light strength
const float FS = .3;                    // fresnel strength
/* Raymarching constants */
/* --------------------- */
const float MAX_TRACE_DISTANCE = 50.;             // max trace distance
const float INTERSECTION_PRECISION = 0.0001;       // precision of the intersection
const int NUM_OF_TRACE_STEPS = 256;               // max number of trace steps
const float STEP_MULTIPLIER = 1.;                 // the step mutliplier - ie, how much further to progress on each step
/* Structures */
/* ---------- */
struct Camera {
vec3 ro;
vec3 rd;
vec3 forward;
vec3 right;
vec3 up;
float FOV;
};
struct Surface {
float len;
vec3 position;
vec3 colour;
float id;
float steps;
float AO;
};
struct Model {
float dist;
vec3 colour;
float id;
};
/* RNG */
/* ---------- */
// Hash without sine from Dave Hoskins
// https://www.shadertoy.com/view/4djSRWa
float hash12(vec2 p) {
vec3 p3  = fract(vec3(p.xyx) * .1031);
p3 += dot(p3, p3.yzx + 33.33);
return fract((p3.x + p3.y) * p3.z);
}
vec2 hash22(vec2 p) {
vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
p3 += dot(p3, p3.yzx+33.33);
return fract((p3.xx+p3.yz)*p3.zy);
}
/* Utilities */
/* ---------- */
vec2 toScreenspace(in vec2 p) {
vec2 uv = (p - 0.5 * iResolution.xy) / min(iResolution.y, iResolution.x);
return uv;
}
mat2 R(float a) {
float c = cos(a);
float s = sin(a);
return mat2(c, -s, s, c);
}
Camera getCamera(in vec2 uv, in vec3 pos, in vec3 target) {
vec3 f = normalize(target - pos);
vec3 r = normalize(vec3(f.z, 0., -f.x));
vec3 u = normalize(cross(f, r));
float FOV = .6;
return Camera(
pos,
normalize(f + FOV * uv.x * r + FOV * uv.y * u),
f,
r,
u,
FOV
);
}
// folding from gaz: https://www.shadertoy.com/view/4tX3DS
vec2 fold(vec2 p, float a) {
p.x=abs(p.x);
vec2 n = vec2(cos(a),sin(a));
for(int i = 0; i < 2; ++i){
p -= 2.*min(0.,dot(p,n))*n;
n = normalize(n-vec2(1.,0.));
}
return p;
}
vec3 path(in float delta) {
return vec3(
cos(delta*.1) * 2.2 + sin((delta) * .3) * .5*cos(delta * .05),
sin(delta * .04) * 5.4+cos(delta * .04) * 5.4,
delta
);
}
#define PI 3.14159236
#define SCALE 2.
//--------------------------------
// Modelling
//--------------------------------
Model model(vec3 p) {
float d = length(p)-.4;
p.xy -= path(p.z).xy;
float m=length(p.xy)*.5;
float z = p.z;
float r = cos(z*.2+sin(m)*.3)*.4+.5;
float r2 = (sin(z*.05124)*cos(z*.025203))+1.;
p*=SCALE;
vec3 q=p;
p=vec3(R(0.05*p.z+r)*p.xy, p.z);
p.xy=fold(p.xy,PI/6.+z*.2);
p=mod(p,3.)-1.5;
vec3 o = abs(p); o-=(o.x+o.y+o.z)*0.33333;
float d0=max(o.x,max(o.y,o.z))-0.01;
float d1=length(q.xy)-1.-r2*2.;
d0=max(d0,-d1);
d0=max(d0,length(q.xy)-4.-r2*2.);
d=length( vec2(abs(d0), length(mod(p,vec3(.1))-.05)) )-.3*r;
vec3 colour = mix(
mix(vec3(.8,.3,.6), vec3(.3,.9,.9), vec3(cos(z*.1)*.5+.5, sin(z*.12)*.5+.5, cos(z*.05+1.)*.5+.5)),
vec3(1.,.6,.4)*.1,
m
);
return Model(d/SCALE, colour, 1.);
}
Model map( vec3 p ){
return model(p);
}
/* Modelling utilities */
/* ---------- */
// I *think* I borrowed this from Shane, but probably orginally comes from IQ. 
// Calculates the normal by taking a very small distance,
// remapping the function, and getting normal for that
vec3 calcNormal( in vec3 pos ){
vec3 eps = vec3( 0.001, 0.0, 0.0 );
vec3 nor = vec3(
map(pos+eps.xyy).dist - map(pos-eps.xyy).dist,
map(pos+eps.yxy).dist - map(pos-eps.yxy).dist,
map(pos+eps.yyx).dist - map(pos-eps.yyx).dist );
return normalize(nor);
}
//--------------------------------
// Raymarcher
//--------------------------------
Surface march( in Camera cam ){
float h = 1e4; // local distance
float d = 0.; // ray depth
float id = -1.; // surace id
float s = 0.; // number of steps
float ao = 0.; // march space AO. Simple weighted accumulator. Not really AO, but ¯\\_(ツ)_/¯
vec3 p; // ray position
vec3 c; // surface colour
for( int i=0; i< NUM_OF_TRACE_STEPS ; i++ ) {
if( abs(h) < INTERSECTION_PRECISION || d > MAX_TRACE_DISTANCE ) break;
p = cam.ro+cam.rd*d;
Model m = map( p );
h = m.dist;
d += h * STEP_MULTIPLIER;
id = m.id;
s += 1.;
ao += max(h, 0.);
c = m.colour;
}
if( d >= MAX_TRACE_DISTANCE ) id = -1.0;
return Surface( d, p, c, id, s, ao );
}
//--------------------------------
// Shading
//--------------------------------
/**
* Soft shadows and AO curtesy of Inigo Quilez
* https://iquilezles.org/articles/rmshadows
*/
float softshadow( in vec3 ro, in vec3 rd, in float mint, in float tmax ) {
float res = 1.0;
float t = mint;
for( int i=0; i<16; i++ ) {
float h = map( ro + rd*t ).dist;
res = min( res, 8.0*h/t );
t += clamp( h, 0.02, 0.10 );
if( h<0.001 || t>tmax ) break;
}
return clamp( res, 0.0, 1.0 );
}
float AO( in vec3 pos, in vec3 nor ) {
float occ = 0.0;
float sca = 1.0;
for( int i=0; i<5; i++ ){
float hr = 0.01 + 0.12*float(i)/4.0;
vec3 aopos =  nor * hr + pos;
float dd = map( aopos ).dist;
occ += -(dd-hr)*sca;
sca *= 0.95;
}
return clamp( 1.0 - 3.0*occ, 0.0, 1.0 );    
}
vec3 shade(vec3 col, vec3 pos, vec3 nor, vec3 ref, Camera cam) {
vec3 plp = LP - pos; // point light
float o = AO( pos, nor );                 // Ambient occlusion
vec3  l = normalize( plp );                    // light direction
float d = clamp( dot( nor, l ), 0.0, 1.0 )*DS;   // diffuse component
float b = clamp( dot( nor, normalize(vec3(-l.x,0,-l.z))), 0.0, 1.0 )*clamp( 1.0-pos.y,0.0,1.0)*BS; // back light component
float f = pow( clamp(1.0+dot(nor,cam.rd),0.0,1.0), 2.0 )*FS; // fresnel component
vec3 c = vec3(0.0);
c += d*LC;                           // diffuse light integration
c += mix(HC1,HC2,dot(nor, HLD))*AS;        // hemisphere light integration (ambient)
c += b*BC*o;       // back light integration
c += f*FC*o;       // fresnel integration
return col*c;
}
vec3 render(Surface surface, Camera cam, vec2 uv) {
vec3 colour = vec3(.04,.045,.05);
colour = vec3(.1, .0, .3);
vec3 colourB = vec3(.1, .05, .2);
vec2 pp = uv;
colour = mix(colourB, colour, pow(length(pp), 2.)/1.5);
vec3 bg = colour;
vec3 surfaceNormal = calcNormal( surface.position );
vec3 ref = reflect(cam.rd, surfaceNormal);
colour = surfaceNormal;
vec3 pos = surface.position;
vec3 col = surface.colour;
colour = shade(col, pos, surfaceNormal, ref, cam);
float sceneLength = length(cam.ro - surface.position);
float fog = smoothstep(MAX_TRACE_DISTANCE, -3., sceneLength);
colour = mix(bg, colour, pow(fog, 2.));
colour *= clamp(1./(surface.steps*.02), .2, 10.);
return colour;
}
void mainImage( out vec4 c, in vec2 f ) {
vec2 uv = toScreenspace(f.xy);
float t = iTime*5.;
vec3 la = path(t+.5);
Camera cam = getCamera(uv, path(t), la);
vec2 a = sin(vec2(1.5707963, 0) - path(la.z).x/4.); 
mat2 rM = mat2(a, -a.y, a.x);
cam.rd.xy *= rM;
Surface surface = march(cam);
vec3 r = render(surface, cam, uv);
c = texture(iChannel0,f/iResolution.xy)*.8;
vec4 c2 = vec4(r,1);
c = clamp(mix(c+c2, c2*2., clamp(surface.len*.03, 0., 1.)), vec4(0.), vec4(1));
}

// Image
void mainImage( out vec4 c, in vec2 f ) {
c = texture(iChannel0,f/iResolution.xy);
}`,
      space: `void mainImage(out vec4 o, vec2 u) {
// Инициализируем i нулем, чтобы избежать мусора в памяти
float i = 0., a, d, s, t = iTime * 1.3;
vec3 p = iResolution;
u = (u + u - p.xy) / p.y;
float roll = sin(t * .7) * .3 + sin(t * 1.3) * .15 - .785;
float alt  = sin(t * .4) * .8 + sin(t * .9) * 4.4;
// Условие на отрисовку рамок (abs(u.y) > .8) удалено
float c = cos(roll), sn = sin(roll);
vec2 ru = u * mat2(c, -sn, sn, c);
// Обнуляем выходной цвет перед циклом
o = vec4(0.0);
for( ; i < 128.; i++) {
p = vec3(ru * d, d + t / .1);
s = 8. + p.y + p.x + alt;
for (a = .01; a < 1.; a += a) {
p += cos(t - p.yzx) * .2;
s -= abs(dot(sin(t + t - .2 * p.z + .3 * p / a), vec3(a + a)));
}
d += s = .1 + abs(s) * .1;
// Накопление свечения
o += vec4(4, 2, 1, 0) / s + .1 * vec4(4, 2, 1, 0) / abs(ru.y + ru.x);
}
// Финальная постобработка и тонирование
o = tanh(o / 1e3 / length(ru - vec2(.5, .3)) + .1 * dot(ru, ru));
}`
    };
    
    const exampleSelect = panel.querySelector('#itd-shader-example');
    const codeArea = panel.querySelector('#itd-shader-code');
    const shaderNameInput = panel.querySelector('#itd-shader-name');
    
    exampleSelect.addEventListener('change', () => {
      if (exampleSelect.value && shaderExamples[exampleSelect.value]) {
        codeArea.value = shaderExamples[exampleSelect.value];
        shaderNameInput.value = exampleSelect.options[exampleSelect.selectedIndex].text;
      }
    });
    
    // Сохранить шейдер
    const saveBtn = panel.querySelector('#itd-save-shader');
    saveBtn.addEventListener('click', () => {
      const name = shaderNameInput.value.trim();
      const code = codeArea.value.trim();
      
      if (!name) {
        alert('Введите название шейдера');
        return;
      }
      if (!code) {
        alert('Введите код шейдера');
        return;
      }
      
      saveShader(name, code, panel);
    });
    
    // Загрузить шейдер
    const loadBtn = panel.querySelector('#itd-load-shader');
    loadBtn.addEventListener('click', () => {
      const savedShadersSelect = panel.querySelector('#itd-saved-shaders');
      const shaderId = savedShadersSelect.value;
      
      if (!shaderId) {
        alert('Выберите шейдер из списка');
        return;
      }
      
      loadShader(shaderId, panel);
    });
    
    // Удалить шейдер
    const deleteBtn = panel.querySelector('#itd-delete-shader');
    deleteBtn.addEventListener('click', () => {
      const savedShadersSelect = panel.querySelector('#itd-saved-shaders');
      const shaderId = savedShadersSelect.value;
      
      if (!shaderId) {
        alert('Выберите шейдер из списка');
        return;
      }
      
      if (confirm('Удалить шейдер "' + savedShadersSelect.options[savedShadersSelect.selectedIndex].text + '"?')) {
        deleteShader(shaderId, panel);
      }
    });
    
    // Применить шейдер
    const applyBtn = panel.querySelector('#itd-apply-shader');
    applyBtn.addEventListener('click', () => {
      const code = codeArea.value.trim();
      if (code) {
        applyShader(code);
        chrome.storage.local.set({ itdShaderCode: code });
      }
    });
    
    // Очистить шейдер
    const clearBtn = panel.querySelector('#itd-clear-shader');
    clearBtn.addEventListener('click', () => {
      clearShader();
      codeArea.value = '';
      shaderNameInput.value = '';
      exampleSelect.value = '';
      chrome.storage.local.remove('itdShaderCode');
      chrome.storage.local.remove('itdActiveShader');
    });
    
    // === Кастомные темы ===
    
    // Обработчик слайдера прозрачности фона - применять в реальном времени
    const bgOpacitySlider = panel.querySelector('#itd-custom-bg-opacity');
    const bgOpacityValue = panel.querySelector('#itd-bg-opacity-value');
    
    bgOpacitySlider.addEventListener('input', () => {
      bgOpacityValue.textContent = bgOpacitySlider.value + '%';
      
      // Автоматически применить тему при изменении прозрачности
      const primary = panel.querySelector('#itd-custom-primary').value;
      const secondary = panel.querySelector('#itd-custom-secondary').value;
      const bg = panel.querySelector('#itd-custom-bg').value;
      const bgOpacity = bgOpacitySlider.value;
      const gradient = panel.querySelector('#itd-custom-gradient').checked;
      
      applyCustomTheme(primary, secondary, bg, gradient, bgOpacity);
    });
    
    // Автоприменение для color picker'ов и градиента
    const primaryInput = panel.querySelector('#itd-custom-primary');
    const secondaryInput = panel.querySelector('#itd-custom-secondary');
    const bgInput = panel.querySelector('#itd-custom-bg');
    const gradientCheck = panel.querySelector('#itd-custom-gradient');
    
    primaryInput.addEventListener('input', () => {
      const primary = primaryInput.value;
      const secondary = secondaryInput.value;
      const bg = bgInput.value;
      const bgOpacity = bgOpacitySlider.value;
      const gradient = gradientCheck.checked;
      applyCustomTheme(primary, secondary, bg, gradient, bgOpacity);
    });
    
    secondaryInput.addEventListener('input', () => {
      const primary = primaryInput.value;
      const secondary = secondaryInput.value;
      const bg = bgInput.value;
      const bgOpacity = bgOpacitySlider.value;
      const gradient = gradientCheck.checked;
      applyCustomTheme(primary, secondary, bg, gradient, bgOpacity);
    });
    
    bgInput.addEventListener('input', () => {
      const primary = primaryInput.value;
      const secondary = secondaryInput.value;
      const bg = bgInput.value;
      const bgOpacity = bgOpacitySlider.value;
      const gradient = gradientCheck.checked;
      applyCustomTheme(primary, secondary, bg, gradient, bgOpacity);
    });
    
    gradientCheck.addEventListener('change', () => {
      const primary = primaryInput.value;
      const secondary = secondaryInput.value;
      const bg = bgInput.value;
      const bgOpacity = bgOpacitySlider.value;
      const gradient = gradientCheck.checked;
      applyCustomTheme(primary, secondary, bg, gradient, bgOpacity);
    });
    
    // Кастомный шрифт - чекбокс и drop zone
    const customFontCheck = panel.querySelector('#itd-custom-font-enabled');
    const fontDropZone = panel.querySelector('#itd-font-drop-zone');
    
    customFontCheck.addEventListener('change', () => {
      if (customFontCheck.checked) {
        fontDropZone.style.display = 'block';
      } else {
        fontDropZone.style.display = 'none';
        clearCustomFont();
      }
    });
    
    // Загрузить сохраненный шрифт
    chrome.storage.local.get(['itdCustomFont', 'itdCustomFontName'], (data) => {
      if (data.itdCustomFont && data.itdCustomFontName) {
        customFontCheck.checked = true;
        fontDropZone.style.display = 'block';
        fontDropZone.querySelector('.itd-font-name').textContent = data.itdCustomFontName;
        applyCustomFont(data.itdCustomFont, data.itdCustomFontName);
      }
    });
    
    // Drag & Drop для TTF файлов
    fontDropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      fontDropZone.classList.add('drag-over');
    });
    
    fontDropZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      fontDropZone.classList.remove('drag-over');
    });
    
    fontDropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      fontDropZone.classList.remove('drag-over');
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (file.name.endsWith('.ttf') || file.name.endsWith('.TTF')) {
          loadFontFile(file, fontDropZone);
        } else {
          alert('Пожалуйста, загрузите TTF файл');
        }
      }
    });
    
    // Клик для выбора файла
    fontDropZone.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.ttf';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          loadFontFile(file, fontDropZone);
        }
      };
      input.click();
    });
    
    // Сохранить кастомную тему
    const saveCustomThemeBtn = panel.querySelector('#itd-save-custom-theme');
    saveCustomThemeBtn.addEventListener('click', () => {
      const name = panel.querySelector('#itd-custom-theme-name').value.trim();
      const primary = panel.querySelector('#itd-custom-primary').value;
      const secondary = panel.querySelector('#itd-custom-secondary').value;
      const bg = panel.querySelector('#itd-custom-bg').value;
      const bgOpacity = panel.querySelector('#itd-custom-bg-opacity').value;
      const gradient = panel.querySelector('#itd-custom-gradient').checked;
      
      if (!name) {
        alert('Введите название темы');
        return;
      }
      
      saveCustomTheme(name, primary, secondary, bg, gradient, bgOpacity, panel);
    });
    
    // Применить кастомную тему
    const applyCustomThemeBtn = panel.querySelector('#itd-apply-custom-theme');
    applyCustomThemeBtn.addEventListener('click', () => {
      const primary = panel.querySelector('#itd-custom-primary').value;
      const secondary = panel.querySelector('#itd-custom-secondary').value;
      const bg = panel.querySelector('#itd-custom-bg').value;
      const bgOpacity = panel.querySelector('#itd-custom-bg-opacity').value;
      const gradient = panel.querySelector('#itd-custom-gradient').checked;
      
      applyCustomTheme(primary, secondary, bg, gradient, bgOpacity);
    });
    
    // Загрузить кастомную тему
    const loadCustomThemeBtn = panel.querySelector('#itd-load-custom-theme');
    loadCustomThemeBtn.addEventListener('click', () => {
      const savedCustomThemesSelect = panel.querySelector('#itd-saved-custom-themes');
      const themeId = savedCustomThemesSelect.value;
      
      if (!themeId) {
        alert('Выберите тему из списка');
        return;
      }
      
      loadCustomTheme(themeId, panel);
    });
    
    // Удалить кастомную тему
    const deleteCustomThemeBtn = panel.querySelector('#itd-delete-custom-theme');
    deleteCustomThemeBtn.addEventListener('click', () => {
      const savedCustomThemesSelect = panel.querySelector('#itd-saved-custom-themes');
      const themeId = savedCustomThemesSelect.value;
      
      if (!themeId) {
        alert('Выберите тему из списка');
        return;
      }
      
      if (confirm('Удалить тему "' + savedCustomThemesSelect.options[savedCustomThemesSelect.selectedIndex].text + '"?')) {
        deleteCustomTheme(themeId, panel);
      }
    });
    
    console.log("[ITD Floating Panel] Themes panel setup");
  }
  
  // Загрузить список сохранённых шейдеров
  function loadSavedShadersList(selectElement, savedShaders, activeShader) {
    // Очистить список
    selectElement.innerHTML = '<option value="">-- Выбрать --</option>';
    
    // Добавить сохранённые шейдеры
    Object.keys(savedShaders).forEach(id => {
      const shader = savedShaders[id];
      const option = document.createElement('option');
      option.value = id;
      option.textContent = shader.name;
      if (id === activeShader) {
        option.selected = true;
      }
      selectElement.appendChild(option);
    });
  }
  
  // Загрузить список кастомных тем
  function loadSavedCustomThemesList(selectElement, savedThemes, activeTheme) {
    // Очистить список
    selectElement.innerHTML = '<option value="">-- Выбрать --</option>';
    
    // Добавить сохранённые темы
    Object.keys(savedThemes).forEach(id => {
      const theme = savedThemes[id];
      const option = document.createElement('option');
      option.value = id;
      option.textContent = theme.name;
      if (id === activeTheme) {
        option.selected = true;
      }
      selectElement.appendChild(option);
    });
  }
  
  // Сохранить шейдер
  function saveShader(name, code, panel) {
    chrome.storage.local.get(['itdSavedShaders'], (data) => {
      const savedShaders = data.itdSavedShaders || {};
      const shaderId = 'shader_' + Date.now();
      
      savedShaders[shaderId] = {
        name: name,
        code: code,
        created: new Date().toISOString()
      };
      
      chrome.storage.local.set({ 
        itdSavedShaders: savedShaders,
        itdActiveShader: shaderId
      }, () => {
        console.log("[ITD Floating Panel] Shader saved:", name);
        
        // Обновить список
        const savedShadersSelect = panel.querySelector('#itd-saved-shaders');
        loadSavedShadersList(savedShadersSelect, savedShaders, shaderId);
        
        alert('Шейдер "' + name + '" сохранён!');
      });
    });
  }
  
  // Загрузить шейдер
  function loadShader(shaderId, panel) {
    chrome.storage.local.get(['itdSavedShaders'], (data) => {
      const savedShaders = data.itdSavedShaders || {};
      const shader = savedShaders[shaderId];
      
      if (!shader) {
        alert('Шейдер не найден');
        return;
      }
      
      const codeArea = panel.querySelector('#itd-shader-code');
      const shaderNameInput = panel.querySelector('#itd-shader-name');
      
      codeArea.value = shader.code;
      shaderNameInput.value = shader.name;
      
      chrome.storage.local.set({ itdActiveShader: shaderId });
      
      console.log("[ITD Floating Panel] Shader loaded:", shader.name);
    });
  }
  
  // Удалить шейдер
  function deleteShader(shaderId, panel) {
    chrome.storage.local.get(['itdSavedShaders', 'itdActiveShader'], (data) => {
      const savedShaders = data.itdSavedShaders || {};
      const shaderName = savedShaders[shaderId]?.name || 'Unknown';
      
      delete savedShaders[shaderId];
      
      const updates = { itdSavedShaders: savedShaders };
      
      // Если удаляем активный шейдер - сбросить
      if (data.itdActiveShader === shaderId) {
        updates.itdActiveShader = null;
        const codeArea = panel.querySelector('#itd-shader-code');
        const shaderNameInput = panel.querySelector('#itd-shader-name');
        codeArea.value = '';
        shaderNameInput.value = '';
      }
      
      chrome.storage.local.set(updates, () => {
        console.log("[ITD Floating Panel] Shader deleted:", shaderName);
        
        // Обновить список
        const savedShadersSelect = panel.querySelector('#itd-saved-shaders');
        loadSavedShadersList(savedShadersSelect, savedShaders, data.itdActiveShader);
        
        alert('Шейдер "' + shaderName + '" удалён!');
      });
    });
  }
  
  // === Функции для кастомных тем ===
  
  // Сохранить кастомную тему
  function saveCustomTheme(name, primary, secondary, bg, gradient, bgOpacity, panel) {
    chrome.storage.local.get(['itdSavedCustomThemes'], (data) => {
      const savedThemes = data.itdSavedCustomThemes || {};
      const themeId = 'custom_theme_' + Date.now();
      
      savedThemes[themeId] = {
        name: name,
        primary: primary,
        secondary: secondary,
        bg: bg,
        bgOpacity: bgOpacity || 80,
        gradient: gradient,
        created: new Date().toISOString()
      };
      
      chrome.storage.local.set({ 
        itdSavedCustomThemes: savedThemes,
        itdActiveCustomTheme: themeId
      }, () => {
        console.log("[ITD Floating Panel] Custom theme saved:", name);
        
        // Обновить список
        const savedCustomThemesSelect = panel.querySelector('#itd-saved-custom-themes');
        loadSavedCustomThemesList(savedCustomThemesSelect, savedThemes, themeId);
        
        alert('Тема "' + name + '" сохранена!');
      });
    });
  }
  
  // Загрузить кастомную тему
  function loadCustomTheme(themeId, panel) {
    chrome.storage.local.get(['itdSavedCustomThemes'], (data) => {
      const savedThemes = data.itdSavedCustomThemes || {};
      const theme = savedThemes[themeId];
      
      if (!theme) {
        alert('Тема не найдена');
        return;
      }
      
      const nameInput = panel.querySelector('#itd-custom-theme-name');
      const primaryInput = panel.querySelector('#itd-custom-primary');
      const secondaryInput = panel.querySelector('#itd-custom-secondary');
      const bgInput = panel.querySelector('#itd-custom-bg');
      const bgOpacityInput = panel.querySelector('#itd-custom-bg-opacity');
      const bgOpacityValue = panel.querySelector('#itd-bg-opacity-value');
      const gradientCheck = panel.querySelector('#itd-custom-gradient');
      
      nameInput.value = theme.name;
      primaryInput.value = theme.primary;
      secondaryInput.value = theme.secondary;
      bgInput.value = theme.bg;
      bgOpacityInput.value = theme.bgOpacity || 80;
      bgOpacityValue.textContent = (theme.bgOpacity || 80) + '%';
      gradientCheck.checked = theme.gradient || false;
      
      chrome.storage.local.set({ itdActiveCustomTheme: themeId });
      
      // Применить тему
      applyCustomTheme(theme.primary, theme.secondary, theme.bg, theme.gradient, theme.bgOpacity || 80);
      
      console.log("[ITD Floating Panel] Custom theme loaded:", theme.name);
    });
  }
  
  // Удалить кастомную тему
  function deleteCustomTheme(themeId, panel) {
    chrome.storage.local.get(['itdSavedCustomThemes', 'itdActiveCustomTheme'], (data) => {
      const savedThemes = data.itdSavedCustomThemes || {};
      const themeName = savedThemes[themeId]?.name || 'Unknown';
      
      delete savedThemes[themeId];
      
      const updates = { itdSavedCustomThemes: savedThemes };
      
      // Если удаляем активную тему - сбросить
      if (data.itdActiveCustomTheme === themeId) {
        updates.itdActiveCustomTheme = null;
        const nameInput = panel.querySelector('#itd-custom-theme-name');
        const primaryInput = panel.querySelector('#itd-custom-primary');
        const secondaryInput = panel.querySelector('#itd-custom-secondary');
        const bgInput = panel.querySelector('#itd-custom-bg');
        const gradientCheck = panel.querySelector('#itd-custom-gradient');
        nameInput.value = '';
        primaryInput.value = '#667eea';
        secondaryInput.value = '#764ba2';
        bgInput.value = '#0a0e1a';
        gradientCheck.checked = false;
      }
      
      chrome.storage.local.set(updates, () => {
        console.log("[ITD Floating Panel] Custom theme deleted:", themeName);
        
        // Обновить список
        const savedCustomThemesSelect = panel.querySelector('#itd-saved-custom-themes');
        loadSavedCustomThemesList(savedCustomThemesSelect, savedThemes, data.itdActiveCustomTheme);
        
        alert('Тема "' + themeName + '" удалена!');
      });
    });
  }
  
  // Применить кастомную тему
  function applyCustomTheme(primary, secondary, bg, gradient, bgOpacity) {
    document.documentElement.setAttribute('data-itd-custom-theme', 'custom');
    
    // Преобразовать прозрачность из 0-100 в 0-1
    let opacity = (bgOpacity || 80) / 100;
    
    // СОХРАНИТЬ параметры кастомной темы для автозагрузки
    chrome.storage.local.set({
      itdCustomTheme: 'custom',
      itdLastCustomThemeParams: {
        primary,
        secondary,
        bg,
        gradient,
        bgOpacity: bgOpacity || 80
      }
    });
    
    // Определить контрастный цвет текста
    const textColor = getContrastColor(bg);
    const cardBg = adjustBrightness(bg, 20);
    
    document.documentElement.style.setProperty('--itd-theme-primary', primary);
    document.documentElement.style.setProperty('--itd-theme-secondary', secondary);
    document.documentElement.style.setProperty('--color-text', textColor);
    document.documentElement.style.setProperty('--color-text-secondary', adjustBrightness(textColor, -20));
    document.documentElement.style.setProperty('--color-border', hexToRgba(primary, 0.3));
    
    // Применить градиент или обычный фон
    if (gradient) {
      const bg1 = hexToRgba(bg, opacity);
      const bg2 = hexToRgba(adjustBrightness(bg, 15), opacity);
      const bg3 = hexToRgba(adjustBrightness(bg, 25), opacity);
      
      document.documentElement.style.setProperty('--color-background', bg1);
      document.documentElement.style.setProperty('--color-card', hexToRgba(cardBg, opacity * 0.9));
      
      // Создать плавную анимацию градиента
      if (!document.getElementById('itd-custom-gradient-style')) {
        const style = document.createElement('style');
        style.id = 'itd-custom-gradient-style';
        style.textContent = `
          @keyframes customGradient {
            0% {
              background: linear-gradient(135deg, ${bg1} 0%, ${bg2} 25%, ${bg3} 50%, ${bg2} 75%, ${bg1} 100%);
            }
            12.5% {
              background: linear-gradient(135deg, ${bg2} 0%, ${bg3} 25%, ${bg1} 50%, ${bg3} 75%, ${bg2} 100%);
            }
            25% {
              background: linear-gradient(135deg, ${bg3} 0%, ${bg1} 25%, ${bg2} 50%, ${bg1} 75%, ${bg3} 100%);
            }
            37.5% {
              background: linear-gradient(135deg, ${bg1} 0%, ${bg2} 25%, ${bg3} 50%, ${bg2} 75%, ${bg1} 100%);
            }
            50% {
              background: linear-gradient(135deg, ${bg2} 0%, ${bg3} 25%, ${bg1} 50%, ${bg3} 75%, ${bg2} 100%);
            }
            62.5% {
              background: linear-gradient(135deg, ${bg3} 0%, ${bg1} 25%, ${bg2} 50%, ${bg1} 75%, ${bg3} 100%);
            }
            75% {
              background: linear-gradient(135deg, ${bg1} 0%, ${bg2} 25%, ${bg3} 50%, ${bg2} 75%, ${bg1} 100%);
            }
            87.5% {
              background: linear-gradient(135deg, ${bg2} 0%, ${bg3} 25%, ${bg1} 50%, ${bg3} 75%, ${bg2} 100%);
            }
            100% {
              background: linear-gradient(135deg, ${bg1} 0%, ${bg2} 25%, ${bg3} 50%, ${bg2} 75%, ${bg1} 100%);
            }
          }
        `;
        document.head.appendChild(style);
      } else {
        // Обновить существующий стиль
        const style = document.getElementById('itd-custom-gradient-style');
        style.textContent = `
          @keyframes customGradient {
            0% {
              background: linear-gradient(135deg, ${bg1} 0%, ${bg2} 25%, ${bg3} 50%, ${bg2} 75%, ${bg1} 100%);
            }
            12.5% {
              background: linear-gradient(135deg, ${bg2} 0%, ${bg3} 25%, ${bg1} 50%, ${bg3} 75%, ${bg2} 100%);
            }
            25% {
              background: linear-gradient(135deg, ${bg3} 0%, ${bg1} 25%, ${bg2} 50%, ${bg1} 75%, ${bg3} 100%);
            }
            37.5% {
              background: linear-gradient(135deg, ${bg1} 0%, ${bg2} 25%, ${bg3} 50%, ${bg2} 75%, ${bg1} 100%);
            }
            50% {
              background: linear-gradient(135deg, ${bg2} 0%, ${bg3} 25%, ${bg1} 50%, ${bg3} 75%, ${bg2} 100%);
            }
            62.5% {
              background: linear-gradient(135deg, ${bg3} 0%, ${bg1} 25%, ${bg2} 50%, ${bg1} 75%, ${bg3} 100%);
            }
            75% {
              background: linear-gradient(135deg, ${bg1} 0%, ${bg2} 25%, ${bg3} 50%, ${bg2} 75%, ${bg1} 100%);
            }
            87.5% {
              background: linear-gradient(135deg, ${bg2} 0%, ${bg3} 25%, ${bg1} 50%, ${bg3} 75%, ${bg2} 100%);
            }
            100% {
              background: linear-gradient(135deg, ${bg1} 0%, ${bg2} 25%, ${bg3} 50%, ${bg2} 75%, ${bg1} 100%);
            }
          }
        `;
      }
      
      document.body.style.background = `linear-gradient(135deg, ${bg1} 0%, ${bg2} 25%, ${bg3} 50%, ${bg2} 75%, ${bg1} 100%)`;
      document.body.style.animation = 'customGradient 20s ease-in-out infinite';
      
      // Применить к основному контейнеру сайта
      const layout = document.querySelector('div.layout');
      if (layout) {
        layout.style.background = `linear-gradient(135deg, ${bg1} 0%, ${bg2} 25%, ${bg3} 50%, ${bg2} 75%, ${bg1} 100%)`;
        layout.style.animation = 'customGradient 20s ease-in-out infinite';
      }
    } else {
      // Обычный фон
      const bgWithOpacity = hexToRgba(bg, opacity);
      const cardBgWithOpacity = hexToRgba(cardBg, opacity * 0.9);
      
      document.documentElement.style.setProperty('--color-background', bgWithOpacity);
      document.documentElement.style.setProperty('--color-card', cardBgWithOpacity);
      document.body.style.background = bgWithOpacity;
      document.body.style.animation = 'none';
      
      // Применить к основному контейнеру сайта
      const layout = document.querySelector('div.layout');
      if (layout) {
        layout.style.background = bgWithOpacity;
        layout.style.animation = 'none';
      }
      
      // Удалить стиль градиента
      const gradientStyle = document.getElementById('itd-custom-gradient-style');
      if (gradientStyle) {
        gradientStyle.remove();
      }
    }
    
    updateButtonColors('custom');
    console.log("[ITD Floating Panel] Applied custom theme", { gradient, bgOpacity, textColor });
  }
  
  // Определить контрастный цвет текста (белый или чёрный)
  function getContrastColor(hexColor) {
    // Конвертировать hex в RGB
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Вычислить яркость (luminance)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Если фон светлый - вернуть чёрный текст, если тёмный - белый
    return luminance > 0.5 ? '#1a1a1a' : '#ffffff';
  }
  
  // Вспомогательная функция: увеличить/уменьшить яркость цвета
  function adjustBrightness(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) + amt));
    const G = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) + amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }
  
  // Вспомогательная функция: конвертировать hex в rgba
  function hexToRgba(hex, alpha) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = (num >> 16);
    const g = (num >> 8 & 0x00FF);
    const b = (num & 0x0000FF);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  
  // Применить тему
  function applyTheme(theme) {
    // Сбросить кастомные стили перед применением обычной темы
    document.body.style.background = '';
    document.body.style.animation = '';
    
    // Удалить стиль градиента если есть
    const gradientStyle = document.getElementById('itd-custom-gradient-style');
    if (gradientStyle) {
      gradientStyle.remove();
    }
    
    // Сбросить CSS переменные
    document.documentElement.style.removeProperty('--itd-theme-primary');
    document.documentElement.style.removeProperty('--itd-theme-secondary');
    document.documentElement.style.removeProperty('--color-text');
    document.documentElement.style.removeProperty('--color-text-secondary');
    document.documentElement.style.removeProperty('--color-background');
    document.documentElement.style.removeProperty('--color-card');
    document.documentElement.style.removeProperty('--color-border');
    
    // Применить новую тему
    document.documentElement.setAttribute('data-itd-custom-theme', theme);
    updateButtonColors(theme);
    
    // Сохранить выбор (удалить параметры кастомной темы)
    chrome.storage.local.set({ 
      itdCustomTheme: theme,
      itdLastCustomThemeParams: null
    });
    
    console.log("[ITD Floating Panel] Applied theme:", theme);
  }
  
  // Обновить цвета кнопок в соответствии с темой
  function updateButtonColors(theme) {
    const themeColors = {
      default: { primary: '#667eea', secondary: '#764ba2' },
      blue: { primary: '#87c9ff', secondary: '#6a8fff' },
      purple: { primary: '#b794f6', secondary: '#8b5cf6' },
      cyan: { primary: '#06b6d4', secondary: '#0891b2' },
      green: { primary: '#10b981', secondary: '#059669' },
      red: { primary: '#ef4444', secondary: '#dc2626' }
    };
    
    const colors = themeColors[theme] || themeColors.default;
    
    // Обновить CSS переменные для кнопок
    document.documentElement.style.setProperty('--itd-theme-primary', colors.primary);
    document.documentElement.style.setProperty('--itd-theme-secondary', colors.secondary);
    
    console.log("[ITD Floating Panel] Button colors updated for theme:", theme);
  }
  
  // Применить шейдер (поддержка multipass как на Shadertoy)
  function applyShader(code) {
    clearShader();
    if (!code) return;
    
    console.log("[ITD Floating Panel] Applying shader...");
    
    const canvas = document.createElement("canvas");
    canvas.id = "itd-shader-canvas";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) {
      console.error("[ITD Floating Panel] WebGL not supported");
      alert("WebGL не поддерживается в вашем браузере");
      return;
    }
    
    const isWebGL2 = gl instanceof WebGL2RenderingContext;
    console.log("[ITD Floating Panel] Using", isWebGL2 ? "WebGL 2.0" : "WebGL 1.0");
    
    // Включить расширения для WebGL 1.0
    if (!isWebGL2) {
      gl.getExtension('OES_texture_float');
      gl.getExtension('OES_texture_float_linear');
    }
    
    try {
      // Парсинг Shadertoy кода - разделить на Buffer A/B/C/D и Image
      const shaderParts = parseShadertoyShadersCode(code);
      console.log("[ITD Floating Panel] Parsed shaders:", Object.keys(shaderParts));
      
      // Создать текстуру шума
      const noiseTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
      const noiseData = new Uint8Array(256 * 256 * 4);
      for (let i = 0; i < noiseData.length; i++) {
        noiseData[i] = Math.random() * 255;
      }
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 256, 0, gl.RGBA, gl.UNSIGNED_BYTE, noiseData);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      
      // Создать framebuffer
      function createFramebuffer(width, height) {
        const fbo = gl.createFramebuffer();
        const texture = gl.createTexture();
        
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
          console.error("[ITD Floating Panel] Framebuffer incomplete");
        }
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return { fbo, texture };
      }
      
      // Создать ping-pong буферы для каждого Buffer shader
      const buffers = {
        bufferA: shaderParts.bufferA ? {
          ping: createFramebuffer(canvas.width, canvas.height),
          pong: createFramebuffer(canvas.width, canvas.height),
          pingPong: false
        } : null,
        bufferB: shaderParts.bufferB ? {
          ping: createFramebuffer(canvas.width, canvas.height),
          pong: createFramebuffer(canvas.width, canvas.height),
          pingPong: false
        } : null,
        bufferC: shaderParts.bufferC ? {
          ping: createFramebuffer(canvas.width, canvas.height),
          pong: createFramebuffer(canvas.width, canvas.height),
          pingPong: false
        } : null,
        bufferD: shaderParts.bufferD ? {
          ping: createFramebuffer(canvas.width, canvas.height),
          pong: createFramebuffer(canvas.width, canvas.height),
          pingPong: false
        } : null
      };
      
      // Парсинг Shadertoy кода - извлечь Buffer A/B/C/D и Image
      function parseShadertoyShadersCode(fullCode) {
        const result = {
          bufferA: null,
          bufferB: null,
          bufferC: null,
          bufferD: null,
          image: null
        };
        
        // Попробовать найти маркеры Buffer A/B/C/D и Image
        const bufferAMatch = fullCode.match(/\/\/\s*Buffer\s*A\s*\n([\s\S]*?)(?=\/\/\s*(?:Buffer\s*[BCD]|Image)|$)/i);
        const bufferBMatch = fullCode.match(/\/\/\s*Buffer\s*B\s*\n([\s\S]*?)(?=\/\/\s*(?:Buffer\s*[ACD]|Image)|$)/i);
        const bufferCMatch = fullCode.match(/\/\/\s*Buffer\s*C\s*\n([\s\S]*?)(?=\/\/\s*(?:Buffer\s*[ABD]|Image)|$)/i);
        const bufferDMatch = fullCode.match(/\/\/\s*Buffer\s*D\s*\n([\s\S]*?)(?=\/\/\s*(?:Buffer\s*[ABC]|Image)|$)/i);
        const imageMatch = fullCode.match(/\/\/\s*Image\s*\n([\s\S]*?)$/i);
        
        if (bufferAMatch) result.bufferA = bufferAMatch[1].trim();
        if (bufferBMatch) result.bufferB = bufferBMatch[1].trim();
        if (bufferCMatch) result.bufferC = bufferCMatch[1].trim();
        if (bufferDMatch) result.bufferD = bufferDMatch[1].trim();
        if (imageMatch) result.image = imageMatch[1].trim();
        
        // Если нет маркеров - весь код это Image shader
        if (!result.bufferA && !result.bufferB && !result.bufferC && !result.bufferD && !result.image) {
          result.image = fullCode.trim();
        }
        
        return result;
      }
      
      // Компилировать шейдер
      function compileShader(shaderCode, isBufferShader = false) {
        const vs = gl.createShader(gl.VERTEX_SHADER);
        if (isWebGL2) {
          gl.shaderSource(vs, `#version 300 es
in vec2 p;
void main() {
  gl_Position = vec4(p, 0., 1.);
}`);
        } else {
          gl.shaderSource(vs, `attribute vec2 p;
void main() {
  gl_Position = vec4(p, 0., 1.);
}`);
        }
        gl.compileShader(vs);
        
        const fs = gl.createShader(gl.FRAGMENT_SHADER);
        
        // Обработать код шейдера
        let processedCode = shaderCode.trim();
        
        // Заменить texture() на texture2D() только для WebGL 1.0
        if (!isWebGL2) {
          processedCode = processedCode.replace(/\btexture\s*\(/g, 'texture2D(');
        }
        
        // Проверить есть ли уже mainImage функция
        const hasMainImage = /void\s+mainImage\s*\(/.test(processedCode);
        
        // Если нет mainImage - обернуть код
        let wrapped;
        if (hasMainImage) {
          // Код уже содержит mainImage
          if (isWebGL2) {
            wrapped = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform float iTime;
uniform vec3 iResolution;
uniform vec4 iMouse;
uniform vec4 iDate;
uniform float iTimeDelta;
uniform int iFrame;
uniform float iFrameRate;
uniform float iChannelTime[4];
uniform vec3 iChannelResolution[4];
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform sampler2D iChannel2;
uniform sampler2D iChannel3;

${processedCode}

void main() {
  mainImage(fragColor, gl_FragCoord.xy);
}`;
          } else {
            wrapped = `precision highp float;
uniform float iTime;
uniform vec3 iResolution;
uniform vec4 iMouse;
uniform vec4 iDate;
uniform float iTimeDelta;
uniform int iFrame;
uniform float iFrameRate;
uniform float iChannelTime[4];
uniform vec3 iChannelResolution[4];
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform sampler2D iChannel2;
uniform sampler2D iChannel3;

${processedCode}

void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}`;
          }
        } else {
          // Код без mainImage
          if (isWebGL2) {
            wrapped = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform float iTime;
uniform vec3 iResolution;
uniform vec4 iMouse;
uniform vec4 iDate;
uniform float iTimeDelta;
uniform int iFrame;
uniform float iFrameRate;
uniform float iChannelTime[4];
uniform vec3 iChannelResolution[4];
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform sampler2D iChannel2;
uniform sampler2D iChannel3;

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  ${processedCode}
}

void main() {
  mainImage(fragColor, gl_FragCoord.xy);
}`;
          } else {
            wrapped = `precision highp float;
uniform float iTime;
uniform vec3 iResolution;
uniform vec4 iMouse;
uniform vec4 iDate;
uniform float iTimeDelta;
uniform int iFrame;
uniform float iFrameRate;
uniform float iChannelTime[4];
uniform vec3 iChannelResolution[4];
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform sampler2D iChannel2;
uniform sampler2D iChannel3;

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  ${processedCode}
}

void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}`;
          }
        }
        
        gl.shaderSource(fs, wrapped);
        gl.compileShader(fs);
        
        if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
          const error = gl.getShaderInfoLog(fs);
          console.error("[ITD Floating Panel] Shader compilation error:", error);
          
          const lines = wrapped.split('\n');
          const errorMatch = error.match(/ERROR: \d+:(\d+):/);
          if (errorMatch) {
            const lineNum = parseInt(errorMatch[1]) - 1;
            const errorLine = lines[lineNum];
            console.error(`Line ${lineNum}: ${errorLine}`);
          }
          
          throw new Error("Shader compilation error:\n" + error);
        }
        
        const prog = gl.createProgram();
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.linkProgram(prog);
        
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
          throw new Error("Shader link error:\n" + gl.getProgramInfoLog(prog));
        }
        
        return prog;
      }
      
      // Компилировать все шейдеры
      const programs = {
        bufferA: shaderParts.bufferA ? compileShader(shaderParts.bufferA, true) : null,
        bufferB: shaderParts.bufferB ? compileShader(shaderParts.bufferB, true) : null,
        bufferC: shaderParts.bufferC ? compileShader(shaderParts.bufferC, true) : null,
        bufferD: shaderParts.bufferD ? compileShader(shaderParts.bufferD, true) : null,
        image: shaderParts.image ? compileShader(shaderParts.image, false) : null
      };
      
      if (!programs.image) {
        throw new Error("No Image shader found!");
      }
      
      // Создать vertex buffer
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
      
      // Функция для установки uniforms и рендера
      function renderPass(program, targetFBO, time, timeDelta, frame, channelTextures) {
        gl.useProgram(program);
        
        const pos = gl.getAttribLocation(program, "p");
        gl.enableVertexAttribArray(pos);
        gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
        
        const uTime = gl.getUniformLocation(program, "iTime");
        const uRes = gl.getUniformLocation(program, "iResolution");
        const uMouse = gl.getUniformLocation(program, "iMouse");
        const uDate = gl.getUniformLocation(program, "iDate");
        const uTimeDelta = gl.getUniformLocation(program, "iTimeDelta");
        const uFrame = gl.getUniformLocation(program, "iFrame");
        const uChannel0 = gl.getUniformLocation(program, "iChannel0");
        const uChannel1 = gl.getUniformLocation(program, "iChannel1");
        const uChannel2 = gl.getUniformLocation(program, "iChannel2");
        const uChannel3 = gl.getUniformLocation(program, "iChannel3");
        
        if (uTime) gl.uniform1f(uTime, time);
        if (uRes) gl.uniform3f(uRes, canvas.width, canvas.height, 1);
        if (uMouse) gl.uniform4f(uMouse, 0, 0, 0, 0);
        if (uDate) {
          const date = new Date();
          gl.uniform4f(uDate, 
            date.getFullYear(), 
            date.getMonth(), 
            date.getDate(), 
            date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds()
          );
        }
        if (uTimeDelta) gl.uniform1f(uTimeDelta, timeDelta);
        if (uFrame) gl.uniform1i(uFrame, frame);
        
        // Привязать текстуры к каналам
        if (uChannel0 && channelTextures[0]) {
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, channelTextures[0]);
          gl.uniform1i(uChannel0, 0);
        }
        if (uChannel1 && channelTextures[1]) {
          gl.activeTexture(gl.TEXTURE1);
          gl.bindTexture(gl.TEXTURE_2D, channelTextures[1]);
          gl.uniform1i(uChannel1, 1);
        }
        if (uChannel2 && channelTextures[2]) {
          gl.activeTexture(gl.TEXTURE2);
          gl.bindTexture(gl.TEXTURE_2D, channelTextures[2]);
          gl.uniform1i(uChannel2, 2);
        }
        if (uChannel3 && channelTextures[3]) {
          gl.activeTexture(gl.TEXTURE3);
          gl.bindTexture(gl.TEXTURE_2D, channelTextures[3]);
          gl.uniform1i(uChannel3, 3);
        }
        
        // Рендер в target
        gl.bindFramebuffer(gl.FRAMEBUFFER, targetFBO);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      
      const start = Date.now();
      let frame = 0;
      let lastTime = start;
      
      function render() {
        const shaderCanvas = document.getElementById('itd-shader-canvas');
        if (!shaderCanvas) return;
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        const now = Date.now();
        const time = (now - start) / 1000;
        const timeDelta = (now - lastTime) / 1000;
        lastTime = now;
        frame++;
        
        // Рендер Buffer A (если есть)
        if (programs.bufferA && buffers.bufferA) {
          const current = buffers.bufferA.pingPong ? buffers.bufferA.pong : buffers.bufferA.ping;
          const previous = buffers.bufferA.pingPong ? buffers.bufferA.ping : buffers.bufferA.pong;
          
          // Buffer A: iChannel0 = предыдущий кадр Buffer A, остальные = noise
          renderPass(programs.bufferA, current.fbo, time, timeDelta, frame, [
            previous.texture,
            noiseTexture,
            noiseTexture,
            noiseTexture
          ]);
          
          buffers.bufferA.pingPong = !buffers.bufferA.pingPong;
        }
        
        // Рендер Buffer B (если есть)
        if (programs.bufferB && buffers.bufferB) {
          const current = buffers.bufferB.pingPong ? buffers.bufferB.pong : buffers.bufferB.ping;
          const previous = buffers.bufferB.pingPong ? buffers.bufferB.ping : buffers.bufferB.pong;
          
          renderPass(programs.bufferB, current.fbo, time, timeDelta, frame, [
            previous.texture,
            noiseTexture,
            noiseTexture,
            noiseTexture
          ]);
          
          buffers.bufferB.pingPong = !buffers.bufferB.pingPong;
        }
        
        // Рендер Buffer C (если есть)
        if (programs.bufferC && buffers.bufferC) {
          const current = buffers.bufferC.pingPong ? buffers.bufferC.pong : buffers.bufferC.ping;
          const previous = buffers.bufferC.pingPong ? buffers.bufferC.ping : buffers.bufferC.pong;
          
          renderPass(programs.bufferC, current.fbo, time, timeDelta, frame, [
            previous.texture,
            noiseTexture,
            noiseTexture,
            noiseTexture
          ]);
          
          buffers.bufferC.pingPong = !buffers.bufferC.pingPong;
        }
        
        // Рендер Buffer D (если есть)
        if (programs.bufferD && buffers.bufferD) {
          const current = buffers.bufferD.pingPong ? buffers.bufferD.pong : buffers.bufferD.ping;
          const previous = buffers.bufferD.pingPong ? buffers.bufferD.ping : buffers.bufferD.pong;
          
          renderPass(programs.bufferD, current.fbo, time, timeDelta, frame, [
            previous.texture,
            noiseTexture,
            noiseTexture,
            noiseTexture
          ]);
          
          buffers.bufferD.pingPong = !buffers.bufferD.pingPong;
        }
        
        // Рендер финального Image на экран
        // iChannel0 = Buffer A, iChannel1 = Buffer B, iChannel2 = Buffer C, iChannel3 = Buffer D (или noise)
        const bufferATexture = buffers.bufferA ? 
          (buffers.bufferA.pingPong ? buffers.bufferA.pong.texture : buffers.bufferA.ping.texture) : 
          noiseTexture;
        const bufferBTexture = buffers.bufferB ? 
          (buffers.bufferB.pingPong ? buffers.bufferB.pong.texture : buffers.bufferB.ping.texture) : 
          noiseTexture;
        const bufferCTexture = buffers.bufferC ? 
          (buffers.bufferC.pingPong ? buffers.bufferC.pong.texture : buffers.bufferC.ping.texture) : 
          noiseTexture;
        const bufferDTexture = buffers.bufferD ? 
          (buffers.bufferD.pingPong ? buffers.bufferD.pong.texture : buffers.bufferD.ping.texture) : 
          noiseTexture;
        
        renderPass(programs.image, null, time, timeDelta, frame, [
          bufferATexture,
          bufferBTexture,
          bufferCTexture,
          bufferDTexture
        ]);
        
        requestAnimationFrame(render);
      }
      
      render();
      console.log("[ITD Floating Panel] Multipass shader applied successfully");
    } catch (err) {
      console.error("[ITD Floating Panel] Shader error:", err);
      alert("Ошибка шейдера: " + err.message);
      clearShader();
    }
  }
  
  // Очистить шейдер
  function clearShader() {
    const canvas = document.getElementById('itd-shader-canvas');
    if (canvas) {
      canvas.remove();
      console.log("[ITD Floating Panel] Shader cleared");
    }
  }
  
  // Настройка панели AI
  function setupAIPanel(panel) {
    const closeBtn = panel.querySelector('.itd-panel-close');
    closeBtn.addEventListener('click', () => {
      closePanel('ai');
      const btn = document.querySelector('[data-panel="ai"]');
      if (btn) btn.classList.remove('active');
      state.activePanel = null;
    });
    
    // Загрузить сохранённые настройки
    chrome.storage.local.get(['itdAiEndpoint', 'itdAiKey'], (data) => {
      if (data.itdAiEndpoint) {
        panel.querySelector('#itd-ai-endpoint').value = data.itdAiEndpoint;
      }
      if (data.itdAiKey) {
        panel.querySelector('#itd-ai-key').value = data.itdAiKey;
      }
      // Модель всегда фиксированная
      panel.querySelector('#itd-ai-model').value = 'openai-gpt-oss-20b';
    });
    
    // Кнопка генерации
    const generateBtn = panel.querySelector('#itd-ai-generate');
    generateBtn.addEventListener('click', async () => {
      const endpoint = panel.querySelector('#itd-ai-endpoint').value.trim();
      const apiKey = panel.querySelector('#itd-ai-key').value.trim();
      const model = 'openai-gpt-oss-20b'; // Фиксированная модель
      const prompt = panel.querySelector('#itd-ai-prompt').value.trim();
      const resultArea = panel.querySelector('#itd-ai-result');
      
      if (!endpoint || !apiKey || !prompt) {
        alert('Заполните все поля');
        return;
      }
      
      // Сохранить настройки (без модели)
      chrome.storage.local.set({
        itdAiEndpoint: endpoint,
        itdAiKey: apiKey
      });
      
      generateBtn.disabled = true;
      generateBtn.textContent = 'Генерация...';
      resultArea.value = '';
      
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: [{
              role: 'user',
              content: prompt
            }],
            temperature: 0.7,
            max_tokens: 500
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || 'Ошибка: пустой ответ';
        resultArea.value = text;
        
      } catch (error) {
        console.error('[ITD AI] Error:', error);
        resultArea.value = `Ошибка: ${error.message}`;
      } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = 'Сгенерировать';
      }
    });
    
    // Кнопка вставки
    const insertBtn = panel.querySelector('#itd-ai-insert');
    insertBtn.addEventListener('click', () => {
      const text = panel.querySelector('#itd-ai-result').value;
      if (!text) {
        alert('Нет текста для вставки');
        return;
      }
      
      // Найти textarea для поста на странице
      const postTextarea = document.querySelector('textarea[placeholder*="пост"], textarea[name*="text"], textarea[class*="post"]');
      if (postTextarea) {
        postTextarea.value = text;
        postTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        alert('Текст вставлен в пост!');
      } else {
        // Копировать в буфер обмена
        navigator.clipboard.writeText(text).then(() => {
          alert('Текст скопирован в буфер обмена!');
        });
      }
    });
    
    console.log("[ITD Floating Panel] AI panel setup");
  }
  
  // Настройка панели баннера
  function setupBannerPanel(panel) {
    const closeBtn = panel.querySelector('.itd-panel-close');
    closeBtn.addEventListener('click', () => {
      closePanel('banner');
      const btn = document.querySelector('[data-panel="banner"]');
      if (btn) btn.classList.remove('active');
      state.activePanel = null;
    });
    
    // Отправить сообщение в content script через window.postMessage
    function sendToContentScript(message) {
      return new Promise((resolve) => {
        const messageId = 'itd_' + Date.now() + '_' + Math.random();
        message.messageId = messageId;
        
        // Слушать ответ
        const responseHandler = (event) => {
          if (event.data && event.data.messageId === messageId && event.data.isResponse) {
            window.removeEventListener('message', responseHandler);
            resolve(event.data.response || { ok: false, message: 'Нет ответа' });
          }
        };
        
        window.addEventListener('message', responseHandler);
        
        // Отправить сообщение
        window.postMessage(message, '*');
        
        // Таймаут на случай если ответа не будет
        setTimeout(() => {
          window.removeEventListener('message', responseHandler);
          resolve({ ok: false, message: 'Таймаут ожидания ответа' });
        }, 5000);
      });
    }
    
    // Найти canvas
    const detectBtn = panel.querySelector('#itd-detect-canvas');
    detectBtn.addEventListener('click', async () => {
      const resp = await sendToContentScript({ type: 'ITD_REDRAW_DETECT_CANVAS' });
      if (!resp.ok) {
        alert(resp.message || 'Canvas не найден');
        return;
      }
      if (resp.canvas) {
        alert(`Canvas найден: CSS ${Math.round(resp.target.width)}x${Math.round(resp.target.height)} | px ${resp.canvas.width}x${resp.canvas.height}`);
      } else {
        const w = Math.round(resp.target?.width || 0);
        const h = Math.round(resp.target?.height || 0);
        alert(`Canvas найден: ${w}x${h}`);
      }
      console.log('[ITD Banner] Canvas detected:', resp);
    });
    
    // Выбрать область
    const selectBtn = panel.querySelector('#itd-select-area');
    selectBtn.addEventListener('click', async () => {
      const resp = await sendToContentScript({ type: 'ITD_REDRAW_SELECT_AREA' });
      if (!resp.ok) {
        alert(resp.message || 'Не удалось запустить выделение');
        return;
      }
      alert('Режим выделения включен. Выдели прямоугольник на странице.');
      console.log('[ITD Banner] Selection mode started');
    });
    
    // Загрузить изображение
    const imageInput = panel.querySelector('#itd-image-input');
    const imageMeta = panel.querySelector('#itd-image-meta');
    
    imageInput.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;
      
      // Конвертировать в data URLs
      const dataUrls = await Promise.all(files.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target.result);
          reader.readAsDataURL(file);
        });
      }));
      
      // Отправить в content script
      const resp = await sendToContentScript({
        type: files.length === 1 ? 'ITD_REDRAW_SET_IMAGE' : 'ITD_REDRAW_SET_IMAGES',
        payload: files.length === 1 ? { dataUrl: dataUrls[0] } : { dataUrls }
      });
      
      if (resp.ok) {
        if (files.length === 1 && resp.image) {
          imageMeta.textContent = `${files[0].name} | ${resp.image.width}x${resp.image.height}`;
        } else if (resp.imagesCount && resp.firstImage) {
          imageMeta.textContent = `${resp.imagesCount} файлов | первый: ${resp.firstImage.width}x${resp.firstImage.height}`;
        } else {
          imageMeta.textContent = `${files.length} файл(ов) загружено`;
        }
        console.log('[ITD Banner] Images loaded:', files.length);
      } else {
        imageMeta.textContent = resp.message || 'Ошибка загрузки';
      }
    });
    
    // Обновить настройки при изменении слайдеров
    const scaleSlider = panel.querySelector('#itd-scale');
    const scaleValue = panel.querySelector('#itd-scale-value');
    const offsetXSlider = panel.querySelector('#itd-offset-x');
    const offsetXValue = panel.querySelector('#itd-offset-x-value');
    const offsetYSlider = panel.querySelector('#itd-offset-y');
    const offsetYValue = panel.querySelector('#itd-offset-y-value');
    const fitMode = panel.querySelector('#itd-fit-mode');
    
    function updateSettings() {
      const settings = {
        fitMode: fitMode.value,
        scale: parseInt(scaleSlider.value),
        offsetX: parseInt(offsetXSlider.value),
        offsetY: parseInt(offsetYSlider.value)
      };
      
      sendToContentScript({
        type: 'ITD_REDRAW_UPDATE_SETTINGS',
        payload: settings
      });
    }
    
    scaleSlider.addEventListener('input', () => {
      scaleValue.textContent = scaleSlider.value + '%';
      updateSettings();
    });
    
    offsetXSlider.addEventListener('input', () => {
      offsetXValue.textContent = offsetXSlider.value + 'px';
      updateSettings();
    });
    
    offsetYSlider.addEventListener('input', () => {
      offsetYValue.textContent = offsetYSlider.value + 'px';
      updateSettings();
    });
    
    fitMode.addEventListener('change', updateSettings);
    
    // Применить баннер
    const applyBtn = panel.querySelector('#itd-apply-banner');
    applyBtn.addEventListener('click', async () => {
      const resp = await sendToContentScript({ type: 'ITD_REDRAW_APPLY_CANVAS' });
      if (!resp.ok) {
        alert(resp.message || 'Не удалось применить');
        return;
      }
      alert(resp.message || 'Изображение применено!');
      console.log('[ITD Banner] Applied to canvas');
    });
    
    // Экспорт PNG
    const exportBtn = panel.querySelector('#itd-export-banner');
    exportBtn.addEventListener('click', async () => {
      const resp = await sendToContentScript({ type: 'ITD_REDRAW_EXPORT_PNG' });
      if (!resp.ok) {
        alert(resp.message || 'Не удалось экспортировать');
        return;
      }
      alert(resp.message || 'PNG экспортирован!');
      console.log('[ITD Banner] Exported PNG');
    });
    
    // Экспорт GIF
    const exportGifBtn = panel.querySelector('#itd-export-gif');
    exportGifBtn.addEventListener('click', async () => {
      const resp = await sendToContentScript({ type: 'ITD_REDRAW_EXPORT_GIF' });
      if (!resp.ok) {
        alert(resp.message || 'Не удалось экспортировать GIF');
        return;
      }
      alert(resp.message || 'GIF экспортирован!');
      console.log('[ITD Banner] Exported GIF');
    });
    
    console.log("[ITD Floating Panel] Banner panel setup (using window.postMessage)");
  }
  
  // Настройка панели настроек
  function setupSettingsPanel(panel) {
    const closeBtn = panel.querySelector('.itd-panel-close');
    closeBtn.addEventListener('click', () => {
      closePanel('settings');
      const btn = document.querySelector('[data-panel="settings"]');
      if (btn) btn.classList.remove('active');
      state.activePanel = null;
    });
    
    console.log("[ITD Floating Panel] Settings panel setup");
  }
  
  // Настройка панели дебага
  function setupDebugPanel(panel) {
    const closeBtn = panel.querySelector('.itd-panel-close');
    closeBtn.addEventListener('click', () => {
      closePanel('debug');
      const btn = document.querySelector('[data-panel="debug"]');
      if (btn) btn.classList.remove('active');
      state.activePanel = null;
    });
    
    // Обновить статус
    const refreshBtn = panel.querySelector('#itd-debug-refresh');
    refreshBtn.addEventListener('click', updateDebugInfo);
    
    // Копировать логи
    const copyBtn = panel.querySelector('#itd-debug-copy');
    copyBtn.addEventListener('click', () => {
      const logs = panel.querySelector('#itd-debug-logs').value;
      navigator.clipboard.writeText(logs);
      alert('Логи скопированы в буфер обмена');
    });
    
    // Очистить логи
    const clearBtn = panel.querySelector('#itd-debug-clear');
    clearBtn.addEventListener('click', () => {
      panel.querySelector('#itd-debug-logs').value = '';
    });
    
    // Загрузить начальную информацию
    updateDebugInfo();
    
    console.log("[ITD Floating Panel] Debug panel setup");
  }
  
  // Обновить информацию дебага
  function updateDebugInfo() {
    const panel = state.panels['debug'];
    if (!panel) return;
    
    const statusDiv = panel.querySelector('#itd-debug-status');
    const logsArea = panel.querySelector('#itd-debug-logs');
    
    // Собрать информацию
    const info = {
      url: location.href,
      hostname: location.hostname,
      panelLoaded: window.__itdFloatingPanelLoaded,
      activePanel: state.activePanel,
      timestamp: new Date().toISOString()
    };
    
    statusDiv.innerHTML = `
      <p><strong>URL:</strong> ${info.url}</p>
      <p><strong>Hostname:</strong> ${info.hostname}</p>
      <p><strong>Panel loaded:</strong> ${info.panelLoaded ? 'Yes' : 'No'}</p>
      <p><strong>Active panel:</strong> ${info.activePanel || 'None'}</p>
      <p><strong>Time:</strong> ${info.timestamp}</p>
    `;
    
    logsArea.value = JSON.stringify(info, null, 2);
  }
  
  // Инициализация
  function init() {
    // Загрузить и применить сохранённую тему сразу
    chrome.storage.local.get(['itdCustomTheme', 'itdLastCustomThemeParams', 'itdAutoTheme', 'itdShaderCode', 'itdAutoShader', 'itdCustomFont', 'itdCustomFontName'], (data) => {
      // Применить тему если автозапуск включен
      const autoTheme = data.itdAutoTheme !== undefined ? data.itdAutoTheme : true;
      if (autoTheme && data.itdCustomTheme) {
        console.log("[ITD Floating Panel] Auto-applying theme:", data.itdCustomTheme);
        
        // Если это кастомная тема - применить с параметрами
        if (data.itdCustomTheme === 'custom' && data.itdLastCustomThemeParams) {
          const params = data.itdLastCustomThemeParams;
          console.log("[ITD Floating Panel] Applying custom theme with params:", params);
          applyCustomTheme(params.primary, params.secondary, params.bg, params.gradient, params.bgOpacity);
        } else {
          // Обычная тема
          applyTheme(data.itdCustomTheme);
        }
      }
      
      // Применить кастомный шрифт если сохранен
      if (data.itdCustomFont && data.itdCustomFontName) {
        console.log("[ITD Floating Panel] Auto-applying custom font:", data.itdCustomFontName);
        applyCustomFont(data.itdCustomFont, data.itdCustomFontName);
      }
      
      // Применить шейдер если автозапуск включен
      const autoShader = data.itdAutoShader !== undefined ? data.itdAutoShader : true;
      if (autoShader && data.itdShaderCode) {
        console.log("[ITD Floating Panel] Auto-applying shader...");
        setTimeout(() => {
          applyShader(data.itdShaderCode);
        }, 1000);
      }
    });
    
    // Создать UI
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(createFloatingButtons, 100);
      });
    } else {
      setTimeout(createFloatingButtons, 100);
    }
  }
  
  init();
  
  console.log("[ITD Floating Panel] Script loaded successfully");
  window.__itdFloatingPanelVersion = "1.0.8";
  
  // Уведомить background worker
  try {
    chrome.runtime.sendMessage({ type: 'ITD_FLOATING_PANEL_LOADED' });
  } catch (err) {
    console.log("[ITD Floating Panel] Could not notify background worker:", err.message);
  }
})();


// === Функции для работы с кастомными шрифтами ===

function loadFontFile(file, dropZone) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const fontData = e.target.result;
    const fontName = file.name.replace('.ttf', '').replace('.TTF', '');
    
    // Сохранить шрифт в storage
    chrome.storage.local.set({
      itdCustomFont: fontData,
      itdCustomFontName: fontName
    }, () => {
      console.log('[ITD Floating Panel] Font saved:', fontName);
      dropZone.querySelector('.itd-font-name').textContent = fontName;
      applyCustomFont(fontData, fontName);
    });
  };
  reader.readAsDataURL(file);
}

function applyCustomFont(fontData, fontName) {
  // Удалить старый стиль если есть
  const oldStyle = document.getElementById('itd-custom-font-style');
  if (oldStyle) {
    oldStyle.remove();
  }
  
  // Создать новый @font-face
  const style = document.createElement('style');
  style.id = 'itd-custom-font-style';
  style.textContent = `
    @font-face {
      font-family: 'ITDCustomFont';
      src: url('${fontData}') format('truetype');
      font-weight: normal;
      font-style: normal;
    }
    
    /* Применить ко всему сайту */
    body, body * {
      font-family: 'ITDCustomFont', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
    }
    
    /* Сохранить моноширинные шрифты для кода */
    code, pre, textarea, input[type="text"], input[type="password"] {
      font-family: 'ITDCustomFont', 'Courier New', monospace !important;
    }
  `;
  
  document.head.appendChild(style);
  console.log('[ITD Floating Panel] Custom font applied:', fontName);
}

function clearCustomFont() {
  const style = document.getElementById('itd-custom-font-style');
  if (style) {
    style.remove();
  }
  
  chrome.storage.local.remove(['itdCustomFont', 'itdCustomFontName'], () => {
    console.log('[ITD Floating Panel] Custom font cleared');
  });
}
