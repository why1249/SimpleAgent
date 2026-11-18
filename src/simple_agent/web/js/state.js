window.App = window.App || {};

(function (App) {
  App.state = {
    isBusy: false,
    commands: {},
    config: {
      has_config: false,
      cwd: "",
      model: "deepseek-chat",
      base_url: "https://api.deepseek.com/v1",
      reasoning_effort: "default",
    },
    activeTurn: null,

    resetTurn() {
      this.activeTurn = null;
    },
  };
})(window.App);
