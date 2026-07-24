import os
from openai import OpenAI
import json
from datetime import date

class Session:
    def __init__(self, tools: list, tool_map: map):
        self.messages = [
            {
                "role": "system", 
                "content": self.get_system_prompt("./prompt/system_prompt.md")
            },
        ]
        self.client = OpenAI(
            api_key=os.getenv("OPENAI_API_KEY"),
            base_url=os.getenv("OPENAI_BASE_URL"),
            max_retries=5
        )
        self.model = os.getenv("MODEL")
        self.tools = tools
        self.tool_map = tool_map

    def run(self, new_prompt: str):
        
        self.messages.append({"role": "user", "content": new_prompt})
            
        while True:
            # 响应与持久化上下文
            response = self.client.chat.completions.create(
                model=self.model,
                messages=self.messages,
                tools=self.tools,
                max_completion_tokens=5000,
                reasoning_effort="high",
                extra_body={"thinking": {"type": "enabled"}},
                stream = True
            )

            # 流式，需要手动收集信息，最后再持久化
            tool_calls = []
            content = ""
            reasoning_content = ""

            for chunk in response:
                delta = chunk.choices[0].delta
                if delta.content is not None:
                    print(delta.content, end="")
                    content += delta.content
                else:
                    # 先尝试输出思维链，输出失败说明是工具信息进入工具处理
                    try:
                        print(delta.reasoning_content, end="")
                        reasoning_content += delta.reasoning_content
                    except:
                        self.collect_tool_calls(tool_calls, delta)
            # 持久化上下文
            self.messages.append(
                {
                    "role": "assistant", 
                    "content": content,
                    "reasoning_content": reasoning_content,
                    "tool_calls": tool_calls if tool_calls != [] else None
                }
            )
            print()

            # 处理工具调用
            if tool_calls == []:
                break
            print(tool_calls)
            for tool in tool_calls:
                tool_function = self.tool_map[tool['function']['name']]
                tool_result = tool_function(**json.loads(tool['function']['arguments']))
                print(f"tool result for {tool['function']['name']}: {tool_result}\n")
                self.messages.append({
                    "role": "tool",
                    "tool_call_id": tool['id'],
                    "content": tool_result,
                })

    def start(self):
        while True:
            new_prompt = input("User: ")
            self.run(new_prompt)

    @staticmethod
    def get_system_prompt(path: str):
        with open(path, 'r', encoding='utf-8') as f:
            system_propmt = f.read()
        current_state = f"当前工作区：{os.getcwd()}；当前时间：{date.today()} \n"
        # print(system_propmt + current_state)
        return system_propmt + current_state

    @staticmethod
    def collect_tool_calls(tool_calls: list, delta):
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