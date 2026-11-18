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
        const preferred =
          parsed.path ?? parsed.file_path ?? parsed.command ?? parsed.cmd;
        if (typeof preferred === "string" || typeof preferred === "number") {
          return String(preferred).replace(/\s+/g, " ").trim();
        }
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
    return text.replace(/\s+/g, " ").slice(0, 90);
  }

  function formatArgs(rawArgs) {
    if (!rawArgs) return "(empty)";
    const text = String(rawArgs).trim();
    if (!text) return "(empty)";
    try {
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch (_) {
      return text;
    }
  }

  App.components.toolStep = {
    create(name, args) {
      const { el, spinner } = App.dom;
      const startedAt = performance.now();

      const details = el("details", "step-row step-tool");
      const summary = el("summary", "step-summary");

      const left = el("div", "step-summary-left");
      const glyph = el("span", "step-glyph is-running");
      spinner.start(glyph);

      const nameSpan = el("span", "step-name", name);
      const previewSpan = el("span", "step-arg-preview", extractArgPreview(args));

      left.appendChild(glyph);
      left.appendChild(nameSpan);
      left.appendChild(previewSpan);

      const meta = el("span", "step-meta is-running");
      const timeSpan = el("span", "step-time", "running");
      const toggleMark = el("span", "step-toggle-mark");
      meta.appendChild(timeSpan);
      meta.appendChild(toggleMark);

      summary.appendChild(left);
      summary.appendChild(meta);

      const body = el("div", "step-body");
      const argsSection = el("div", "step-section");
      argsSection.appendChild(el("div", "step-section-label", "args"));
      argsSection.appendChild(el("pre", "step-pre", formatArgs(args)));
      body.appendChild(argsSection);

      details.appendChild(summary);
      details.appendChild(body);

      return {
        element: details,
        glyph,
        meta,
        timeSpan,
        body,
        startedAt,
        completed: false,
      };
    },

    complete(stepRef, result) {
      if (!stepRef || stepRef.completed) return;
      const { el, spinner, formatDuration } = App.dom;

      stepRef.completed = true;
      spinner.stop(stepRef.glyph, "✓");
      stepRef.glyph.className = "step-glyph is-done";
      stepRef.meta.className = "step-meta";
      stepRef.timeSpan.textContent = formatDuration(stepRef.startedAt);

      const resultSection = el("div", "step-section");
      resultSection.appendChild(el("div", "step-section-label", "output"));
      resultSection.appendChild(
        el("pre", "step-pre", result ? String(result) : "(empty)")
      );
      stepRef.body.appendChild(resultSection);
    },

    abort(stepRef) {
      if (!stepRef || stepRef.completed) return;
      stepRef.completed = true;
      App.dom.spinner.stop(stepRef.glyph, "×");
      stepRef.glyph.className = "step-glyph";
      stepRef.meta.className = "step-meta";
      stepRef.timeSpan.textContent = "aborted";
    },
  };
})(window.App);
