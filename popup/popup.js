const SETTINGS_KEY = "itdRedrawSettings";

const els = {
  detectCanvasBtn: document.getElementById("detectCanvasBtn"),
  selectAreaBtn: document.getElementById("selectAreaBtn"),
  imageInput: document.getElementById("imageInput"),
  imageMeta: document.getElementById("imageMeta"),
  fitMode: document.getElementById("fitMode"),
  resampleMode: document.getElementById("resampleMode"),
  scaleRange: document.getElementById("scaleRange"),
  offsetXRange: document.getElementById("offsetXRange"),
  offsetYRange: document.getElementById("offsetYRange"),
  opacityRange: document.getElementById("opacityRange"),
  autoPasteApply: document.getElementById("autoPasteApply"),
  scaleValue: document.getElementById("scaleValue"),
  offsetXValue: document.getElementById("offsetXValue"),
  offsetYValue: document.getElementById("offsetYValue"),
  opacityValue: document.getElementById("opacityValue"),
  applyBtn: document.getElementById("applyBtn"),
  exportBtn: document.getElementById("exportBtn"),
  resetBtn: document.getElementById("resetBtn"),
  status: document.getElementById("status")
};

const defaults = {
  fitMode: "cover",
  resampleMode: "pixel",
  scale: 100,
  offsetX: 0,
  offsetY: 0,
  opacity: 100,
  autoPasteApply: true
};

async function getActiveTabId() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (!tab || typeof tab.id !== "number") {
    throw new Error("Не удалось получить активную вкладку.");
  }
  return tab.id;
}

async function sendToActiveTab(message) {
  const tabId = await getActiveTabId();
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      const err = chrome.runtime.lastError;
      if (err) {
        reject(new Error(err.message));
        return;
      }
      resolve(response || null);
    });
  });
}

function setStatus(text, isError = false) {
  els.status.textContent = text;
  els.status.style.color = isError ? "#ff9191" : "#a6b7c9";
}

function setControls(settings) {
  els.fitMode.value = settings.fitMode;
  els.resampleMode.value = settings.resampleMode;
  els.scaleRange.value = String(settings.scale);
  els.offsetXRange.value = String(settings.offsetX);
  els.offsetYRange.value = String(settings.offsetY);
  els.opacityRange.value = String(settings.opacity);
  els.autoPasteApply.checked = Boolean(settings.autoPasteApply);
  updateReadouts();
}

function readControls() {
  return {
    fitMode: els.fitMode.value,
    resampleMode: els.resampleMode.value,
    scale: Number(els.scaleRange.value),
    offsetX: Number(els.offsetXRange.value),
    offsetY: Number(els.offsetYRange.value),
    opacity: Number(els.opacityRange.value),
    autoPasteApply: Boolean(els.autoPasteApply.checked)
  };
}

function updateReadouts() {
  els.scaleValue.textContent = `${els.scaleRange.value}%`;
  els.offsetXValue.textContent = `${els.offsetXRange.value}px`;
  els.offsetYValue.textContent = `${els.offsetYRange.value}px`;
  els.opacityValue.textContent = `${els.opacityRange.value}%`;
}

async function saveSettings(settings) {
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
}

async function loadSettings() {
  const data = await chrome.storage.local.get(SETTINGS_KEY);
  return { ...defaults, ...(data[SETTINGS_KEY] || {}) };
}

async function pushSettings() {
  const settings = readControls();
  updateReadouts();
  await saveSettings(settings);
  try {
    const resp = await sendToActiveTab({ type: "ITD_REDRAW_UPDATE_SETTINGS", payload: settings });
    if (!resp || !resp.ok) {
      setStatus(resp?.message || "Настройки сохранены, но превью пока неактивно.");
      return;
    }
    setStatus(resp.message || "Превью обновлено.");
  } catch (err) {
    setStatus(`Не удалось обновить превью: ${err.message}`, true);
  }
}

async function readFileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Ошибка чтения файла."));
    reader.readAsDataURL(file);
  });
}

async function handleFiles(files) {
  if (!files || files.length === 0) {
    return;
  }

  try {
    const dataUrls = await Promise.all(files.map((file) => readFileToDataUrl(file)));
    const resp = await sendToActiveTab(
      dataUrls.length === 1
        ? {
            type: "ITD_REDRAW_SET_IMAGE",
            payload: { dataUrl: dataUrls[0] }
          }
        : {
            type: "ITD_REDRAW_SET_IMAGES",
            payload: { dataUrls }
          }
    );

    if (!resp?.ok) {
      setStatus(resp?.message || "Не удалось загрузить изображение на страницу.", true);
      return;
    }

    if (files.length === 1 && resp.image) {
      els.imageMeta.textContent = `${files[0].name} | ${resp.image.width}x${resp.image.height}`;
    } else if (resp.imagesCount && resp.firstImage) {
      els.imageMeta.textContent = `${resp.imagesCount} файлов | первый: ${resp.firstImage.width}x${resp.firstImage.height}`;
    } else {
      els.imageMeta.textContent = `${files.length} файлов`;
    }
    setStatus(resp.message || `Загружено ${files.length} изображений.`);
  } catch (err) {
    setStatus(`Ошибка отправки файлов: ${err.message}`, true);
  }
}

