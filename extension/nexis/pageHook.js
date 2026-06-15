// Nexis AI Tool — Page Hook (injected into MAIN world)
// Intercepts network requests on lovable.dev

(function () {
  const NEXIS_EVENT_PREFIX = "nexis:";

  const OriginalXHR = window.XMLHttpRequest;
  const originalFetch = window.fetch;

  // Intercept fetch
  window.fetch = async function (...args) {
    const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
    const result = await originalFetch.apply(this, args);
    return result;
  };

  // Intercept XHR
  const originalOpen = OriginalXHR.prototype.open;
  OriginalXHR.prototype.open = function (method, url, ...rest) {
    this._nexisUrl = url;
    this._nexisMethod = method;
    return originalOpen.call(this, method, url, ...rest);
  };

  // Forward events from page context to extension
  window.addEventListener("nexis:to-extension", (e) => {
    // Page scripts can dispatch events to communicate with the extension
  });
})();
