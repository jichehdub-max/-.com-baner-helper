// Background service worker для автоматической загрузки тем
console.log("[ITD Background] Service worker started");

// Инжектить плавающую панель при загрузке страницы итд.com
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Проверяем что страница загружена и это итд.com
  if (changeInfo.status === 'complete' && tab.url) {
    const url = tab.url.toLowerCase();
    const isItdSite = url.includes('xn--d1ah4a.com') || url.includes('итд.com');
    
    if (isItdSite) {
      console.log("[ITD Background] Detected итд.com, injecting floating panel...");
      
      // Инжектим CSS
      chrome.scripting.insertCSS({
        target: { tabId: tabId },
        files: ['floating-panel/floating-panel.css']
      }).then(() => {
        console.log("[ITD Background] CSS injected");
      }).catch(err => {
        console.log("[ITD Background] CSS injection failed (might be already loaded):", err.message);
      });
      
      // Инжектим JS
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['floating-panel/floating-panel.js']
      }).then(() => {
        console.log("[ITD Background] JS injected successfully");
      }).catch(err => {
        console.log("[ITD Background] JS injection failed:", err.message);
      });
    }
  }
});

// Также инжектим при установке/обновлении расширения
chrome.runtime.onInstalled.addListener((details) => {
  console.log("[ITD Background] Extension installed/updated:", details.reason);
  
  // Найти все открытые вкладки с итд.com и инжектить панель
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (tab.url) {
        const url = tab.url.toLowerCase();
        const isItdSite = url.includes('xn--d1ah4a.com') || url.includes('итд.com');
        
        if (isItdSite) {
          console.log("[ITD Background] Injecting into existing tab:", tab.id);
          
          chrome.scripting.insertCSS({
            target: { tabId: tab.id },
            files: ['floating-panel/floating-panel.css']
          }).catch(() => {});
          
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['floating-panel/floating-panel.js']
          }).catch(() => {});
        }
      }
    });
  });
});

// Слушаем сообщения от content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ITD_FLOATING_PANEL_LOADED') {
    console.log("[ITD Background] Floating panel loaded on tab:", sender.tab?.id);
    sendResponse({ ok: true });
  }
  return true;
});
