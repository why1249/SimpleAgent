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
        modelBtn: document.getElementById("badge-model"),
        modelVal: document.getElementById("badge-model-val"),
        emptyCwd: document.getElementById("empty-cwd"),
        emptyModel: document.getElementById("empty-model"),
        emptyTools: document.getElementById("empty-tools"),
        statusPill: document.getElementById("status-pill"),
        statusGlyph: document.getElementById("status-glyph"),
        statusText: document.getElementById("status-text"),
        btnSettings: document.getElementById("btn-settings"),
      };

      if (onOpenSettings) {
        if (els.modelBtn) els.modelBtn.addEventListener("click", onOpenSettings);
        if (els.emptyModel) els.emptyModel.addEventListener("click", onOpenSettings);
        if (els.btnSettings) els.btnSettings.addEventListener("click", onOpenSettings);
        document.querySelectorAll("[data-open-settings]").forEach((btn) => {
          btn.addEventListener("click", onOpenSettings);
        });
      }
    },

    updateMeta({ cwd, model, tools }) {
      if (cwd !== undefined) {
        const displayCwd = formatCwd(cwd);
        if (els.cwd) {
          els.cwd.textContent = displayCwd;
          els.cwd.title = cwd || "";
        }
        if (els.emptyCwd) {
          els.emptyCwd.textContent = displayCwd;
          els.emptyCwd.title = cwd || "";
        }
      }

      if (model !== undefined) {
        const displayModel = model || "unconfigured";
        if (els.modelVal) els.modelVal.textContent = displayModel;
        if (els.emptyModel) els.emptyModel.textContent = displayModel;
      }

      if (Array.isArray(tools) && tools.length > 0 && els.emptyTools) {
        els.emptyTools.textContent = tools.join(" · ");
      }
    },

    setStatus(text, mode = "ready") {
      if (!els.statusPill || !els.statusText || !els.statusGlyph) return;
      els.statusText.textContent = text;
      els.statusPill.className = "status-readout";

      if (mode === "busy") {
        els.statusPill.classList.add("is-busy");
        App.dom.spinner.start(els.statusGlyph);
      } else if (mode === "active") {
        els.statusPill.classList.add("is-active");
        App.dom.spinner.start(els.statusGlyph);
      } else if (mode === "error") {
        els.statusPill.classList.add("is-error");
        App.dom.spinner.stop(els.statusGlyph, "!");
      } else {
        App.dom.spinner.stop(els.statusGlyph, "▪");
      }
    },
  };
})(window.App);
