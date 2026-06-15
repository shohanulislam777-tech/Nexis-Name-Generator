// Nexis AI Tool — Internationalization

const NexisI18n = {
  locale: "en",

  strings: {
    en: {
      "loading": "Loading...",
      "header.notifications": "Notifications",
      "header.theme": "Toggle Theme",
      "header.logout": "Sign Out",
      "footer.support": "Support",
      "sp.backToPopup": "Popup",
      "notif.title": "Notifications",
      "notif.markRead": "Mark all as read",
      "notif.loading": "Loading...",
      "notif.empty": "No notifications",
      "license.title": "Activate Nexis",
      "license.subtitle": "Enter your license key to continue",
      "license.placeholder": "NEXIS-XXXX-XXXX-XXXX-XXXX",
      "license.validate": "Activate License",
      "license.validating": "Validating...",
      "license.expired": "Your license has expired",
      "license.suspended": "Your license has been suspended",
      "license.revoked": "Your license has been revoked",
      "license.contact": "Contact support",
    }
  },

  t(key) {
    const lang = this.strings[this.locale] || this.strings.en;
    return lang[key] || key;
  },

  applyToDOM() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (key) el.textContent = this.t(key);
    });
    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
      const key = el.getAttribute("data-i18n-title");
      if (key) el.setAttribute("title", this.t(key));
    });
  },
};
