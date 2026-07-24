from openai import OpenAI
from dotenv import load_dotenv
import os

import json

TOOL_SCHEMA = {
    "type": "function",
    "function": {
        "name": "read_file",
        "description": "读取路径指向的文件",
        "parameters": {
            "type": "object",
            "properties": {
                "path": {
                    "type": "string"
                },
            },
            "required": ["path"]
        }
    }
}

def read_file(path: str):
    # content = None
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        return json.dumps({
            "success": True,
            "content": content
        })
    except:
        return json.dumps({
            "success": False,
            "content": None
        })
    
load_dotenv()
client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url=os.getenv("OPENAI_BASE_URL"),
    max_retries=5
)

response = client.chat.completions.create(
    model=os.getenv("MODEL"),
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "读取test.py中的内容"}
    ],
    max_completion_tokens=5000,
    reasoning_effort="high",
    extra_body={"thinking": {"type": "enabled"}},
    stream=True,
    tools = [TOOL_SCHEMA]
)


collected_tool_calls = []       # 按 index 存放

for chunk in response:
    delta = chunk.choices[0].delta

    # 文本内容（如果有的话）
    if chunk.choices[0].delta.content is not None:
        print(chunk.choices[0].delta.content, end="")
    else:
        try:
            print(chunk.choices[0].delta.reasoning_content,end="")
        except:
            # 工具调用增量
            if delta.tool_calls:
                for tc in delta.tool_calls:
                    # 确保 collected_tool_calls 有足够的位置
                    while len(collected_tool_calls) <= tc.index:
                        collected_tool_calls.append({
                            "id": "",
                            "type": "function",
                            "function": {"name": "", "arguments": ""}
                        })

                    if tc.id:
                        collected_tool_calls[tc.index]["id"] = tc.id
                    if tc.type:
                        collected_tool_calls[tc.index]["type"] = tc.type
                    if tc.function:
                        if tc.function.name:
                            collected_tool_calls[tc.index]["function"]["name"] = tc.function.name
                        if tc.function.arguments:
                            # 注意：arguments 是 JSON 字符串的片段，直接拼接即可
                            collected_tool_calls[tc.index]["function"]["arguments"] += tc.function.arguments

print(collected_tool_calls)
    