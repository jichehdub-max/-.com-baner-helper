// ========== INJECTED SCRIPT ==========
// Этот скрипт внедряется напрямую в контекст страницы
// ДО загрузки всех скриптов сайта
// Он перехватывает нативный window.fetch

(function() {
  'use strict';
  
  console.log('[ITD INJECTED] Script loaded, installing interceptors...');
  
  // Слушать событие от content script с данными GIF/MP4
  window.addEventListener('ITD_GIF_UPLOAD', async function(event) {
    console.log('[ITD INJECTED] ========== RECEIVED FILE DATA ==========');
    console.log('[ITD INJECTED] Event detail:', event.detail);
    
    const { gifData, gifSize, gifType, fileName } = event.detail;
    
    // Конвертировать base64 обратно в Blob
    const response = await fetch(gifData);
    const fileBlob = await response.blob();
    
    const fileSizeKB = Math.round(fileBlob.size / 1024);
    const fileSizeMB = (fileBlob.size / (1024 * 1024)).toFixed(2);
    
    console.log('[ITD INJECTED] File Blob restored:', {
      type: fileBlob.type,
      size: fileBlob.size,
      sizeKB: fileSizeKB,
      sizeMB: fileSizeMB,
      fileName: fileName
    });
    
    // Установить флаги в контексте страницы
    window.__itdForceGifUpload = true;
    window.__itdGifBlob = fileBlob;
    window.__itdFileName = fileName || 'banner.gif';
    
    console.log('[ITD INJECTED] Flags set in page context!');
    console.log('[ITD INJECTED] Ready to intercept upload...');
    console.log('[ITD INJECTED] File size:', fileSizeMB, 'MB');
  });
  
  // Сохранить оригинальный fetch ДО того как сайт его обернёт
  const originalFetch = window.fetch;
  
  // Перехватчик fetch
  window.fetch = async function(...args) {
    const [url, options] = args;
    
    // Проверить что это загрузка файла
    if (typeof url === 'string' && url.includes('/api/files/upload')) {
      console.log('[ITD INJECTED] ========== FETCH to /api/files/upload ==========');
      console.log('[ITD INJECTED] URL:', url);
      console.log('[ITD INJECTED] Method:', options?.method);
      console.log('[ITD INJECTED] Body type:', options?.body?.constructor?.name);
      console.log('[ITD INJECTED] Force GIF mode:', window.__itdForceGifUpload);
      console.log('[ITD INJECTED] Has GIF blob:', !!window.__itdGifBlob);
      
      // Если это POST с FormData и включен GIF режим
      if (window.__itdForceGifUpload && 
          options && 
          options.method === 'POST' &&
          options.body instanceof FormData) {
        
        console.log('[ITD INJECTED] ========== INTERCEPTING UPLOAD ==========');
        
        // Показать содержимое FormData
        console.log('[ITD INJECTED] Original FormData:');
        for (const [key, value] of options.body.entries()) {
          if (value instanceof Blob) {
            console.log(`  ${key}:`, {
              type: value.type,
              size: value.size,
              name: value.name || 'unnamed'
            });
          } else {
            console.log(`  ${key}:`, value);
          }
        }
        
        const gifBlob = window.__itdGifBlob;
        if (gifBlob) {
          console.log('[ITD INJECTED] GIF Blob to inject:', {
            type: gifBlob.type,
            size: gifBlob.size,
            sizeKB: Math.round(gifBlob.size / 1024)
          });
          
          // Создать новый FormData с GIF вместо PNG
          const newFormData = new FormData();
          
          // Скопировать все поля кроме file
          console.log('[ITD INJECTED] Building new FormData:');
          for (const [key, value] of options.body.entries()) {
            if (key !== 'file') {
              newFormData.append(key, value);
              console.log(`  Copied: ${key}`);
            }
          }
          
          // Добавить GIF/MP4 файл
          const fileName = window.__itdFileName || 'banner.gif';
          newFormData.append('file', gifBlob, fileName);
          console.log('  Added: file (' + fileName + ')', Math.round(gifBlob.size / 1024), 'KB');
          
          // Показать финальный FormData
          console.log('[ITD INJECTED] Final FormData:');
          for (const [key, value] of newFormData.entries()) {
            if (value instanceof Blob) {
              console.log(`  ${key}:`, {
                type: value.type,
                size: value.size,
                name: value.name || 'unnamed'
              });
            } else {
              console.log(`  ${key}:`, value);
            }
          }
          
          // Создать новые options с GIF
          const newOptions = {
            ...options,
            body: newFormData
          };
          
          // Сбросить флаги
          window.__itdForceGifUpload = false;
          window.__itdGifBlob = null;
          
          console.log('[ITD INJECTED] Sending modified request with GIF...');
          console.log('[ITD INJECTED] ========================================');
          
          return originalFetch(url, newOptions);
        }
      }
    }
    
    // Обычный запрос
    return originalFetch(...args);
  };
  
  console.log('[ITD INJECTED] Fetch interceptor installed!');
  
  // Перехватчик FormData.append (запасной вариант)
  const OriginalFormDataAppend = FormData.prototype.append;
  FormData.prototype.append = function(name, value, filename) {
    // Логируем вызовы с file
    if (name === 'file') {
      console.log('[ITD INJECTED] FormData.append called:', {
        name,
        valueType: value?.constructor?.name,
        filename,
        forceGifMode: window.__itdForceGifUpload,
        hasGifBlob: !!window.__itdGifBlob
      });
    }
    
    // Если это поле "file" и включен режим GIF/MP4
    if (name === 'file' && window.__itdForceGifUpload && window.__itdGifBlob) {
      console.log('[ITD INJECTED] ========== INTERCEPTED FormData.append ==========');
      console.log('[ITD INJECTED] Replacing with animated file');
      
      const gifBlob = window.__itdGifBlob;
      const fileName = window.__itdFileName || 'banner.gif';
      return OriginalFormDataAppend.call(this, name, gifBlob, fileName);
    }
    
    // Обычное добавление
    return OriginalFormDataAppend.call(this, name, value, filename);
  };
  
  console.log('[ITD INJECTED] FormData.append interceptor installed!');
  console.log('[ITD INJECTED] All interceptors ready!');
})();
