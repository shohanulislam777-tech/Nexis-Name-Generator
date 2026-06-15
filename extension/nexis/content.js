// Nexis AI Tool — Content Script
// Runs on lovable.dev pages

(async function () {
  "use strict";

  const NEXIS_API_BASE = "REPLACE_AFTER_BACKEND_DEPLOY";

  // Check license status
  const state = await new Promise((resolve) => {
    chrome.storage.local.get([
      "nx_license_valid",
      "nx_license_key",
      "nx_user_name",
      "nx_expires_at",
      "nx_license_status",
      "nx_plan_name",
    ], resolve);
  });

  if (!state.nx_license_valid) {
    injectLicenseGate();
    return;
  }

  const licenseStatus = state.nx_license_status;
  if (licenseStatus === "revoked" || licenseStatus === "suspended") {
    showStatusOverlay(licenseStatus);
    return;
  }

  // License valid — initialize features
  initNexisFeatures(state);

  function injectLicenseGate() {
    if (document.getElementById("nx-floating")) return;

    const container = document.createElement("div");
    container.id = "nx-floating";

    container.innerHTML = `
      <div id="nx-floating-panel">
        <div class="nx-floating-header">
          <div class="nx-floating-title">
            <div class="nx-floating-icon">N</div>
            Nexis AI Tool
          </div>
          <button id="nx-minimize" style="background:none;border:none;cursor:pointer;color:#6b7280;font-size:16px;padding:0 2px">−</button>
        </div>
        <div class="ql-license-gate" id="ql-body">
          <h3>Activate Nexis</h3>
          <p>Enter your license key to unlock all features.</p>
          <input type="text" id="ql-license-input" placeholder="NEXIS-XXXX-XXXX-XXXX-XXXX" autocomplete="off" spellcheck="false" />
          <button id="ql-validate-btn">Activate License</button>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    document.getElementById("nx-minimize")?.addEventListener("click", () => {
      const body = document.getElementById("ql-body");
      if (body) body.style.display = body.style.display === "none" ? "" : "none";
    });

    // Make draggable
    let dragging = false, ox = 0, oy = 0;
    const header = container.querySelector(".nx-floating-header");
    header?.addEventListener("mousedown", (e) => {
      if (e.target.tagName === "BUTTON") return;
      dragging = true;
      ox = e.clientX - container.offsetLeft;
      oy = e.clientY - container.offsetTop;
      container.style.right = "auto";
    });
    document.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      container.style.left = (e.clientX - ox) + "px";
      container.style.top = (e.clientY - oy) + "px";
      container.style.bottom = "auto";
    });
    document.addEventListener("mouseup", () => { dragging = false; });
  }

  function showStatusOverlay(status) {
    const msgs = {
      expired: "Your Nexis license has expired.",
      suspended: "Your Nexis license has been suspended.",
      revoked: "Your Nexis license has been revoked.",
    };
    const colors = { expired: "#f59e0b", suspended: "#ef4444", revoked: "#dc2626" };

    const overlay = document.createElement("div");
    overlay.id = "nx-status-overlay";
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 2147483640;
      background: rgba(0,0,0,0.85);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      color: #fff; font-family: -apple-system, sans-serif;
      gap: 12px; text-align: center; padding: 20px;
    `;
    overlay.innerHTML = `
      <div style="font-size:40px">⚠️</div>
      <h2 style="color:${colors[status] || '#ef4444'};margin:0">License ${status.charAt(0).toUpperCase() + status.slice(1)}</h2>
      <p style="color:#9ca3af;max-width:300px;margin:0">${msgs[status]}</p>
      <a href="https://nexis.dev/support" target="_blank" style="color:${colors[status]};margin-top:8px">Contact Support</a>
    `;
    document.body.appendChild(overlay);
  }

  function initNexisFeatures(licenseState) {
    console.log("[Nexis] Extension active — License:", licenseState.nx_license_key?.slice(0, 16) + "...");

    // Read Lovable auth tokens and save them
    chrome.runtime.sendMessage({ action: "readLovableCookies" }, (resp) => {
      if (resp?.success && resp.tokens?.length) {
        const token = resp.tokens[0].token;
        chrome.runtime.sendMessage({ action: "saveTokens", token });
      }
    });

    // Heartbeat check every hour
    setInterval(async () => {
      const key = licenseState.nx_license_key;
      if (!key) return;
      const deviceId = await new Promise((resolve) => {
        chrome.storage.local.get(["nx_hw_fingerprint", "nx_device_id_fallback"], (r) => {
          resolve(r.nx_hw_fingerprint || r.nx_device_id_fallback);
        });
      });
      if (!deviceId) return;
      chrome.runtime.sendMessage({
        action: "proxyFetch",
        url: NEXIS_API_BASE + "/check-license",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ license_key: key, device_id: deviceId }),
      }, (resp) => {
        if (resp?.data && !resp.data.valid) {
          chrome.storage.local.set({ nx_license_valid: false, nx_license_status: resp.data.status });
        }
      });
    }, 60 * 60 * 1000);
  }
})();
