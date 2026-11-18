window.App = window.App || {};
window.App.components = window.App.components || {};

(function (App) {
  function extractArgPreview(rawArgs) {
    if (!rawArgs) return "";
    const text = String(rawArgs).trim();
    if (!text) return "";
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object") {
        const firstVal = Object.values(parsed).find(
          (v) => typeof v === "string" || typeof v === "number"
        );
        if (firstVal !== undefined) {
          return String(firstVal).replace(/\s+/g, " ").trim();
        }
      }
    } catch (_) {
      // 非 JSON 字符串直接取单行摘要
    }
    return text.replace(/\s+/g, " ").slice(0, 80);
  }

  function formatArgs(rawArgs) {
    if (!rawArgs) return "（无参数）";
    const text = String(rawArgs).trim();
    if (!text) return "（无参数）";
    try {
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch (_) {
      return text;
    }
  }

  App.components.toolStep = {
    create(name, args) {
      const { el } = App.dom;

      const details = el("details", "step-row step-tool");
      const summary = el("summary", "step-summary");

      const left = el("div", "step-summary-left");
      const indicator = el("span", "step-indicator is-running");
      const nameSpan = el("span", "step-name", name);
      const previewSpan = el("span", "step-arg-preview", extractArgPreview(args));

      left.appendChild(indicator);
      left.appendChild(nameSpan);
      left.appendChild(previewSpan);

      const badge = el("span", "step-badge is-running", "运行中");
      summary.appendChild(left);
      summary.appendChild(badge);

      const body = el("div", "step-body");
      const argsSection = el("div", "step-section");
      argsSection.appendChild(el("div", "step-section-label", "Arguments"));
      argsSection.appendChild(el("pre", "step-pre", formatArgs(args)));
      body.appendChild(argsSection);

      details.appendChild(summary);
      details.appendChild(body);

      return {
        element: details,
        indicator,
        badge,
        body,
      };
    },

    complete(stepRef, result) {
      if (!stepRef) return;
      const { el } = App.dom;

      stepRef.indicator.className = "step-indicator is-done";
      stepRef.badge.className = "step-badge is-done";
      stepRef.badge.textContent = "完成";

      const resultSection = el("div", "step-section");
      resultSection.appendChild(el("div", "step-section-label", "Output"));
      resultSection.appendChild(el("pre", "step-pre", result ? String(result) : "（无输出）"));
      stepRef.body.appendChild(resultSection);
    },
  };
})(window.App);
