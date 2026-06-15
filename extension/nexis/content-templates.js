// Nexis AI Tool — Content Templates
// Provides AI prompt templates and shortcuts for lovable.dev

const NexisTemplates = {
  categories: {
    "UI Components": [
      {
        name: "Modern Dashboard",
        prompt: "Create a modern admin dashboard with a sidebar, stats cards, and a data table. Use Tailwind CSS with a dark color scheme.",
      },
      {
        name: "Auth Pages",
        prompt: "Create login and signup pages with form validation, error states, and a clean professional design.",
      },
      {
        name: "Landing Page Hero",
        prompt: "Create a compelling hero section with a headline, subtext, CTA buttons, and an animated background. Make it modern and conversion-focused.",
      },
    ],
    "Backend Features": [
      {
        name: "REST API",
        prompt: "Set up a REST API with CRUD operations, input validation, error handling, and proper HTTP status codes.",
      },
      {
        name: "Authentication",
        prompt: "Implement JWT authentication with login, register, refresh tokens, and protected routes.",
      },
    ],
    "Database": [
      {
        name: "Schema Design",
        prompt: "Design a PostgreSQL database schema with proper relationships, indexes, and constraints for a SaaS application.",
      },
    ],
  },

  render(container) {
    if (!container) return;
    const html = Object.entries(this.categories).map(([cat, templates]) => `
      <div class="nx-template-cat">
        <div class="nx-template-cat-title">${cat}</div>
        ${templates.map((t) => `
          <button class="nx-template-btn" data-prompt="${t.prompt.replace(/"/g, "&quot;")}">
            ${t.name}
          </button>
        `).join("")}
      </div>
    `).join("");
    container.innerHTML = `<div class="nx-templates">${html}</div>`;
    container.querySelectorAll(".nx-template-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const prompt = btn.getAttribute("data-prompt");
        if (!prompt) return;
        // Try to insert into active Lovable input
        const input = document.querySelector("textarea[placeholder]");
        if (input) {
          input.value = prompt;
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.focus();
        }
      });
    });
  },
};
