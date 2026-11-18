window.App = window.App || {};
window.App.components = window.App.components || {};

(function (App) {
  let els = {};

  function updateEmptyState() {
    if (!els.emptyState || !els.messagesList) return;
    const hasMessages = els.messagesList.children.length > 0;
    els.emptyState.style.display = hasMessages ? "none" : "block";
  }

  function scrollToBottom(force = false) {
    App.dom.scrollToBottom(els.container, force);
  }

  App.components.chatView = {
    init() {
      els = {
        container: document.getElementById("chat-container"),
        messagesList: document.getElementById("messages"),
        emptyState: document.getElementById("empty-state"),
      };
      updateEmptyState();
    },

    appendUserMessage(text) {
      const { el } = App.dom;
      const item = el("div", "message-item");
      const block = el("div", "user-block");
      block.appendChild(el("span", "user-prompt-mark", "›"));
      block.appendChild(el("div", "user-prompt-text", text));
      item.appendChild(block);

      els.messagesList.appendChild(item);
      updateEmptyState();
      scrollToBottom(true);
    },

    startAssistantTurn() {
      const { el } = App.dom;

      const item = el("div", "message-item assistant-turn");
      const stepsStack = el("div", "steps-stack is-empty");

      // 思考过程单行树节点（仅在收到 reasoning 事件时显现）
      const thoughtDetails = el("details", "step-row step-thinking hidden");
      thoughtDetails.open = true;

      const thoughtSummary = el("summary", "step-summary");
      const thoughtLeft = el("div", "step-summary-left");
      const thoughtGlyph = el("span", "step-glyph is-running", "·");
      const thoughtLabel = el("span", "step-name", "thinking");
      thoughtLeft.appendChild(thoughtGlyph);
      thoughtLeft.appendChild(thoughtLabel);

      const thoughtMeta = el("span", "step-meta is-running");
      const thoughtTime = el("span", "step-time", "running");
      const thoughtToggle = el("span", "step-toggle-mark");
      thoughtMeta.appendChild(thoughtTime);
      thoughtMeta.appendChild(thoughtToggle);

      thoughtSummary.appendChild(thoughtLeft);
      thoughtSummary.appendChild(thoughtMeta);

      const thoughtBody = el("div", "step-body");
      const thoughtPre = el("pre", "step-pre");
      thoughtBody.appendChild(thoughtPre);

      thoughtDetails.appendChild(thoughtSummary);
      thoughtDetails.appendChild(thoughtBody);
      stepsStack.appendChild(thoughtDetails);

      item.appendChild(stepsStack);

      const markdownEl = el("div", "markdown-body");
      item.appendChild(markdownEl);

      els.messagesList.appendChild(item);
      updateEmptyState();
      scrollToBottom(true);

      App.state.activeTurn = {
        rootEl: item,
        stepsStack,
        thoughtDetails,
        thoughtGlyph,
        thoughtMeta,
        thoughtTime,
        thoughtPre,
        thoughtStartedAt: 0,
        markdownEl,
        toolMap: {},
        toolList: [],
        lastToolStep: null,
        rawMarkdown: "",
        hasThought: false,
        thoughtFinalized: false,
      };
    },

    appendReasoning(chunk) {
      const turn = App.state.activeTurn;
      if (!turn) return;

      if (!turn.hasThought) {
        turn.hasThought = true;
        turn.thoughtStartedAt = performance.now();
        turn.stepsStack.classList.remove("is-empty");
        turn.thoughtDetails.classList.remove("hidden");
        App.dom.spinner.start(turn.thoughtGlyph);
      }

      turn.thoughtPre.textContent += chunk;
      turn.thoughtPre.scrollTop = turn.thoughtPre.scrollHeight;
      scrollToBottom(false);
    },

    finalizeThinking(collapse = true) {
      const turn = App.state.activeTurn;
      if (!turn || turn.thoughtFinalized) return;

      turn.thoughtFinalized = true;
      if (turn.hasThought) {
        App.dom.spinner.stop(turn.thoughtGlyph, "·");
        turn.thoughtGlyph.className = "step-glyph is-done";
        turn.thoughtMeta.className = "step-meta";
        turn.thoughtTime.textContent = App.dom.formatDuration(turn.thoughtStartedAt);
        if (collapse) {
          turn.thoughtDetails.open = false;
        }
      } else {
        turn.thoughtDetails.classList.add("hidden");
      }
    },

    appendContent(chunk) {
      const turn = App.state.activeTurn;
      if (!turn) return;

      this.finalizeThinking(true);
      turn.rawMarkdown += chunk;
      App.markdown.render(turn.markdownEl, turn.rawMarkdown);
      scrollToBottom(false);
    },

    appendToolCall({ id, name, args }) {
      const turn = App.state.activeTurn;
      if (!turn) return;

      this.finalizeThinking(true);
      turn.stepsStack.classList.remove("is-empty");

      const stepRef = App.components.toolStep.create(name, args);
      turn.stepsStack.appendChild(stepRef.element);
      turn.toolMap[id || name] = stepRef;
      turn.toolList.push(stepRef);
      turn.lastToolStep = stepRef;
      scrollToBottom(false);
    },

    completeToolCall({ id, name, result }) {
      const turn = App.state.activeTurn;
      if (!turn) return;

      const stepRef = turn.toolMap[id || name] || turn.lastToolStep;
      if (stepRef) {
        App.components.toolStep.complete(stepRef, result);
      }
      scrollToBottom(false);
    },

    appendTurnError(message) {
      const turn = App.state.activeTurn;
      const errBox = App.dom.el("div", "turn-error-box", `error: ${message}`);
      if (turn && turn.rootEl) {
        turn.rootEl.appendChild(errBox);
      } else {
        this.appendSystemNotice(message, "error");
      }
      scrollToBottom(false);
    },

    finishTurn() {
      const turn = App.state.activeTurn;
      this.finalizeThinking(false);
      if (turn && Array.isArray(turn.toolList)) {
        turn.toolList.forEach((stepRef) => {
          if (!stepRef.completed) {
            App.components.toolStep.abort(stepRef);
          }
        });
      }
      App.state.resetTurn();
    },

    appendSystemNotice(message, level = "info") {
      const { el } = App.dom;
      const levelClass = level && level !== "info" ? ` is-${level}` : "";
      const line = el("div", `system-notice${levelClass}`, message);

      els.messagesList.appendChild(line);
      updateEmptyState();
      scrollToBottom(true);
    },

    clear() {
      if (els.messagesList) {
        els.messagesList.innerHTML = "";
      }
      App.state.resetTurn();
      updateEmptyState();
    },
  };
})(window.App);
