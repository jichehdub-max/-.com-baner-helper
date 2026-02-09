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
      state.panels[panelName].style.display = 'block';
      setTimeout(() => {
        state.panels[panelName].classList.add('open');
      }, 10);
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
      setTimeout(() => {
        panel.classList.add('open');
      }, 10);
    }
  }
  
  // Закрыть панель
  function closePanel(panelName) {
    const panel = state.panels[panelName];
    if (panel) {
      panel.classList.remove('open');
      setTimeout(() => {
        panel.style.display = 'none';
      }, 300);
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
            <label class="itd-checkbox">
              <input type="checkbox" id="itd-custom-gradient">
              <span>Градиентный режим</span>
            </label>
            <p class="itd-hint">Создаёт плавный градиент между основным и вторичным цветом</p>
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
    
    // Сохранить кастомную тему
    const saveCustomThemeBtn = panel.querySelector('#itd-save-custom-theme');
    saveCustomThemeBtn.addEventListener('click', () => {
      const name = panel.querySelector('#itd-custom-theme-name').value.trim();
      const primary = panel.querySelector('#itd-custom-primary').value;
      const secondary = panel.querySelector('#itd-custom-secondary').value;
      const bg = panel.querySelector('#itd-custom-bg').value;
      const gradient = panel.querySelector('#itd-custom-gradient').checked;
      
      if (!name) {
        alert('Введите название темы');
        return;
      }
      
      saveCustomTheme(name, primary, secondary, bg, gradient, panel);
    });
    
    // Применить кастомную тему
    const applyCustomThemeBtn = panel.querySelector('#itd-apply-custom-theme');
    applyCustomThemeBtn.addEventListener('click', () => {
      const primary = panel.querySelector('#itd-custom-primary').value;
      const secondary = panel.querySelector('#itd-custom-secondary').value;
      const bg = panel.querySelector('#itd-custom-bg').value;
      const gradient = panel.querySelector('#itd-custom-gradient').checked;
      
      applyCustomTheme(primary, secondary, bg, gradient);
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
  function saveCustomTheme(name, primary, secondary, bg, gradient, panel) {
    chrome.storage.local.get(['itdSavedCustomThemes'], (data) => {
      const savedThemes = data.itdSavedCustomThemes || {};
      const themeId = 'custom_theme_' + Date.now();
      
      savedThemes[themeId] = {
        name: name,
        primary: primary,
        secondary: secondary,
        bg: bg,
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
      const gradientCheck = panel.querySelector('#itd-custom-gradient');
      
      nameInput.value = theme.name;
      primaryInput.value = theme.primary;
      secondaryInput.value = theme.secondary;
      bgInput.value = theme.bg;
      gradientCheck.checked = theme.gradient || false;
      
      chrome.storage.local.set({ itdActiveCustomTheme: themeId });
      
      // Применить тему
      applyCustomTheme(theme.primary, theme.secondary, theme.bg, theme.gradient);
      
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
  function applyCustomTheme(primary, secondary, bg, gradient) {
    document.documentElement.setAttribute('data-itd-custom-theme', 'custom');
    
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
      const bg1 = bg;
      const bg2 = adjustBrightness(bg, 15);
      const bg3 = adjustBrightness(bg, 25);
      
      document.documentElement.style.setProperty('--color-background', bg);
      document.documentElement.style.setProperty('--color-card', cardBg);
      
      // Создать анимацию градиента если её нет
      if (!document.getElementById('itd-custom-gradient-style')) {
        const style = document.createElement('style');
        style.id = 'itd-custom-gradient-style';
        style.textContent = `
          @keyframes customGradient {
            0% {
              background: linear-gradient(135deg, ${bg1} 0%, ${bg2} 50%, ${bg1} 100%);
            }
            33% {
              background: linear-gradient(135deg, ${bg2} 0%, ${bg3} 50%, ${bg2} 100%);
            }
            66% {
              background: linear-gradient(135deg, ${bg3} 0%, ${bg1} 50%, ${bg3} 100%);
            }
            100% {
              background: linear-gradient(135deg, ${bg1} 0%, ${bg2} 50%, ${bg1} 100%);
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
              background: linear-gradient(135deg, ${bg1} 0%, ${bg2} 50%, ${bg1} 100%);
            }
            33% {
              background: linear-gradient(135deg, ${bg2} 0%, ${bg3} 50%, ${bg2} 100%);
            }
            66% {
              background: linear-gradient(135deg, ${bg3} 0%, ${bg1} 50%, ${bg3} 100%);
            }
            100% {
              background: linear-gradient(135deg, ${bg1} 0%, ${bg2} 50%, ${bg1} 100%);
            }
          }
        `;
      }
      
      document.body.style.background = `linear-gradient(135deg, ${bg1} 0%, ${bg2} 50%, ${bg1} 100%)`;
      document.body.style.animation = 'customGradient 15s ease-in-out infinite';
    } else {
      document.documentElement.style.setProperty('--color-background', bg);
      document.documentElement.style.setProperty('--color-card', cardBg);
      document.body.style.background = bg;
      document.body.style.animation = 'none';
      
      // Удалить стиль градиента
      const gradientStyle = document.getElementById('itd-custom-gradient-style');
      if (gradientStyle) {
        gradientStyle.remove();
      }
    }
    
    updateButtonColors('custom');
    console.log("[ITD Floating Panel] Applied custom theme", { gradient, textColor });
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
    document.documentElement.setAttribute('data-itd-custom-theme', theme);
    updateButtonColors(theme);
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
  
  // Применить шейдер
  function applyShader(code) {
    clearShader();
    if (!code) return;
    
    console.log("[ITD Floating Panel] Applying shader...");
    
    const canvas = document.createElement("canvas");
    canvas.id = "itd-shader-canvas";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) {
      console.error("[ITD Floating Panel] WebGL not supported");
      alert("WebGL не поддерживается в вашем браузере");
      return;
    }
    
    try {
      const vs = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vs, `attribute vec2 p; void main(){gl_Position=vec4(p,0.,1.);}`);
      gl.compileShader(vs);
      
      const fs = gl.createShader(gl.FRAGMENT_SHADER);
      const wrapped = `precision mediump float;uniform float iTime;uniform vec3 iResolution;${code}void main(){mainImage(gl_FragColor,gl_FragCoord.xy);}`;
      gl.shaderSource(fs, wrapped);
      gl.compileShader(fs);
      
      if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
        console.error("[ITD Floating Panel] Shader error:", gl.getShaderInfoLog(fs));
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
        const shaderCanvas = document.getElementById('itd-shader-canvas');
        if (!shaderCanvas) return;
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform1f(uTime, (Date.now() - start) / 1000);
        gl.uniform3f(uRes, canvas.width, canvas.height, 1);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        requestAnimationFrame(render);
      }
      
      render();
      console.log("[ITD Floating Panel] Shader applied");
    } catch (err) {
      console.error("[ITD Floating Panel] Shader error:", err);
      alert("Ошибка шейдера: " + err.message);
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
    
    // Отправить сообщение в content script
    function sendMessage(message) {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(message, (response) => {
          resolve(response || { ok: false, message: 'Нет ответа' });
        });
      });
    }
    
    // Найти canvas
    const detectBtn = panel.querySelector('#itd-detect-canvas');
    detectBtn.addEventListener('click', async () => {
      const resp = await sendMessage({ type: 'ITD_REDRAW_DETECT_CANVAS' });
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
      const resp = await sendMessage({ type: 'ITD_REDRAW_SELECT_AREA' });
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
      const resp = await sendMessage({
        type: 'ITD_REDRAW_SET_IMAGES',
        payload: { dataUrls }
      });
      
      if (resp.ok) {
        imageMeta.textContent = `${files.length} файл(ов) загружено`;
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
      
      sendMessage({
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
      const resp = await sendMessage({ type: 'ITD_REDRAW_APPLY_CANVAS' });
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
      const resp = await sendMessage({ type: 'ITD_REDRAW_EXPORT_PNG' });
      if (!resp.ok) {
        alert(resp.message || 'Не удалось экспортировать');
        return;
      }
      alert(resp.message || 'PNG экспортирован!');
      console.log('[ITD Banner] Exported PNG');
    });
    
    console.log("[ITD Floating Panel] Banner panel setup (using content.js)");
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
    chrome.storage.local.get(['itdCustomTheme', 'itdAutoTheme', 'itdShaderCode', 'itdAutoShader'], (data) => {
      // Применить тему если автозапуск включен
      const autoTheme = data.itdAutoTheme !== undefined ? data.itdAutoTheme : true;
      if (autoTheme && data.itdCustomTheme) {
        console.log("[ITD Floating Panel] Auto-applying theme:", data.itdCustomTheme);
        applyTheme(data.itdCustomTheme);
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
  window.__itdFloatingPanelVersion = "1.0.7";
  
  // Уведомить background worker
  try {
    chrome.runtime.sendMessage({ type: 'ITD_FLOATING_PANEL_LOADED' });
  } catch (err) {
    console.log("[ITD Floating Panel] Could not notify background worker:", err.message);
  }
})();
