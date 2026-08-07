import os
from pathlib import Path
from openai import OpenAI
import json
from datetime import date
import time
class Session:
    def __init__(self, tools: list, tool_map: map):
        # 从源文件目录读取prompt
        self.messages = [
            {
                "role": "system", 
                "content": self.get_system_prompt(str(Path(__file__).parent / "prompt" / "system_prompt.md"))
            },
        ] 
        self.client = OpenAI(
            api_key=os.getenv("OPENAI_API_KEY"),
            base_url=os.getenv("OPENAI_BASE_URL"),
            max_retries=5
        )
        self.model = os.getenv("MODEL")
        self.reasoning_effort = os.getenv("REASONING_EFFORT")
        self.tools = tools
        self.tool_map = tool_map

    def run(self, new_prompt: str, on_content=None, on_reasoning=None, on_tool=None):
        '''单轮响应，流式 chunk 经回调上抛，便于 UI 实时渲染'''
        self.messages.append({"role": "user", "content": new_prompt})

        while True:
            # 响应与持久化上下文
            response = self.client.chat.completions.create(
                model=self.model,
                messages=self.messages,
                tools=self.tools,
                max_completion_tokens=65536,
                reasoning_effort=self.reasoning_effort,
                extra_body={"thinking": {"type": "enabled"}},
                stream=True
            )

            # 流式，需要手动收集信息，最后再持久化
            tool_calls = []
            content = ""
            reasoning_content = ""
            content_count = 0
            reasoning_content_count = 0
            new_content = ""
            new_reasoning_content = ""
            max_new_tokens = 3
            count = 0.0
            start = time.perf_counter()
            for chunk in response:
                delta = chunk.choices[0].delta
                count += 1.0
                if delta.content is not None:
                    new_content += delta.content
                    content_count += 1

                    if on_content is not None and content_count >= max_new_tokens:
                        # 先处理剩余的思维链
                        if reasoning_content_count != 0:
                            reasoning_content_count = 0
                            on_reasoning(new_reasoning_content)
                            new_reasoning_content = ""
                            reasoning_content += new_reasoning_content
                        # 正文回复 
                        content_count = 0
                        on_content(new_content)
                        new_content = ""
                        content += new_content
                    
                elif delta.reasoning_content is not None:
                    # 无内容时输出思维链，否则是工具调用信息
                    new_reasoning_content += delta.reasoning_content
                    reasoning_content_count += 1
                    # 思维链输出
                    if on_reasoning is not None and reasoning_content_count >= max_new_tokens:
                        reasoning_content_count = 0
                        on_reasoning(new_reasoning_content)
                        new_reasoning_content = ""
                        reasoning_content += new_reasoning_content
                    
                else:
                    # 处理剩余正文
                    if content_count != 0:
                        content_count = 0
                        on_content(new_content)
                        new_content = ""
                        content += new_content
                    self.collect_tool_calls(tool_calls, delta)
                current = time.perf_counter()
                max_new_tokens = 0.9*max_new_tokens + 0.1 * max(count/(current-start+0.02)/15, 1)

            # 处理剩余正文
            if content_count != 0:
                content_count = 0
                on_content(new_content)
                new_content = ""
                content += new_content

            # 持久化上下文
            self.messages.append(
                {
                    "role": "assistant",
                    "content": content,
                    "reasoning_content": reasoning_content,
                    "tool_calls": tool_calls if tool_calls != [] else None
                }
            )

            # 处理工具调用
            if tool_calls == []:
                break
            for tool in tool_calls:
                tool_function = self.tool_map[tool['function']['name']]
                tool_result = tool_function(**json.loads(tool['function']['arguments']))
                if on_tool is not None:
                    on_tool(tool['function']['name'])
                self.messages.append({
                    "role": "tool",
                    "tool_call_id": tool['id'],
                    "content": tool_result,
                })

    def start(self):
        '''开启会话（终端模式）'''
        while True:
            new_prompt = input("User: ")
            self.run(
                new_prompt,
                on_content=lambda c: print(c, end="", flush=True),
                on_reasoning=lambda c: print(c, end="", flush=True),
                on_tool=lambda name: print(f"৹ 调用工具：{name}", flush=True),
            )
            print(flush=True)

    @staticmethod
    def get_system_prompt(path: str):
        '''获取系统提示词'''
        with open(path, 'r', encoding='utf-8') as f:
            system_propmt = f.read()
        current_state = f"当前工作区：{os.getcwd()}；当前时间：{date.today()} \n"
        # print(system_propmt + current_state)
        return system_propmt + current_state

    @staticmethod
    def collect_tool_calls(tool_calls: list, delta):
        '''收集流式工具调用信息'''
        for tc in delta.tool_calls:
            # tc.index表明这是第tc.index个调用
            if len(tool_calls) <= tc.index:
                tool_calls.append({
                    "id": "",
                    "type": "function",
                    "function": {"name": "", "arguments": ""}
                })

            if tc.id:
                tool_calls[tc.index]["id"] = tc.id
            if tc.type:
                tool_calls[tc.index]["type"] = tc.type
            if tc.function:
                if tc.function.name:
                    tool_calls[tc.index]["function"]["name"] = tc.function.name
                if tc.function.arguments:
                    # arguments 是 JSON 字符串的片段，直接拼接即可
                    tool_calls[tc.index]["function"]["arguments"] += tc.function.arguments