window.App = window.App || {};

(function (App) {
  let eventListener = null;

  function getApi() {
    return window.pywebview && window.pywebview.api ? window.pywebview.api : null;
  }

  App.bridge = {
    isReady() {
      const api = getApi();
      return Boolean(api && typeof api.get_status === "function");
    },

    async getStatus() {
      const api = getApi();
      if (!api) throw new Error("pywebview bridge 未就绪");
      return api.get_status();
    },

    async saveConfig(config) {
      const api = getApi();
      if (!api) throw new Error("pywebview bridge 未就绪");
      return api.save_config(config);
    },

    async sendMessage(text) {
      const api = getApi();
      if (!api) throw new Error("pywebview bridge 未就绪");
      return api.send_message(text);
    },

    onEvent(handler) {
      eventListener = handler;
    },
  };

  // 供 Python gui.py AgentBridge.emit() 回调的全局入口
  window.agentBridge = {
    handleRawEvent(rawJson) {
      try {
        const event = JSON.parse(rawJson);
        if (eventListener) {
          eventListener(event);
        }
      } catch (err) {
        console.error("[Bridge] 解析事件失败:", err, rawJson);
      }
    },
  };
})(window.App);
