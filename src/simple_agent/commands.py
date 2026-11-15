from simple_agent.command_definitions import clear

commands = [
    clear.COMMAND_SCHEMA,
]

COMMAND_MAP = {
    "/clear": clear.execute,
}