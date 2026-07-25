# Simple Agent

本项目为个人练习项目，不使用AI编程工具，按个人理解古法编程，逐渐实现一个现代Coding Agent。文档、代码全部由人工完成。

> 当前处于早期版本，可靠性不足，不宜用于生产环境，仅用于学习用途

## 最新

**[2026/7/25]-v0** 包含`write_file、read_file、edit、shell`四个工具的基础实现，跑通多轮对话与工具调用。

## 快速开始

Simple Agent使用.env管理环境变量，并使用uv管理依赖。当前仅支持deepseek

```bash
# 克隆仓库
git clone https://github.com/why1249/SimpleAgent.git
cd SimpleAgent
# 创建.env写入以下环境变量，参考.env.example
OPENAI_API_KEY=sk-xxxxxxx
OPENAI_BASE_URL=https://api.deepseek.com/v1
MODEL=deepseek-v4-flash
REASONING_EFFORT=high
# 使用uv同步依赖并运行项目
uv sync
uv run main.py
```