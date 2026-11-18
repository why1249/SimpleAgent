window.App = window.App || {};
window.App.components = window.App.components || {};

(function (App) {
  let els = {};
  let onSavedHandler = null;

  function showFeedback(text, type = "error") {
    if (!els.feedback) return;
    els.feedback.textContent = text;
    els.feedback.className = `modal-feedback is-${type}`;
  }

  function clearFeedback() {
    if (!els.feedback) return;
    els.feedback.textContent = "";
    els.feedback.className = "modal-feedback hidden";
  }

  async function handleSave() {
    const apiKey = els.apiKey.value.trim();
    const baseUrl = els.baseUrl.value.trim();
    const model = els.model.value.trim();
    const reasoning = els.reasoning.value.trim();

    if (!apiKey) {
      showFeedback("请输入有效的 API Key（保存配置会更新本地 .env 文件）", "error");
      els.apiKey.focus();
      return;
    }

    clearFeedback();
    els.btnSave.disabled = true;

    try {
      const res = await App.bridge.saveConfig({
        api_key: apiKey,
        base_url: baseUrl,
        model,
        reasoning_effort: reasoning,
      });

      if (res && res.success) {
        if (onSavedHandler) {
          onSavedHandler(res);
        }
        App.components.settingsModal.close();
      } else {
        showFeedback("保存失败，请检查配置项", "error");
      }
    } catch (err) {
      showFeedback(`保存失败: ${err}`, "error");
    } finally {
      els.btnSave.disabled = false;
    }
  }

  App.components.settingsModal = {
    init({ onSaved }) {
      onSavedHandler = onSaved;
      els = {
        overlay: document.getElementById("settings-modal"),
        btnClose: document.getElementById("btn-close-modal"),
        btnCancel: document.getElementById("btn-cancel-config"),
        btnSave: document.getElementById("btn-save-config"),
        apiKey: document.getElementById("cfg-api-key"),
        baseUrl: document.getElementById("cfg-base-url"),
        model: document.getElementById("cfg-model"),
        reasoning: document.getElementById("cfg-reasoning"),
        feedback: document.getElementById("modal-feedback"),
      };

      if (els.btnClose) els.btnClose.addEventListener("click", () => this.close());
      if (els.btnCancel) els.btnCancel.addEventListener("click", () => this.close());
      if (els.btnSave) els.btnSave.addEventListener("click", handleSave);

      if (els.overlay) {
        els.overlay.addEventListener("click", (e) => {
          if (e.target === els.overlay) {
            this.close();
          }
        });
      }
    },

    populate(config) {
      if (!els.apiKey) return;
      els.apiKey.value = "";
      els.apiKey.placeholder = config.has_config
        ? "已配置（修改配置时需重新输入）"
        : "sk-...";
      els.baseUrl.value = config.base_url || "https://api.deepseek.com/v1";
      els.model.value = config.model || "deepseek-chat";
      els.reasoning.value = config.reasoning_effort || "default";
    },

    isOpen() {
      return Boolean(els.overlay && !els.overlay.classList.contains("hidden"));
    },

    open() {
      if (!els.overlay) return;
      clearFeedback();
      els.overlay.classList.remove("hidden");
      if (els.apiKey) els.apiKey.focus();
    },

    close() {
      if (!els.overlay) return;
      els.overlay.classList.add("hidden");
      clearFeedback();
      App.components.inputBar.focus();
    },

    toggle() {
      if (this.isOpen()) {
        this.close();
      } else {
        this.open();
      }
    },
  };
})(window.App);
