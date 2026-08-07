# Simple Agent

本项目为个人练习项目，不使用AI编程工具，按个人理解古法编程，逐渐实现一个现代Coding Agent。文档、代码全部由人工完成。

> 当前处于早期版本，可靠性不足，不宜用于生产环境，仅用于学习用途

## 最新

**[2026/7/25]-v0.1.0** 包含`write_file、read_file、edit、shell`四个工具的基础实现，跑通多轮对话与工具调用。
**[2026/8/07]-v0.1.1** 支持uv直接安装，首次启动时交互式配置（替代手写.env）
## 快速开始

Simple Agent使用.env管理环境变量，并使用uv管理依赖。**当前仅支持deepseek的openai chat completions接口**

```bash
# 使用uv从仓库安装
uv tool install git+https://github.com/why1249/SimpleAgent.git
```
首次启动时会弹出API KEY等配置信息的填写。