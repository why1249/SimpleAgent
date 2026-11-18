window.App = window.App || {};
window.App.components = window.App.components || {};

(function (App) {
  let els = {};

  function updateEmptyState() {
    if (!els.emptyState || !els.messagesList) return;
    const hasMessages = els.messagesList.children.length > 0;
    els.emptyState.style.display = hasMessages ? "none" : "block";
  }

  function scrollToBottom() {
    App.dom.scrollToBottom(els.container);
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
      scrollToBottom();
    },

    startAssistantTurn() {
      const { el } = App.dom;

      const item = el("div", "message-item assistant-turn");
      const meta = el("div", "assistant-meta");
      meta.appendChild(el("span", "assistant-meta-dot"));
      meta.appendChild(el("span", "", "agent"));
      item.appendChild(meta);

      const stepsStack = el("div", "steps-stack");

      // 思考过程折叠条（仅在收到 reasoning 事件时显示）
      const thoughtDetails = el("details", "step-row step-thinking hidden");
      thoughtDetails.open = true;

      const thoughtSummary = el("summary", "step-summary");
      const thoughtLeft = el("div", "step-summary-left");
      const thoughtIndicator = el("span", "step-indicator is-running");
      const thoughtLabel = el("span", "step-name", "思考过程");
      thoughtLeft.appendChild(thoughtIndicator);
      thoughtLeft.appendChild(thoughtLabel);

      const thoughtBadge = el("span", "step-badge is-running", "思考中");
      thoughtSummary.appendChild(thoughtLeft);
      thoughtSummary.appendChild(thoughtBadge);

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
      scrollToBottom();

      App.state.activeTurn = {
        rootEl: item,
        stepsStack,
        thoughtDetails,
        thoughtIndicator,
        thoughtBadge,
        thoughtPre,
        markdownEl,
        toolMap: {},
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
        turn.thoughtDetails.classList.remove("hidden");
      }

      turn.thoughtPre.textContent += chunk;
      turn.thoughtPre.scrollTop = turn.thoughtPre.scrollHeight;
      scrollToBottom();
    },

    finalizeThinking(collapse = true) {
      const turn = App.state.activeTurn;
      if (!turn || turn.thoughtFinalized) return;

      turn.thoughtFinalized = true;
      if (turn.hasThought) {
        turn.thoughtIndicator.className = "step-indicator is-done";
        turn.thoughtBadge.className = "step-badge is-done";
        turn.thoughtBadge.textContent = "已完成";
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
      scrollToBottom();
    },

    appendToolCall({ id, name, args }) {
      const turn = App.state.activeTurn;
      if (!turn) return;

      this.finalizeThinking(true);
      const stepRef = App.components.toolStep.create(name, args);
      turn.stepsStack.appendChild(stepRef.element);
      turn.toolMap[id || name] = stepRef;
      turn.lastToolStep = stepRef;
      scrollToBottom();
    },

    completeToolCall({ id, name, result }) {
      const turn = App.state.activeTurn;
      if (!turn) return;

      const stepRef = turn.toolMap[id || name] || turn.lastToolStep;
      if (stepRef) {
        App.components.toolStep.complete(stepRef, result);
      }
      scrollToBottom();
    },

    appendTurnError(message) {
      const turn = App.state.activeTurn;
      const errBox = App.dom.el("div", "turn-error-box", `错误：${message}`);
      if (turn && turn.rootEl) {
        turn.rootEl.appendChild(errBox);
      } else {
        this.appendSystemNotice(message, "error");
      }
      scrollToBottom();
    },

    finishTurn() {
      this.finalizeThinking(false);
      App.state.resetTurn();
    },

    appendSystemNotice(message, level = "info") {
      const { el } = App.dom;
      const levelClass = level && level !== "info" ? ` is-${level}` : "";
      const wrapper = el("div", `system-notice${levelClass}`);
      wrapper.appendChild(el("span", "system-notice-pill", message));

      els.messagesList.appendChild(wrapper);
      updateEmptyState();
      scrollToBottom();
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
