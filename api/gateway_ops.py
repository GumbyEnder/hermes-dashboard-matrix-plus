"""Gateway service helpers for Hermes dashboard.

Provides lightweight systemd integration for per-profile Hermes gateway services.
This mirrors the practical service-name detection used in hermes-control-interface
while keeping the interface small and focused:

- read status
- read recent logs
- start / stop / restart
"""
from __future__ import annotations

import os
import subprocess
from pathlib import Path
from typing import Dict, List

IS_ROOT = False
try:
    IS_ROOT = os.getuid() == 0
except Exception:
    IS_ROOT = False

SYSTEMD_USER_FLAG = [] if IS_ROOT else ["--user"]
if not IS_ROOT and not os.getenv("XDG_RUNTIME_DIR"):
    try:
        uid = os.getuid()
        runtime_dir = Path(f"/run/user/{uid}")
        if runtime_dir.exists():
            os.environ["XDG_RUNTIME_DIR"] = str(runtime_dir)
    except Exception:
        pass


def _run(cmd: List[str], timeout: int = 8) -> tuple[str, bool]:
    try:
        res = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False,
        )
        out = (res.stdout or "") + (res.stderr or "")
        return out.strip(), res.returncode == 0
    except (subprocess.TimeoutExpired, OSError):
        return "", False


def _service_candidates(profile: str) -> Dict[str, str]:
    suffix = str(profile or "default").strip()
    bare = "hermes-gateway"
    profiled = f"hermes-gateway-{suffix}"
    primary = profiled if IS_ROOT else bare
    secondary = bare if primary == profiled else profiled
    return {
        "primary": primary,
        "secondary": secondary,
        "bare": bare,
        "profiled": profiled,
    }


def _service_exists(service: str) -> bool:
    out, _ = _run(["systemctl", *SYSTEMD_USER_FLAG, "list-unit-files", f"{service}.service"], timeout=6)
    return f"{service}.service" in out


def _pick_service(profile: str) -> str:
    candidates = _service_candidates(profile)
    if _service_exists(candidates["primary"]):
        return candidates["primary"]
    if _service_exists(candidates["secondary"]):
        return candidates["secondary"]
    return candidates["primary"]


def get_gateway_status(profile: str) -> dict:
    service = _pick_service(profile)
    if not _service_exists(service):
        return {
            "ok": True,
            "profile": profile,
            "service": service,
            "active": False,
            "enabled": False,
            "installed": False,
            "status": "not installed",
        }

    active_out, _ = _run(["systemctl", *SYSTEMD_USER_FLAG, "is-active", service], timeout=5)
    enabled_out, _ = _run(["systemctl", *SYSTEMD_USER_FLAG, "is-enabled", service], timeout=5)
    status_out, _ = _run(["systemctl", *SYSTEMD_USER_FLAG, "status", service, "--no-pager", "--lines=12"], timeout=8)
    active = active_out.strip() == "active"
    enabled = enabled_out.strip() == "enabled"

    return {
        "ok": True,
        "profile": profile,
        "service": service,
        "active": active,
        "enabled": enabled,
        "installed": True,
        "status": status_out.strip() or active_out.strip() or "unknown",
    }


def get_gateway_logs(profile: str, lines: int = 100) -> dict:
    service = _pick_service(profile)
    lines = max(10, min(int(lines or 100), 500))
    if not _service_exists(service):
        return {
            "ok": True,
            "profile": profile,
            "service": service,
            "logs": "",
            "installed": False,
        }

    logs_out, _ = _run(
        ["journalctl", *SYSTEMD_USER_FLAG, "-u", service, "--no-pager", "-n", str(lines)],
        timeout=10,
    )
    return {
        "ok": True,
        "profile": profile,
        "service": service,
        "logs": logs_out.strip(),
        "installed": True,
    }


def apply_gateway_action(profile: str, action: str) -> dict:
    if action not in {"start", "stop", "restart"}:
        return {"ok": False, "message": f"Unsupported action: {action}"}

    service = _pick_service(profile)
    if not _service_exists(service):
        return {
            "ok": False,
            "profile": profile,
            "service": service,
            "message": "Gateway service is not installed",
        }

    out, ok = _run(["systemctl", *SYSTEMD_USER_FLAG, action, service], timeout=12)
    status = get_gateway_status(profile)
    return {
        "ok": ok,
        "profile": profile,
        "service": service,
        "action": action,
        "active": status.get("active", False),
        "enabled": status.get("enabled", False),
        "status": status.get("status", ""),
        "output": out,
        "message": "" if ok else (out.strip() or f"{action} failed"),
    }
