from simple_agent.tool_definitions import read_file, edit, shell, write_file

tools = [
    read_file.TOOL_SCHEMA,
    write_file.TOOL_SCHEMA,
    edit.TOOL_SCHEMA,
    shell.TOOL_SCHEMA
]
TOOL_MAP = {
    "write_file": write_file.execute,
    "read_file": read_file.execute,
    "edit": edit.execute,
    "shell": shell.execute,
}
