import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "plugins", "labs", "hooks"))

from compound_bash_allow import parse_command


def test_single_command():
    assert parse_command("git status") == ["git status"]


def test_and_operator():
    assert parse_command("cd /path && git status") == ["cd /path", "git status"]


def test_or_operator():
    assert parse_command("git check-ignore -q .worktrees 2>/dev/null || echo NOT") == [
        "git check-ignore -q .worktrees 2>/dev/null",
        "echo NOT",
    ]


def test_pipe_operator():
    assert parse_command("git log | head -5") == ["git log", "head -5"]


def test_semicolon_operator():
    assert parse_command("printenv FOO; echo done") == ["printenv FOO", "echo done"]


def test_operator_inside_double_quotes():
    assert parse_command('echo "a && b" || true') == ['echo "a && b"', "true"]


def test_operator_inside_single_quotes():
    assert parse_command("echo 'a && b' || true") == ["echo 'a && b'", "true"]


def test_chained_operators():
    assert parse_command('cd "..." && git check-ignore -q .worktrees 2>/dev/null && echo ignored || echo NOT') == [
        'cd "..."',
        "git check-ignore -q .worktrees 2>/dev/null",
        "echo ignored",
        "echo NOT",
    ]


def test_whitespace_stripped():
    assert parse_command("  git status  &&  echo done  ") == ["git status", "echo done"]


def test_subshell_not_split():
    # $() is out of scope — treated as a single unsplittable sub-command
    result = parse_command("cd $(git rev-parse --show-toplevel)")
    assert result == ["cd $(git rev-parse --show-toplevel)"]


def test_empty_string():
    assert parse_command("") == []


def test_only_whitespace():
    assert parse_command("   ") == []
