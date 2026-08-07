from simple_agent.session import Session
from simple_agent.tools import TOOL_MAP, tools
import os
from dotenv import load_dotenv

from textual.app import App
from textual import events
from textual.widgets import Header, Input, Markdown
from textual.containers import VerticalScroll

class SimpleAgent(App[str]):
    TITLE = "SIMPLE AGENT"
    SUB_TITLE = "CURRENT SESSION"
    CSS_PATH = "tui.css"

    def compose(self):
        self.session = Session(tools, TOOL_MAP)
        yield Header()
        self.input = Input(value="", placeholder="输入消息，回车发送")
        yield self.input
        self.output = Markdown()
        # 官方流式组件：widget 跟不上时自动合并 fragment，避免逐 chunk 重渲染
        # self.output_stream = Markdown.get_stream(self.output)
        with VerticalScroll():
            yield self.output

    def on_mount(self):
        self.query_one(VerticalScroll).anchor()

    async def on_key(self, event: events.Key):
        if event.key == "enter" and self.input.value != "":
            content = self.input.value
            self.input.clear()
            self.input.disabled = True
            # await self.output_stream.write(f"**你：** {content}\n\n")
            await self.output.append(f"**你：** {content}\n\n")
            # 后台线程跑 agent 循环，事件循环保持空闲，chunk 实时上屏
            self.run_worker(lambda: self._run_agent(content), thread=True, exclusive=True)
            

    def _run_agent(self, content: str) -> None:
        '''后台线程执行 agent 循环，chunk 经 _write 线程安全投递'''
        try:
            self.session.run(
                content,
                on_content=lambda chunk: self._write(chunk),
                on_reasoning=lambda chunk: self._write(chunk),
                on_tool=lambda name: self._write(f"\n\n🔧 调用工具：{name}\n\n"),
            )
        finally:
            self._write("\n\n---\n\n")
            self._enable_input()

    def _write(self, text: str) -> None:
        '''线程安全地写入 markdown 流'''
        # self.call_from_thread(self.output_stream.write, text)
        self.call_from_thread(self.output.append, text)

    def _enable_input(self) -> None:
        self.call_from_thread(lambda: setattr(self.input, "disabled", False))


def initialize(dotenv_path):
    '''动态初始化，写入环境变量文件'''
    os.makedirs(os.path.dirname(dotenv_path), exist_ok=True)
    api_key = input("API KEY: ")
    base_url = input("BASE URL: ")
    model = input("MODEL: ")
    reasoning_effort = input("REASONING EFFORT: ")
    content = f"OPENAI_API_KEY = {api_key}\n"  \
            + f"OPENAI_BASE_URL = {base_url}\n" \
            + f"MODEL = {model}\n" \
            + f"REASONING_EFFORT = {reasoning_effort}\n" 
    with open(dotenv_path, "w", encoding="utf-8") as f:
        f.write(content)

def main():
    home = os.path.expanduser("~")
    dotenv_path = os.path.join(home, '.simple-agent/.env')
    print(f"\033[36mloaded from {dotenv_path}\033[0m")

    if load_dotenv(dotenv_path) == False:
        initialize(dotenv_path)
        load_dotenv(dotenv_path)
    simple_agent = SimpleAgent()
    simple_agent.run()