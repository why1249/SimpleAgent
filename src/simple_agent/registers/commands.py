from simple_agent.command_definitions import clear, new

commands = {
    "/clear": clear.COMMAND_SCHEMA,
    "/new": new.COMMAND_SCHEMA,
}

COMMAND_MAP = {
    "/clear": clear.execute,
    "/new": new.execute,
}