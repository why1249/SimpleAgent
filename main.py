from src.session import Session
from src.tools import TOOL_MAP, tools

if __name__ == "__main__":

    session = Session(tools, TOOL_MAP)
    session.start()

