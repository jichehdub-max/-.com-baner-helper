// Система кастомных тем для итд.com
(() => {
  try {
    console.log("[ITD Themes] Script loaded, starting...");
    
    if (window.__itdThemeSystemLoaded) {
      console.log("[ITD Themes] Already loaded, skipping");
      return;
    }
    window.__itdThemeSystemLoaded = true;

    const THEMES_KEY = "itdCustomThemes";
    const ACTIVE_THEME_KEY = "itdActiveTheme";
    const SHADER_KEY = "itdActiveShader";

    console.log("[ITD Themes] Initializing theme system...");

  const defaultThemes = {
    default: {
      name: "Default",
      colors: {
        primary: "#87c9ff",
        secondary: "#6a8fff",
        background: "rgba(9, 16, 30, 0.52)",
        text: "#f4f8ff",
        border: "rgba(255, 255, 255, 0.34)"
      }
    },
    dark: {
      name: "Dark Purple",
      colors: {
        primary: "#b794f6",
        secondary: "#8b5cf6",
        background: "rgba(17, 12, 30, 0.62)",
        text: "#e9d5ff",
        border: "rgba(196, 181, 253, 0.34)"
      }
    },
    neon: {
      name: "Neon Cyan",
      colors: {
        primary: "#06b6d4",
        secondary: "#0891b2",
        background: "rgba(8, 20, 30, 0.72)",
        text: "#cffafe",
        border: "rgba(34, 211, 238, 0.44)"
      }
    }
  };

  class ThemeSystem {
    constructor() {
      this.themes = { ...defaultThemes };
      this.activeTheme = "default";
      this.shader = null;
      this.shaderCanvas = null;
      this.shaderContext = null;
      this.animationFrame = null;
      this.initialized = false;
    }

    async init() {
      console.log("[ITD Themes] Starting initialization...");
      try {
        await this.loadThemes();
        await this.loadActiveTheme();
        await this.loadShader();
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
          await new Promise(resolve => {
            document.addEventListener('DOMContentLoaded', resolve, { once: true });
          });
        }
        
        this.applyTheme();
        this.setupShader();
        
        // Watch for div.layout appearance (SvelteKit dynamic loading)
        this.watchForLayout();
        
        this.initialized = true;
        console.log("[ITD Themes] Initialization complete");
      } catch (err) {
        console.error("[ITD Themes] Initialization error:", err);
      }
    }

    watchForLayout() {
      // Check if layout already exists
      const layout = document.querySelector('div.layout');
      if (layout) {
        console.log("[ITD Themes] div.layout found immediately");
        return;
      }

      // Watch for layout to appear
      console.log("[ITD Themes] Watching for div.layout to appear...");
      const observer = new MutationObserver((mutations) => {
        const layout = document.querySelector('div.layout');
        if (layout) {
          console.log("[ITD Themes] div.layout appeared, reapplying theme");
          this.applyTheme();
          observer.disconnect();
        }
      });

      observer.observe(document.documentElement, {
        childList: true,
        subtree: true
      });

      // Stop watching after 10 seconds
      setTimeout(() => {
        observer.disconnect();
        console.log("[ITD Themes] Stopped watching for div.layout");
      }, 10000);
    }

    async loadThemes() {
      return new Promise((resolve) => {
        chrome.storage.local.get(THEMES_KEY, (data) => {
          if (data[THEMES_KEY]) {
            this.themes = { ...defaultThemes, ...data[THEMES_KEY] };
            console.log("[ITD Themes] Loaded custom themes:", data[THEMES_KEY]);
          }
          resolve();
        });
      });
    }

    async loadActiveTheme() {
      return new Promise((resolve) => {
        chrome.storage.local.get(ACTIVE_THEME_KEY, (data) => {
          this.activeTheme = data[ACTIVE_THEME_KEY] || "default";
          console.log("[ITD Themes] Active theme:", this.activeTheme);
          resolve();
        });
      });
    }

    async loadShader() {
      return new Promise((resolve) => {
        chrome.storage.local.get(SHADER_KEY, (data) => {
          this.shader = data[SHADER_KEY] || null;
          if (this.shader) {
            console.log("[ITD Themes] Loaded shader");
          }
          resolve();
        });
      });
    }

    saveThemes() {
      const custom = {};
      Object.keys(this.themes).forEach(key => {
        if (!defaultThemes[key]) {
          custom[key] = this.themes[key];
        }
      });
      chrome.storage.local.set({ [THEMES_KEY]: custom }, () => {
        console.log("[ITD Themes] Saved custom themes:", custom);
      });
    }

    saveActiveTheme() {
      chrome.storage.local.set({ [ACTIVE_THEME_KEY]: this.activeTheme }, () => {
        console.log("[ITD Themes] Saved active theme:", this.activeTheme);
      });
    }

    saveShader() {
      chrome.storage.local.set({ [SHADER_KEY]: this.shader }, () => {
        console.log("[ITD Themes] Saved shader");
      });
    }

    addTheme(id, theme) {
      this.themes[id] = theme;
      this.saveThemes();
    }

    deleteTheme(id) {
      if (defaultThemes[id]) return false;
      delete this.themes[id];
      if (this.activeTheme === id) {
        this.activeTheme = "default";
        this.saveActiveTheme();
      }
      this.saveThemes();
      return true;
    }

    setActiveTheme(id) {
      if (!this.themes[id]) return false;
      this.activeTheme = id;
      this.saveActiveTheme();
      this.applyTheme();
      return true;
    }

    setShader(shaderCode) {
      this.shader = shaderCode;
      this.saveShader();
      this.setupShader();
    }

    clearShader() {
      this.shader = null;
      this.saveShader();
      this.destroyShader();
    }

    applyTheme() {
      const theme = this.themes[this.activeTheme];
      if (!theme) {
        console.warn("[ITD Themes] Theme not found:", this.activeTheme);
        return;
      }

      console.log("[ITD Themes] Applying theme:", this.activeTheme, theme);

      // Remove old style if exists
      const oldStyle = document.getElementById("itd-custom-theme-style");
      if (oldStyle) {
        oldStyle.remove();
      }

      // Create new style element
      const style = document.createElement("style");
      style.id = "itd-custom-theme-style";
      style.setAttribute("data-theme", this.activeTheme);
      
      const css = `
        /* Основной контейнер сайта итд.com */
        div.layout {
          background: linear-gradient(135deg, ${this.hexToRgba(theme.colors.primary, 0.08)}, ${this.hexToRgba(theme.colors.secondary, 0.05)}) !important;
          position: relative !important;
        }
        
        /* Декоративный overlay поверх layout */
        div.layout::before {
          content: "" !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background: 
            radial-gradient(circle at 20% 30%, ${this.hexToRgba(theme.colors.primary, 0.15)}, transparent 50%),
            radial-gradient(circle at 80% 70%, ${this.hexToRgba(theme.colors.secondary, 0.12)}, transparent 50%) !important;
          pointer-events: none !important;
          z-index: 0 !important;
          mix-blend-mode: screen !important;
        }
        
        /* Контент поверх overlay */
        div.layout > * {
          position: relative !important;
          z-index: 1 !important;
        }
        
        /* Body фон */
        body {
          background: linear-gradient(180deg, ${this.hexToRgba(theme.colors.primary, 0.03)}, ${this.hexToRgba(theme.colors.secondary, 0.02)}) !important;
        }
        
        /* Toast контейнер */
        div.toast-container {
          z-index: 999999 !important;
        }
        
        /* Элементы расширения */
        #itd-redraw-target {
          border-color: ${theme.colors.border} !important;
          background: linear-gradient(160deg, ${this.hexToRgba(theme.colors.primary, 0.11)}, ${this.hexToRgba(theme.colors.secondary, 0.09)}) !important;
        }
        
        #itd-redraw-badge {
          color: ${theme.colors.text} !important;
          background: linear-gradient(150deg, ${this.hexToRgba(theme.colors.primary, 0.2)} 0%, ${this.hexToRgba(theme.colors.secondary, 0.1)} 45%, ${this.hexToRgba(theme.colors.secondary, 0.18)} 100%), ${theme.colors.background} !important;
          border-color: ${theme.colors.border} !important;
        }
        
        #itd-redraw-toast {
          color: ${theme.colors.text} !important;
          background: linear-gradient(150deg, ${this.hexToRgba(theme.colors.primary, 0.23)}, ${this.hexToRgba(theme.colors.secondary, 0.14)}), ${theme.colors.background} !important;
          border-color: ${theme.colors.border} !important;
        }
        
        #itd-redraw-select-box {
          border-color: ${this.hexToRgba(theme.colors.primary, 0.95)} !important;
          background: linear-gradient(145deg, ${this.hexToRgba(theme.colors.primary, 0.22)}, ${this.hexToRgba(theme.colors.secondary, 0.16)}) !important;
        }
      `;
      
      style.textContent = css;
      
      // Ensure head exists
      if (!document.head) {
        console.warn("[ITD Themes] document.head not available yet");
        return;
      }
      
      document.head.appendChild(style);
      
      // Log applied elements
      const layoutDiv = document.querySelector('div.layout');
      if (layoutDiv) {
        console.log("[ITD Themes] ✓ Found div.layout, theme applied");
      } else {
        console.warn("[ITD Themes] ⚠ div.layout not found yet, styles will apply when it appears");
      }
      
      console.log("[ITD Themes] Theme styles injected successfully");
    }

    hexToRgba(hex, alpha) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    setupShader() {
      this.destroyShader();
      if (!this.shader) {
        console.log("[ITD Themes] No shader to setup");
        return;
      }

      console.log("[ITD Themes] Setting up shader...");
      console.log("[ITD Themes] Shader code length:", this.shader.length, "chars");

      if (!document.body && !document.documentElement) {
        console.warn("[ITD Themes] DOM not ready for shader, will retry...");
        setTimeout(() => this.setupShader(), 500);
        return;
      }

      this.shaderCanvas = document.createElement("canvas");
      this.shaderCanvas.id = "itd-shader-canvas";
      this.shaderCanvas.width = window.innerWidth;
      this.shaderCanvas.height = window.innerHeight;
      this.shaderCanvas.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 999998 !important;
        pointer-events: none !important;
        opacity: 0.3 !important;
        mix-blend-mode: screen !important;
      `;
      
      const target = document.body || document.documentElement;
      target.appendChild(this.shaderCanvas);
      console.log("[ITD Themes] Shader canvas created:", this.shaderCanvas.width, "x", this.shaderCanvas.height);
      console.log("[ITD Themes] Canvas appended to:", target.tagName);
      
      const gl = this.shaderCanvas.getContext("webgl", { alpha: true, premultipliedAlpha: false }) 
                 || this.shaderCanvas.getContext("experimental-webgl", { alpha: true, premultipliedAlpha: false });
      
      if (!gl) {
        console.error("[ITD Themes] WebGL not supported");
        this.shaderCanvas.remove();
        return;
      }

      console.log("[ITD Themes] WebGL context created");
      this.shaderContext = gl;
      
      try {
        this.initShaderProgram(gl);
        this.renderShader();
        console.log("[ITD Themes] Shader setup complete and rendering");
      } catch (err) {
        console.error("[ITD Themes] Shader setup error:", err);
        this.destroyShader();
      }
    }

    initShaderProgram(gl) {
      const vertexShader = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vertexShader, `
        attribute vec2 position;
        void main() {
          gl_Position = vec4(position, 0.0, 1.0);
        }
      `);
      gl.compileShader(vertexShader);

      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
      const wrappedShader = this.wrapShadertoyCode(this.shader);
      gl.shaderSource(fragmentShader, wrappedShader);
      gl.compileShader(fragmentShader);

      if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(fragmentShader));
        return;
      }

      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      gl.useProgram(program);

      const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

      const position = gl.getAttribLocation(program, "position");
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

      this.shaderProgram = program;
      this.shaderUniforms = {
        time: gl.getUniformLocation(program, "iTime"),
        resolution: gl.getUniformLocation(program, "iResolution"),
        mouse: gl.getUniformLocation(program, "iMouse")
      };

      this.shaderStartTime = Date.now();
    }

    wrapShadertoyCode(code) {
      return `
        precision mediump float;
        uniform float iTime;
        uniform vec3 iResolution;
        uniform vec4 iMouse;
        
        ${code}
        
        void main() {
          mainImage(gl_FragColor, gl_FragCoord.xy);
        }
      `;
    }

    renderShader() {
      if (!this.shaderContext || !this.shaderCanvas) return;

      const gl = this.shaderContext;
      const canvas = this.shaderCanvas;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);

      const time = (Date.now() - this.shaderStartTime) / 1000;
      gl.uniform1f(this.shaderUniforms.time, time);
      gl.uniform3f(this.shaderUniforms.resolution, canvas.width, canvas.height, 1.0);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      this.animationFrame = requestAnimationFrame(() => this.renderShader());
    }

    destroyShader() {
      console.log("[ITD Themes] Destroying shader");
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
      }
      if (this.shaderCanvas && this.shaderCanvas.parentNode) {
        this.shaderCanvas.remove();
      }
      this.shaderCanvas = null;
      this.shaderContext = null;
      this.shaderProgram = null;
    }

    getThemes() {
      return this.themes;
    }

    getActiveTheme() {
      return this.activeTheme;
    }

    getShader() {
      return this.shader;
    }
  }

  // Create and initialize theme system
  console.log("[ITD Themes] Creating ThemeSystem instance...");
  const themeSystem = new ThemeSystem();
  window.itdThemeSystem = themeSystem;
  
  console.log("[ITD Themes] ThemeSystem instance created, starting init...");
  
  // Initialize asynchronously
  themeSystem.init().then(() => {
    console.log("[ITD Themes] Init completed successfully");
  }).catch(err => {
    console.error("[ITD Themes] Failed to initialize:", err);
  });

  // API для popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("[ITD Themes] Received message:", request.action);
    
    const system = window.itdThemeSystem;
    if (!system) {
      console.error("[ITD Themes] Theme system not initialized");
      sendResponse({ success: false, error: "Theme system not initialized" });
      return true;
    }

    // Wait for initialization if needed
    const handleRequest = async () => {
      if (!system.initialized) {
        console.log("[ITD Themes] Waiting for initialization...");
        await system.init();
      }

      switch (request.action) {
        case "getThemes":
          const themes = system.getThemes();
          const active = system.getActiveTheme();
          console.log("[ITD Themes] Sending themes:", themes, "active:", active);
          sendResponse({ themes: themes, active: active });
          break;
        case "setTheme":
          const success = system.setActiveTheme(request.themeId);
          console.log("[ITD Themes] Set theme result:", success);
          sendResponse({ success: success });
          break;
        case "addTheme":
          system.addTheme(request.themeId, request.theme);
          console.log("[ITD Themes] Added theme:", request.themeId);
          sendResponse({ success: true });
          break;
        case "deleteTheme":
          const deleted = system.deleteTheme(request.themeId);
          console.log("[ITD Themes] Delete theme result:", deleted);
          sendResponse({ success: deleted });
          break;
        case "setShader":
          system.setShader(request.shader);
          console.log("[ITD Themes] Set shader");
          sendResponse({ success: true });
          break;
        case "clearShader":
          system.clearShader();
          console.log("[ITD Themes] Cleared shader");
          sendResponse({ success: true });
          break;
        case "getShader":
          const shader = system.getShader();
          console.log("[ITD Themes] Sending shader");
          sendResponse({ shader: shader });
          break;
        default:
          console.warn("[ITD Themes] Unknown action:", request.action);
          sendResponse({ success: false, error: "Unknown action" });
      }
    };

    handleRequest().catch(err => {
      console.error("[ITD Themes] Message handler error:", err);
      sendResponse({ success: false, error: err.message });
    });

    return true;
  });

  console.log("[ITD Themes] Theme system loaded successfully");
  
  } catch (err) {
    console.error("[ITD Themes] CRITICAL ERROR:", err);
    console.error("[ITD Themes] Stack:", err.stack);
    alert("ITD Themes Error:\n\n" + err.message + "\n\nCheck console for details");
  }
})();
