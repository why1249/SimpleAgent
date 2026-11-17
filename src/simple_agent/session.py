import os
from pathlib import Path
from openai import OpenAI
import json
from datetime import datetime


class Session:
    def __init__(self, tools: list, tool_map: dict, run):
        # 用时间作为会话ID，精确到秒
        self.session_id = datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
        self.tools = tools
        self.tool_map = tool_map
        self.system_prompt_path = str(Path(__file__).parent / "prompt" / "system_prompt.md")
        self.client = None
        self.model = None
        self.reasoning_effort = None
        self.messages = []
        self.reload_config()
        self.reset()
        self.run = run

    def reload_config(self, session_data: dict = None):
        """重新读取环境变量初始化客户端与提示词，并更新会话配置（可通过 session_data 覆盖默认值，用于切换会话）"""

        if session_data:
            self.session_id = session_data.get("session_id", self.session_id)
            self.system_prompt_path = session_data.get("system_prompt_path", self.system_prompt_path)
            self.model = session_data.get("model", self.model)
            self.reasoning_effort = session_data.get("reasoning_effort", self.reasoning_effort)
            self.messages = session_data.get("messages", self.messages)

        api_key = os.getenv("OPENAI_API_KEY", "").strip()
        if api_key:
            try:
                self.client = OpenAI(
                    api_key=api_key,
                    base_url=os.getenv("OPENAI_BASE_URL"),
                    max_retries=5
                )
            except Exception as e:
                print(f"\033[33m[Session] 初始化客户端警告: {e}\033[0m")
                self.client = None
        else:
            self.client = None

        self.model = os.getenv("MODEL", "deepseek-chat")
        self.reasoning_effort = os.getenv("REASONING_EFFORT")

    def reset(self):
        """重置会话上下文"""
        self.messages = [
            {
                "role": "system",
                "content": self.get_system_prompt(self.system_prompt_path)
            }
        ]

    @staticmethod
    def get_system_prompt(path: str) -> str:
        """获取系统提示词并附带当前环境信息"""
        try:
            with open(path, "r", encoding="utf-8") as f:
                system_prompt = f.read()
        except Exception:
            system_prompt = "你是用户的助手，可以调用工具帮助用户编写代码。\n"
        current_state = f"\n当前工作区：{os.getcwd()}；当前时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        return system_prompt + current_state
