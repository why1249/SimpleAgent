from simple_agent.provider_definitions import deepseek

providers = {
    "deepseek": deepseek.PROVIDER_SCHEMA,
}

PROVIDER_MAP = {
    "deepseek": deepseek.execute
}