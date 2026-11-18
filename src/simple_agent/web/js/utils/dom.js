window.App = window.App || {};

(function (App) {
  App.dom = {
    el(tag, className = "", text = "") {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text !== undefined && text !== null && text !== "") {
        node.textContent = text;
      }
      return node;
    },

    scrollToBottom(container) {
      if (!container) return;
      container.scrollTop = container.scrollHeight;
    },
  };
})(window.App);
