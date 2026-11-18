window.App = window.App || {};

(function (App) {
  if (typeof marked !== "undefined") {
    marked.use({
      breaks: true,
      gfm: true,
    });
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    }
    return Promise.resolve(fallbackCopy(text));
  }

  function fallbackCopy(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
    } finally {
      document.body.removeChild(textarea);
    }
  }

  App.markdown = {
    render(element, markdownText) {
      if (!element) return;

      if (typeof marked === "undefined") {
        element.textContent = markdownText;
        return;
      }

      element.innerHTML = marked.parse(markdownText);

      element.querySelectorAll("pre code").forEach((codeBlock) => {
        if (typeof hljs !== "undefined" && !codeBlock.classList.contains("hljs")) {
          hljs.highlightElement(codeBlock);
        }

        const pre = codeBlock.parentElement;
        if (!pre || !pre.parentElement || pre.parentElement.classList.contains("code-block-wrapper")) {
          return;
        }

        const wrapper = App.dom.el("div", "code-block-wrapper");
        const header = App.dom.el("div", "code-header");

        const langClass = Array.from(codeBlock.classList).find((c) => c.startsWith("language-"));
        const langName = langClass ? langClass.replace("language-", "") : "text";

        const langSpan = App.dom.el("span", "", langName);
        const copyBtn = App.dom.el("button", "btn-copy", "复制");
        copyBtn.type = "button";
        copyBtn.addEventListener("click", () => {
          copyText(codeBlock.innerText).then(() => {
            copyBtn.textContent = "已复制";
            setTimeout(() => {
              copyBtn.textContent = "复制";
            }, 1500);
          });
        });

        header.appendChild(langSpan);
        header.appendChild(copyBtn);

        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(header);
        wrapper.appendChild(pre);
      });
    },
  };
})(window.App);
