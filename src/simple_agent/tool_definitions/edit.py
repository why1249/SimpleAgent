import json


TOOL_SCHEMA = {
    "type": "function",
    "function": {
        "name": "edit",
        "description": "替换路径指向文件内的字符串",
        "parameters": {
            "type": "object",
            "properties": {
                "path": {"type": "string"},
                "old_string": {"type": "string"},
                "new_string": {"type": "string"}
            },
            "required": ["path", "old_string", "new_string"]
        }
    }
}

def definition(path: str, old_string: str, new_string: str):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()

        content = content.replace(old_string, new_string)

        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        return json.dumps({
            "success": True
        })
    except:
        return json.dumps({
            "success": False
        })
