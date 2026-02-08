const SETTINGS_KEY = "itdRedrawSettings";
const AI_SETTINGS_KEY = "itdRedrawAiSettings";

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
  aiEndpointInput: document.getElementById("aiEndpointInput"),
  aiApiKeyInput: document.getElementById("aiApiKeyInput"),
  aiModelInput: document.getElementById("aiModelInput"),
  aiPromptInput: document.getElementById("aiPromptInput"),
  aiResultOutput: document.getElementById("aiResultOutput"),
  aiGenerateBtn: document.getElementById("aiGenerateBtn"),
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

const aiDefaults = {
  endpoint: "https://ai.megallm.io/v1/chat/completions",
  apiKey: "",
  model: "openai-gpt-oss-20b",
  prompt: ""
};

async function getActiveTabId() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (!tab || typeof tab.id !== "number") {
    throw new Error("Не удалось получить активную вкладку.");
  }
  return tab.id;
}

function isRestrictedUrl(url) {
  if (!url || typeof url !== "string") {
    return true;
  }
  const lowered = url.toLowerCase();
  return (
    lowered.startsWith("chrome://") ||
    lowered.startsWith("edge://") ||
    lowered.startsWith("about:") ||
    lowered.startsWith("chrome-extension://") ||
    lowered.startsWith("view-source:")
  );
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (!tab || typeof tab.id !== "number") {
    throw new Error("Не удалось получить активную вкладку.");
  }
  return tab;
}

async function sendMessageToTab(tabId, message) {
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

async function ensureContentScript(tab) {
  if (isRestrictedUrl(tab.url || "")) {
    throw new Error("Эта вкладка не поддерживает расширения (служебная страница браузера).");
  }

  try {
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ["content/content.css"]
    });
  } catch (err) {
    // CSS может быть уже вставлен — это не критично.
  }

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content/content.js"]
  });
}

async function sendToActiveTab(message) {
  const tab = await getActiveTab();
  try {
    return await sendMessageToTab(tab.id, message);
  } catch (err) {
    const text = String(err?.message || "");
    const missingReceiver = text.includes("Receiving end does not exist") || text.includes("Could not establish connection");
    if (!missingReceiver) {
      throw err;
    }

    await ensureContentScript(tab);
    return sendMessageToTab(tab.id, message);
  }
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

function setAiControls(settings) {
  els.aiEndpointInput.value = settings.endpoint || "";
  els.aiApiKeyInput.value = settings.apiKey || "";
  els.aiModelInput.value = settings.model || "";
  els.aiPromptInput.value = settings.prompt || "";
}

function readAiControls() {
  return {
    endpoint: els.aiEndpointInput.value.trim(),
    apiKey: els.aiApiKeyInput.value.trim(),
    model: els.aiModelInput.value.trim(),
    prompt: els.aiPromptInput.value.trim()
  };
}

async function saveAiSettings(settings) {
  const payload = {
    endpoint: settings.endpoint || aiDefaults.endpoint,
    apiKey: settings.apiKey || "",
    model: settings.model || aiDefaults.model,
    prompt: settings.prompt || ""
  };
  await chrome.storage.local.set({ [AI_SETTINGS_KEY]: payload });
}

async function loadAiSettings() {
  const data = await chrome.storage.local.get(AI_SETTINGS_KEY);
  const stored = data[AI_SETTINGS_KEY] || {};
  return {
    endpoint: stored.endpoint || aiDefaults.endpoint,
    apiKey: stored.apiKey || "",
    model: stored.model || aiDefaults.model,
    prompt: stored.prompt || ""
  };
}

function setAiBusy(isBusy) {
  if (els.aiGenerateBtn) {
    els.aiGenerateBtn.disabled = isBusy;
  }
}

function setAiResultValue(value) {
  if (els.aiResultOutput) {
    els.aiResultOutput.value = value;
  }
}

function isUnknownCommandMessage(message) {
  if (typeof message !== "string") {
    return false;
  }
  const normalized = message.trim().toLowerCase();
  return normalized.includes("неизвестная команда");
}

async function insertTextViaScriptingFallback(text) {
  const tabId = await getActiveTabId();
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    args: [text],
    func: (value) => {
      const inputText = typeof value === "string" ? value.trim() : "";
      if (!inputText) {
        return { ok: false, message: "Пустой текст." };
      }

      const isVisible = (el) => {
        if (!(el instanceof Element)) {
          return false;
        }
        const rect = el.getBoundingClientRect();
        if (rect.width < 6 || rect.height < 6) {
          return false;
        }
        const style = window.getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) < 0.05) {
          return false;
        }
        return rect.bottom > 0 && rect.right > 0 && rect.left < window.innerWidth && rect.top < window.innerHeight;
      };

      const selectors = [
        "textarea.wall-post-form__textarea[placeholder='Что у вас нового?']",
        "textarea.wall-post-form__textarea[aria-label='Что у вас нового?']",
        "textarea.wall-post-form__textarea[name='Что у вас нового?']",
        ".wall-post-form__content textarea.wall-post-form__textarea",
        "textarea.wall-post-form__textarea[placeholder*='Что у вас нового']",
        "textarea.wall-post-form__textarea[placeholder*='что у вас нового']",
        "textarea.wall-post-form__textarea"
      ];

      let target = null;
      for (const selector of selectors) {
        const nodes = Array.from(document.querySelectorAll(selector));
        target = nodes.find(isVisible) || nodes[0] || null;
        if (target) {
          break;
        }
      }

      if (!(target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement)) {
        return { ok: false, message: "Не найдено поле поста." };
      }

      target.focus();
      const proto = target instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const valueDescriptor = Object.getOwnPropertyDescriptor(proto, "value");
      if (valueDescriptor && valueDescriptor.set) {
        valueDescriptor.set.call(target, inputText);
      } else {
        target.value = inputText;
      }

      const base = { bubbles: true, cancelable: false, composed: true };
      try {
        target.dispatchEvent(new InputEvent("input", { ...base, inputType: "insertText", data: inputText }));
      } catch (err) {
        target.dispatchEvent(new Event("input", base));
      }
      target.dispatchEvent(new Event("change", base));

      return { ok: true, message: "Текст вставлен в поле поста." };
    }
  });

  const result = Array.isArray(results) && results.length > 0 ? results[0]?.result : null;
  if (result && typeof result === "object") {
    return result;
  }
  return { ok: false, message: "Не удалось выполнить fallback-вставку." };
}

