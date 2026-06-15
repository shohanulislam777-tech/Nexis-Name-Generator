// Nexis AI Tool — Side Panel Controller

const NEXIS_API_BASE = "REPLACE_AFTER_BACKEND_DEPLOY";

async function initSidePanel() {
  const body = document.getElementById("sp-body");
  if (!body) return;

  // Load stored license state
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
    body.innerHTML = renderLicenseGate();
    return;
  }

  const status = state.nx_license_status;
  if (status === "expired" || status === "suspended" || status === "revoked") {
    const msgs = {
      expired: "Your license has expired. Please renew to continue.",
      suspended: "Your license has been suspended. Please contact support.",
      revoked: "Your license has been permanently revoked.",
    };
    body.innerHTML = renderStatusScreen(status, msgs[status]);
    return;
  }

  showMainUI();
}

function showMainUI(container) {
  const body = container || document.getElementById("sp-body");
  if (!body) return;

  chrome.storage.local.get(["nx_user_name", "nx_plan_name", "nx_expires_at"], (state) => {
    body.innerHTML = renderMainUI(state.nx_user_name, state.nx_plan_name, state.nx_expires_at);

    // Sidebar mode toggle
    document.getElementById("nx-btn-sidebar-mode")?.addEventListener("click", () => {
      chrome.storage.local.get(["nx_sidebar_mode"], (r) => {
        const newMode = !r.nx_sidebar_mode;
        chrome.storage.local.set({ nx_sidebar_mode: newMode });
        chrome.runtime.sendMessage({ action: newMode ? "activateSidebar" : "deactivateSidebar" });
      });
    });

    // Deactivate device
    document.getElementById("nx-btn-deactivate")?.addEventListener("click", async () => {
      try {
        const { nx_license_key } = await new Promise((r) => chrome.storage.local.get(["nx_license_key"], r));
        const { nx_hw_fingerprint, nx_device_id_fallback } = await new Promise((r) =>
          chrome.storage.local.get(["nx_hw_fingerprint", "nx_device_id_fallback"], r)
        );
        const deviceId = nx_hw_fingerprint || nx_device_id_fallback;
        if (!nx_license_key || !deviceId) return;

        await fetch(NEXIS_API_BASE + "/deactivate-license", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ license_key: nx_license_key, device_id: deviceId }),
        });

        chrome.storage.local.clear(() => {
          const body = document.getElementById("sp-body");
          if (body) body.innerHTML = renderLicenseGate();
        });
      } catch (err) {
        console.error("[Nexis] Deactivate error:", err);
      }
    });
  });
}

// Theme toggle
document.getElementById("nx-theme-btn")?.addEventListener("click", () => {
  document.body.classList.toggle("light-theme");
  document.body.classList.toggle("dark-theme");
});

// Back to popup
document.getElementById("sp-back-to-popup")?.addEventListener("click", () => {
  chrome.storage.local.set({ nx_sidebar_mode: false });
  chrome.runtime.sendMessage({ action: "deactivateSidebar" });
});

// Notifications
const notifBtn = document.getElementById("nx-notif-btn");
const notifPanel = document.getElementById("nx-notif-panel");

notifBtn?.addEventListener("click", () => {
  const hidden = notifPanel.style.display === "none" || !notifPanel.style.display;
  notifPanel.style.display = hidden ? "flex" : "none";
  if (hidden) loadNotifications();
});

document.getElementById("nx-notif-close")?.addEventListener("click", () => {
  if (notifPanel) notifPanel.style.display = "none";
});

async function loadNotifications() {
  const list = document.getElementById("nx-notif-list");
  if (!list) return;
  try {
    const resp = await fetch(NEXIS_API_BASE + "/admin/notifications?limit=20");
    const data = await resp.json();
    if (data?.data?.length) {
      list.innerHTML = data.data.map((n) => `
        <div class="nx-notif-item ${!n.isRead ? "unread" : ""}">
          <div class="nx-notif-item-title">${n.title}</div>
          <div class="nx-notif-item-msg">${n.message}</div>
        </div>
      `).join("");
      const badge = document.getElementById("nx-notif-badge");
      const unread = data.data.filter((n) => !n.isRead).length;
      if (badge) {
        badge.style.display = unread > 0 ? "flex" : "none";
        badge.textContent = unread;
      }
    } else {
      list.innerHTML = `<p class="nx-notif-empty">No notifications</p>`;
    }
  } catch {
    list.innerHTML = `<p class="nx-notif-empty">Failed to load</p>`;
  }
}

// Logout button
document.getElementById("nx-logout-btn")?.addEventListener("click", () => {
  if (!confirm("Deactivate and sign out?")) return;
  chrome.storage.local.clear(() => {
    const body = document.getElementById("sp-body");
    if (body) body.innerHTML = renderLicenseGate();
  });
});

// Listen for license invalidation from heartbeat
window.addEventListener("nexis:license-invalid", (e) => {
  const body = document.getElementById("sp-body");
  if (!body) return;
  const status = e.detail?.status || "invalid";
  body.innerHTML = renderStatusScreen(status, "Your license is no longer valid.");
});

// Init
document.addEventListener("DOMContentLoaded", initSidePanel);
