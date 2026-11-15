import os
from dotenv import load_dotenv
from simple_agent.gui import run_gui


def main():
    home = os.path.expanduser("~")
    dotenv_path = os.path.join(home, ".simple-agent", ".env")
    session_path = os.path.join(home, ".simple-agent", "sessions")
    if os.path.exists(dotenv_path):
        load_dotenv(dotenv_path)
        print(f"\033[36m已加载环境配置: {dotenv_path}\033[0m")
    else:
        print(f"\033[33m未检测到配置文件，将在 GUI 中引导初始化: {dotenv_path}\033[0m")

    run_gui(dotenv_path, session_path)


if __name__ == "__main__":
    main()