async function persistAiControls() {
  const settings = readAiControls();
  await saveAiSettings(settings);
}

function normalizeAiContent(content) {
  if (typeof content === "string") {
    return content.trim();
  }
  if (Array.isArray(content)) {
    const parts = content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }
        if (part && typeof part.text === "string") {
          return part.text;
        }
        if (part && typeof part.content === "string") {
          return part.content;
        }
        return "";
      })
      .filter(Boolean);
    return parts.join("\n").trim();
  }
  if (content && typeof content === "object") {
    const fields = [
      content.text,
      content.output_text,
      content.response,
      content.result,
      content.answer,
      content.content,
      content.message?.content,
      content.message?.text,
      content.delta?.content,
      content.parts
    ];
    for (const value of fields) {
      const normalized = normalizeAiContent(value);
      if (normalized) {
        return normalized;
      }
    }
  }
  return "";
}

function pickFirstNonEmpty(values) {
  const list = Array.isArray(values) ? values : [values];
  for (const value of list) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    const normalized = normalizeAiContent(value);
    if (normalized) {
      return normalized;
    }
  }
  return "";
}

function pickFirstNonEmptyKeepWhitespace(values) {
  const list = Array.isArray(values) ? values : [values];
  for (const value of list) {
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
    if (value && typeof value === "object") {
      const normalized = normalizeAiContent(value);
      if (normalized) {
        return normalized;
      }
    }
  }
  return "";
}

function extractFromChoices(choices) {
  if (!Array.isArray(choices) || choices.length === 0) {
    return "";
  }
  for (const choice of choices) {
    if (!choice || typeof choice !== "object") {
      continue;
    }
    const text = pickFirstNonEmpty([
      choice.text,
      choice.message?.content,
      choice.delta?.content,
      choice.content
    ]);
    if (text) {
      return text;
    }
  }
  return "";
}

