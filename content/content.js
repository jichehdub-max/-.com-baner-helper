(() => {
  if (window.__itdRedrawHelperLoaded) {
    return;
  }
  window.__itdRedrawHelperLoaded = true;
  const SETTINGS_KEY = "itdRedrawSettings";

  const defaults = {
    fitMode: "cover",
    resampleMode: "pixel",
    scale: 100,
    offsetX: 0,
    offsetY: 0,
    opacity: 100,
    autoPasteApply: true,
    videoLoop: true,
    videoFps: 24
  };

  const state = {
    settings: { ...defaults },
    images: [],
    target: null,
    targetCanvas: null,
    ui: null,
    selection: null,
    toastTimer: null,
    loopJob: null,
    drag: {
      active: false,
      startX: 0,
      startY: 0,
      baseOffsetX: 0,
      baseOffsetY: 0,
      previewBox: null
    },
    targetWatchTimer: null
  };

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function normalizeSettings(raw) {
    const safe = raw || {};
    const fitMode = ["cover", "contain", "stretch"].includes(safe.fitMode) ? safe.fitMode : state.settings.fitMode;
    const resampleMode = safe.resampleMode === "smooth" ? "smooth" : "pixel";
    return {
      fitMode,
      resampleMode,
      scale: clamp(Number(safe.scale ?? state.settings.scale), 20, 300),
      offsetX: clamp(Number(safe.offsetX ?? state.settings.offsetX), -2000, 2000),
      offsetY: clamp(Number(safe.offsetY ?? state.settings.offsetY), -2000, 2000),
      opacity: clamp(Number(safe.opacity ?? state.settings.opacity), 1, 100),
      autoPasteApply: safe.autoPasteApply === undefined ? state.settings.autoPasteApply : Boolean(safe.autoPasteApply),
      videoLoop: safe.videoLoop === undefined ? state.settings.videoLoop : Boolean(safe.videoLoop),
      videoFps: clamp(Number(safe.videoFps ?? state.settings.videoFps), 1, 60)
    };
  }

  function loadSettingsFromStorage() {
    return new Promise((resolve) => {
      chrome.storage.local.get(SETTINGS_KEY, (data) => {
        const stored = data && data[SETTINGS_KEY] ? data[SETTINGS_KEY] : {};
        resolve(normalizeSettings({ ...defaults, ...stored }));
      });
    });
  }

  function isCanvasVisible(canvas) {
    if (!(canvas instanceof HTMLCanvasElement)) {
      return false;
    }
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) {
      return false;
    }
    const style = window.getComputedStyle(canvas);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) < 0.05) {
      return false;
    }
    return rect.bottom > 0 && rect.right > 0 && rect.left < window.innerWidth && rect.top < window.innerHeight;
  }

  function scoreCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const className = canvas.className || "";
    const targetRatio = 800 / 267;
    const ratio = rect.width / rect.height;
    const ratioPenalty = Math.abs(ratio - targetRatio);

    let score = rect.width * rect.height;
    if (className.includes("drawing-canvas")) {
      score += 600000;
    }
    if (Math.abs(rect.width - 800) < 40 && Math.abs(rect.height - 267) < 30) {
      score += 250000;
    }
    score -= ratioPenalty * 50000;
    return score;
  }

  function detectBestCanvas() {
    const preferred = Array.from(document.querySelectorAll("canvas.drawing-canvas")).filter(isCanvasVisible);
    if (preferred.length > 0) {
      preferred.sort((a, b) => scoreCanvas(b) - scoreCanvas(a));
      return preferred[0];
    }

    const candidates = Array.from(document.querySelectorAll("canvas")).filter(isCanvasVisible);
    if (candidates.length === 0) {
      return null;
    }

    candidates.sort((a, b) => scoreCanvas(b) - scoreCanvas(a));
    return candidates[0];
  }

  function resolveCanvasForRect(viewRect) {
    const canvases = Array.from(document.querySelectorAll("canvas")).filter(isCanvasVisible);
    let best = null;
    let bestArea = 0;

    canvases.forEach((canvas) => {
      const r = canvas.getBoundingClientRect();
      const left = Math.max(r.left, viewRect.left);
      const top = Math.max(r.top, viewRect.top);
      const right = Math.min(r.right, viewRect.right);
      const bottom = Math.min(r.bottom, viewRect.bottom);
      const area = Math.max(0, right - left) * Math.max(0, bottom - top);
      if (area > bestArea) {
        bestArea = area;
        best = canvas;
      }
    });

    return bestArea > 0 ? best : null;
  }

  function getCanvasMeta(canvas) {
    if (!(canvas instanceof HTMLCanvasElement)) {
      return null;
    }
    const rect = canvas.getBoundingClientRect();
    return {
      width: canvas.width,
      height: canvas.height,
      cssWidth: rect.width,
      cssHeight: rect.height
    };
  }

  function round2(value) {
    return Math.round(value * 100) / 100;
  }

  function showToast(text) {
    let toast = document.getElementById("itd-redraw-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "itd-redraw-toast";
      document.documentElement.appendChild(toast);
    }

    toast.textContent = text;
    toast.dataset.show = "1";

    if (state.toastTimer) {
      clearTimeout(state.toastTimer);
    }
    state.toastTimer = setTimeout(() => {
      toast.dataset.show = "0";
      state.toastTimer = null;
    }, 2200);
  }

  function isEditableTarget(node) {
    if (!(node instanceof Element)) {
      return false;
    }
    if (node.closest("input, textarea, [contenteditable]")) {
      return true;
    }
    return false;
  }

  function isElementVisible(element) {
    if (!(element instanceof Element)) {
      return false;
    }
    const rect = element.getBoundingClientRect();
    if (rect.width < 6 || rect.height < 6) {
      return false;
    }
    const style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) < 0.05) {
      return false;
    }
    return rect.bottom > 0 && rect.right > 0 && rect.left < window.innerWidth && rect.top < window.innerHeight;
  }

  function getComposerHintText(element) {
    if (!(element instanceof Element)) {
      return "";
    }
    const parts = [
      element.getAttribute("placeholder"),
      element.getAttribute("aria-label"),
      element.getAttribute("data-placeholder"),
      element.getAttribute("name"),
      element.getAttribute("id"),
      typeof element.className === "string" ? element.className : ""
    ].filter((value) => typeof value === "string" && value.trim().length > 0);
    return parts.join(" ").toLowerCase();
  }

  function scoreComposerCandidate(element) {
    if (!(element instanceof Element)) {
      return -1;
    }

    let score = 0;
    const hints = getComposerHintText(element);
    const text = (element.textContent || "").toLowerCase();
    const rect = element.getBoundingClientRect();

    if (element instanceof HTMLTextAreaElement) {
      score += 6;
    }
    if (element instanceof HTMLInputElement) {
      score += element.type === "text" ? 2 : -2;
    }
    if (element instanceof HTMLElement && element.isContentEditable) {
      score += 8;
    }
    if (element.matches("[role='textbox']")) {
      score += 4;
    }

    if (hints.includes("что у вас нового")) {
      score += 18;
    }
    if (hints.includes("пост")) {
      score += 6;
    }
    if (hints.includes("post") || hints.includes("publish") || hints.includes("new")) {
      score += 4;
    }
    if (text.includes("что у вас нового")) {
      score += 10;
    }
    if (rect.height >= 36) {
      score += 3;
    }
    if (rect.width >= 260) {
      score += 2;
    }

    return score;
  }

  function collectComposerCandidates(root) {
    if (!(root instanceof Element || root instanceof Document)) {
      return [];
    }

    const selectors = [
      "textarea",
      "input[type='text']",
      "[contenteditable='true']",
      "[contenteditable='plaintext-only']",
      "[role='textbox']"
    ];
    const items = [];
    selectors.forEach((selector) => {
      root.querySelectorAll(selector).forEach((node) => {
        if (!(node instanceof Element)) {
          return;
        }
        if (!isElementVisible(node)) {
          return;
        }
        if (!items.includes(node)) {
          items.push(node);
        }
      });
    });
    return items;
  }

  function findExactItdComposer(includeHidden = false) {
    const selectors = [
      "textarea.wall-post-form__textarea[placeholder='Что у вас нового?']",
      "textarea.wall-post-form__textarea[aria-label='Что у вас нового?']",
      "textarea.wall-post-form__textarea[name='Что у вас нового?']",
      "textarea.wall-post-form__textarea[role='textbox'][placeholder*='Что у вас нового']",
      "textarea.wall-post-form__textarea[placeholder*='Что у вас нового']",
      "textarea.wall-post-form__textarea[placeholder*='что у вас нового']",
      ".wall-post-form__content textarea.wall-post-form__textarea",
      ".wall-post-form__content textarea[role='textbox'][placeholder*='Что у вас нового']",
      ".wall-post-form__content textarea[placeholder*='Что у вас нового']",
      "textarea[placeholder*='Что у вас нового']",
      "textarea[placeholder*='что у вас нового']",
      "textarea.wall-post-form__textarea"
    ];

    for (const selector of selectors) {
      const nodes = Array.from(document.querySelectorAll(selector));
      for (const node of nodes) {
        if (!(node instanceof Element)) {
          continue;
        }
        if (!includeHidden && !isElementVisible(node)) {
          continue;
        }
        return node;
      }
    }

    return null;
  }

  function findPostComposer() {
    const exactVisible = findExactItdComposer(false);
    if (exactVisible) {
      return exactVisible;
    }

    const publishButtons = Array.from(document.querySelectorAll("button, [role='button'], a")).filter((node) => {
      if (!(node instanceof Element) || !isElementVisible(node)) {
        return false;
      }
      const text = (node.textContent || "").trim().toLowerCase();
      return text.includes("опубликовать") || text.includes("publish");
    });

    const scopedCandidates = [];
    publishButtons.forEach((button) => {
      const scope = button.closest("form, section, article, div");
      if (!scope) {
        return;
      }
      collectComposerCandidates(scope).forEach((candidate) => {
        if (!scopedCandidates.includes(candidate)) {
          scopedCandidates.push(candidate);
        }
      });
    });

    const candidates = scopedCandidates.length > 0 ? scopedCandidates : collectComposerCandidates(document);
    if (candidates.length === 0) {
      return findExactItdComposer(true);
    }

    candidates.sort((a, b) => scoreComposerCandidate(b) - scoreComposerCandidate(a));
    return candidates[0] || null;
  }

  function resolveEditableComposerTarget(candidate) {
    if (!candidate) {
      return null;
    }
    if (candidate instanceof HTMLTextAreaElement || candidate instanceof HTMLInputElement) {
      return candidate;
    }
    if (candidate instanceof HTMLElement && candidate.isContentEditable) {
      return candidate;
    }
    if (candidate instanceof Element) {
      const nested = candidate.querySelector("[contenteditable='true'], [contenteditable='plaintext-only']");
      if (nested instanceof HTMLElement && nested.isContentEditable) {
        return nested;
      }
    }
    return null;
  }

  function dispatchComposerInputEvents(target, text) {
    const base = { bubbles: true, cancelable: false, composed: true };
    try {
      target.dispatchEvent(new InputEvent("input", { ...base, inputType: "insertText", data: text }));
    } catch (err) {
      target.dispatchEvent(new Event("input", base));
    }
    target.dispatchEvent(new Event("change", base));
  }

  function setInputLikeValue(target, text) {
    const prototype = target instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
    if (descriptor && descriptor.set) {
      descriptor.set.call(target, text);
    } else {
      target.value = text;
    }
    dispatchComposerInputEvents(target, text);
  }

  function setContentEditableValue(target, text) {
    target.focus();
    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      range.selectNodeContents(target);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    let applied = false;
    if (typeof document.execCommand === "function") {
      try {
        applied = document.execCommand("insertText", false, text);
      } catch (err) {
        applied = false;
      }
    }
    if (!applied) {
      target.textContent = text;
    }

    dispatchComposerInputEvents(target, text);
  }

  function openComposerHint() {
    const hintNodes = Array.from(document.querySelectorAll("div, span, p")).filter((node) => {
      if (!(node instanceof Element) || !isElementVisible(node)) {
        return false;
      }
      const text = (node.textContent || "").trim().toLowerCase();
      return text === "что у вас нового?" || text === "что у вас нового";
    });

    if (hintNodes.length === 0) {
      return false;
    }

    const node = hintNodes[0];
    node.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: window }));
    node.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window }));
    node.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
    return true;
  }

  function insertTextToPostComposer(text) {
    if (typeof text !== "string" || text.trim().length === 0) {
      return { ok: false, message: "Текст для вставки пустой." };
    }

    let candidate = findPostComposer();
    if (!candidate && openComposerHint()) {
      candidate = findPostComposer();
    }
    if (!candidate) {
      return { ok: false, message: "Не найдено поле поста. Откройте вкладку 'Посты' и фокус на строке 'Что у вас нового?'." };
    }

    const target = resolveEditableComposerTarget(candidate);
    if (!target) {
      return { ok: false, message: "Поле найдено, но оно не поддерживает вставку." };
    }

    const finalText = text.trim();
    if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) {
      target.focus();
      setInputLikeValue(target, finalText);
    } else {
      setContentEditableValue(target, finalText);
    }

    try {
      target.scrollIntoView({ block: "center", inline: "nearest" });
    } catch (err) {}

    return { ok: true, message: "Текст вставлен в поле поста." };
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Не удалось прочитать файл из буфера."));
      reader.readAsDataURL(file);
    });
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Не удалось прочитать blob."));
      reader.readAsDataURL(blob);
    });
  }

  function looksLikeMediaUrl(text) {
    if (typeof text !== "string" || text.length < 8) {
      return false;
    }
    const trimmed = text.trim();
    if (!/^https?:\/\//i.test(trimmed)) {
      return false;
    }
    return /\.(gif|png|jpe?g|webp|bmp|mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(trimmed);
  }

  async function fetchMediaUrlToDataUrl(url) {
    const response = await fetch(url, { credentials: "omit" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const blob = await response.blob();
    if (!(blob.type.startsWith("image/") || blob.type.startsWith("video/"))) {
      throw new Error("URL не содержит изображение или видео.");
    }
    return blobToDataUrl(blob);
  }

  function getPrimaryImage() {
    return state.images.length > 0 ? state.images[0] : null;
  }

  function getGifCount() {
    return state.images.reduce((sum, image) => sum + (image.isGif ? 1 : 0), 0);
  }

  function getVideoCount() {
    return state.images.reduce((sum, image) => sum + (image.isVideo ? 1 : 0), 0);
  }

  function parseMimeFromDataUrl(dataUrl) {
    if (typeof dataUrl !== "string") {
      return "";
    }
    const m = dataUrl.match(/^data:([^;,]+)[;,]/i);
    return m ? m[1].toLowerCase() : "";
  }

  function isVideoMime(mime) {
    return typeof mime === "string" && mime.startsWith("video/");
  }

  function getDrawSource(image) {
    return image.bitmap || image.element;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function hasVisiblePixels(ctx, width, height) {
    const samples = 12;
    const stepX = Math.max(1, Math.floor(width / samples));
    const stepY = Math.max(1, Math.floor(height / samples));
    const data = ctx.getImageData(0, 0, width, height).data;

    for (let y = 0; y < height; y += stepY) {
      for (let x = 0; x < width; x += stepX) {
        const idx = (y * width + x) * 4;
        const a = data[idx + 3];
        if (a > 0) {
          return true;
        }
      }
    }
    return false;
  }

  async function captureGifFrameCanvas(image) {
    if (!image.isGif) {
      return null;
    }
    if (image.frameCanvas) {
      return image.frameCanvas;
    }

    const width = Math.max(1, image.width);
    const height = Math.max(1, image.height);
    const frameCanvas = document.createElement("canvas");
    frameCanvas.width = width;
    frameCanvas.height = height;
    const frameCtx = frameCanvas.getContext("2d", { willReadFrequently: true });
    if (!frameCtx) {
      return null;
    }

    let captured = false;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      frameCtx.clearRect(0, 0, width, height);
      frameCtx.drawImage(image.element, 0, 0, width, height);
      try {
        if (hasVisiblePixels(frameCtx, width, height)) {
          captured = true;
          break;
        }
      } catch (err) {
        captured = true;
        break;
      }
      await sleep(90);
    }

    if (!captured) {
      frameCtx.clearRect(0, 0, width, height);
      frameCtx.drawImage(image.element, 0, 0, width, height);
    }

    image.frameCanvas = frameCanvas;
    return frameCanvas;
  }

  async function getRenderableSource(image) {
    if (image.isGif) {
      const gifCanvas = await captureGifFrameCanvas(image);
      if (gifCanvas) {
        return gifCanvas;
      }
    }
    return getDrawSource(image);
  }

  function releaseImages(images) {
    images.forEach((image) => {
      if (image.isVideo && image.element) {
        try {
          image.element.pause();
          image.element.removeAttribute("src");
          image.element.load();
        } catch (err) {}
      }
      if (image.bitmap && typeof image.bitmap.close === "function") {
        image.bitmap.close();
      }
      if (image.frameCanvas) {
        image.frameCanvas.width = 1;
        image.frameCanvas.height = 1;
        image.frameCanvas = null;
      }
      image.element = null;
    });
  }

  function persistSettings() {
    chrome.storage.local.set({ [SETTINGS_KEY]: state.settings }, () => {});
  }

  function hasVisibleDrawingCanvas() {
    return Array.from(document.querySelectorAll("canvas.drawing-canvas")).some(isCanvasVisible);
  }

  function isPointInRect(x, y, rect) {
    if (!rect) {
      return false;
    }
    return x >= rect.left && x <= rect.left + rect.width && y >= rect.top && y <= rect.top + rect.height;
  }

  function canStartPreviewDrag(event) {
    if (event.button !== 0) {
      return false;
    }
    if (!state.target || !getPrimaryImage()) {
      return false;
    }
    return isPointInRect(event.clientX, event.clientY, state.drag.previewBox);
  }

  function clearTarget() {
    endPreviewDrag();
    state.target = null;
    state.targetCanvas = null;
    state.drag.previewBox = null;
    if (state.ui?.target) {
      state.ui.target.style.display = "none";
    }
  }

  function beginPreviewDrag(event) {
    if (!canStartPreviewDrag(event)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    state.drag.active = true;
    state.drag.startX = event.clientX;
    state.drag.startY = event.clientY;
    state.drag.baseOffsetX = state.settings.offsetX;
    state.drag.baseOffsetY = state.settings.offsetY;

    if (state.ui?.image) {
      state.ui.image.dataset.dragging = "1";
    }
    document.documentElement.style.cursor = "grabbing";
  }

  function updatePreviewDrag(event) {
    if (!state.drag.active) {
      return;
    }

    event.preventDefault();
    const dx = event.clientX - state.drag.startX;
    const dy = event.clientY - state.drag.startY;
    state.settings.offsetX = clamp(state.drag.baseOffsetX + dx, -2000, 2000);
    state.settings.offsetY = clamp(state.drag.baseOffsetY + dy, -2000, 2000);
    renderPreview();
  }

  function endPreviewDrag() {
    if (!state.drag.active) {
      return;
    }
    state.drag.active = false;
    if (state.ui?.image) {
      delete state.ui.image.dataset.dragging;
    }
    document.documentElement.style.cursor = "";
    persistSettings();
  }

  function handlePreviewPointerDown(event) {
    if (state.selection) {
      return;
    }
    beginPreviewDrag(event);
  }

  function ensureOverlay() {
    if (state.ui?.overlay?.isConnected) {
      return state.ui;
    }

    const overlay = document.createElement("div");
    overlay.id = "itd-redraw-overlay";

    const target = document.createElement("div");
    target.id = "itd-redraw-target";

    const clip = document.createElement("div");
    clip.id = "itd-redraw-clip";

    const image = document.createElement("div");
    image.id = "itd-redraw-image";
    image.addEventListener("mousedown", beginPreviewDrag);

    const badge = document.createElement("div");
    badge.id = "itd-redraw-badge";

    clip.appendChild(image);
    target.appendChild(clip);
    target.appendChild(badge);
    overlay.appendChild(target);
    document.documentElement.appendChild(overlay);

    state.ui = { overlay, target, clip, image, badge };
    return state.ui;
  }

  function getViewportTargetRect() {
    if (!state.target) {
      return null;
    }

    if (state.target.boundToCanvas) {
      if (!state.targetCanvas || !state.targetCanvas.isConnected || !isCanvasVisible(state.targetCanvas)) {
        endPreviewDrag();
        clearTarget();
        return null;
      }
      const rect = state.targetCanvas.getBoundingClientRect();
      state.target.pageLeft = rect.left + window.scrollX;
      state.target.pageTop = rect.top + window.scrollY;
      state.target.width = rect.width;
      state.target.height = rect.height;
    }

    if (state.target.width < 2 || state.target.height < 2) {
      clearTarget();
      return null;
    }

    return {
      left: state.target.pageLeft - window.scrollX,
      top: state.target.pageTop - window.scrollY,
      width: state.target.width,
      height: state.target.height
    };
  }

  function setTargetFromViewportRect(viewRect, source, canvasHint) {
    if (!viewRect || viewRect.width < 2 || viewRect.height < 2) {
      return;
    }
    const resolvedCanvas = canvasHint || resolveCanvasForRect(viewRect) || null;
    state.target = {
      pageLeft: viewRect.left + window.scrollX,
      pageTop: viewRect.top + window.scrollY,
      width: viewRect.width,
      height: viewRect.height,
      source,
      boundToCanvas: Boolean(source === "canvas" || resolvedCanvas)
    };
    state.targetCanvas = resolvedCanvas;
    renderPreview();
  }

  function computeFitBox(containerWidth, containerHeight, imageWidth, imageHeight, settings, scaleX, scaleY) {
    const mode = settings.fitMode;
    let baseWidth = containerWidth;
    let baseHeight = containerHeight;

    if (mode !== "stretch") {
      const ratioX = containerWidth / imageWidth;
      const ratioY = containerHeight / imageHeight;
      const ratio = mode === "contain" ? Math.min(ratioX, ratioY) : Math.max(ratioX, ratioY);
      baseWidth = imageWidth * ratio;
      baseHeight = imageHeight * ratio;
    }

    const userScale = settings.scale / 100;
    const drawWidth = baseWidth * userScale;
    const drawHeight = baseHeight * userScale;
    const offsetX = settings.offsetX * scaleX;
    const offsetY = settings.offsetY * scaleY;

    return {
      x: (containerWidth - drawWidth) / 2 + offsetX,
      y: (containerHeight - drawHeight) / 2 + offsetY,
      width: drawWidth,
      height: drawHeight
    };
  }

  function renderPreview() {
    const ui = ensureOverlay();
    const targetRect = getViewportTargetRect();

    if (!targetRect) {
      endPreviewDrag();
      state.drag.previewBox = null;
      ui.target.style.display = "none";
      return;
    }

    ui.target.style.display = "block";
    ui.target.style.left = `${targetRect.left}px`;
    ui.target.style.top = `${targetRect.top}px`;
    ui.target.style.width = `${targetRect.width}px`;
    ui.target.style.height = `${targetRect.height}px`;

    ui.clip.style.left = "0";
    ui.clip.style.top = "0";
    ui.clip.style.width = `${targetRect.width}px`;
    ui.clip.style.height = `${targetRect.height}px`;

    const previewImage = getPrimaryImage();
    if (!previewImage) {
      ui.image.style.display = "none";
      ui.image.style.pointerEvents = "none";
      state.drag.previewBox = null;
      const canvasMeta = getCanvasMeta(state.targetCanvas);
      if (canvasMeta) {
        ui.badge.textContent = `Область ${Math.round(targetRect.width)}x${Math.round(targetRect.height)} CSS | canvas ${canvasMeta.width}x${canvasMeta.height}px`;
      } else {
        ui.badge.textContent = `Область ${Math.round(targetRect.width)}x${Math.round(targetRect.height)} | Загрузите изображение`;
      }
      return;
    }

    const box = computeFitBox(
      targetRect.width,
      targetRect.height,
      previewImage.width,
      previewImage.height,
      state.settings,
      1,
      1
    );

    ui.image.style.display = "block";
    ui.image.style.pointerEvents = "auto";
    ui.image.style.left = `${box.x}px`;
    ui.image.style.top = `${box.y}px`;
    ui.image.style.width = `${box.width}px`;
    ui.image.style.height = `${box.height}px`;
    ui.image.style.opacity = `${state.settings.opacity / 100}`;
    const previewSource = previewImage.previewSrc || previewImage.src;
    ui.image.style.backgroundImage = previewSource ? `url("${previewSource}")` : "none";
    ui.image.style.imageRendering = state.settings.resampleMode === "pixel" ? "pixelated" : "auto";
    state.drag.previewBox = {
      left: targetRect.left + box.x,
      top: targetRect.top + box.y,
      width: box.width,
      height: box.height
    };

    const sourceLabel = state.target.source === "canvas" ? "canvas" : "manual";
    const canvasMeta = getCanvasMeta(state.targetCanvas);
    if (canvasMeta) {
      const scaleX = round2(canvasMeta.width / targetRect.width);
      const scaleY = round2(canvasMeta.height / targetRect.height);
      const imagesLabel = state.images.length > 1 ? ` | images ${state.images.length}` : "";
      ui.badge.textContent = `${state.settings.fitMode}/${state.settings.resampleMode} | src ${previewImage.width}x${previewImage.height} | canvas ${canvasMeta.width}x${canvasMeta.height} | px-scale ${scaleX}x${scaleY}${imagesLabel}`;
    } else {
      ui.badge.textContent = `Режим ${state.settings.fitMode}/${state.settings.resampleMode} | Область ${Math.round(targetRect.width)}x${Math.round(targetRect.height)} | ${sourceLabel}`;
    }
  }

  function watchTargetLifecycle() {
    if (!state.target) {
      return;
    }

    const hasDrawingCanvas = hasVisibleDrawingCanvas();
    if (!hasDrawingCanvas && state.target.source !== "manual") {
      clearTarget();
      renderPreview();
      return;
    }

    if (state.target.boundToCanvas && (!state.targetCanvas || !state.targetCanvas.isConnected || !isCanvasVisible(state.targetCanvas))) {
      clearTarget();
      renderPreview();
      return;
    }

    if (!hasDrawingCanvas && state.target.source === "manual") {
      clearTarget();
      renderPreview();
    }
  }

  function destroySelectionOverlay() {
    if (!state.selection) {
      return;
    }
    window.removeEventListener("keydown", state.selection.onKeyDown, true);
    state.selection.overlay.remove();
    state.selection = null;
  }

  function startSelectionMode() {
    destroySelectionOverlay();

    const overlay = document.createElement("div");
    overlay.id = "itd-redraw-select-overlay";

    const box = document.createElement("div");
    box.id = "itd-redraw-select-box";
    box.style.display = "none";
    overlay.appendChild(box);

    document.documentElement.appendChild(overlay);

    let dragging = false;
    let startX = 0;
    let startY = 0;
    let currentRect = null;

    function paintRect(x1, y1, x2, y2) {
      const left = Math.min(x1, x2);
      const top = Math.min(y1, y2);
      const width = Math.abs(x2 - x1);
      const height = Math.abs(y2 - y1);
      currentRect = { left, top, width, height, right: left + width, bottom: top + height };

      box.style.display = "block";
      box.style.left = `${left}px`;
      box.style.top = `${top}px`;
      box.style.width = `${width}px`;
      box.style.height = `${height}px`;
    }

    function finishSelection(applyRect) {
      destroySelectionOverlay();
      if (!applyRect || applyRect.width < 4 || applyRect.height < 4) {
        return;
      }
      const canvas = resolveCanvasForRect(applyRect);
      setTargetFromViewportRect(applyRect, "manual", canvas);
    }

    overlay.addEventListener("mousedown", (event) => {
      if (event.button !== 0) {
        return;
      }
      event.preventDefault();
      dragging = true;
      startX = event.clientX;
      startY = event.clientY;
      paintRect(startX, startY, startX, startY);
    });

    overlay.addEventListener("mousemove", (event) => {
      if (!dragging) {
        return;
      }
      event.preventDefault();
      paintRect(startX, startY, event.clientX, event.clientY);
    });

    overlay.addEventListener("mouseup", (event) => {
      if (!dragging) {
        return;
      }
      event.preventDefault();
      dragging = false;
      paintRect(startX, startY, event.clientX, event.clientY);
      finishSelection(currentRect);
    });

    overlay.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      destroySelectionOverlay();
    });

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        destroySelectionOverlay();
      }
    };
    window.addEventListener("keydown", onKeyDown, true);

    state.selection = {
      overlay,
      onKeyDown
    };
  }

  function loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = async () => {
        const mime = parseMimeFromDataUrl(dataUrl);
        const isGif = mime === "image/gif";

        resolve({
          src: dataUrl,
          width: img.naturalWidth,
          height: img.naturalHeight,
          element: img,
          bitmap: null,
          frameCanvas: null,
          mime,
          isGif,
          isVideo: false,
          previewSrc: null
        });
      };
      img.onerror = () => reject(new Error("Невозможно прочитать изображение."));
      img.src = dataUrl;
    });
  }

  function loadVideo(dataUrl) {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "auto";
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.crossOrigin = "anonymous";

      const cleanup = () => {
        video.removeEventListener("loadeddata", onLoadedData);
        video.removeEventListener("error", onError);
      };

      const onLoadedData = () => {
        cleanup();
        const width = Math.max(1, video.videoWidth || 1);
        const height = Math.max(1, video.videoHeight || 1);
        let previewSrc = null;
        try {
          const c = document.createElement("canvas");
          c.width = width;
          c.height = height;
          const cctx = c.getContext("2d");
          if (cctx) {
            cctx.drawImage(video, 0, 0, width, height);
            previewSrc = c.toDataURL("image/png");
          }
        } catch (err) {
          previewSrc = null;
        }

        resolve({
          src: dataUrl,
          width,
          height,
          element: video,
          bitmap: null,
          frameCanvas: null,
          mime: "video/*",
          isGif: false,
          isVideo: true,
          previewSrc
        });
      };

      const onError = () => {
        cleanup();
        reject(new Error("Невозможно прочитать видео."));
      };

      video.addEventListener("loadeddata", onLoadedData, { once: true });
      video.addEventListener("error", onError, { once: true });
      video.src = dataUrl;
      video.load();
    });
  }

  async function handleImageDataUrls(dataUrls, triggerApply) {
    const safeUrls = Array.isArray(dataUrls) ? dataUrls.filter((u) => typeof u === "string" && u.length > 0) : [];
    if (safeUrls.length === 0) {
      return { ok: false, message: "Не переданы данные изображений." };
    }

    const images = await Promise.all(
      safeUrls.map((url) => {
        const mime = parseMimeFromDataUrl(url);
        if (isVideoMime(mime)) {
          return loadVideo(url);
        }
        return loadImage(url);
      })
    );
    stopVideoLoop();
    if (state.images.length > 0) {
      releaseImages(state.images);
    }
    state.images = images;

    if (!state.target) {
      const canvas = detectBestCanvas();
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        setTargetFromViewportRect(
          {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height
          },
          "canvas",
          canvas
        );
      }
    }

    renderPreview();

    if (triggerApply && state.settings.autoPasteApply) {
      const result = await applyToCanvas();
      showToast(result.ok ? result.message : `Ctrl+V: ${result.message}`);
      return result;
    }

    const first = images[0];
    const label = images.length > 1 ? `${images.length} изображений` : `${first.width}x${first.height}px`;
    const gifsCount = images.reduce((sum, image) => sum + (image.isGif ? 1 : 0), 0);
    const videosCount = images.reduce((sum, image) => sum + (image.isVideo ? 1 : 0), 0);
    showToast(`Ctrl+V: вставлено ${label}`);
    return {
      ok: true,
      message: images.length > 1 ? `Загружено ${images.length} файлов.` : "Файл загружен.",
      image: { width: first.width, height: first.height },
      firstImage: { width: first.width, height: first.height },
      imagesCount: images.length,
      gifsCount,
      videosCount
    };
  }

  function computeCanvasRegion(canvas, targetRect) {
    if (!(canvas instanceof HTMLCanvasElement)) {
      return null;
    }
    const canvasRect = canvas.getBoundingClientRect();
    if (canvasRect.width < 2 || canvasRect.height < 2) {
      return null;
    }

    const scaleX = canvas.width / canvasRect.width;
    const scaleY = canvas.height / canvasRect.height;

    const x = (targetRect.left - canvasRect.left) * scaleX;
    const y = (targetRect.top - canvasRect.top) * scaleY;
    const width = targetRect.width * scaleX;
    const height = targetRect.height * scaleY;

    const clipLeft = clamp(x, 0, canvas.width);
    const clipTop = clamp(y, 0, canvas.height);
    const clipRight = clamp(x + width, 0, canvas.width);
    const clipBottom = clamp(y + height, 0, canvas.height);
    const clipWidth = clipRight - clipLeft;
    const clipHeight = clipBottom - clipTop;

    return {
      scaleX,
      scaleY,
      x: clipLeft,
      y: clipTop,
      width: clipWidth,
      height: clipHeight
    };
  }

  function stopVideoLoop() {
    if (!state.loopJob) {
      return;
    }
    if (state.loopJob.rafId) {
      cancelAnimationFrame(state.loopJob.rafId);
    }
    state.loopJob = null;
  }

  async function startVideoLoop(canvas, region) {
    stopVideoLoop();

    const videos = state.images.filter((item) => item.isVideo);
    if (videos.length === 0 || !state.settings.videoLoop) {
      return { ok: true, started: false };
    }

    for (const videoItem of videos) {
      try {
        videoItem.element.currentTime = 0;
      } catch (err) {}
      try {
        await videoItem.element.play();
      } catch (err) {}
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return { ok: false, started: false, message: "Нет контекста canvas для video loop." };
    }

    const frameDelay = 1000 / Math.max(1, state.settings.videoFps || 24);
    const smooth = state.settings.resampleMode === "smooth";
    let lastDraw = 0;
    let rafId = 0;

    const drawFrame = async (ts) => {
      if (!state.loopJob) {
        return;
      }
      if (ts - lastDraw < frameDelay) {
        rafId = requestAnimationFrame(drawFrame);
        state.loopJob.rafId = rafId;
        return;
      }
      lastDraw = ts;

      ctx.save();
      ctx.beginPath();
      ctx.rect(region.x, region.y, region.width, region.height);
      ctx.clip();
      ctx.clearRect(region.x, region.y, region.width, region.height);
      ctx.globalAlpha = state.settings.opacity / 100;
      ctx.imageSmoothingEnabled = smooth;
      ctx.imageSmoothingQuality = smooth ? "high" : "low";

      for (const item of state.images) {
        const fit = computeFitBox(
          region.width,
          region.height,
          item.width,
          item.height,
          state.settings,
          region.scaleX,
          region.scaleY
        );
        const drawSource = item.isVideo ? item.element : await getRenderableSource(item);
        ctx.drawImage(
          drawSource,
          region.x + fit.x,
          region.y + fit.y,
          fit.width,
          fit.height
        );
      }
      ctx.restore();

      rafId = requestAnimationFrame(drawFrame);
      state.loopJob.rafId = rafId;
    };

    state.loopJob = {
      canvas,
      region,
      rafId: requestAnimationFrame(drawFrame)
    };
    return { ok: true, started: true };
  }

  async function applyToCanvas() {
    if (state.images.length === 0) {
      return { ok: false, message: "Сначала загрузите изображение(я)." };
    }

    const targetRect = getViewportTargetRect();
    if (!targetRect) {
      return { ok: false, message: "Сначала выберите область или найдите canvas." };
    }

    let canvas = state.targetCanvas;
    if (!canvas || !canvas.isConnected) {
      canvas = resolveCanvasForRect(targetRect) || detectBestCanvas();
      state.targetCanvas = canvas || null;
    }
    if (!canvas) {
      return { ok: false, message: "Canvas не найден. Откройте окно рисования." };
    }

    const region = computeCanvasRegion(canvas, targetRect);
    if (!region || region.width < 1 || region.height < 1) {
      return { ok: false, message: "Выбранная область не попадает в canvas." };
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return { ok: false, message: "Не удалось получить контекст canvas." };
    }

    const smooth = state.settings.resampleMode === "smooth";
    stopVideoLoop();

    ctx.save();
    ctx.beginPath();
    ctx.rect(region.x, region.y, region.width, region.height);
    ctx.clip();
    ctx.globalAlpha = state.settings.opacity / 100;
    ctx.imageSmoothingEnabled = smooth;
    ctx.imageSmoothingQuality = smooth ? "high" : "low";
    for (const image of state.images) {
      const fit = computeFitBox(
        region.width,
        region.height,
        image.width,
        image.height,
        state.settings,
        region.scaleX,
        region.scaleY
      );
      const drawSource = await getRenderableSource(image);
      ctx.drawImage(
        drawSource,
        region.x + fit.x,
        region.y + fit.y,
        fit.width,
        fit.height
      );
    }
    ctx.restore();

    let loopStarted = false;
    const videoCount = getVideoCount();
    if (videoCount > 0 && state.settings.videoLoop) {
      const loopResult = await startVideoLoop(canvas, region);
      loopStarted = Boolean(loopResult.ok && loopResult.started);
    }

    return {
      ok: true,
      message: `Готово: ${state.images.length} файлов, canvas ${canvas.width}x${canvas.height}px, область ${Math.round(region.width)}x${Math.round(region.height)}px, режим ${state.settings.resampleMode}.`,
      region: {
        width: region.width,
        height: region.height
      }
    };
  }

  async function exportPng() {
    if (state.images.length === 0) {
      return { ok: false, message: "Сначала загрузите изображение(я)." };
    }

    const targetRect = getViewportTargetRect();
    if (!targetRect) {
      return { ok: false, message: "Нет выбранной области." };
    }

    let scaleX = 1;
    let scaleY = 1;
    let outWidth = Math.max(1, Math.round(targetRect.width));
    let outHeight = Math.max(1, Math.round(targetRect.height));

    if (state.targetCanvas && state.targetCanvas.isConnected) {
      const region = computeCanvasRegion(state.targetCanvas, targetRect);
      if (region && region.width > 0 && region.height > 0) {
        scaleX = region.scaleX;
        scaleY = region.scaleY;
        outWidth = Math.max(1, Math.round(region.width));
        outHeight = Math.max(1, Math.round(region.height));
      }
    }

    const outCanvas = document.createElement("canvas");
    outCanvas.width = outWidth;
    outCanvas.height = outHeight;
    const outCtx = outCanvas.getContext("2d");
    if (!outCtx) {
      return { ok: false, message: "Не удалось создать PNG." };
    }

    const smooth = state.settings.resampleMode === "smooth";

    outCtx.save();
    outCtx.beginPath();
    outCtx.rect(0, 0, outWidth, outHeight);
    outCtx.clip();
    outCtx.globalAlpha = state.settings.opacity / 100;
    outCtx.imageSmoothingEnabled = smooth;
    outCtx.imageSmoothingQuality = smooth ? "high" : "low";
    for (const image of state.images) {
      const fit = computeFitBox(
        outWidth,
        outHeight,
        image.width,
        image.height,
        state.settings,
        scaleX,
        scaleY
      );
      const drawSource = await getRenderableSource(image);
      outCtx.drawImage(drawSource, fit.x, fit.y, fit.width, fit.height);
    }
    outCtx.restore();

    const dataUrl = outCanvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `itd-banner-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    return { ok: true, message: `PNG сохранен: ${outWidth}x${outHeight}.` };
  }

  async function exportGif() {
    if (state.images.length === 0) {
      return { ok: false, message: "Сначала загрузите изображение(я)." };
    }

    // Проверить есть ли GIF среди загруженных изображений
    const gifImage = state.images.find(img => img.isGif);
    
    if (!gifImage) {
      return { ok: false, message: "Загрузите GIF файл для экспорта в GIF формате. Для статичных изображений используйте 'Экспорт PNG'." };
    }

    // Конвертировать GIF в Blob
    try {
      let gifBlob;
      
      if (gifImage.src.startsWith('data:')) {
        // Если это data URL - конвертировать в Blob
        const response = await fetch(gifImage.src);
        gifBlob = await response.blob();
      } else {
        // Если это URL - попробовать скачать
        try {
          const response = await fetch(gifImage.src, { mode: 'no-cors' });
          gifBlob = await response.blob();
        } catch (corsError) {
          console.warn('[ITD GIF] CORS error, using element as source:', corsError);
          // Если CORS блокирует - использовать element напрямую
          // Создать canvas и отрисовать GIF
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = gifImage.width;
          tempCanvas.height = gifImage.height;
          const tempCtx = tempCanvas.getContext('2d');
          
          try {
            tempCtx.drawImage(gifImage.element, 0, 0);
            // Конвертировать в PNG (т.к. GIF недоступен из-за CORS)
            gifBlob = await new Promise(resolve => tempCanvas.toBlob(resolve, 'image/png'));
            showToast("⚠️ CORS блокирует GIF. Будет сохранён как PNG.");
          } catch (drawError) {
            return { ok: false, message: `CORS блокирует доступ к GIF. Загрузите файл напрямую (не по URL).` };
          }
        }
      }
      
      // Сохранить GIF Blob для перехвата
      window.__itdForceGifUpload = true;
      window.__itdGifBlob = gifBlob;
      
      showToast("Режим GIF активирован. Применяю на canvas...");
      
      // Сначала применить изображение на canvas
      const applyResult = await applyToCanvas();
      if (!applyResult.ok) {
        window.__itdForceGifUpload = false;
        window.__itdGifBlob = null;
        return { ok: false, message: `Не удалось применить на canvas: ${applyResult.message}` };
      }
      
      showToast("Изображение применено. Ищу кнопку 'Сохранить'...");
      
      // Подождать немного чтобы canvas обновился
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Найти и нажать кнопку "Сохранить" на сайте
      const saveButtonSelectors = [
        'button.drawing-btn.drawing-btn--save:not([disabled])',
        'button.drawing-btn--save:not([disabled])',
        'button[class*="drawing-btn"][class*="save"]:not([disabled])'
      ];
      
      let saveButton = null;
      for (const selector of saveButtonSelectors) {
        try {
          saveButton = document.querySelector(selector);
          if (saveButton) break;
        } catch (e) {
          // Игнорировать ошибки селектора
        }
      }
      
      // Если не нашли по селектору - искать по тексту (не disabled)
      if (!saveButton) {
        const buttons = Array.from(document.querySelectorAll('button:not([disabled])'));
        saveButton = buttons.find(btn => {
          const text = btn.textContent.toLowerCase();
          return text.includes('сохранить') || text.includes('save');
        });
      }
      
      if (saveButton) {
        console.log('[ITD GIF] Found save button, clicking...', saveButton);
        showToast("Кнопка 'Сохранить' найдена! Нажимаю...");
        
        // Нажать кнопку
        saveButton.click();
        
        setTimeout(() => {
          showToast("GIF отправляется на сервер...");
        }, 500);
      } else {
        console.warn('[ITD GIF] Save button not found or disabled');
        showToast("Кнопка 'Сохранить' не найдена или неактивна. Нажмите её вручную.");
      }
      
      return { ok: true, message: `Режим GIF активирован (${Math.round(gifBlob.size / 1024)}KB). Автоматическое сохранение...` };
    } catch (err) {
      console.error('[ITD GIF] Error preparing GIF:', err);
      window.__itdForceGifUpload = false;
      window.__itdGifBlob = null;
      return { ok: false, message: `Ошибка подготовки GIF: ${err.message}` };
    }
  }

  // Перехватчик canvas.toBlob для подмены PNG на GIF
  const originalToBlob = HTMLCanvasElement.prototype.toBlob;
  HTMLCanvasElement.prototype.toBlob = function(callback, type, quality) {
    // Если включен режим GIF - вернуть GIF вместо PNG
    if (window.__itdForceGifUpload && window.__itdGifBlob && type === 'image/png') {
      console.log('[ITD GIF] Intercepting canvas.toBlob, returning GIF instead of PNG');
      
      const gifBlob = window.__itdGifBlob;
      
      // Сбросить флаг
      window.__itdForceGifUpload = false;
      window.__itdGifBlob = null;
      
      showToast("GIF подменён! Сохранение...");
      
      // Вернуть GIF blob
      setTimeout(() => callback(gifBlob), 0);
      return;
    }
    
    // Обычное поведение
    return originalToBlob.call(this, callback, type, quality);
  };

  // Перехватчик canvas.toDataURL для подмены PNG на GIF
  const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
  HTMLCanvasElement.prototype.toDataURL = function(type, quality) {
    // Если включен режим GIF - вернуть GIF data URL вместо PNG
    if (window.__itdForceGifUpload && window.__itdGifBlob && type === 'image/png') {
      console.log('[ITD GIF] Intercepting canvas.toDataURL, returning GIF data URL instead of PNG');
      
      showToast("GIF подменён через toDataURL!");
      
      // Конвертировать Blob в data URL
      const reader = new FileReader();
      reader.readAsDataURL(window.__itdGifBlob);
      
      // Сбросить флаг
      window.__itdForceGifUpload = false;
      const gifBlob = window.__itdGifBlob;
      window.__itdGifBlob = null;
      
      // Вернуть синхронно (это проблема - toDataURL синхронный, а FileReader асинхронный)
      // Поэтому вернём пустой data URL и надеемся что сайт использует toBlob
      return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    }
    
    // Обычное поведение
    return originalToDataURL.call(this, type, quality);
  };

  function resetAll() {
    endPreviewDrag();
    stopVideoLoop();
    if (state.images.length > 0) {
      releaseImages(state.images);
    }
    state.settings = { ...defaults };
    state.images = [];
    state.target = null;
    state.targetCanvas = null;
    destroySelectionOverlay();
    if (state.ui?.overlay?.isConnected) {
      state.ui.overlay.remove();
    }
    state.ui = null;
    const toast = document.getElementById("itd-redraw-toast");
    if (toast) {
      toast.remove();
    }
    if (state.toastTimer) {
      clearTimeout(state.toastTimer);
      state.toastTimer = null;
    }
  }

  function pingState() {
    const targetRect = getViewportTargetRect();
    const canvasMeta = getCanvasMeta(state.targetCanvas);
    const primary = getPrimaryImage();
    return {
      ok: true,
      hasImage: state.images.length > 0,
      image: primary ? { width: primary.width, height: primary.height } : null,
      imagesCount: state.images.length,
      gifsCount: getGifCount(),
      videosCount: getVideoCount(),
      target: targetRect
        ? {
            left: targetRect.left,
            top: targetRect.top,
            width: targetRect.width,
          height: targetRect.height
        }
        : null,
      source: state.target?.source || null,
      canvas: canvasMeta
    };
  }

  async function handleMessage(message) {
    if (!message || typeof message.type !== "string") {
      return { ok: false, message: "Некорректный запрос." };
    }

    if (message.type === "ITD_REDRAW_PING") {
      return pingState();
    }

    if (message.type === "ITD_REDRAW_DETECT_CANVAS") {
      const canvas = detectBestCanvas();
      if (!canvas) {
        return { ok: false, message: "Canvas не найден. Откройте окно рисования и повторите." };
      }
      const rect = canvas.getBoundingClientRect();
      setTargetFromViewportRect(
        {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height
        },
        "canvas",
        canvas
      );
      return {
        ok: true,
        message: "Canvas найден и привязан.",
        target: { width: rect.width, height: rect.height },
        canvas: {
          width: canvas.width,
          height: canvas.height
        }
      };
    }

    if (message.type === "ITD_REDRAW_SELECT_AREA") {
      startSelectionMode();
      return { ok: true, message: "Режим выделения включен." };
    }

    if (message.type === "ITD_REDRAW_SET_IMAGE") {
      const dataUrl = message.payload?.dataUrl;
      if (!dataUrl || typeof dataUrl !== "string") {
        return { ok: false, message: "Не переданы данные изображения." };
      }
      return handleImageDataUrls([dataUrl], false);
    }

    if (message.type === "ITD_REDRAW_SET_IMAGES") {
      const dataUrls = message.payload?.dataUrls;
      if (!Array.isArray(dataUrls) || dataUrls.length === 0) {
        return { ok: false, message: "Не переданы данные изображений." };
      }
      return handleImageDataUrls(dataUrls, false);
    }

    if (message.type === "ITD_REDRAW_UPDATE_SETTINGS") {
      const next = normalizeSettings(message.payload || {});
      state.settings = { ...state.settings, ...next };
      renderPreview();
      if (!state.settings.videoLoop) {
        stopVideoLoop();
      } else if (state.loopJob && getVideoCount() > 0) {
        await startVideoLoop(state.loopJob.canvas, state.loopJob.region);
      }
      return { ok: true, message: "Настройки применены." };
    }

    if (message.type === "ITD_REDRAW_INSERT_POST_TEXT") {
      const text = message.payload?.text;
      if (typeof text !== "string" || text.trim().length === 0) {
        return { ok: false, message: "Не передан текст для поста." };
      }
      return insertTextToPostComposer(text);
    }

    if (message.type === "ITD_REDRAW_APPLY_CANVAS") {
      return applyToCanvas();
    }

    if (message.type === "ITD_REDRAW_EXPORT_PNG") {
      return exportPng();
    }

    if (message.type === "ITD_REDRAW_EXPORT_GIF") {
      return exportGif();
    }

    if (message.type === "ITD_REDRAW_STOP_LOOP") {
      stopVideoLoop();
      return { ok: true, message: "Video loop остановлен." };
    }

    if (message.type === "ITD_REDRAW_RESET") {
      resetAll();
      return { ok: true, message: "Сброс выполнен." };
    }

    return { ok: false, message: "Неизвестная команда." };
  }

  // Слушать сообщения от floating-panel.js через window.postMessage
  window.addEventListener('message', async (event) => {
    // Проверить что сообщение от нашего расширения
    if (event.source !== window) {
      return;
    }
    
    const message = event.data;
    if (!message || !message.type || !message.type.startsWith('ITD_REDRAW_')) {
      return;
    }
    
    // Обработать сообщение
    try {
      const result = await handleMessage(message);
      
      // Отправить ответ обратно
      if (message.messageId) {
        window.postMessage({
          messageId: message.messageId,
          isResponse: true,
          response: result
        }, '*');
      }
    } catch (err) {
      if (message.messageId) {
        window.postMessage({
          messageId: message.messageId,
          isResponse: true,
          response: {
            ok: false,
            message: err?.message || "Внутренняя ошибка."
          }
        }, '*');
      }
    }
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleMessage(message)
      .then((result) => sendResponse(result))
      .catch((err) => {
        sendResponse({
          ok: false,
          message: err?.message || "Внутренняя ошибка."
        });
      });
    return true;
  });

  window.addEventListener(
    "paste",
    async (event) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      const clipboard = event.clipboardData;
      if (!clipboard || !clipboard.items || clipboard.items.length === 0) {
        return;
      }

      const imageFiles = [];
      for (const item of clipboard.items) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            imageFiles.push(file);
          }
        }
      }

      const activeCanvas = state.targetCanvas && state.targetCanvas.isConnected ? state.targetCanvas : detectBestCanvas();
      if (!state.target && !activeCanvas) {
        return;
      }

      try {
        let dataUrls = [];
        if (imageFiles.length > 0) {
          event.preventDefault();
          dataUrls = await Promise.all(imageFiles.map((file) => readFileAsDataUrl(file)));
        } else {
          const maybeText = clipboard.getData("text/plain") || clipboard.getData("text/uri-list") || "";
          if (!looksLikeMediaUrl(maybeText)) {
            return;
          }
          event.preventDefault();
          const urlDataUrl = await fetchMediaUrlToDataUrl(maybeText.trim());
          dataUrls = [urlDataUrl];
        }

        const result = await handleImageDataUrls(dataUrls, true);
        if (!result.ok) {
          showToast(`Ctrl+V: ${result.message}`);
        }
      } catch (err) {
        showToast(`Ctrl+V ошибка: ${err?.message || "не удалось вставить изображение"}`);
      }
    },
    true
  );

  window.addEventListener("mousedown", handlePreviewPointerDown, true);
  window.addEventListener("mousemove", updatePreviewDrag, true);
  window.addEventListener("mouseup", endPreviewDrag, true);
  window.addEventListener("blur", endPreviewDrag);

  loadSettingsFromStorage()
    .then((saved) => {
      state.settings = { ...state.settings, ...saved };
      if (state.target) {
        renderPreview();
      }
    })
    .catch(() => {});

  state.targetWatchTimer = window.setInterval(watchTargetLifecycle, 320);

  const onViewportChange = () => {
    if (state.target) {
      renderPreview();
    }
  };
  window.addEventListener("scroll", onViewportChange, { passive: true });
  window.addEventListener("resize", onViewportChange);
})();
