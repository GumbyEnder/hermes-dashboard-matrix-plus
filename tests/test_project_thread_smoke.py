"""
Smoke coverage for project -> thread binding and editable project metadata.
Exercises the same backend contract the live Projects UI uses.
"""
import json
import urllib.error
import urllib.request

BASE = "http://127.0.0.1:8788"


def get(path):
    with urllib.request.urlopen(BASE + path, timeout=10) as r:
        return json.loads(r.read()), r.status


def post(path, body=None):
    data = json.dumps(body or {}).encode()
    req = urllib.request.Request(BASE + path, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return json.loads(r.read()), r.status
    except urllib.error.HTTPError as e:
        return json.loads(e.read()), e.code


def make_project(created, name="Smoke Project"):
    d, status = post("/api/projects/create", {"name": name})
    assert status == 200, d
    pid = d["project"]["project_id"]
    created.append(pid)
    return d["project"]


def cleanup(project_ids, session_ids):
    for sid in session_ids:
        try:
            post("/api/session/delete", {"session_id": sid})
        except Exception:
            pass
    for pid in project_ids:
        try:
            post("/api/projects/delete", {"project_id": pid})
        except Exception:
            pass


def test_project_metadata_editor_and_thread_smoke():
    project_ids = []
    session_ids = []
    try:
        proj = make_project(project_ids, "Smoke Project")
        pid = proj["project_id"]

        d, status = post("/api/projects/update", {
            "project_id": pid,
            "status": "active",
            "url": "https://example.com/smoke-project",
            "access_instructions": "Open the workspace and continue the same thread.",
            "brief": "Smoke brief for binding."
        })
        assert status == 200, d
        assert d["project"]["status"] == "active"
        assert d["project"]["url"] == "https://example.com/smoke-project"
        assert d["project"]["brief"] == "Smoke brief for binding."

        thread1, status = post("/api/project/thread", {
            "project_id": pid,
            "project_name": "Smoke Project",
            "project_path": proj.get("path", ""),
            "brief": "Smoke brief for binding."
        })
        assert status == 200, thread1
        assert thread1["created"] is True
        assert thread1["project"]["project_id"] == pid
        assert thread1["session"]["project_id"] == pid
        sid = thread1["session"]["session_id"]
        session_ids.append(sid)
        assert thread1["status"] == "active"
        assert thread1["url"] == "https://example.com/smoke-project"
        assert "Open the workspace" in thread1["access_instructions"]
        assert any("Smoke brief for binding" in (m.get("content") or "") for m in thread1["session"]["messages"])

        thread2, status = post("/api/project/thread", {"project_id": pid})
        assert status == 200, thread2
        assert thread2["created"] is False
        assert thread2["session"]["session_id"] == sid
        assert thread2["session"]["project_id"] == pid

        projects, status = get("/api/projects")
        assert status == 200, projects
        match = next((p for p in projects["projects"] if p["project_id"] == pid), None)
        assert match is not None, projects
        assert match["status"] == "active"
        assert match["url"] == "https://example.com/smoke-project"
        assert match["access_instructions"].startswith("Open the workspace")
        assert "Smoke brief for binding" in (match.get("brief_preview") or "")
    finally:
        cleanup(project_ids, session_ids)
