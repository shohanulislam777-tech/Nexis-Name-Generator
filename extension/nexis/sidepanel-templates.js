// Nexis AI Tool — Side Panel HTML Templates

function renderLicenseGate() {
  return `
    <div class="sp-license-gate" style="max-width:300px;margin:0 auto">
      <div class="nx-brand-icon" style="width:48px;height:48px;font-size:20px;border-radius:12px;margin-bottom:4px">N</div>
      <h2>Activate Nexis</h2>
      <p>Enter your license key to unlock the full extension.</p>
      <input
        type="text"
        id="sp-license-input"
        placeholder="NEXIS-XXXX-XXXX-XXXX-XXXX"
        autocomplete="off"
        spellcheck="false"
      />
      <button id="sp-validate-btn">Activate License</button>
    </div>
  `;
}

function renderStatusScreen(status, message) {
  const info = {
    expired: { title: "License Expired", color: "#f59e0b", icon: "⏰" },
    suspended: { title: "License Suspended", color: "#ef4444", icon: "⚠️" },
    revoked: { title: "License Revoked", color: "#dc2626", icon: "🚫" },
  }[status] || { title: "License Invalid", color: "#6b7280", icon: "✗" };

  return `
    <div style="display:flex;flex-direction:column;align-items:center;padding:40px 20px;gap:12px;text-align:center">
      <div style="font-size:40px">${info.icon}</div>
      <h3 style="color:${info.color}">${info.title}</h3>
      <p style="color:var(--nx-text-muted);font-size:12px">${message || ""}</p>
      <a href="https://nexis.dev/support" target="_blank" rel="noopener"
         style="color:${info.color};font-size:12px">Contact Support</a>
    </div>
  `;
}

function renderMainUI(userName, planName, expiresAt) {
  return `
    <div style="display:flex;flex-direction:column;gap:12px">
      <div style="background:var(--nx-bg-card);border:1px solid var(--nx-border);border-radius:var(--nx-radius);padding:12px">
        <div style="font-size:11px;color:var(--nx-text-muted);margin-bottom:4px">Licensed to</div>
        <div style="font-weight:600">${userName || "License Holder"}</div>
        ${planName ? `<div style="font-size:11px;color:var(--nx-accent);margin-top:2px">${planName}</div>` : ""}
        ${expiresAt ? `<div style="font-size:10px;color:var(--nx-text-muted);margin-top:4px">Expires: ${new Date(expiresAt).toLocaleDateString()}</div>` : ""}
      </div>
      <div style="background:var(--nx-bg-card);border:1px solid var(--nx-border);border-radius:var(--nx-radius);padding:12px">
        <div style="font-size:11px;color:var(--nx-text-muted);margin-bottom:8px;font-weight:600">QUICK ACTIONS</div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <button class="nx-action-btn" id="nx-btn-sidebar-mode" style="
            background:none;border:1px solid var(--nx-border);border-radius:6px;
            color:var(--nx-text);cursor:pointer;padding:7px 10px;font-size:12px;
            text-align:left;transition:background 0.15s;
          ">Toggle Sidebar Mode</button>
          <button class="nx-action-btn" id="nx-btn-deactivate" style="
            background:none;border:1px solid rgba(239,68,68,0.3);border-radius:6px;
            color:#ef4444;cursor:pointer;padding:7px 10px;font-size:12px;
            text-align:left;transition:background 0.15s;
          ">Deactivate on this device</button>
        </div>
      </div>
    </div>
  `;
}
