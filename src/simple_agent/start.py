from simple_agent.session import Session
from simple_agent.tools import TOOL_MAP, tools

def main():
    session = Session(tools, TOOL_MAP)
    session.start()