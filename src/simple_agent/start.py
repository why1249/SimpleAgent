from simple_agent.session import Session
from simple_agent.tools import TOOL_MAP, tools
import os
from dotenv import load_dotenv

def initialize(dotenv_path):
    # 动态初始化：写入环境变量文件
    os.makedirs(os.path.dirname(dotenv_path), exist_ok=True)
    api_key = input("API KEY: ")
    base_url = input("BASE URL: ")
    model = input("MODEL: ")
    reasoning_effort = input("REASONING EFFORT: ")
    content = f"OPENAI_API_KEY = {api_key}\n"  \
            + f"OPENAI_BASE_URL = {base_url}\n" \
            + f"MODEL = {model}\n" \
            + f"REASONING_EFFORT = {reasoning_effort}\n" 
    with open(dotenv_path, "w", encoding="utf-8") as f:
        f.write(content)

def main():
    home = os.path.expanduser("~")
    dotenv_path = os.path.join(home, '.simple-agent/.env')
    print(dotenv_path)
    if load_dotenv(dotenv_path) == False:
        initialize(dotenv_path)
        load_dotenv(dotenv_path)
    session = Session(tools, TOOL_MAP)
    session.start()