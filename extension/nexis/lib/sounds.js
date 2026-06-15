// Nexis AI Tool — Sound System

const NexisSounds = {
  _cache: {},

  play(name) {
    try {
      const files = {
        "error-payment": chrome.runtime.getURL("sounds/error-payment.mp3"),
        "error-ratelimit": chrome.runtime.getURL("sounds/error-ratelimit.mp3"),
        "error-token": chrome.runtime.getURL("sounds/error-token.mp3"),
      };
      const url = files[name];
      if (!url) return;
      if (!this._cache[name]) {
        this._cache[name] = new Audio(url);
      }
      this._cache[name].currentTime = 0;
      this._cache[name].play().catch(() => {});
    } catch {}
  },

  errorPayment() { this.play("error-payment"); },
  errorRateLimit() { this.play("error-ratelimit"); },
  errorToken() { this.play("error-token"); },
};