async function syncInitialState() {
  try {
    const resp = await sendToActiveTab({ type: "ITD_REDRAW_PING" });
    if (!resp?.ok) {
      setStatus("Контент-скрипт не активен на этой вкладке.", true);
      return;
    }
    if (resp.hasImage && resp.image) {
      if ((resp.imagesCount || 1) > 1) {
        els.imageMeta.textContent = `Текущее: ${resp.imagesCount} изображений | первое ${resp.image.width}x${resp.image.height}`;
      } else {
        els.imageMeta.textContent = `Текущее: ${resp.image.width}x${resp.image.height}`;
      }
    }
    if (resp.target) {
      const w = Math.round(resp.target.width);
      const h = Math.round(resp.target.height);
      if (resp.canvas) {
        setStatus(`Область ${w}x${h} CSS | canvas ${resp.canvas.width}x${resp.canvas.height}px.`);
      } else {
        setStatus(`Целевая область: ${w}x${h} px.`);
      }
    } else {
      setStatus("Открой окно рисования на сайте и нажми 'Найти canvas'. Ctrl+V работает на странице.");
    }
  } catch (err) {
    setStatus(`Нет доступа к странице: ${err.message}`, true);
  }
}

async function onDetectCanvas() {
  try {
    const resp = await sendToActiveTab({ type: "ITD_REDRAW_DETECT_CANVAS" });
    if (!resp?.ok) {
      setStatus(resp?.message || "Canvas не найден.", true);
      return;
    }
    if (resp.canvas) {
      setStatus(`Canvas найден: CSS ${Math.round(resp.target.width)}x${Math.round(resp.target.height)} | px ${resp.canvas.width}x${resp.canvas.height}.`);
      return;
    }
    const w = Math.round(resp.target?.width || 0);
    const h = Math.round(resp.target?.height || 0);
    setStatus(`Canvas найден: ${w}x${h}.`);
  } catch (err) {
    setStatus(`Ошибка поиска canvas: ${err.message}`, true);
  }
}

async function onSelectArea() {
  try {
    const resp = await sendToActiveTab({ type: "ITD_REDRAW_SELECT_AREA" });
    if (!resp?.ok) {
      setStatus(resp?.message || "Не удалось запустить выделение.", true);
      return;
    }
    setStatus("Режим выделения включен. Выдели прямоугольник на странице.");
    window.close();
  } catch (err) {
    setStatus(`Ошибка запуска выделения: ${err.message}`, true);
  }
}

async function onApply() {
  try {
    const resp = await sendToActiveTab({ type: "ITD_REDRAW_APPLY_CANVAS" });
    if (!resp?.ok) {
      setStatus(resp?.message || "Не удалось применить в canvas.", true);
      return;
    }
    setStatus(resp.message || "Изображение применено в canvas.");
  } catch (err) {
    setStatus(`Ошибка применения: ${err.message}`, true);
  }
}

async function onExport() {
  try {
    const resp = await sendToActiveTab({ type: "ITD_REDRAW_EXPORT_PNG" });
    if (!resp?.ok) {
      setStatus(resp?.message || "Не удалось экспортировать PNG.", true);
      return;
    }
    setStatus(resp.message || "PNG экспортирован.");
  } catch (err) {
    setStatus(`Ошибка экспорта: ${err.message}`, true);
  }
}

async function onReset() {
  setControls(defaults);
  await saveSettings(defaults);
  els.imageInput.value = "";
  els.imageMeta.textContent = "Файл не выбран.";
  try {
    const resp = await sendToActiveTab({ type: "ITD_REDRAW_RESET" });
    if (!resp?.ok) {
      setStatus(resp?.message || "Сброс выполнен локально.", false);
      return;
    }
    setStatus("Сброс выполнен.");
  } catch (err) {
    setStatus(`Сброс настроек, но страница недоступна: ${err.message}`);
  }
}

function bindEvents() {
  els.detectCanvasBtn.addEventListener("click", onDetectCanvas);
  els.selectAreaBtn.addEventListener("click", onSelectArea);
  els.applyBtn.addEventListener("click", onApply);
  els.exportBtn.addEventListener("click", onExport);
  els.resetBtn.addEventListener("click", onReset);

  els.imageInput.addEventListener("change", () => {
    const list = els.imageInput.files ? Array.from(els.imageInput.files) : [];
    handleFiles(list);
  });

  const controls = [
    els.fitMode,
    els.resampleMode,
    els.scaleRange,
    els.offsetXRange,
    els.offsetYRange,
    els.opacityRange
  ];
  controls.forEach((el) => {
    el.addEventListener("input", () => {
      pushSettings();
    });
  });
  els.autoPasteApply.addEventListener("change", () => {
    pushSettings();
  });
}

async function init() {
  const settings = await loadSettings();
  setControls(settings);
  bindEvents();

  try {
    await sendToActiveTab({
      type: "ITD_REDRAW_UPDATE_SETTINGS",
      payload: settings
    });
  } catch (err) {
    setStatus(`Открой поддерживаемую вкладку: ${err.message}`, true);
  }

  await syncInitialState();
}

init();
