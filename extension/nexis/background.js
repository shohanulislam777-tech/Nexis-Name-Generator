// Nexis AI Tool — Background Service Worker
// Handles: side panel, proxy fetch, cookie reading, token storage

console.log("[Nexis] Background service worker started");

// ── Side panel behavior ───────────────────────────────────────────────────────
chrome.storage.local.get(["nx_sidebar_mode"], (result) => {
  const sidebarMode = result.nx_sidebar_mode ?? false;
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: sidebarMode }).catch(() => {});
  console.log("[Nexis] Sidebar mode:", sidebarMode);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.nx_sidebar_mode) {
    const enabled = changes.nx_sidebar_mode.newValue ?? false;
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: enabled }).catch(() => {});
    console.log("[Nexis] Sidebar mode updated:", enabled);
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  try {
    const result = await chrome.storage.local.get(["nx_sidebar_mode"]);
    if (result.nx_sidebar_mode && tab.id) {
      await chrome.sidePanel.open({ tabId: tab.id });
    }
  } catch (err) {
    console.error("[Nexis] action.onClicked error:", err);
  }
});

// ── Message handler ───────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.action) return;

  // Activate sidebar mode
  if (message.action === "activateSidebar") {
    chrome.storage.local.set({ nx_sidebar_mode: true });
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
    if (sender.tab?.id) {
      chrome.sidePanel.open({ tabId: sender.tab.id })
        .then(() => sendResponse({ ok: true }))
        .catch(() => sendResponse({ ok: true, deferred: true }));
    } else {
      sendResponse({ ok: true, deferred: true });
    }
    return true;
  }

  // Deactivate sidebar mode
  if (message.action === "deactivateSidebar") {
    chrome.storage.local.set({ nx_sidebar_mode: false });
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});
    sendResponse({ ok: true });
    return false;
  }

  // Open side panel explicitly
  if (message.action === "openSidePanel") {
    if (sender.tab?.id) {
      chrome.sidePanel.open({ tabId: sender.tab.id })
        .then(() => sendResponse({ ok: true }))
        .catch((err) => sendResponse({ ok: false, error: err.message }));
    } else {
      sendResponse({ ok: false, error: "No tab context" });
    }
    return true;
  }

  // Save auth tokens to storage
  if (message.action === "saveTokens") {
    const data = {};
    if (message.token) data.nx_token = message.token;
    if (message.projectId) data.nx_projectId = message.projectId;
    if (Object.keys(data).length) {
      chrome.storage.local.set(data, () => {
        console.log("[Nexis] Tokens saved:", Object.keys(data).join(", "));
      });
    }
    return;
  }

  // Proxy fetch (bypasses CORS restrictions)
  if (message.action === "proxyFetch") {
    (async () => {
      try {
        console.log("[Nexis] proxyFetch ->", message.url);
        const ALLOWED_HOSTS = ["api.lovable.dev", "lovable.dev", "lovable-api.com", "cdn.lovable.dev"];
        try {
          const hostname = new URL(message.url).hostname;
          const allowed = ALLOWED_HOSTS.some((h) => hostname === h || hostname.endsWith("." + h));
          if (!allowed) {
            sendResponse({ ok: false, status: 403, data: { error: "Host not allowed" } });
            return;
          }
        } catch {
          sendResponse({ ok: false, status: 400, data: { error: "Invalid URL" } });
          return;
        }

        const opts = {
          method: message.method || "POST",
          headers: message.headers || {},
        };
        if (message.body) opts.body = message.body;

        const resp = await fetch(message.url, opts);
        const text = await resp.text();
        let data;
        try { data = JSON.parse(text); } catch { data = { raw: text }; }
        sendResponse({ ok: resp.ok, status: resp.status, data });
      } catch (err) {
        console.error("[Nexis] proxyFetch error:", err);
        sendResponse({ ok: false, status: 0, data: { error: err.message || "Fetch failed" } });
      }
    })();
    return true;
  }

  // Read lovable.dev auth cookies
  if (message.action === "readLovableCookies") {
    const COOKIE_NAMES = ["lovable-session-id.id", "lovable-session-id.refresh", "lovable_token", "lovable-session-id.sig"];
    const tokens = [];
    let pending = COOKIE_NAMES.length;
    COOKIE_NAMES.forEach((name) => {
      chrome.cookies.get({ url: "https://lovable.dev", name }, (cookie) => {
        pending--;
        if (cookie?.value) {
          const parts = cookie.value.split(".");
          if (parts.length === 3 && cookie.value.startsWith("eyJ")) {
            tokens.push({ token: cookie.value, cookieName: name, httpOnly: cookie.httpOnly });
          }
        }
        if (pending === 0) sendResponse({ success: tokens.length > 0, tokens });
      });
    });
    return true;
  }

  // Get all lovable.dev cookies
  if (message.action === "getAllCookies") {
    chrome.cookies.getAll({ domain: "lovable.dev" }, (cookies) => {
      const pairs = [];
      if (cookies?.length) {
        cookies.forEach((c) => {
          if (c.name && typeof c.value === "string") {
            pairs.push(c.name + "=" + c.value);
          }
        });
      }
      sendResponse({ ok: true, cookie: pairs.join("; ") });
    });
    return true;
  }

  // Download project source code
  if (message.action === "downloadProject") {
    (async () => {
      try {
        const url = `https://lovable-api.com/projects/${message.projectId}/source-code`;
        const resp = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: "Bearer " + message.token,
            Accept: "application/json",
          },
        });
        if (!resp.ok) {
          sendResponse({ success: false, error: "API returned " + resp.status });
          return;
        }
        const data = await resp.json();
        sendResponse({ success: true, files: data.files || [] });
      } catch (err) {
        sendResponse({ success: false, error: err.message || "Download failed" });
      }
    })();
    return true;
  }
});