function extractFromOutput(output) {
  if (!Array.isArray(output) || output.length === 0) {
    return "";
  }
  for (const item of output) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const direct = pickFirstNonEmpty([
      item.text,
      item.output_text,
      item.message?.content,
      item.content
    ]);
    if (direct) {
      return direct;
    }

    if (Array.isArray(item.content)) {
      const partText = pickFirstNonEmpty(item.content.map((part) => [part?.text, part?.content, part?.output_text]));
      if (partText) {
        return partText;
      }
    }
  }
  return "";
}

function describePayloadShape(payload, rawText) {
  if (payload && typeof payload === "object") {
    const keys = Object.keys(payload).slice(0, 8);
    if (keys.length > 0) {
      return `формат ответа: ${keys.join(", ")}`;
    }
  }
  const text = typeof rawText === "string" ? rawText.trim() : "";
  if (!text) {
    return "пустой ответ";
  }
  return `raw: ${shortErrorDetail(text)}`;
}

function extractAiText(payload, rawText = "") {
  if (!payload || typeof payload !== "object") {
    const plain = typeof rawText === "string" ? rawText.trim() : "";
    if (plain && !/^[\[{]/.test(plain)) {
      return plain;
    }
    return "";
  }

  const topText = pickFirstNonEmpty([
    payload.output_text,
    payload.response,
    payload.result,
    payload.answer,
    payload.text,
    payload.content,
    payload.message,
    payload.data?.output_text,
    payload.data?.response,
    payload.data?.result,
    payload.data?.answer,
    payload.data?.text,
    payload.data?.content,
    payload.data?.message?.content
  ]);
  if (topText) {
    return topText;
  }

  const choiceText = extractFromChoices(payload.choices) || extractFromChoices(payload.data?.choices);
  if (choiceText) {
    return choiceText;
  }

  const outputText = extractFromOutput(payload.output) || extractFromOutput(payload.data?.output);
  if (outputText) {
    return outputText;
  }

  const geminiText = pickFirstNonEmpty([
    payload.candidates?.[0]?.content?.parts,
    payload.data?.candidates?.[0]?.content?.parts
  ]);
  if (geminiText) {
    return geminiText;
  }

  const plain = typeof rawText === "string" ? rawText.trim() : "";
  if (plain && !/^[\[{]/.test(plain)) {
    return plain;
  }
  return "";
}

function shortErrorDetail(raw) {
  if (!raw) {
    return "";
  }
  const text = String(raw).trim().replace(/\s+/g, " ");
  if (!text) {
    return "";
  }
  return text.length > 160 ? `${text.slice(0, 160)}...` : text;
}

function normalizeProviderApiKey(apiKey) {
  const key = typeof apiKey === "string" ? apiKey.trim() : "";
  if (!key) {
    return "";
  }
  if (key.startsWith("k-mega-")) {
    return `s${key}`;
  }
  return key;
}

function buildAiRequestPayload(model, prompt, stream) {
  return {
    model,
    temperature: 0.9,
    max_tokens: 350,
    max_completion_tokens: 350,
    stream,
    messages: [
      {
        role: "system",
        content: "Ты пишешь короткие посты для соцсети. Возвращай только готовый текст поста на русском без пояснений и кавычек."
      },
      {
        role: "user",
        content: prompt
      }
    ]
  };
}

function parseJsonSafe(rawText) {
  if (typeof rawText !== "string" || !rawText.trim()) {
    return null;
  }
  try {
    return JSON.parse(rawText);
  } catch (err) {
    return null;
  }
}

function extractStreamChunkText(payload) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  return pickFirstNonEmptyKeepWhitespace([
    payload.choices?.[0]?.delta?.content,
    payload.choices?.[0]?.message?.content,
    payload.choices?.[0]?.text,
    payload.choices?.[0]?.content,
    payload.data?.choices?.[0]?.delta?.content,
    payload.data?.choices?.[0]?.message?.content,
    payload.data?.choices?.[0]?.text,
    payload.delta?.content,
    payload.output_text,
    payload.result,
    payload.answer,
    payload.text,
    payload.response,
    payload.content
  ]);
}

function cleanGeneratedPostText(text) {
  if (typeof text !== "string") {
    return "";
  }

  let output = text;
  output = output.replace(/<think[\s\S]*?<\/think>/gi, " ");
  output = output.replace(/```[\s\S]*?```/g, " ");

  const finalMatches = [...output.matchAll(/(?:^|\n|\r)\s*final\s*:\s*/gi)];
  if (finalMatches.length > 0) {
    const last = finalMatches[finalMatches.length - 1];
    const idx = (last.index || 0) + last[0].length;
    output = output.slice(idx);
  }

  const latinReasoningStart =
    output.toLowerCase().indexOf("we need to") >= 0 ||
    output.toLowerCase().indexOf("must be in") >= 0 ||
    output.toLowerCase().indexOf("let's ") >= 0;

  const lines = output
    .split(/\r?\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  if (latinReasoningStart && lines.length > 0) {
    output = lines[lines.length - 1];
  } else if (lines.length > 1) {
    let bestLine = lines[0];
    let bestScore = -1;
    for (const line of lines) {
      const cyr = (line.match(/[А-Яа-яЁё]/g) || []).length;
      const lat = (line.match(/[A-Za-z]/g) || []).length;
      const score = cyr * 2 - lat;
      if (score > bestScore) {
        bestScore = score;
        bestLine = line;
      }
    }
    output = bestLine;
  }

  output = output.replace(/\s+/g, " ").trim();
  return output;
}

function parseSseLines(buffer, onLine) {
  let cursor = 0;
  while (true) {
    const nextNewline = buffer.indexOf("\n", cursor);
    if (nextNewline < 0) {
      return buffer.slice(cursor);
    }
    const line = buffer.slice(cursor, nextNewline).replace(/\r$/, "");
    cursor = nextNewline + 1;
    onLine(line);
  }
}

async function readStreamedAiResponse(response, onProgress) {
  const reader = response.body?.getReader?.();
  if (!reader) {
    return "";
  }

  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let rawCombined = "";
  let text = "";

  const consumeLine = (line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(":")) {
      return;
    }

    const data = trimmed.startsWith("data:") ? trimmed.slice(5).trim() : trimmed;
    if (!data || data === "[DONE]") {
      return;
    }

    const payload = parseJsonSafe(data);
    if (!payload) {
      return;
    }

    const piece = extractStreamChunkText(payload) || extractAiText(payload, data);
    if (!piece) {
      return;
    }

    text += piece;
    if (typeof onProgress === "function") {
      onProgress(text, piece);
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }
    const decoded = decoder.decode(value, { stream: true });
    rawCombined += decoded;
    buffer += decoded;
    buffer = parseSseLines(buffer, consumeLine);
  }

  const tail = decoder.decode();
  if (tail) {
    rawCombined += tail;
    buffer += tail;
  }
  buffer = parseSseLines(buffer, consumeLine);

  if (buffer.trim().length > 0) {
    consumeLine(buffer.trim());
  }

  if (!text && rawCombined.trim().length > 0) {
    const payload = parseJsonSafe(rawCombined.trim());
    if (payload) {
      text = extractAiText(payload, rawCombined) || "";
      if (text && typeof onProgress === "function") {
        onProgress(text, text);
      }
    }
  }

  return text.trim();
}

async function requestAiNonStream(endpoint, headers, model, prompt) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(buildAiRequestPayload(model, prompt, false))
  });

  const rawText = await response.text();
  const payload = parseJsonSafe(rawText);

  if (!response.ok) {
    const apiMessage = payload?.error?.message || payload?.message || rawText || response.statusText;
    throw new Error(`AI API ${response.status}: ${shortErrorDetail(apiMessage)}`);
  }

  const text = extractAiText(payload, rawText);
  if (!text) {
    throw new Error(`AI вернул пустой ответ (${describePayloadShape(payload, rawText)}). Проверь endpoint/модель.`);
  }
  return text;
}

