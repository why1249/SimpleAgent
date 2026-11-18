window.App = window.App || {};

(function (App) {
  const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  const activeSpinners = new Set();
  let frameIndex = 0;
  let spinnerTimer = null;

  function tickSpinners() {
    frameIndex = (frameIndex + 1) % SPINNER_FRAMES.length;
    const glyph = SPINNER_FRAMES[frameIndex];
    activeSpinners.forEach((node) => {
      if (!node.isConnected && node.id !== "status-glyph") {
        activeSpinners.delete(node);
        return;
      }
      node.textContent = glyph;
    });
    if (activeSpinners.size === 0 && spinnerTimer) {
      clearInterval(spinnerTimer);
      spinnerTimer = null;
    }
  }

  App.dom = {
    el(tag, className = "", text = "") {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text !== undefined && text !== null && text !== "") {
        node.textContent = text;
      }
      return node;
    },

    scrollToBottom(container, force = false) {
      if (!container) return;
      if (force) {
        container.scrollTop = container.scrollHeight;
        return;
      }
      const distanceToBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      if (distanceToBottom <= 72) {
        container.scrollTop = container.scrollHeight;
      }
    },

    formatDuration(startedAt) {
      if (!startedAt) return "";
      const sec = Math.max(0.1, (performance.now() - startedAt) / 1000);
      return sec < 10 ? `${sec.toFixed(1)}s` : `${Math.round(sec)}s`;
    },

    spinner: {
      start(node) {
        if (!node) return;
        node.textContent = SPINNER_FRAMES[frameIndex];
        activeSpinners.add(node);
        if (!spinnerTimer) {
          spinnerTimer = setInterval(tickSpinners, 80);
        }
      },

      stop(node, finalGlyph = "") {
        if (!node) return;
        activeSpinners.delete(node);
        if (finalGlyph !== null && finalGlyph !== undefined) {
          node.textContent = finalGlyph;
        }
        if (activeSpinners.size === 0 && spinnerTimer) {
          clearInterval(spinnerTimer);
          spinnerTimer = null;
        }
      },
    },
  };
})(window.App);
