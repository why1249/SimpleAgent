import os
import json
import threading
from pathlib import Path
from dotenv import load_dotenv
import webview

from simple_agent.session import Session
from simple_agent.session_manager import SessionManager
from simple_agent.registers.tools import TOOL_MAP, tools
from simple_agent.registers.commands import COMMAND_MAP, commands
from simple_agent.registers.providers import PROVIDER_MAP, providers

class AgentBridge:
    def __init__(self, dotenv_path: str, session_path: str):
        self.dotenv_path = dotenv_path
        self.window = None
        self.is_busy = False
        self.session_path = session_path
        self.session = Session(tools, TOOL_MAP, PROVIDER_MAP["deepseek"])
        self.session_manager = SessionManager(self.session_path)

    def set_window(self, window):
        self.window = window

    def emit(self, event_type: str, data: dict = None):
        """线程安全地向前端 JavaScript 发送事件"""
        if not self.window:
            return
        payload = {"type": event_type, "data": data or {}}
        raw_json = json.dumps(payload)
        # 用 json.dumps 嵌套包裹，确保作为 JS 字符串参数时不会产生语法转义问题
        js_code = f"window.agentBridge && window.agentBridge.handleRawEvent({json.dumps(raw_json)});"
        try:
            self.window.evaluate_js(js_code)
        except Exception as e:
            print(f"[GUI Bridge] 发送事件异常: {e}")

    def get_status(self):
        """供前端初始化时查询当前配置与状态"""
        api_key = os.getenv("OPENAI_API_KEY", "")
        return {
            "has_config": bool(api_key.strip()),
            "cwd": os.getcwd(),
            "model": os.getenv("MODEL", "deepseek-chat"),
            "base_url": os.getenv("OPENAI_BASE_URL", "https://api.deepseek.com/v1"),
            "reasoning_effort": os.getenv("REASONING_EFFORT", "default"),
            "is_busy": self.is_busy,
            "commands": commands,
            "tools": list(TOOL_MAP.keys()),
        }

    def get_commands(self):
        """供前端获取所有支持的斜杠命令定义"""
        return commands

    def save_config(self, config: dict):
        """保存 API 配置到 .env 并热重载 Session"""
        api_key = config.get("api_key", "").strip()
        base_url = config.get("base_url", "").strip() or "https://api.deepseek.com/v1"
        model = config.get("model", "").strip() or "deepseek-chat"
        reasoning_effort = config.get("reasoning_effort", "").strip() or "default"

        os.makedirs(os.path.dirname(self.dotenv_path), exist_ok=True)
        content = (
            f"OPENAI_API_KEY = {api_key}\n"
            f"OPENAI_BASE_URL = {base_url}\n"
            f"MODEL = {model}\n"
            f"REASONING_EFFORT = {reasoning_effort}\n"
        )
        with open(self.dotenv_path, "w", encoding="utf-8") as f:
            f.write(content)

        load_dotenv(self.dotenv_path, override=True)
        self.session.reload_config()
        return {"success": True, "model": model, "cwd": os.getcwd()}

    def send_message(self, text: str):
        """前端提交用户消息后触发"""
        content = text.strip()
        if not content:
            return {"success": False, "error": "输入内容不能为空"}

        # 优先拦截斜杠命令
        if content.startswith("/"):
            if self.is_busy:
                return {"success": False, "error": "当前正在执行任务，请等待完成"}

            parts = content.split(maxsplit=1)
            cmd_name = parts[0]
            args = parts[1] if len(parts) > 1 else ""

            handler = COMMAND_MAP.get(cmd_name)
            if handler:
                try:
                    handler(self, args)
                except Exception as e:
                    self.emit("system_notice", {
                        "message": f"执行命令 {cmd_name} 失败: {str(e)}",
                        "level": "error"
                    })
            else:
                self.emit("system_notice", {
                    "message": f"未知的斜杠命令: {cmd_name}。可输入 /help 查看支持的命令。",
                    "level": "warning"
                })
            return {"success": True, "is_command": True}

        if self.is_busy:
            return {"success": False, "error": "当前正在执行任务，请等待完成"}

        self.is_busy = True

        def worker():
            try:
                self.emit("start", {"user_content": content})
                self.session.run(
                    self.session,
                    content,
                    on_reasoning=lambda chunk: self.emit("reasoning", {"chunk": chunk}),
                    on_content=lambda chunk: self.emit("content", {"chunk": chunk}),
                    on_tool_call=lambda tid, name, args: self.emit("tool_call", {"id": tid, "name": name, "args": args}),
                    on_tool_result=lambda tid, name, res: self.emit("tool_result", {"id": tid, "name": name, "result": res}),
                    on_error=lambda err: self.emit("error", {"message": err})
                )
            except Exception as e:
                self.emit("error", {"message": str(e)})
            finally:
                self.is_busy = False
                self.emit("done", {})

        thread = threading.Thread(target=worker, daemon=True)
        thread.start()
        return {"success": True}

def run_gui(dotenv_path: str, session_path: str):
    """启动 GUI 桌面应用"""
    bridge = AgentBridge(dotenv_path, session_path)
    web_dir = Path(__file__).parent / "web"
    index_file = web_dir / "index.html"

    window = webview.create_window(
        title="Simple Agent",
        url=f"file://{index_file.resolve()}",
        js_api=bridge,
        width=1040,
        height=780,
        min_size=(640, 480),
    )
    bridge.set_window(window)
    webview.start(debug=False)
