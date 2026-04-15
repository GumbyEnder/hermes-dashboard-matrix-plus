from pathlib import Path

import api.dashboard_phase2 as dp


def test_obsidian_scan_skips_when_nas_mount_unavailable(monkeypatch):
    monkeypatch.setattr(dp, "OBSIDIAN_VAULT", Path('/mnt/nas/Obsidian Vault'))
    monkeypatch.setattr(dp.os.path, "ismount", lambda p: False)

    called = {"walk": 0}

    def _walk(*args, **kwargs):
        called["walk"] += 1
        return iter(())

    monkeypatch.setattr(dp.os, "walk", _walk)

    touched = dp.load_recent_obsidian_touched(limit=20, days=30)
    assert touched == []
    assert called["walk"] == 0


def test_projects_scan_skips_when_nas_mount_unavailable(monkeypatch):
    monkeypatch.setattr(dp.os.path, "ismount", lambda p: False)

    class FakeRoot:
        def __init__(self):
            self.called = False

        def exists(self):
            return True

        def iterdir(self):
            self.called = True
            return iter(())

        def __str__(self):
            return "/mnt/nas/agents/Projects"

    fake = FakeRoot()
    projects = dp.load_recent_projects(limit=10, root=fake)

    assert projects == []
    assert fake.called is False
