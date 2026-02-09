// Простая система тем через data-атрибут
console.log("[ITD Themes Simple] Loading...");

(function() {
  const THEME_KEY = "itdCustomTheme";
  const SHADER_KEY = "itdShaderCode";
  
  let currentTheme = "default";
  let shaderCanvas = null;
  let shaderContext = null;
  let animationFrame = null;
  
  // Применить тему
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-itd-custom-theme', theme);
    currentTheme = theme;
    chrome.storage.local.set({ [THEME_KEY]: theme });
    console.log("[ITD Themes] Applied theme:", theme);
  }
  
  // Загрузить сохранённую тему
  chrome.storage.local.get(THEME_KEY, (data) => {
    const saved = data[THEME_KEY] || "default";
    applyTheme(saved);
  });
  
  // Применить шейдер
  function applyShader(code) {
    clearShader();
    if (!code) return;
    
    console.log("[ITD Themes] Applying shader...");
    
    shaderCanvas = document.createElement("canvas");
    shaderCanvas.id = "itd-shader-canvas";
    shaderCanvas.width = window.innerWidth;
    shaderCanvas.height = window.innerHeight;
    document.body.appendChild(shaderCanvas);
    
    const gl = shaderCanvas.getContext("webgl") || shaderCanvas.getContext("experimental-webgl");
    if (!gl) {
      console.error("[ITD Themes] WebGL not supported");
      return;
    }
    
    shaderContext = gl;
    
    try {
      // Vertex shader
      const vs = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vs, `attribute vec2 p; void main(){gl_Position=vec4(p,0.,1.);}`);
      gl.compileShader(vs);
      
      // Fragment shader
      const fs = gl.createShader(gl.FRAGMENT_SHADER);
      const wrapped = `precision mediump float;uniform float iTime;uniform vec3 iResolution;${code}void main(){mainImage(gl_FragColor,gl_FragCoord.xy);}`;
      gl.shaderSource(fs, wrapped);
      gl.compileShader(fs);
      
      if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
        console.error("[ITD Themes] Shader error:", gl.getShaderInfoLog(fs));
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
      console.log("[ITD Themes] Shader applied");
    } catch (err) {
      console.error("[ITD Themes] Shader error:", err);
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
  
  // Загрузить сохранённый шейдер
  chrome.storage.local.get(SHADER_KEY, (data) => {
    if (data[SHADER_KEY]) {
      setTimeout(() => applyShader(data[SHADER_KEY]), 1000);
    }
  });
  
  // API для popup
  window.itdThemes = {
    setTheme: applyTheme,
    getTheme: () => currentTheme,
    setShader: applyShader,
    clearShader: clearShader
  };
  
  console.log("[ITD Themes Simple] Loaded! Current theme:", currentTheme);
})();
