// 配置 marked.js
if (typeof marked !== "undefined") {
  marked.use({
    breaks: true,
    gfm: true
  });
}

// 状态管理
const state = {
  isBusy: false,
  currentAssistantMsg: null,
  currentThoughtContent: null,
  currentThoughtSummary: null,
  currentMarkdownEl: null,
  currentToolCards: {},
  rawMarkdownBuffer: ""
};

// DOM 元素引用
const dom = {
  chatContainer: document.getElementById("chat-container"),
  messagesList: document.getElementById("messages"),
  emptyState: document.getElementById("empty-state"),
  promptInput: document.getElementById("prompt-input"),
  sendBtn: document.getElementById("send-btn"),
  badgeCwd: document.getElementById("badge-cwd"),
  badgeModel: document.getElementById("badge-model"),
  badgeStatus: document.getElementById("badge-status"),
  btnReset: document.getElementById("btn-reset"),
  btnSettings: document.getElementById("btn-settings"),
  settingsModal: document.getElementById("settings-modal"),
  btnCloseModal: document.getElementById("btn-close-modal"),
  btnCancelConfig: document.getElementById("btn-cancel-config"),
  btnSaveConfig: document.getElementById("btn-save-config"),
  cfgApiKey: document.getElementById("cfg-api-key"),
  cfgBaseUrl: document.getElementById("cfg-base-url"),
  cfgModel: document.getElementById("cfg-model"),
  cfgReasoning: document.getElementById("cfg-reasoning")
};

// 滚动到底部
function scrollToBottom() {
  dom.chatContainer.scrollTop = dom.chatContainer.scrollHeight;
}

// 检查空状态
function updateEmptyState() {
  if (dom.messagesList.children.length === 0) {
    dom.emptyState.style.display = "block";
  } else {
    dom.emptyState.style.display = "none";
  }
}

// 更新状态标签
function setStatus(text, type = "ready") {
  dom.badgeStatus.textContent = text;
  dom.badgeStatus.className = "pill";
  if (type === "ready") {
    dom.badgeStatus.classList.add("pill-ready");
  } else if (type === "busy") {
    dom.badgeStatus.classList.add("pill-busy");
  } else if (type === "accent") {
    dom.badgeStatus.classList.add("pill-accent");
  }
}

// 自动调整输入框高度
function autoResizeInput() {
  dom.promptInput.style.height = "auto";
  const newHeight = Math.min(dom.promptInput.scrollHeight, 180);
  dom.promptInput.style.height = `${newHeight}px`;
}

// 渲染 Markdown 并添加代码块增强（高亮、复制按钮）
function renderMarkdown(element, markdownText) {
  if (typeof marked === "undefined") {
    element.textContent = markdownText;
    return;
  }

  element.innerHTML = marked.parse(markdownText);

  // 为代码块添加头部包装与高亮
  element.querySelectorAll("pre code").forEach((codeBlock) => {
    if (typeof hljs !== "undefined" && !codeBlock.classList.contains("hljs")) {
      hljs.highlightElement(codeBlock);
    }

    const pre = codeBlock.parentElement;
    if (pre && !pre.parentElement.classList.contains("code-block-wrapper")) {
      const wrapper = document.createElement("div");
      wrapper.className = "code-block-wrapper";

      const header = document.createElement("div");
      header.className = "code-header";

      // 提取语言名称
      const langClass = Array.from(codeBlock.classList).find(c => c.startsWith("language-"));
      const langName = langClass ? langClass.replace("language-", "") : "code";

      const langSpan = document.createElement("span");
      langSpan.textContent = langName;

      const copyBtn = document.createElement("button");
      copyBtn.className = "btn-copy";
      copyBtn.textContent = "复制";
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(codeBlock.innerText).then(() => {
          copyBtn.textContent = "已复制!";
          setTimeout(() => { copyBtn.textContent = "复制"; }, 1500);
        });
      };

      header.appendChild(langSpan);
      header.appendChild(copyBtn);

      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(header);
      wrapper.appendChild(pre);
    }
  });
}

// 创建并追加用户气泡
function appendUserMessage(content) {
  const msgItem = document.createElement("div");
  msgItem.className = "message-item user-message";

  const bubble = document.createElement("div");
  bubble.className = "user-bubble";
  bubble.textContent = content;

  msgItem.appendChild(bubble);
  dom.messagesList.appendChild(msgItem);
  updateEmptyState();
  scrollToBottom();
}

