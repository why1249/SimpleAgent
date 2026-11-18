window.App = window.App || {};
window.App.components = window.App.components || {};

(function (App) {
  let textarea = null;
  let sendBtn = null;
  let onSubmitHandler = null;

  const history = [];
  let historyIndex = -1;
  let draftInput = "";

  function autoResize() {
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  }

  function pushHistory(text) {
    if (!text) return;
    if (history[history.length - 1] !== text) {
      history.push(text);
    }
    historyIndex = history.length;
    draftInput = "";
  }

  function submitCurrent() {
    if (!textarea || App.state.isBusy) return;
    const text = textarea.value.trim();
    if (!text) return;

    pushHistory(text);
    textarea.value = "";
    autoResize();
    App.components.slashMenu.hide();

    if (onSubmitHandler) {
      onSubmitHandler(text);
    }
  }

  App.components.inputBar = {
    init({ onSubmit }) {
      textarea = document.getElementById("prompt-input");
      sendBtn = document.getElementById("send-btn");
      onSubmitHandler = onSubmit;

      if (!textarea) return;

      textarea.addEventListener("input", () => {
        autoResize();
        App.components.slashMenu.update(textarea.value);
      });

      textarea.addEventListener("keydown", (e) => {
        const slashMenu = App.components.slashMenu;

        // 若斜杠命令菜单打开，优先交由菜单处理导航与补全
        if (slashMenu.isOpen()) {
          if (e.key === "ArrowUp") {
            e.preventDefault();
            slashMenu.move(-1);
            return;
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            slashMenu.move(1);
            return;
          }
          if (e.key === "Tab") {
            e.preventDefault();
            const selected = slashMenu.getSelected();
            if (selected) {
              textarea.value = selected.name;
              autoResize();
              slashMenu.hide();
            }
            return;
          }
          if (e.key === "Escape") {
            e.preventDefault();
            slashMenu.hide();
            return;
          }
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            const selected = slashMenu.getSelected();
            if (selected) {
              textarea.value = selected.name;
            }
            submitCurrent();
            return;
          }
        }

        // Enter 发送，Shift+Enter 换行
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          submitCurrent();
          return;
        }

        // 上翻输入历史
        if (
          e.key === "ArrowUp" &&
          (textarea.selectionStart === 0 || !textarea.value.includes("\n"))
        ) {
          if (history.length > 0) {
            if (historyIndex === history.length) {
              draftInput = textarea.value;
            }
            if (historyIndex > 0) {
              historyIndex--;
              textarea.value = history[historyIndex];
              autoResize();
            }
            e.preventDefault();
          }
          return;
        }

        // 下翻输入历史
        if (
          e.key === "ArrowDown" &&
          (textarea.selectionStart === textarea.value.length || !textarea.value.includes("\n"))
        ) {
          if (historyIndex < history.length) {
            historyIndex++;
            textarea.value =
              historyIndex === history.length ? draftInput : history[historyIndex];
            autoResize();
            e.preventDefault();
          }
        }
      });

      if (sendBtn) {
        sendBtn.addEventListener("click", submitCurrent);
      }

      // 空状态快捷指令卡片
      document.querySelectorAll(".quick-item").forEach((item) => {
        item.addEventListener("click", () => {
          const prompt = item.getAttribute("data-prompt");
          if (!prompt || App.state.isBusy) return;
          textarea.value = prompt;
          autoResize();
          submitCurrent();
        });
      });
    },

    setBusy(busy) {
      if (textarea) textarea.disabled = busy;
      if (sendBtn) sendBtn.disabled = busy;
      if (!busy) {
        this.focus();
      }
    },

    setValue(text, execute = false) {
      if (!textarea) return;
      textarea.value = text;
      autoResize();
      if (execute) {
        submitCurrent();
      } else {
        this.focus();
      }
    },

    focus() {
      if (textarea && !textarea.disabled) {
        textarea.focus();
      }
    },

    isFocused() {
      return document.activeElement === textarea;
    },
  };
})(window.App);
