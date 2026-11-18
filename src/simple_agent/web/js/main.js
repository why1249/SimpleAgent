window.App = window.App || {};

(function (App) {
  let initialized = false;

  async function submitInput(text) {
    const { chatView, statusBar, inputBar } = App.components;

    // 斜杠命令：直接转发给后端，不进入对话流忙碌态
    if (text.startsWith("/")) {
      chatView.appendUserMessage(text);
      try {
        const res = await App.bridge.sendMessage(text);
        if (res && !res.success) {
          chatView.appendSystemNotice(`命令执行失败: ${res.error || "未知错误"}`, "error");
        }
      } catch (err) {
        chatView.appendSystemNotice(`调用命令异常: ${err}`, "error");
      }
      return;
    }

    // 普通对话消息
    App.state.isBusy = true;
    inputBar.setBusy(true);
    statusBar.setStatus("Thinking", "busy");
    chatView.appendUserMessage(text);
    chatView.startAssistantTurn();

    try {
      const res = await App.bridge.sendMessage(text);
      if (res && !res.success) {
        App.state.isBusy = false;
        inputBar.setBusy(false);
        statusBar.setStatus("Error", "error");
        chatView.appendTurnError(res.error || "发送失败");
        chatView.finishTurn();
      }
    } catch (err) {
      App.state.isBusy = false;
      inputBar.setBusy(false);
      statusBar.setStatus("Error", "error");
      chatView.appendTurnError(String(err));
      chatView.finishTurn();
    }
  }

  function handleBackendEvent(event) {
    const { type, data } = event || {};
    const { chatView, statusBar, inputBar } = App.components;

    switch (type) {
      case "clear_screen":
        chatView.clear();
        break;

      case "system_notice":
        chatView.appendSystemNotice(data.message, data.level || "info");
        break;

      case "reasoning":
        statusBar.setStatus("Thinking", "busy");
        chatView.appendReasoning(data.chunk || "");
        break;

      case "content":
        statusBar.setStatus("Replying", "active");
        chatView.appendContent(data.chunk || "");
        break;

      case "tool_call":
        statusBar.setStatus(`Tool: ${data.name}`, "busy");
        chatView.appendToolCall(data || {});
        break;

      case "tool_result":
        statusBar.setStatus("Thinking", "busy");
        chatView.completeToolCall(data || {});
        break;

      case "error":
        statusBar.setStatus("Error", "error");
        chatView.appendTurnError(data.message || "未知错误");
        break;

      case "done":
        App.state.isBusy = false;
        inputBar.setBusy(false);
        statusBar.setStatus("Ready", "ready");
        chatView.finishTurn();
        break;
    }
  }

  function bindGlobalShortcuts() {
    document.addEventListener("keydown", (e) => {
      const { settingsModal, slashMenu, inputBar } = App.components;

      // Ctrl+, / Cmd+, 打开或关闭设置
      if ((e.ctrlKey || e.metaKey) && e.key === ",") {
        e.preventDefault();
        settingsModal.toggle();
        return;
      }

      // Esc 关闭弹窗或命令菜单
      if (e.key === "Escape") {
        if (settingsModal.isOpen()) {
          e.preventDefault();
          settingsModal.close();
          return;
        }
        if (slashMenu.isOpen()) {
          e.preventDefault();
          slashMenu.hide();
          return;
        }
      }

      // Ctrl+L 清屏（仿终端习惯）
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "l") {
        if (!App.state.isBusy && !settingsModal.isOpen()) {
          e.preventDefault();
          submitInput("/clear");
        }
        return;
      }

      // 未聚焦输入框时按 "/" 快速聚焦输入
      if (
        e.key === "/" &&
        !settingsModal.isOpen() &&
        !inputBar.isFocused() &&
        document.activeElement.tagName !== "INPUT"
      ) {
        inputBar.focus();
      }
    });
  }

  async function initPyWebView() {
    if (initialized) return;
    if (!App.bridge.isReady()) {
      setTimeout(initPyWebView, 100);
      return;
    }
    initialized = true;

    try {
      const status = await App.bridge.getStatus();
      App.state.config = status;
      App.state.commands = status.commands || {};

      App.components.statusBar.updateMeta({
        cwd: status.cwd,
        model: status.model,
      });
      App.components.settingsModal.populate(status);

      if (!status.has_config) {
        App.components.settingsModal.open();
      } else {
        App.components.inputBar.focus();
      }
    } catch (err) {
      console.error("[Main] 读取状态失败:", err);
      App.components.chatView.appendSystemNotice(`初始化状态失败: ${err}`, "error");
    }
  }

  function bootstrap() {
    App.components.statusBar.init({
      onOpenSettings: () => App.components.settingsModal.open(),
    });
    App.components.chatView.init();
    App.components.slashMenu.init({
      onPick: (cmdName, execute) => {
        App.components.slashMenu.hide();
        App.components.inputBar.setValue(cmdName, execute);
      },
    });
    App.components.inputBar.init({
      onSubmit: submitInput,
    });
    App.components.settingsModal.init({
      onSaved: (res) => {
        App.state.config.has_config = true;
        App.state.config.model = res.model;
        App.state.config.cwd = res.cwd;
        App.components.statusBar.updateMeta({
          cwd: res.cwd,
          model: res.model,
        });
        App.components.chatView.appendSystemNotice("配置已保存并生效", "success");
      },
    });

    App.bridge.onEvent(handleBackendEvent);
    bindGlobalShortcuts();
    initPyWebView();
  }

  window.addEventListener("DOMContentLoaded", bootstrap);
  window.addEventListener("pywebviewready", initPyWebView);
})(window.App);