// 初始化助理消息卡片骨架
function createAssistantMessage() {
  const msgItem = document.createElement("div");
  msgItem.className = "message-item assistant-message";

  const header = document.createElement("div");
  header.className = "assistant-header";
  header.innerHTML = `<span>🤖 Simple Agent</span>`;
  msgItem.appendChild(header);

  // 思考块（默认预建）
  const thoughtBox = document.createElement("details");
  thoughtBox.className = "thought-box";
  thoughtBox.open = true;

  const thoughtSummary = document.createElement("summary");
  thoughtSummary.className = "thought-summary";
  thoughtSummary.innerHTML = `<span class="thinking-pulse"></span> 正在思考...`;

  const thoughtContent = document.createElement("div");
  thoughtContent.className = "thought-content";

  thoughtBox.appendChild(thoughtSummary);
  thoughtBox.appendChild(thoughtContent);
  msgItem.appendChild(thoughtBox);

  // 工具调用容器
  const toolsContainer = document.createElement("div");
  toolsContainer.className = "tools-container";
  msgItem.appendChild(toolsContainer);

  // 正文渲染区域
  const markdownBody = document.createElement("div");
  markdownBody.className = "markdown-body";
  msgItem.appendChild(markdownBody);

  dom.messagesList.appendChild(msgItem);
  updateEmptyState();
  scrollToBottom();

  // 更新当前活跃状态引用
  state.currentAssistantMsg = msgItem;
  state.currentThoughtBox = thoughtBox;
  state.currentThoughtSummary = thoughtSummary;
  state.currentThoughtContent = thoughtContent;
  state.currentToolsContainer = toolsContainer;
  state.currentMarkdownEl = markdownBody;
  state.currentToolCards = {};
  state.rawMarkdownBuffer = "";
  state.hasThoughtText = false;
}

// 发送用户输入
async function handleSend() {
  const text = dom.promptInput.value.trim();
  if (!text || state.isBusy) return;

  dom.promptInput.value = "";
  autoResizeInput();
  dom.promptInput.disabled = true;
  dom.sendBtn.disabled = true;
  state.isBusy = true;

  appendUserMessage(text);
  createAssistantMessage();
  setStatus("🟡 思考中...", "busy");

  try {
    if (window.pywebview && window.pywebview.api) {
      const res = await window.pywebview.api.send_message(text);
      if (!res.success) {
        setStatus("🔴 发送失败", "busy");
        console.error("send_message failed:", res.error);
      }
    }
  } catch (err) {
    console.error("调用 send_message 异常:", err);
    state.isBusy = false;
    dom.promptInput.disabled = false;
    dom.sendBtn.disabled = false;
    setStatus("🟢 就绪", "ready");
  }
}

// 注册后端事件桥接对象
window.agentBridge = {
  handleRawEvent: function (rawJson) {
    try {
      const event = JSON.parse(rawJson);
      this.handleEvent(event);
    } catch (e) {
      console.error("解析事件失败:", e, rawJson);
    }
  },

  handleEvent: function (event) {
    const { type, data } = event;

    switch (type) {
      case "reasoning": {
        if (!state.currentThoughtContent) return;
        state.hasThoughtText = true;
        state.currentThoughtContent.textContent += data.chunk;
        state.currentThoughtContent.scrollTop = state.currentThoughtContent.scrollHeight;
        scrollToBottom();
        break;
      }

      case "content": {
        // 当正式内容开始到达时，若思考盒有内容则标记思考完成
        if (state.currentThoughtSummary && state.hasThoughtText) {
          state.currentThoughtSummary.innerHTML = `🧠 思考过程 (已完成)`;
        } else if (state.currentThoughtBox && !state.hasThoughtText) {
          // 如果模型没有输出思维链，隐藏空的思考盒
          state.currentThoughtBox.style.display = "none";
        }

        setStatus("🔵 正在回复...", "accent");
        state.rawMarkdownBuffer += data.chunk;
        renderMarkdown(state.currentMarkdownEl, state.rawMarkdownBuffer);
        scrollToBottom();
        break;
      }

      case "tool_call": {
        setStatus(`🟣 调用工具: ${data.name}`, "busy");
        if (state.currentThoughtSummary && state.hasThoughtText) {
          state.currentThoughtSummary.innerHTML = `🧠 思考过程 (已完成)`;
        }

        const card = document.createElement("div");
        card.className = "tool-card";
        card.innerHTML = `
          <div class="tool-header">
            <span class="tool-title">🔧 工具调用: ${data.name}</span>
            <span class="tool-badge tool-badge-running">执行中...</span>
          </div>
          <div class="tool-details">
            <details open>
              <summary>参数信息</summary>
              <pre class="tool-output">${data.args ? data.args : "无参数"}</pre>
            </details>
          </div>
        `;

        state.currentToolsContainer.appendChild(card);
        state.currentToolCards[data.id || data.name] = card;
        scrollToBottom();
        break;
      }

      case "tool_result": {
        setStatus("🟡 整理结果中...", "busy");
        const card = state.currentToolCards[data.id || data.name] ||
                     state.currentToolsContainer.lastElementChild;

        if (card) {
          const badge = card.querySelector(".tool-badge");
          if (badge) {
            badge.className = "tool-badge tool-badge-done";
            badge.textContent = "执行完成";
          }

          const details = card.querySelector(".tool-details");
          if (details) {
            const resDetails = document.createElement("details");
            resDetails.open = false;
            resDetails.innerHTML = `
              <summary>查看输出结果</summary>
              <pre class="tool-output">${data.result || "（无输出）"}</pre>
            `;
            details.appendChild(resDetails);
          }
        }
        scrollToBottom();
        break;
      }

      case "error": {
        setStatus("🔴 发生错误", "busy");
        if (state.currentAssistantMsg) {
          const errBox = document.createElement("div");
          errBox.style.color = "#f87171";
          errBox.style.padding = "8px 12px";
          errBox.style.background = "rgba(239, 68, 68, 0.1)";
          errBox.style.borderRadius = "4px";
          errBox.style.border = "1px solid #7f1d1d";
          errBox.style.marginTop = "8px";
          errBox.textContent = `⚠️ ${data.message}`;
          state.currentAssistantMsg.appendChild(errBox);
        }
        break;
      }

      case "done": {
        state.isBusy = false;
        dom.promptInput.disabled = false;
        dom.sendBtn.disabled = false;
        dom.promptInput.focus();
        setStatus("🟢 就绪", "ready");

        // 若思考盒为空则隐藏，若有则保留折叠展示
        if (state.currentThoughtBox && !state.hasThoughtText) {
          state.currentThoughtBox.style.display = "none";
        } else if (state.currentThoughtSummary) {
          state.currentThoughtSummary.innerHTML = `🧠 思考过程 (已完成)`;
        }
        break;
      }
    }
  }
};

