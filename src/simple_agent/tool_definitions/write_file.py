import json, os

TOOL_SCHEMA = {
    "type": "function",
    "function": {
        "name": "write_file",
        "description": "将内容写入当前工作区下相对路径指向的文件，自动创建父级目录",
        "parameters": {
            "type": "object",
            "properties": {
                "path": {"type": "string"},
                "content": {"type": "string"}
            },
            "required": ["path", "content"]
        }
    }
}

def execute(path: str, content: str):
    try:
        # 自动创建父级文件夹，否则直接写入不存在路径会报错
        if os.path.isabs(path):
            os.makedirs(os.path.dirname(path), exist_ok=True)
        else:
            os.makedirs(os.path.dirname('./'+path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        return json.dumps({
            "success": True
        })
    except:
        return json.dumps({
            "success": False
        })
