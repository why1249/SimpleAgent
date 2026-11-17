import json
PROVIDER_SCHEMA = {
    'name': 'deepseek'
}

def execute(session,
            new_prompt: str,
            on_content=None,
            on_reasoning=None,
            on_tool_call=None,
            on_tool_result=None,
            on_error=None):
        """单轮响应与工具调用循环，流式上报事件"""
        if not session.client:
            if on_error:
                on_error("尚未检测到有效 API Key，请点击右上角「设置」完成配置。")
            return

        session.messages.append({"role": "user", "content": new_prompt})

        while True:
            extra_kwargs = {}
            if session.reasoning_effort and session.reasoning_effort.lower() != "default":
                extra_kwargs["reasoning_effort"] = session.reasoning_effort
            else:
                extra_kwargs["extra_body"] = {"thinking": {"type": "enabled"}}

            try:
                response = session.client.chat.completions.create(
                    model=session.model,
                    messages=session.messages,
                    tools=session.tools,
                    max_completion_tokens=65536,
                    stream=True,
                    **extra_kwargs
                )
            except Exception as e:
                if on_error:
                    on_error(f"API 调用异常: {str(e)}")
                return

            tool_calls = []
            content = ""
            reasoning_content = ""

            try:
                for chunk in response:
                    if not chunk.choices:
                        continue
                    delta = chunk.choices[0].delta

                    # 思维链增量
                    if hasattr(delta, "reasoning_content") and delta.reasoning_content:
                        reasoning_content += delta.reasoning_content
                        if on_reasoning:
                            on_reasoning(delta.reasoning_content)

                    # 正文回复增量
                    if hasattr(delta, "content") and delta.content:
                        content += delta.content
                        if on_content:
                            on_content(delta.content)

                    # 工具调用解析
                    if hasattr(delta, "tool_calls") and delta.tool_calls:
                        collect_tool_calls(tool_calls, delta)

            except Exception as e:
                if on_error:
                    on_error(f"流式接收中断: {str(e)}")
                return

            # 持久化当前轮次的助理消息到上下文
            session.messages.append({
                "role": "assistant",
                "content": content,
                "reasoning_content": reasoning_content,
                "tool_calls": tool_calls if tool_calls else None
            })

            # 没有工具调用时结束当前轮次循环
            if not tool_calls:
                break

            # 处理每个工具调用
            for tool in tool_calls:
                tool_id = tool.get("id") or ""
                func_info = tool.get("function", {})
                tool_name = func_info.get("name", "")
                tool_args_str = func_info.get("arguments", "")

                if on_tool_call:
                    on_tool_call(tool_id, tool_name, tool_args_str)

                # 执行本地工具
                try:
                    tool_func = session.tool_map.get(tool_name)
                    if tool_func:
                        args = json.loads(tool_args_str) if tool_args_str else {}
                        tool_result = tool_func(**args)
                    else:
                        tool_result = json.dumps({"success": False, "error": f"未找到工具: {tool_name}"})
                except Exception as e:
                    tool_result = json.dumps({"success": False, "error": f"执行工具失败: {str(e)}"})

                if on_tool_result:
                    on_tool_result(tool_id, tool_name, str(tool_result))

                # 回填工具执行结果
                session.messages.append({
                    "role": "tool",
                    "tool_call_id": tool_id,
                    "content": str(tool_result),
                })

def collect_tool_calls(tool_calls: list, delta):
    """收集流式工具调用片段"""
    for tc in delta.tool_calls:
        while len(tool_calls) <= tc.index:
            tool_calls.append({
                "id": "",
                "type": "function",
                "function": {"name": "", "arguments": ""}
            })

        if tc.id:
            tool_calls[tc.index]["id"] = tc.id
        if tc.type:
            tool_calls[tc.index]["type"] = tc.type
        if tc.function:
            if tc.function.name:
                tool_calls[tc.index]["function"]["name"] += tc.function.name
            if tc.function.arguments:
                tool_calls[tc.index]["function"]["arguments"] += tc.function.arguments