// 初始化应用与配置查询
async function initApp() {
  if (!window.pywebview || !window.pywebview.api) {
    // 轮询等待 pywebview bridge 就绪
    setTimeout(initApp, 100);
    return;
  }

  try {
    const status = await window.pywebview.api.get_status();
    dom.badgeCwd.textContent = `📁 ${status.cwd}`;
    dom.badgeModel.textContent = `🧠 ${status.model}`;

    dom.cfgApiKey.value = "";
    dom.cfgBaseUrl.value = status.base_url || "https://api.deepseek.com/v1";
    dom.cfgModel.value = status.model || "deepseek-chat";
    dom.cfgReasoning.value = status.reasoning_effort || "default";

    if (!status.has_config) {
      dom.settingsModal.classList.remove("hidden");
    }
  } catch (e) {
    console.error("读取状态失败:", e);
  }
}

// 绑定交互事件
function bindEvents() {
  // 回车发送，Shift+Enter 换行
  dom.promptInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  dom.promptInput.addEventListener("input", autoResizeInput);
  dom.sendBtn.addEventListener("click", handleSend);

  // 快捷提问气泡
  document.querySelectorAll(".tip-card").forEach((card) => {
    card.addEventListener("click", () => {
      dom.promptInput.value = card.getAttribute("data-prompt");
      autoResizeInput();
      handleSend();
    });
  });

  // 清空对话
  dom.btnReset.addEventListener("click", async () => {
    if (state.isBusy) return;
    if (window.pywebview && window.pywebview.api) {
      await window.pywebview.api.reset_chat();
    }
    dom.messagesList.innerHTML = "";
    updateEmptyState();
  });

  // 设置模态弹窗开关
  dom.btnSettings.addEventListener("click", () => {
    dom.settingsModal.classList.remove("hidden");
  });

  dom.btnCloseModal.addEventListener("click", () => {
    dom.settingsModal.classList.add("hidden");
  });

  dom.btnCancelConfig.addEventListener("click", () => {
    dom.settingsModal.classList.add("hidden");
  });

  // 保存设置
  dom.btnSaveConfig.addEventListener("click", async () => {
    const apiKey = dom.cfgApiKey.value.trim();
    const baseUrl = dom.cfgBaseUrl.value.trim();
    const model = dom.cfgModel.value.trim();
    const reasoning = dom.cfgReasoning.value.trim();

    if (!apiKey) {
      alert("请输入有效的 API Key");
      return;
    }

    try {
      const res = await window.pywebview.api.save_config({
        api_key: apiKey,
        base_url: baseUrl,
        model: model,
        reasoning_effort: reasoning
      });

      if (res.success) {
        dom.badgeModel.textContent = `🧠 ${res.model}`;
        dom.badgeCwd.textContent = `📁 ${res.cwd}`;
        dom.settingsModal.classList.add("hidden");
        alert("配置已成功保存并生效！");
      }
    } catch (e) {
      alert(`保存失败: ${e}`);
    }
  });
}

// 页面加载触发
window.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  initApp();
});
window.addEventListener("pywebviewready", initApp);