async function requestAiStream(endpoint, headers, model, prompt, onProgress) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(buildAiRequestPayload(model, prompt, true))
  });

  if (!response.ok) {
    const rawText = await response.text();
    const payload = parseJsonSafe(rawText);
    const apiMessage = payload?.error?.message || payload?.message || rawText || response.statusText;
    const error = new Error(`AI API ${response.status}: ${shortErrorDetail(apiMessage)}`);
    error.skipFallback = true;
    throw error;
  }

  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  if (contentType.includes("application/json")) {
    const rawText = await response.text();
    const payload = parseJsonSafe(rawText);
    const text = extractAiText(payload, rawText);
    if (!text) {
      throw new Error(`AI вернул пустой ответ (${describePayloadShape(payload, rawText)}). Проверь endpoint/модель.`);
    }
    if (typeof onProgress === "function") {
      onProgress(text, text);
    }
    return text;
  }

  const streamedText = await readStreamedAiResponse(response, onProgress);
  if (!streamedText) {
    throw new Error("Пустой stream-ответ от AI.");
  }
  return streamedText;
}

async function generateAiText(endpoint, apiKey, model, prompt, onProgress) {
  const headers = {
    "Content-Type": "application/json"
  };
  const resolvedApiKey = normalizeProviderApiKey(apiKey);
  if (resolvedApiKey) {
    headers.Authorization = `Bearer ${resolvedApiKey}`;
  }

  try {
    return await requestAiStream(endpoint, headers, model, prompt, onProgress);
  } catch (err) {
    if (err?.skipFallback) {
      throw err;
    }
    return requestAiNonStream(endpoint, headers, model, prompt);
  }
}

