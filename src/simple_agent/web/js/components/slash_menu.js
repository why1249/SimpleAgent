window.App = window.App || {};
window.App.components = window.App.components || {};

(function (App) {
  let menuEl = null;
  let listEl = null;
  let matches = [];
  let selectedIndex = 0;
  let onPickHandler = null;

  function render() {
    if (!menuEl || !listEl) return;

    listEl.innerHTML = "";
    if (matches.length === 0) {
      menuEl.classList.add("hidden");
      return;
    }

    const { el } = App.dom;
    matches.forEach((cmd, idx) => {
      const btn = el("button", "slash-menu-item");
      btn.type = "button";
      if (idx === selectedIndex) {
        btn.classList.add("is-selected");
      }

      btn.appendChild(el("span", "slash-cmd-name", cmd.name));
      btn.appendChild(el("span", "slash-cmd-desc", cmd.description || ""));

      btn.addEventListener("mouseenter", () => {
        selectedIndex = idx;
        updateHighlight();
      });

      btn.addEventListener("mousedown", (e) => {
        // 阻止输入框失焦
        e.preventDefault();
        if (onPickHandler) {
          onPickHandler(cmd.name, true);
        }
      });

      listEl.appendChild(btn);
    });

    menuEl.classList.remove("hidden");
  }

  function updateHighlight() {
    if (!listEl) return;
    Array.from(listEl.children).forEach((node, idx) => {
      node.classList.toggle("is-selected", idx === selectedIndex);
    });
  }

  App.components.slashMenu = {
    init({ onPick }) {
      menuEl = document.getElementById("slash-menu");
      listEl = document.getElementById("slash-menu-list");
      onPickHandler = onPick;
    },

    update(inputValue) {
      const trimmed = inputValue.trimStart();
      if (!/^\/\S*$/.test(trimmed)) {
        this.hide();
        return;
      }

      const query = trimmed.toLowerCase();
      const allCommands = Object.values(App.state.commands || {});
      matches = allCommands.filter((cmd) =>
        (cmd.name || "").toLowerCase().startsWith(query)
      );
      selectedIndex = 0;
      render();
    },

    isOpen() {
      return Boolean(menuEl && !menuEl.classList.contains("hidden") && matches.length > 0);
    },

    move(delta) {
      if (!this.isOpen()) return;
      selectedIndex = (selectedIndex + delta + matches.length) % matches.length;
      updateHighlight();
    },

    getSelected() {
      if (!this.isOpen()) return null;
      return matches[selectedIndex] || null;
    },

    hide() {
      matches = [];
      selectedIndex = 0;
      if (menuEl) {
        menuEl.classList.add("hidden");
      }
    },
  };
})(window.App);
