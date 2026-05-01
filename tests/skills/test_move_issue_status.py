import io
import json
import os
import sys
import unittest
from contextlib import redirect_stdout
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../plugins/workflow/skills/move-issue-status'))

import move_issue_status as m


PROJECTS_JSON = json.dumps({"projects": [
    {"number": 2, "id": "PVT_abc", "title": "Issue Tracker"}
]})

ITEMS_JSON_MATCH = json.dumps({"items": [
    {"id": "PVTI_x", "content": {"number": 42, "type": "Issue"}, "status": "📋 New"}
]})

ITEMS_JSON_NO_MATCH = json.dumps({"items": [
    {"id": "PVTI_y", "content": {"number": 99, "type": "Issue"}, "status": "📋 New"}
]})

FIELDS_JSON = json.dumps({"fields": [
    {"id": "PVTSSF_z", "name": "Status", "type": "ProjectV2SingleSelectField",
     "options": [
         {"id": "opt1", "name": "📋 New"},
         {"id": "opt2", "name": "🧠 Brainstorming"},
         {"id": "opt3", "name": "🏗️ Building"},
     ]}
]})

FIELDS_JSON_NO_STATUS = json.dumps({"fields": [
    {"id": "PVTF_a", "name": "Title", "type": "ProjectV2Field"}
]})


def make_proc(stdout=""):
    proc = MagicMock()
    proc.stdout = stdout
    proc.returncode = 0
    return proc


class TestResolveRepo(unittest.TestCase):
    @patch('subprocess.run')
    def test_https_url(self, mock_run):
        mock_run.return_value = make_proc("https://github.com/HeadlessTarry/Token-Effort.git\n")
        owner, repo = m.resolve_repo()
        self.assertEqual(owner, "HeadlessTarry")
        self.assertEqual(repo, "Token-Effort")

    @patch('subprocess.run')
    def test_ssh_url(self, mock_run):
        mock_run.return_value = make_proc("git@github.com:HeadlessTarry/Token-Effort.git\n")
        owner, repo = m.resolve_repo()
        self.assertEqual(owner, "HeadlessTarry")
        self.assertEqual(repo, "Token-Effort")

    @patch.dict(os.environ, {"GITHUB_ACTIONS": "true", "GITHUB_REPOSITORY": "Org/Repo"})
    def test_github_actions(self):
        owner, repo = m.resolve_repo()
        self.assertEqual(owner, "Org")
        self.assertEqual(repo, "Repo")


class TestFindProjectItem(unittest.TestCase):
    @patch('subprocess.run')
    def test_finds_match(self, mock_run):
        mock_run.side_effect = [
            make_proc(PROJECTS_JSON),
            make_proc(ITEMS_JSON_MATCH),
        ]
        result = m.find_project_item("HeadlessTarry", 42)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["item_id"], "PVTI_x")
        self.assertEqual(result[0]["project_name"], "Issue Tracker")
        self.assertEqual(result[0]["current_status"], "📋 New")

    @patch('subprocess.run')
    def test_no_match(self, mock_run):
        mock_run.side_effect = [
            make_proc(PROJECTS_JSON),
            make_proc(ITEMS_JSON_NO_MATCH),
        ]
        result = m.find_project_item("HeadlessTarry", 42)
        self.assertEqual(result, [])


class TestGetStatusField(unittest.TestCase):
    @patch('subprocess.run')
    def test_returns_status_field(self, mock_run):
        mock_run.return_value = make_proc(FIELDS_JSON)
        field = m.get_status_field("HeadlessTarry", 2)
        self.assertIsNotNone(field)
        self.assertEqual(field["field_id"], "PVTSSF_z")
        self.assertEqual(len(field["options"]), 3)

    @patch('subprocess.run')
    def test_returns_none_when_absent(self, mock_run):
        mock_run.return_value = make_proc(FIELDS_JSON_NO_STATUS)
        field = m.get_status_field("HeadlessTarry", 2)
        self.assertIsNone(field)


