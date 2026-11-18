## 项目结构

```
src/simple_agent/web/
├── index.html                    # 页面结构骨架（顶栏 / 对话流 / 输入坞 / 配置弹窗）
├── styles/
│   ├── tokens.css                # 浅色配色、字体、圆角、阴影变量（改配色/字号只改这里）
│   ├── layout.css                # 整体页面框架布局（顶栏高度、滚动区、输入坞宽度）
│   ├── components.css            # 用户命令块、折叠步骤条、Markdown、命令浮层、弹窗样式
│   └── highlight-light.css       # 适配浅色主题的 GitHub Light 代码语法高亮
└── js/
    ├── state.js                  # 集中状态管理（App.state）
    ├── bridge.js                 # 与 Python AgentBridge 通信的唯一入口（收发事件）
    ├── main.js                   # 总入口：初始化各模块、绑定全局快捷键
    ├── utils/
    │   ├── dom.js                # 轻量 DOM 工具与滚动封装
    │   └── markdown.js           # Marked 渲染、代码块高亮与一键复制
    └── components/
        ├── status_bar.js         # 顶部状态栏（目录、可点击的模型标签、状态点、设置按钮）
        ├── chat_view.js          # 对话流渲染（空状态、用户输入块、AI 回复流、思考折叠条）
        ├── tool_step.js          # 工具调用紧凑步骤条（显示工具名、参数摘要与折叠输出）
        ├── slash_menu.js         # "/" 斜杠命令补全浮层
        ├── input_bar.js          # 底部命令行输入区（↑/↓ 历史、Tab/Enter 补全与发送）
        └── settings_modal.js     # 模型与服务配置弹窗（内联校验提示）
```

