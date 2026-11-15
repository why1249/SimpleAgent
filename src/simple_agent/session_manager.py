from simple_agent.session import Session
import json
import os

class SessionManager:
    '''
    会话管理器，负责保存、恢复、切换会话，只返回会话具体状态。
    Session所需的状态信息：
    - session_id
    - tools
    - tool_map
    - system_prompt_path
    - model
    - reasoning_effort
    - messages
    client在重新加载配置时重新创建，确保同一时刻只有一个client实例。
    '''
    def __init__(self, path: str):
        self.path = path

    def save_session(self, session: Session):
        # 保存到以session_id命名的JSON文件中
        workspace = os.getcwd()
        workspace = workspace.replace("/", "--")
        save_path = os.path.join(self.path, workspace, f"{session.session_id}.json")
        data = {
            "session_id": session.session_id,
            "system_prompt_path": session.system_prompt_path,
            "model": session.model,
            "reasoning_effort": session.reasoning_effort,
            "messages": session.messages
        }
        # 先创建保存目录
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        with open(save_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=4)

    def load_session(self, session_id: str) -> dict:
        try:
            workspace = os.getcwd()
            workspace = workspace.replace("/", "--")
            with open(os.path.join(self.path, workspace, f"{session_id}.json"), "r", encoding="utf-8") as f:
                data = json.load(f)
            if data.get("session_id") == session_id:
                return data
            return {}
        except FileNotFoundError:
            return {}

    def get_session_list(self) -> list:
        '''
        获取所有会话的ID列表。
        '''
        try:
            session_ids = []
            for workspace in os.listdir(self.path):
                workspace_path = os.path.join(self.path, workspace)
                if os.path.isdir(workspace_path):
                    for filename in os.listdir(workspace_path):
                        if filename.endswith(".json"):
                            with open(os.path.join(workspace_path, filename), "r", encoding="utf-8") as f:
                                data = json.load(f)
                            session_id = data.get("session_id")
                            if session_id:
                                session_ids.append(session_id)
            return session_ids
        except FileNotFoundError:
            return []

    