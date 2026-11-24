"""HUD session tabs follow the session's title, not just its project folder."""
import json

import pytest

from whisperstream import claude_hud
from whisperstream.agent_session_names import TranscriptTitleCache
from whisperstream.managed_sessions import ManagedSessionStore
from tests.test_agent_transports import packet
from tests.test_claude_hook_endpoint import PROMPT_SUBMIT, _make_client

CWD = r"C:\dev\hayestek-portal"


def test_record_event_renames_and_falls_back_to_the_basename():
    store = ManagedSessionStore()
    session = store.register("tok", agent="claude", cwd=CWD)
    assert session.source_name == "hayestek-portal"

    store.record_event("tok", "Stop", agent="claude", session_id="sid-1", name="Fix login")
    assert store.get("tok").source_name == "Fix login"

    # An event that says nothing about the name keeps it.
    store.record_event("tok", "UserPromptSubmit", agent="claude", session_id="sid-1")
    assert store.get("tok").source_name == "Fix login"

    # A name resolved to nothing (e.g. /whisperstream:name cleared, no title).
    store.record_event("tok", "Stop", agent="claude", session_id="sid-1", name=None)
    assert store.get("tok").source_name == "hayestek-portal"


@pytest.mark.usefixtures("accepted_eula")
def test_desktop_session_tab_takes_the_transcript_title(tmp_path, monkeypatch):
    monkeypatch.setattr(
        claude_hud, "_DEFAULT_TITLE_CACHE", TranscriptTitleCache(projects_root=tmp_path)
    )
    transcript = tmp_path / "C--dev-hayestek-portal" / "claude-1.jsonl"
    transcript.parent.mkdir()
    transcript.write_text(
        json.dumps({"type": "custom-title", "customTitle": "Fix login"}) + "\n",
        encoding="utf-8",
    )
    client, server = _make_client()
    try:
        client.post("/api/agent-transport/claude", json=packet(
            session_id="claude-1", surface="desktop", cwd=CWD))
        snapshot = server._agent_sessions_snapshot_event()
        assert [s["source_name"] for s in snapshot["sessions"]] == ["hayestek-portal"]

        client.post("/api/claude-hook", json={
            **PROMPT_SUBMIT, "session_id": "claude-1", "transcript_path": str(transcript)})
        snapshot = server._agent_sessions_snapshot_event()
        assert [s["source_name"] for s in snapshot["sessions"]] == ["Fix login"]
    finally:
        server._clear_agent_speak_state(reason="test_cleanup")
        client.close()
