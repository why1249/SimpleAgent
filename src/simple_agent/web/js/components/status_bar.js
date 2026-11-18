window.App = window.App || {};
window.App.components = window.App.components || {};

(function (App) {
  let els = {};

  function formatCwd(cwd) {
    if (!cwd) return "~";
    const match = cwd.match(/^\/home\/[^/]+(.*)$/);
    if (match) {
      return match[1] ? `~${match[1]}` : "~";
    }
    return cwd;
  }

  App.components.statusBar = {
    init({ onOpenSettings }) {
      els = {
        cwd: document.getElementById("badge-cwd"),
        model: document.getElementById("badge-model"),
        statusPill: document.getElementById("status-pill"),
        statusText: document.getElementById("status-text"),
        btnSettings: document.getElementById("btn-settings"),
      };

      if (els.model && onOpenSettings) {
        els.model.addEventListener("click", onOpenSettings);
      }
      if (els.btnSettings && onOpenSettings) {
        els.btnSettings.addEventListener("click", onOpenSettings);
      }
    },

    updateMeta({ cwd, model }) {
      if (els.cwd && cwd !== undefined) {
        els.cwd.textContent = formatCwd(cwd);
        els.cwd.title = cwd || "";
      }
      if (els.model && model !== undefined) {
        els.model.textContent = model || "未配置模型";
      }
    },

    setStatus(text, mode = "ready") {
      if (!els.statusPill || !els.statusText) return;
      els.statusText.textContent = text;
      els.statusPill.className = "status-pill";
      if (mode === "busy") {
        els.statusPill.classList.add("is-busy");
      } else if (mode === "active") {
        els.statusPill.classList.add("is-active");
      } else if (mode === "error") {
        els.statusPill.classList.add("is-error");
      }
    },
  };
})(window.App);
