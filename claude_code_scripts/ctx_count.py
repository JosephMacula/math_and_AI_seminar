#!/usr/bin/env python3
import json, sys

data = json.load(sys.stdin)
ctx = None
try:
    with open(data["transcript_path"]) as f:
        for line in f:
            try:
                entry = json.loads(line)
            except json.JSONDecodeError:
                continue
            u = entry.get("message", {}).get("usage") if entry.get("type") == "assistant" else None
            if u:
                ctx = (u.get("input_tokens", 0)
                       + u.get("cache_creation_input_tokens", 0)
                       + u.get("cache_read_input_tokens", 0))
except (KeyError, FileNotFoundError):
    pass

model = data.get("model", {}).get("display_name", "")
print(f"{model} | context: {ctx:,} tokens" if ctx is not None else f"{model} | context: –")
