// Примеры шейдеров из Shadertoy для быстрого старта
export const shaderExamples = {
  plasma: {
    name: "Plasma Wave",
    code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord / iResolution.xy;
  vec3 col = 0.5 + 0.5 * cos(iTime + uv.xyx + vec3(0, 2, 4));
  fragColor = vec4(col, 1.0);
}`
  },
  
  tunnel: {
    name: "Tunnel Effect",
    code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;
  float d = length(uv);
  float a = atan(uv.y, uv.x);
  vec2 p = vec2(a / 3.14159, 1.0 / d);
  p.y += iTime * 0.5;
  vec3 col = 0.5 + 0.5 * cos(p.y * 3.0 + vec3(0, 2, 4));
  col *= smoothstep(0.1, 0.0, abs(fract(p.x * 8.0) - 0.5));
  fragColor = vec4(col, 1.0);
}`
  },
  
  waves: {
    name: "Color Waves",
    code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord / iResolution.xy;
  float t = iTime * 0.5;
  vec3 col = vec3(0.0);
  for (float i = 0.0; i < 3.0; i++) {
    float wave = sin(uv.x * 10.0 + t + i * 2.0) * 0.5 + 0.5;
    wave *= sin(uv.y * 10.0 + t * 0.7 + i * 1.5) * 0.5 + 0.5;
    col[int(i)] = wave;
  }
  fragColor = vec4(col, 1.0);
}`
  },
  
  grid: {
    name: "Neon Grid",
    code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord / iResolution.xy;
  uv = uv * 2.0 - 1.0;
  uv.y *= iResolution.y / iResolution.x;
  
  float grid = 0.0;
  vec2 p = fract(uv * 10.0 + iTime * 0.2) - 0.5;
  grid = smoothstep(0.05, 0.0, abs(p.x));
  grid += smoothstep(0.05, 0.0, abs(p.y));
  
  vec3 col = vec3(0.1, 0.5, 1.0) * grid;
  col += vec3(0.0, 0.2, 0.4) * (1.0 - grid);
  
  fragColor = vec4(col, 1.0);
}`
  },
  
  stars: {
    name: "Starfield",
    code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
  vec3 col = vec3(0.0);
  
  for (float i = 0.0; i < 40.0; i++) {
    vec2 p = uv * (1.0 + i * 0.1);
    p += vec2(sin(iTime * 0.1 + i), cos(iTime * 0.15 + i)) * 0.3;
    float d = length(fract(p) - 0.5);
    float star = smoothstep(0.05, 0.0, d);
    col += star * vec3(0.5 + 0.5 * sin(i), 0.7, 1.0);
  }
  
  fragColor = vec4(col, 1.0);
}`
  }
};
