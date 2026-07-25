from src.tool_definitions import read_file, edit, shell, write_file

tools = [
    read_file.TOOL_SCHEMA,
    write_file.TOOL_SCHEMA,
    edit.TOOL_SCHEMA,
]
TOOL_MAP = {
    "write_file": write_file.definition,
    "read_file": read_file.definition,
    "edit": edit.definition,
    "bash": shell.definition,
}
