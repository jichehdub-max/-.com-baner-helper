// Система кастомных тем для итд.com
(() => {
  try {
    console.log("[ITD Themes] Script loaded");
    
    if (window.__itdThemeSystemLoaded) {
      console.log("[ITD Themes] Already loaded");
      return;
    }
    window.__itdThemeSystemLoaded = true;

    class ThemeSystem {
      constructor() {
        this.themes = {
          default: { name: "Default", colors: { primary: "#87c9ff", secondary: "#6a8fff", background: "rgba(9, 16, 30, 0.52)", text: "#f4f8ff", border: "rgba(255, 255, 255, 0.34)" } },
          dark: { name: "Dark Purple", colors: { primary: "#b794f6", secondary: "#8b5cf6", background: "rgba(17, 12, 30, 0.62)", text: "#e9d5ff", border: "rgba(196, 181, 253, 0.34)" } },
          neon: { name: "Neon Cyan", colors: { primary: "#06b6d4", secondary: "#0891b2", background: "rgba(8, 20, 30, 0.72)", text: "#cffafe", border: "rgba(34, 211, 238, 0.44)" } }
        };
        this.activeTheme = "default";
        this.initialized = true;
        console.log("[ITD Themes] ThemeSystem created");
      }
      
      getThemes() { return this.themes; }
      getActiveTheme() { return this.activeTheme; }
      setActiveTheme(id) { 
        if (!this.themes[id]) return false;
        this.activeTheme = id;
        this.applyTheme();
        return true;
      }
      
      applyTheme() {
        const theme = this.themes[this.activeTheme];
        if (!theme) return;
        
        const oldStyle = document.getElementById("itd-custom-theme-style");
        if (oldStyle) oldStyle.remove();
        
        const style = document.createElement("style");
        style.id = "itd-custom-theme-style";
        style.setAttribute("data-theme", this.activeTheme);
        
        const hexToRgba = (hex, alpha) => {
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };
        
        style.textContent = `
          div.layout {
            background: linear-gradient(135deg, ${hexToRgba(theme.colors.primary, 0.08)}, ${hexToRgba(theme.colors.secondary, 0.05)}) !important;
          }
          body {
            background: linear-gradient(180deg, ${hexToRgba(theme.colors.primary, 0.03)}, ${hexToRgba(theme.colors.secondary, 0.02)}) !important;
          }
        `;
        
        if (document.head) {
          document.head.appendChild(style);
          console.log("[ITD Themes] Theme applied:", this.activeTheme);
        }
      }
    }

    window.itdThemeSystem = new ThemeSystem();
    window.itdThemeSystem.applyTheme();
    
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      const system = window.itdThemeSystem;
      if (!system) {
        sendResponse({ success: false });
        return true;
      }
      
      switch (request.action) {
        case "getThemes":
          sendResponse({ themes: system.getThemes(), active: system.getActiveTheme() });
          break;
        case "setTheme":
          sendResponse({ success: system.setActiveTheme(request.themeId) });
          break;
        default:
          sendResponse({ success: false });
      }
      return true;
    });
    
    console.log("[ITD Themes] System loaded successfully");
  } catch (err) {
    console.error("[ITD Themes] ERROR:", err);
    alert("ITD Themes Error: " + err.message);
  }
})();
