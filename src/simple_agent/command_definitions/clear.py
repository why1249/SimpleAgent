COMMAND_SCHEMA = {
    "name": "/clear",
    "description": "清空当前会话的历史消息",
}

def execute(context, args: str):
    # 重置会话上下文
    context.session.reset()
    context.emit("clear_screen", {})
    context.emit("system_notice", {"message": "会话上下文已清空"})