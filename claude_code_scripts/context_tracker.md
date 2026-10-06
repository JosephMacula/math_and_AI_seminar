# context_tracker

`ctx_count.py` shows how many tokens are in the current Claude Code session's context window. It runs as Claude Code's status line, so the count appears at the bottom of the terminal and updates after each reply, e.g.

```
Opus 5.5 | context: 47,268 tokens
```

## How it works

1. **Input.** Claude Code runs the script and writes a JSON object describing the session to its stdin. The script uses two fields: `transcript_path` (the session's log file) and `model.display_name`.
2. **The transcript.** The log is a JSONL file (one JSON object per line) under `~/.claude/projects/`. Each assistant reply has a `message.usage` record of the tokens that API call used.
3. **The count.** The context size is the total input of the most recent API call:

   ```
   input_tokens + cache_creation_input_tokens + cache_read_input_tokens
   ```

   Caching changes how tokens are billed, not whether they're in the context, so all three fields count. The script keeps the value from the *last* assistant reply. It does not add up all the replies: each call resends the whole conversation, so a sum would count earlier turns many times over.
4. **Output.** The script prints one line to stdout, and Claude Code shows that line in the status bar.

## Error handling

- A transcript line that isn't valid JSON is skipped (`JSONDecodeError` → `continue`).
- If `transcript_path` is missing (`KeyError`) or the file doesn't exist yet (`FileNotFoundError`), the script prints `context: –`.
- If stdin isn't valid JSON at all, the script crashes. This shouldn't happen, because Claude Code always sends valid JSON.

## Caveats

- **It lags one turn.** The count reflects the last *completed* reply, so your newest message and the reply in progress aren't included yet.
- **After `/compact` or `/clear`,** the count drops on the next reply.

## Installation and testing

The script Claude Code actually runs is `~/.claude/ctx_count.py`, set by the `statusLine` entry in `~/.claude/settings.json`. This repo copy is the one to edit. To install changes:

```bash
cp claude_code_scripts/ctx_count.py ~/.claude/ctx_count.py
```

To test it by hand, imitate Claude Code with `echo`:

```bash
echo '{"transcript_path": "/path/to/session.jsonl", "model": {"display_name": "Opus"}}' | python3 claude_code_scripts/ctx_count.py
```
