// Nexis AI Tool — License Validation System
// Communicates with the Nexis License Backend

(function () {
  const NEXIS_API_BASE = (() => {
    // Production: replace with your deployed API URL
    // Development: proxied through background worker
    return chrome.runtime.getManifest().nexis_api_url || "https://your-nexis-backend.repl.app/api";
  })();

  let _validating = false;

  function getElements() {
    const spBtn = document.querySelector("#sp-validate-btn");
    return {
      isSide: !!spBtn,
      btn: spBtn || document.querySelector("#nx-validate-btn"),
      inp: spBtn
        ? document.querySelector("#sp-license-input")
        : document.querySelector("#nx-license-input"),
      log: spBtn
        ? document.querySelector("#sp-license-log")
        : document.querySelector("#nx-license-log"),
    };
  }

  function showLog(message, type = "info") {
    const { log, btn } = getElements();
    if (!log && btn) {
      const logEl = document.createElement("div");
      logEl.id = btn.closest(".sp-license-gate") ? "sp-license-log" : "nx-license-log";
      btn.insertAdjacentElement("afterend", logEl);
    }
    const el = document.querySelector("#sp-license-log,#nx-license-log");
    if (!el) return;
    el.textContent = message;
    el.className = `nx-log nx-log-${type}`;
    el.style.cssText = `
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      min-height: 18px !important;
      margin-top: 10px !important;
      padding: 8px 10px !important;
      border-radius: 8px !important;
      background: rgba(255,255,255,.08) !important;
      color: inherit !important;
      position: relative !important;
      z-index: 999999 !important;
      font-size: 13px !important;
    `;
  }

  async function getDeviceId() {
    return new Promise((resolve) => {
      try {
        if (typeof getHardwareFingerprint === "function") {
          Promise.resolve(getHardwareFingerprint())
            .then((fp) => resolve(fp || "device-generic"))
            .catch(() => resolve("device-generic"));
          return;
        }
      } catch {}
      chrome.storage.local.get(["nx_hw_fingerprint", "nx_device_id_fallback"], (result) => {
        if (result.nx_hw_fingerprint) return resolve(result.nx_hw_fingerprint);
        if (result.nx_device_id_fallback) return resolve(result.nx_device_id_fallback);
        const id = "device-" + Date.now() + "-" + Math.random().toString(16).slice(2);
        chrome.storage.local.set({ nx_device_id_fallback: id }, () => resolve(id));
      });
    });
  }

  async function callNexisAPI(endpoint, body) {
    return new Promise((resolve, reject) => {
      try {
        chrome.runtime.sendMessage(
          {
            action: "proxyFetch",
            url: NEXIS_API_BASE + endpoint,
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          },
          (resp) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            if (!resp) {
              reject(new Error("No response from background"));
              return;
            }
            resolve(resp.data || {});
          }
        );
      } catch (err) {
        fetch(NEXIS_API_BASE + endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
          .then((r) => r.json())
          .then(resolve)
          .catch(reject);
      }
    });
  }

  async function validateLicense() {
    if (_validating) return;
    const { btn, inp, isSide } = getElements();
    if (!btn) return;

    const key = inp ? String(inp.value || "").trim() : "";
    if (!key) {
      showLog("Enter a license key", "error");
      if (inp) inp.focus();
      return;
    }

    _validating = true;
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Validating...";
    showLog("Validating...", "info");

    try {
      const deviceId = await getDeviceId();
      const result = await callNexisAPI("/validate-license", {
        license_key: key,
        device_id: deviceId,
      });

      if (result && result.valid) {
        chrome.storage.local.set({
          nx_license_valid: true,
          nx_license_key: key,
          nx_session_id: result.session_id || null,
          nx_user_name: result.user_name || null,
          nx_expires_at: result.expires_at || null,
          nx_activated_at: result.activated_at || null,
          nx_license_status: result.status || null,
          nx_plan_name: result.plan_name || null,
        }, () => {
          showLog("✓ " + (result.message || "License activated"), "success");
          try {
            if (typeof activateBypass === "function") activateBypass();
            if (typeof showMainUI === "function") {
              if (isSide) showMainUI();
              else {
                const container = document.querySelector("#nx-body,.ql-body");
                if (container) showMainUI(container);
              }
            }
            if (typeof startHeartbeat === "function") startHeartbeat(key);
          } catch {}
          setTimeout(() => {
            try {
              if (document.querySelector("#sp-body")) location.reload();
            } catch {}
          }, 900);
        });
      } else {
        const msg = result?.message || result?.error || "Invalid license key";
        showLog("✗ " + msg, "error");
      }
    } catch (err) {
      console.error("[Nexis License]", err);
      showLog("✗ Connection error. Please try again.", "error");
    } finally {
      _validating = false;
      const { btn: b } = getElements();
      if (b) { b.disabled = false; b.textContent = originalText; }
    }
  }

  // Heartbeat — periodic license revalidation
  function startHeartbeat(licenseKey) {
    const INTERVAL = 60 * 60 * 1000; // 1 hour
    setInterval(async () => {
      try {
        const deviceId = await getDeviceId();
        const result = await callNexisAPI("/check-license", {
          license_key: licenseKey,
          device_id: deviceId,
        });
        if (!result || !result.valid) {
          chrome.storage.local.set({ nx_license_valid: false });
          // Trigger UI update
          const event = new CustomEvent("nexis:license-invalid", { detail: result });
          window.dispatchEvent(event);
        }
      } catch {}
    }, INTERVAL);
  }

  // Status screen for invalid/expired/suspended/revoked licenses
  function showStatusScreen(status, message) {
    const statusMessages = {
      expired: { title: "License Expired", color: "#f59e0b", icon: "⏰" },
      suspended: { title: "License Suspended", color: "#ef4444", icon: "⚠️" },
      revoked: { title: "License Revoked", color: "#dc2626", icon: "🚫" },
      invalid: { title: "License Invalid", color: "#6b7280", icon: "✗" },
    };
    const info = statusMessages[status] || statusMessages.invalid;
    return `
      <div class="nx-status-screen" style="
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        padding:40px 20px;text-align:center;gap:12px;
      ">
        <div style="font-size:48px">${info.icon}</div>
        <h3 style="margin:0;font-size:18px;color:${info.color}">${info.title}</h3>
        <p style="margin:0;font-size:14px;color:var(--nx-text-muted,#888)">${message || ""}</p>
        <a href="https://nexis.dev/support" target="_blank" rel="noopener"
           style="color:${info.color};font-size:13px;margin-top:8px">
          Contact Support
        </a>
      </div>
    `;
  }

  // Wire up button clicks and keyboard Enter
  document.addEventListener("click", (e) => {
    const target = e.target;
    if (!target?.matches) return;
    if (target.matches("#sp-validate-btn,#nx-validate-btn")) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      validateLicense();
    }
  }, true);

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    if (e.target?.matches?.("#sp-license-input,#nx-license-input")) {
      e.preventDefault();
      e.stopPropagation();
      validateLicense();
    }
  }, true);

  // Auto-attach to validate buttons when they appear
  function attachButtons() {
    const btn = document.querySelector("#sp-validate-btn,#nx-validate-btn");
    if (!btn || btn.dataset.nexisAttached === "1") return;
    btn.dataset.nexisAttached = "1";
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      validateLicense();
    }, true);
  }

  try {
    new MutationObserver(attachButtons).observe(
      document.documentElement || document.body,
      { childList: true, subtree: true }
    );
  } catch {}

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attachButtons);
  } else {
    attachButtons();
  }

  setInterval(attachButtons, 500);
})();