class TestRunAdvanceMode(unittest.TestCase):
    def _match(self, status="📋 New"):
        return [{"item_id": "PVTI_x", "project_number": 2, "project_id": "PVT_abc",
                 "project_name": "Issue Tracker", "current_status": status}]

    def _field(self):
        return {"field_id": "PVTSSF_z", "options": [
            {"id": "opt1", "name": "📋 New"},
            {"id": "opt2", "name": "🧠 Brainstorming"},
            {"id": "opt3", "name": "🏗️ Building"},
        ]}

    @patch('move_issue_status.get_status_field')
    @patch('move_issue_status.find_project_item')
    @patch('move_issue_status.resolve_repo', return_value=("HeadlessTarry", "Token-Effort"))
    def test_advance_moves_from_first_column(self, _repo, mock_find, mock_field):
        mock_find.return_value = self._match("📋 New")
        mock_field.return_value = self._field()
        with patch('subprocess.run', return_value=make_proc("")):
            result = m.run(42, None)
        self.assertEqual(result["status"], "moved")
        self.assertEqual(result["to"], "🧠 Brainstorming")
        self.assertEqual(result["issue"], 42)

    @patch('move_issue_status.find_project_item')
    @patch('move_issue_status.resolve_repo', return_value=("HeadlessTarry", "Token-Effort"))
    def test_advance_skips_zero_projects(self, _repo, mock_find):
        mock_find.return_value = []
        result = m.run(42, None)
        self.assertEqual(result, {"status": "skipped"})

    @patch('move_issue_status.find_project_item')
    @patch('move_issue_status.resolve_repo', return_value=("HeadlessTarry", "Token-Effort"))
    def test_advance_skips_multiple_projects(self, _repo, mock_find):
        mock_find.return_value = [self._match()[0], self._match()[0]]
        result = m.run(42, None)
        self.assertEqual(result, {"status": "skipped"})

    @patch('move_issue_status.get_status_field')
    @patch('move_issue_status.find_project_item')
    @patch('move_issue_status.resolve_repo', return_value=("HeadlessTarry", "Token-Effort"))
    def test_advance_skips_null_status(self, _repo, mock_find, mock_field):
        mock_find.return_value = self._match(None)
        mock_field.return_value = self._field()
        result = m.run(42, None)
        self.assertEqual(result, {"status": "skipped"})

    @patch('move_issue_status.get_status_field')
    @patch('move_issue_status.find_project_item')
    @patch('move_issue_status.resolve_repo', return_value=("HeadlessTarry", "Token-Effort"))
    def test_advance_skips_non_first_column(self, _repo, mock_find, mock_field):
        mock_find.return_value = self._match("🧠 Brainstorming")
        mock_field.return_value = self._field()
        result = m.run(42, None)
        self.assertEqual(result, {"status": "skipped"})

    @patch('move_issue_status.get_status_field')
    @patch('move_issue_status.find_project_item')
    @patch('move_issue_status.resolve_repo', return_value=("HeadlessTarry", "Token-Effort"))
    def test_advance_skips_last_column(self, _repo, mock_find, mock_field):
        mock_find.return_value = self._match("🏗️ Building")
        mock_field.return_value = self._field()
        result = m.run(42, None)
        self.assertEqual(result, {"status": "skipped"})

    @patch('move_issue_status.get_status_field')
    @patch('move_issue_status.find_project_item')
    @patch('move_issue_status.resolve_repo', return_value=("HeadlessTarry", "Token-Effort"))
    def test_advance_skips_no_status_field(self, _repo, mock_find, mock_field):
        mock_find.return_value = self._match("📋 New")
        mock_field.return_value = None
        result = m.run(42, None)
        self.assertEqual(result, {"status": "skipped"})


class TestRunExplicitMode(unittest.TestCase):
    def _match(self):
        return [{"item_id": "PVTI_x", "project_number": 2, "project_id": "PVT_abc",
                 "project_name": "Issue Tracker", "current_status": "🧠 Brainstorming"}]

    def _field(self):
        return {"field_id": "PVTSSF_z", "options": [
            {"id": "opt1", "name": "📋 New"},
            {"id": "opt2", "name": "🧠 Brainstorming"},
            {"id": "opt3", "name": "🏗️ Building"},
        ]}

    @patch('move_issue_status.get_status_field')
    @patch('move_issue_status.find_project_item')
    @patch('move_issue_status.resolve_repo', return_value=("HeadlessTarry", "Token-Effort"))
    def test_explicit_moves_to_named_status(self, _repo, mock_find, mock_field):
        mock_find.return_value = self._match()
        mock_field.return_value = self._field()
        with patch('subprocess.run', return_value=make_proc("")):
            result = m.run(42, "Building")
        self.assertEqual(result["status"], "moved")
        self.assertEqual(result["to"], "🏗️ Building")

    @patch('move_issue_status.get_status_field')
    @patch('move_issue_status.find_project_item')
    @patch('move_issue_status.resolve_repo', return_value=("HeadlessTarry", "Token-Effort"))
    def test_explicit_case_insensitive_match(self, _repo, mock_find, mock_field):
        mock_find.return_value = self._match()
        mock_field.return_value = self._field()
        with patch('subprocess.run', return_value=make_proc("")):
            result = m.run(42, "building")
        self.assertEqual(result["status"], "moved")
        self.assertEqual(result["to"], "🏗️ Building")

    @patch('move_issue_status.find_project_item')
    @patch('move_issue_status.resolve_repo', return_value=("HeadlessTarry", "Token-Effort"))
    def test_explicit_error_no_board(self, _repo, mock_find):
        mock_find.return_value = []
        result = m.run(99, "Building")
        self.assertEqual(result["status"], "error")
        self.assertIn("99", result["message"])

    @patch('move_issue_status.get_status_field')
    @patch('move_issue_status.find_project_item')
    @patch('move_issue_status.resolve_repo', return_value=("HeadlessTarry", "Token-Effort"))
    def test_explicit_error_unknown_status(self, _repo, mock_find, mock_field):
        mock_find.return_value = self._match()
        mock_field.return_value = self._field()
        result = m.run(42, "NonExistent")
        self.assertEqual(result["status"], "error")
        self.assertIn("NonExistent", result["message"])
        self.assertIn("New", result["message"])


class TestMain(unittest.TestCase):
    @patch('move_issue_status.run', return_value={"status": "moved", "issue": 84, "to": "Planning", "project": "X"})
    def test_strips_hash_prefix(self, mock_run):
        buf = io.StringIO()
        with patch('sys.argv', ['move_issue_status.py', '#84', 'Planning']), redirect_stdout(buf):
            m.main()
        mock_run.assert_called_once_with(84, "Planning")
        output = json.loads(buf.getvalue())
        self.assertEqual(output["status"], "moved")
        self.assertEqual(output["issue"], 84)

    @patch('move_issue_status.run', return_value={"status": "skipped"})
    def test_advance_mode_no_status_arg(self, mock_run):
        buf = io.StringIO()
        with patch('sys.argv', ['move_issue_status.py', '42']), redirect_stdout(buf):
            m.main()
        mock_run.assert_called_once_with(42, None)
        output = json.loads(buf.getvalue())
        self.assertEqual(output["status"], "skipped")


if __name__ == '__main__':
    unittest.main()
