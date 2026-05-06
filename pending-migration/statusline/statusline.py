#!/usr/bin/env python3
import io
import json
import os
import sys
import tempfile
import time
from datetime import datetime

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

GREEN = "\033[32m"
YELLOW = "\033[33m"
RED = "\033[31m"
RESET = "\033[0m"

_200K = 200_000
_500K = 500_000
_2KB = 2_048
_CACHE_TTL = 10


def compute_r(data):
    usage = (data.get("context_window") or {}).get("current_usage")
    if not usage:
        return 0, "🟢", False
    r = (
        (usage.get("input_tokens") or 0)
        + (usage.get("cache_creation_input_tokens") or 0)
        + (usage.get("cache_read_input_tokens") or 0)
    )
    if r < _200K:
        emoji = "🟢"
    elif r < _500K:
        emoji = "🟡"
    else:
        emoji = "🔴"
    return r, emoji, True


def fmt_tokens(n, has_data):
    if not has_data:
        return "--"
    if n >= 1_000_000:
        return f"{n / 1_000_000:.1f}M"
    if n >= 1_000:
        return f"{n // 1_000}K"
    return str(n)


def make_bar(pct):
    filled = round(pct * 10 / 100)
    filled = max(0, min(10, filled))
    if pct < 50:
        color = GREEN
    elif pct < 80:
        color = YELLOW
    else:
        color = RED
    bar = f"{color}{'▓' * filled}{'░' * (10 - filled)}{RESET}"
    return bar


def fmt_reset_time(ts, window):
    dt = datetime.fromtimestamp(ts)
    if window == "five_hour":
        return dt.strftime("%H:%M")
    return dt.strftime("%a %H:%M")


def scan_transcript(path):
    max_bytes = 0
    try:
        with open(path, encoding="utf-8", errors="replace") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                except json.JSONDecodeError:
                    continue
                max_bytes = max(max_bytes, _find_tool_errors(obj))
    except OSError:
        pass
    return max_bytes


def _find_tool_errors(obj):
    max_bytes = 0
    if isinstance(obj, dict):
        # Direct tool_result entry
        if obj.get("type") == "tool_result" and obj.get("is_error"):
            content = obj.get("content", "")
            max_bytes = max(max_bytes, _measure_content(content))
        # Recurse into message content arrays
        for key in ("message", "content"):
            val = obj.get(key)
            if isinstance(val, list):
                for item in val:
                    max_bytes = max(max_bytes, _find_tool_errors(item))
            elif isinstance(val, dict):
                max_bytes = max(max_bytes, _find_tool_errors(val))
    return max_bytes


def _measure_content(content):
    if isinstance(content, str):
        return len(content.encode("utf-8"))
    if isinstance(content, list):
        total = 0
        for part in content:
            if isinstance(part, dict):
                total += len((part.get("text") or "").encode("utf-8"))
            elif isinstance(part, str):
                total += len(part.encode("utf-8"))
        return total
    return 0


def get_tool_error(data):
    session_id = data.get("session_id", "unknown")
    transcript_path = data.get("transcript_path", "")
    cache_path = os.path.join(tempfile.gettempdir(), f"claude-statusline-{session_id}")

    try:
        with open(cache_path) as f:
            cache = json.load(f)
        if time.time() - cache.get("checked_at", 0) < _CACHE_TTL:
            return cache.get("max_error_bytes", 0)
    except (OSError, json.JSONDecodeError, KeyError):
        pass

    max_bytes = scan_transcript(transcript_path) if transcript_path else 0

    try:
        with open(cache_path, "w") as f:
            json.dump({"max_error_bytes": max_bytes, "checked_at": time.time()}, f)
    except OSError:
        pass

    return max_bytes


def get_rate_limits(data):
    rl = data.get("rate_limits")
    if not rl:
        return None, None
    return rl.get("five_hour"), rl.get("seven_day")


def format_line(r_emoji, r_tokens, has_r_data, five_h, seven_d, max_error_bytes):
    parts = [f"{r_emoji} {fmt_tokens(r_tokens, has_r_data)}"]

    for window, label, info in (("five_hour", "5h", five_h), ("seven_day", "7d", seven_d)):
        if info is None:
            continue
        pct = int(info.get("used_percentage") or 0)
        resets_at = info.get("resets_at")
        bar = make_bar(pct)
        critical = "🚨 " if pct >= 80 else ""
        reset_str = f" → {fmt_reset_time(resets_at, window)}" if resets_at else ""
        parts.append(f"{label} {bar} {critical}{pct}%{reset_str}")

    if max_error_bytes > _2KB:
        kb = (max_error_bytes + 1023) // 1024
        parts.append(f"⚠ err {kb}KB")

    return "  │  ".join(parts)


def main():
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, OSError):
        print("🟢 --")
        return

    r_tokens, r_emoji, has_r_data = compute_r(data)
    five_h, seven_d = get_rate_limits(data)
    max_error_bytes = get_tool_error(data)

    print(format_line(r_emoji, r_tokens, has_r_data, five_h, seven_d, max_error_bytes))


if __name__ == "__main__":
    main()