async function onAiGenerate() {
  const ai = readAiControls();
  if (!ai.endpoint) {
    setStatus("Укажи AI API Endpoint.", true);
    return;
  }
  if (!ai.model) {
    setStatus("Укажи AI модель.", true);
    return;
  }
  if (!ai.prompt) {
    setStatus("Напиши тему поста для AI.", true);
    return;
  }

  setAiBusy(true);
  setStatus("AI генерирует текст поста...");
  setAiResultValue("");

  try {
    await saveAiSettings(ai);
    let lastStatusUpdate = 0;
    const text = await generateAiText(ai.endpoint, ai.apiKey, ai.model, ai.prompt, (nextText) => {
      setAiResultValue(nextText);
      const now = Date.now();
      if (now - lastStatusUpdate > 350) {
        setStatus(`AI генерирует текст... ${nextText.length} символов`);
        lastStatusUpdate = now;
      }
    });
    const finalText = cleanGeneratedPostText(text);
    if (!finalText) {
      throw new Error("AI вернул пустой текст после обработки.");
    }
    setAiResultValue(finalText);
    const insertResp = await insertTextToPost(finalText);
    if (!insertResp.ok) {
      setStatus(`Текст сгенерирован, но не вставлен: ${insertResp.message}`, true);
      return;
    }
    setStatus("Текст поста сгенерирован и вставлен.");
  } catch (err) {
    setStatus(`Ошибка AI: ${err.message}`, true);
  } finally {
    setAiBusy(false);
  }
}

async function insertTextToPost(text) {
  const safeText = typeof text === "string" ? text.trim() : "";
  if (!safeText) {
    return { ok: false, message: "Пустой текст." };
  }
  try {
    const response = await sendToActiveTab({
      type: "ITD_REDRAW_INSERT_POST_TEXT",
      payload: { text: safeText }
    });
    if (response?.ok) {
      return response;
    }
    if (isUnknownCommandMessage(response?.message || "")) {
      return insertTextViaScriptingFallback(safeText);
    }
    return response || { ok: false, message: "Не удалось вставить текст в пост." };
  } catch (err) {
    const textMessage = String(err?.message || "");
    const missingReceiver =
      textMessage.includes("Receiving end does not exist") ||
      textMessage.includes("Could not establish connection");
    if (missingReceiver) {
      return insertTextViaScriptingFallback(safeText);
    }
    return { ok: false, message: err?.message || "Ошибка вставки текста." };
  }
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

  els.aiGenerateBtn.addEventListener("click", onAiGenerate);

  const aiSettingsInputs = [
    els.aiEndpointInput,
    els.aiApiKeyInput,
    els.aiModelInput,
    els.aiPromptInput
  ];
  aiSettingsInputs.forEach((el) => {
    el.addEventListener("change", () => {
      persistAiControls();
    });
  });
}

async function init() {
  const settings = await loadSettings();
  const aiSettings = await loadAiSettings();
  setControls(settings);
  setAiControls(aiSettings);
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
