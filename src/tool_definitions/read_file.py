import json

TOOL_SCHEMA = {
    "type": "function",
    "function": {
        "name": "read_file",
        "description": "读取路径指向的文件",
        "parameters": {
            "type": "object",
            "properties": {
                "path": {"type": "string"},
            },
            "required": ["path"]
        }
    }
}

def definition(path: str):
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

