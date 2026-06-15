// Nexis AI Tool — Hardware Fingerprinting
// Generates a unique device fingerprint using multiple browser APIs

async function generateHardwareFingerprint() {
  const components = [];

  // Screen metrics
  try {
    components.push(`screen:${screen.width}x${screen.height}`);
    components.push(`depth:${screen.colorDepth}`);
    components.push(`ratio:${window.devicePixelRatio}`);
  } catch {}

  // Navigator data
  try {
    components.push(`platform:${navigator.platform}`);
    components.push(`cores:${navigator.hardwareConcurrency || "unknown"}`);
    components.push(`memory:${navigator.deviceMemory || "unknown"}`);
    components.push(`maxTouchPoints:${navigator.maxTouchPoints || 0}`);
    components.push(`langs:${(navigator.languages || [navigator.language]).join(",")}`);
  } catch {}

  // Timezone
  try {
    components.push(`tz:${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
  } catch {}

  // WebGL GPU fingerprint
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (gl) {
      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      if (debugInfo) {
        components.push(`gpu:${gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)}`);
        components.push(`gpuVendor:${gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)}`);
      }
      components.push(`glVersion:${gl.getParameter(gl.VERSION)}`);
      components.push(`maxTexture:${gl.getParameter(gl.MAX_TEXTURE_SIZE)}`);
      components.push(`maxViewport:${gl.getParameter(gl.MAX_VIEWPORT_DIMS).join(",")}`);
    }
  } catch {}

  // Canvas 2D fingerprint
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "14px 'Arial'";
      ctx.fillStyle = "#f60";
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = "#069";
      ctx.fillText("Nexis", 2, 15);
      ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
      ctx.fillText("Nexis", 4, 17);
      components.push(`canvas:${canvas.toDataURL().substring(0, 100)}`);
    }
  } catch {}

  // Audio fingerprint
  try {
    const ctx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 44100, 44100);
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(10000, ctx.currentTime);
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-50, ctx.currentTime);
    compressor.knee.setValueAtTime(40, ctx.currentTime);
    compressor.ratio.setValueAtTime(12, ctx.currentTime);
    compressor.attack.setValueAtTime(0, ctx.currentTime);
    compressor.release.setValueAtTime(0.25, ctx.currentTime);
    osc.connect(compressor);
    compressor.connect(ctx.destination);
    osc.start(0);
    const buffer = await new Promise((resolve, reject) => {
      ctx.startRendering().then(resolve).catch(reject);
      setTimeout(() => reject(new Error("timeout")), 1000);
    });
    const data = buffer.getChannelData(0);
    let sum = 0;
    for (let i = 4500; i < 5000; i++) sum += Math.abs(data[i]);
    components.push(`audio:${sum.toFixed(6)}`);
  } catch {}

  // Font detection
  try {
    const TEST_FONTS = [
      "monospace", "sans-serif", "serif", "Helvetica", "Arial", "Verdana",
      "Times New Roman", "Courier New", "Georgia", "Impact", "Comic Sans MS",
      "Segoe UI", "Tahoma", "Calibri", "Trebuchet MS", "Palatino Linotype",
      "Lucida Console",
    ];
    const canvas = document.createElement("canvas");
    canvas.width = 500;
    canvas.height = 50;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const baseFonts = ["monospace", "sans-serif", "serif"];
      const baseWidths = {};
      const testStr = "mmmmmmmmmmlli";
      baseFonts.forEach((base) => {
        ctx.font = `72px ${base}`;
        baseWidths[base] = ctx.measureText(testStr).width;
      });
      const detected = [];
      TEST_FONTS.forEach((font) => {
        let different = false;
        baseFonts.forEach((base) => {
          ctx.font = `72px '${font}',${base}`;
          if (ctx.measureText(testStr).width !== baseWidths[base]) different = true;
        });
        if (different) detected.push(font);
      });
      components.push(`fonts:${detected.join("|")}`);
    }
  } catch {}

  const joined = components.join("||");
  const encoded = new TextEncoder().encode(joined);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

let _cachedFingerprint = null;

async function getHardwareFingerprint() {
  if (_cachedFingerprint) return _cachedFingerprint;
  return new Promise(async (resolve) => {
    chrome.storage.local.get(["nx_hw_fingerprint"], async (result) => {
      if (result.nx_hw_fingerprint) {
        _cachedFingerprint = result.nx_hw_fingerprint;
        resolve(_cachedFingerprint);
      } else {
        try {
          const fp = await generateHardwareFingerprint();
          _cachedFingerprint = fp;
          chrome.storage.local.set({ nx_hw_fingerprint: fp });
          resolve(fp);
        } catch {
          const fallback = "device-" + Date.now() + "-" + Math.random().toString(16).slice(2);
          _cachedFingerprint = fallback;
          chrome.storage.local.set({ nx_hw_fingerprint: fallback });
          resolve(fallback);
        }
      }
    });
  });
}
