import json
import subprocess

TOOL_SCHEMA = {
    "type": "function",
    "function": {
        "name": "shell",
        "description": "运行shell命令",
        "parameters": {
            "type": "object",
            "properties": {
                "command": {"type": "string"},
                "timeout": {"type": "integer", "description": "最大等待时间，单位为秒，默认为60"},
            },
            "required": ["command"]
        }
    }
}

def execute(command: str, timeout: int = 60):
    try:
        result = subprocess.run(
            args=command,
            capture_output=True,
            shell=True,
            text=True,
            timeout=timeout,
            encoding= 'utf-8'
        )
        return json.dumps({
            "success": True,
            "stdout": result.stdout
        })
    except:
        return json.dumps({
            "success": False,
            "stdout": result.stdout,
            "stderr": result.stderr
        })
