import json
import os

TOOL_SCHEMA = {
    "type": "function",
    "function": {
        "name": "read_file",
        "description": "读取路径指向的文件，若指向目录则返回目录结构",
        "parameters": {
            "type": "object",
            "properties": {
                "path": {"type": "string"},
            },
            "required": ["path"]
        }
    }
}

def execute(path: str):
    try:
        if os.path.isfile(path):
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
        else:
            content = os.listdir(path)
        return json.dumps({
            "success": True,
            "content": content
        })
    except:
        return json.dumps({
            "success": False,
            "content": None
        })

