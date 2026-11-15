from datetime import datetime
COMMAND_SCHEMA = {
    "name": "/new",
    "description": "新建并切换至新的会话",
}

def execute(context, args: str):
    # 先保存会话状态
    context.session_manager.save_session(context.session)
    # 重新加载会话配置，切换至新的会话
    context.session.reload_config()
    context.session.session_id = datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
    context.emit("clear_screen", {})
    context.emit("system_notice", {"message": "已切换至新的会话"})

