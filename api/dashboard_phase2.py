"""Hermes dashboard Phase2 helpers.

This module keeps the Phase2 dashboard logic out of routes.py:
- append-only event ledger
- Obsidian brief parsing
- active dialog graph synthesis
- cost drill-down aggregation
- recent Obsidian touch scan

All functions are defensive: if a source is missing or malformed, they
return empty structures rather than raising.
"""
from __future__ import annotations

import fcntl
import json
import os
import re
import time
from collections import defaultdict, deque
from pathlib import Path
from typing import Any, Dict, Iterable, List, Tuple

from api.models import all_sessions

HERMES_HOME = Path(os.getenv('HERMES_HOME', str(Path.home() / '.hermes'))).expanduser()
LEDGER_DIR = Path(os.getenv('HERMES_DASHBOARD_LEDGER_DIR', str(HERMES_HOME / 'dashboard'))).expanduser()
LEDGER_FILE = LEDGER_DIR / 'ledger.jsonl'
NAS_MOUNT_ROOT = Path('/mnt/nas')
OBSIDIAN_VAULT = NAS_MOUNT_ROOT / 'Obsidian Vault'
BRIEFS_DIR = OBSIDIAN_VAULT / 'Hermes' / 'Briefs'
DEFAULT_PROJECTS_ROOT = NAS_MOUNT_ROOT / 'agents/Projects'

SECTION_NAMES = ('What', 'WhyStopped', 'Next', 'When')
_TOOL_AGENT_NAMES = {'delegate_task', 'subagent_progress'}


def _safe_int(value: Any, default: int = 0) -> int:
    try:
        return int(value or default)
    except Exception:
        return default


def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value or default)
    except Exception:
        return default


def _fmt_ts(ts: Any) -> float:
    return _safe_float(ts, 0.0)


def _session_project_name(session: dict) -> str:
    project_id = str(session.get('project_id') or '').strip()
    if project_id:
        return project_id
    workspace = str(session.get('workspace') or '').strip()
    if workspace:
        return Path(workspace).name or workspace
    return 'unknown'


def _session_day(session: dict) -> str:
    ts = _fmt_ts(session.get('updated_at') or session.get('created_at') or time.time())
    return time.strftime('%Y-%m-%d', time.localtime(ts))


def _truncate(text: Any, length: int = 220) -> str:
    s = str(text or '').strip()
    if len(s) <= length:
        return s
    return s[: max(0, length - 1)] + '…'


def _is_nas_path(path: Any) -> bool:
    try:
        return str(path).startswith(str(NAS_MOUNT_ROOT))
    except Exception:
        return False


def _is_nas_mount_available() -> bool:
    try:
        return os.path.ismount(str(NAS_MOUNT_ROOT))
    except Exception:
        return False


def _first_heading(text: str) -> str:
    for line in text.splitlines():
        if line.startswith('#'):
            return line.lstrip('#').strip()
    return ''


def _parse_sections(text: str) -> Dict[str, str]:
    sections: Dict[str, List[str]] = {}
    current = None
    for line in text.splitlines():
        m = re.match(r'^##\s+(.+?)\s*$', line.strip())
        if m:
            current = m.group(1).strip()
            sections.setdefault(current, [])
            continue
        if current:
            sections.setdefault(current, []).append(line)
    return {k: '\n'.join(v).strip() for k, v in sections.items()}


def _read_jsonl_tail(path: Path, limit: int = 100) -> List[dict]:
    if not path.exists():
        return []
    try:
        with path.open('r', encoding='utf-8', errors='ignore') as fh:
            return [json.loads(line) for line in deque(fh, maxlen=max(1, limit)) if line.strip()]
    except Exception:
        return []


def _event_base(event_type: str, **fields: Any) -> dict:
    event = {
        'ts': time.time(),
        'owner': 'Aragorn',
        'project': 'Hermes Dashboard',
        'type': event_type,
        'source': 'webui',
    }
    event.update({k: v for k, v in fields.items() if v is not None})
    return event


def record_dashboard_event(event_type: str, **fields: Any) -> None:
    """Append a single ledger event to ~/.hermes/dashboard/ledger.jsonl."""
    try:
        LEDGER_DIR.mkdir(parents=True, exist_ok=True)
        payload = _event_base(event_type, **fields)
        with LEDGER_FILE.open('a', encoding='utf-8') as fh:
            try:
                fcntl.flock(fh.fileno(), fcntl.LOCK_EX)
            except Exception:
                pass
            fh.write(json.dumps(payload, ensure_ascii=False, separators=(',', ':')) + '\n')
            fh.flush()
            try:
                os.fsync(fh.fileno())
            except Exception:
                pass
            try:
                fcntl.flock(fh.fileno(), fcntl.LOCK_UN)
            except Exception:
                pass
    except Exception:
        pass


def load_recent_ledger(limit: int = 120) -> List[dict]:
    """Return recent ledger events, combining append-only file events and live synthesis."""
    limit = max(1, min(int(limit or 120), 500))
    events = _read_jsonl_tail(LEDGER_FILE, limit=max(20, limit // 2))

    live = []
    for session in sorted((s for s in all_sessions() if isinstance(s, dict)), key=lambda s: _fmt_ts(s.get('updated_at')), reverse=True)[: max(10, limit // 3)]:
        live.append({
            'ts': _fmt_ts(session.get('updated_at') or session.get('created_at') or time.time()),
            'owner': 'Aragorn',
            'project': 'Hermes Dashboard',
            'type': 'session_snapshot',
            'source': 'live',
            'session_id': session.get('session_id'),
            'title': session.get('title') or 'Untitled',
            'model': session.get('model') or 'unknown',
            'profile': session.get('profile') or 'default',
            'project_ref': _session_project_name(session),
            'message_count': _safe_int(session.get('message_count')),
            'input_tokens': _safe_int(session.get('input_tokens')),
            'output_tokens': _safe_int(session.get('output_tokens')),
            'estimated_cost': _safe_float(session.get('estimated_cost')),
        })

    recent_files = load_recent_obsidian_touched(limit=max(10, limit // 3))
    for f in recent_files[: max(5, limit // 5)]:
        live.append({
            'ts': _fmt_ts(f.get('mtime')),
            'owner': 'Aragorn',
            'project': 'Hermes Dashboard',
            'type': 'obsidian_file_touched',
            'source': 'live',
            'path': f.get('path'),
            'name': f.get('name'),
            'folder': f.get('folder'),
        })

    recent_projects = load_recent_projects(limit=max(5, limit // 5))
    for p in recent_projects:
        live.append({
            'ts': _fmt_ts(p.get('mtime')),
            'owner': 'Aragorn',
            'project': 'Hermes Dashboard',
            'type': 'project_touched',
            'source': 'live',
            'name': p.get('name'),
            'path': p.get('path'),
        })

    merged = events + live
    merged.sort(key=lambda e: _fmt_ts(e.get('ts')), reverse=True)
    return merged[:limit]


def load_recent_obsidian_touched(limit: int = 50, days: int = 30) -> List[dict]:
    """Scan the Obsidian vault for recently modified files."""
    if _is_nas_path(OBSIDIAN_VAULT) and not _is_nas_mount_available():
        return []
    if not OBSIDIAN_VAULT.exists():
        return []

    cutoff = time.time() - (days * 86400)
    touched: List[dict] = []
    try:
        for root, _, files in os.walk(OBSIDIAN_VAULT):
            for name in files:
                path = Path(root) / name
                try:
                    stat = path.stat()
                except Exception:
                    continue
                if stat.st_mtime < cutoff:
                    continue
                touched.append({
                    'path': str(path),
                    'name': path.name,
                    'folder': str(path.parent),
                    'mtime': stat.st_mtime,
                })
    except Exception:
        return []

    touched.sort(key=lambda x: x['mtime'], reverse=True)
    return touched[: max(1, int(limit or 50))]


def load_recent_projects(limit: int = 20, root: Path = DEFAULT_PROJECTS_ROOT) -> List[dict]:
    if _is_nas_path(root) and not _is_nas_mount_available():
        return []
    if not root.exists():
        return []
    projects: List[dict] = []
    try:
        for p in sorted(root.iterdir(), key=lambda x: x.stat().st_mtime, reverse=True):
            if not p.is_dir() or p.name.startswith('.'):
                continue
            try:
                stat = p.stat()
            except Exception:
                continue
            projects.append({
                'name': p.name,
                'path': str(p),
                'mtime': stat.st_mtime,
                'size_mb': round(stat.st_size / 1e6, 1) if stat.st_size else 0,
            })
    except Exception:
        return []
    return projects[: max(1, int(limit or 20))]


def load_briefs(limit: int = 20) -> List[dict]:
    """Parse Obsidian briefs into dashboard cards."""
    if _is_nas_path(BRIEFS_DIR) and not _is_nas_mount_available():
        return []
    if not BRIEFS_DIR.exists():
        return []
    briefs: List[dict] = []
    recent_touched = load_recent_obsidian_touched(limit=100)
    try:
        files = sorted(BRIEFS_DIR.glob('*.md'), key=lambda p: p.stat().st_mtime, reverse=True)
    except Exception:
        return []

    for path in files[: max(1, int(limit or 20))]:
        try:
            raw = path.read_text(encoding='utf-8')
        except Exception:
            continue
        sections = _parse_sections(raw)
        title = _first_heading(raw) or path.stem
        rel_files = [f for f in recent_touched if str(f.get('folder') or '').startswith(str(path.parent))]
        briefs.append({
            'title': title,
            'path': str(path),
            'mtime': path.stat().st_mtime,
            'what': _truncate(sections.get('What', ''), 500),
            'why_stopped': _truncate(sections.get('WhyStopped', ''), 300),
            'next': _truncate(sections.get('Next', ''), 300),
            'when': _truncate(sections.get('When', ''), 220),
            'sections': {k: _truncate(sections.get(k, ''), 500) for k in SECTION_NAMES},
            'recent_files': rel_files[:5],
        })
    return briefs


def build_cost_breakdown(limit: int = 25) -> dict:
    sessions = [s for s in all_sessions() if isinstance(s, dict)]
    by_model: Dict[str, dict] = defaultdict(lambda: {'model': '', 'sessions': 0, 'input_tokens': 0, 'output_tokens': 0, 'estimated_cost': 0.0})
    by_project: Dict[str, dict] = defaultdict(lambda: {'project': '', 'sessions': 0, 'input_tokens': 0, 'output_tokens': 0, 'estimated_cost': 0.0})
    by_day: Dict[str, dict] = defaultdict(lambda: {'day': '', 'sessions': 0, 'input_tokens': 0, 'output_tokens': 0, 'estimated_cost': 0.0})
    top_sessions: List[dict] = []

    total_in = total_out = 0
    total_cost = 0.0
    for s in sessions:
        input_tokens = _safe_int(s.get('input_tokens'))
        output_tokens = _safe_int(s.get('output_tokens'))
        estimated_cost = _safe_float(s.get('estimated_cost'))
        model = str(s.get('model') or 'unknown')
        project = _session_project_name(s)
        day = _session_day(s)

        total_in += input_tokens
        total_out += output_tokens
        total_cost += estimated_cost

        bm = by_model[model]
        bm['model'] = model
        bm['sessions'] += 1
        bm['input_tokens'] += input_tokens
        bm['output_tokens'] += output_tokens
        bm['estimated_cost'] += estimated_cost

        bp = by_project[project]
        bp['project'] = project
        bp['sessions'] += 1
        bp['input_tokens'] += input_tokens
        bp['output_tokens'] += output_tokens
        bp['estimated_cost'] += estimated_cost

        bd = by_day[day]
        bd['day'] = day
        bd['sessions'] += 1
        bd['input_tokens'] += input_tokens
        bd['output_tokens'] += output_tokens
        bd['estimated_cost'] += estimated_cost

        top_sessions.append({
            'session_id': s.get('session_id'),
            'title': s.get('title') or 'Untitled',
            'model': model,
            'project': project,
            'profile': s.get('profile') or 'default',
            'updated_at': _fmt_ts(s.get('updated_at')),
            'input_tokens': input_tokens,
            'output_tokens': output_tokens,
            'estimated_cost': estimated_cost,
            'message_count': _safe_int(s.get('message_count')),
        })

    top_sessions.sort(key=lambda s: s['estimated_cost'], reverse=True)

    return {
        'total_input_tokens': total_in,
        'total_output_tokens': total_out,
        'total_estimated_cost': round(total_cost, 4),
        'session_count': len(sessions),
        'by_model': sorted(by_model.values(), key=lambda x: x['estimated_cost'], reverse=True)[:limit],
        'by_project': sorted(by_project.values(), key=lambda x: x['estimated_cost'], reverse=True)[:limit],
        'by_day': sorted(by_day.values(), key=lambda x: x['day'], reverse=True)[:limit],
        'top_sessions': top_sessions[:limit],
    }


def _tool_label(tool: dict) -> str:
    name = str(tool.get('name') or 'tool')
    snippet = str(tool.get('snippet') or '').strip()
    if name == 'delegate_task':
        args = tool.get('args') or {}
        goal = ''
        if isinstance(args, dict):
            goal = str(args.get('goal') or args.get('prompt') or args.get('name') or '').strip()
        if goal:
            return _truncate(goal, 120)
    if name == 'subagent_progress':
        args = tool.get('args') or {}
        if isinstance(args, dict):
            label = str(args.get('status') or args.get('message') or args.get('step') or '').strip()
            if label:
                return _truncate(label, 120)
    return _truncate(snippet or name, 140)


def build_dialog_graph(limit: int = 20) -> dict:
    sessions = sorted((s for s in all_sessions() if isinstance(s, dict)), key=lambda s: _fmt_ts(s.get('updated_at')), reverse=True)[: max(1, int(limit or 20))]
    nodes: List[dict] = []
    edges: List[dict] = []
    roots: List[dict] = []

    for session in sessions:
        sid = session.get('session_id')
        if not sid:
            continue
        session_node = {
            'id': sid,
            'type': 'session',
            'label': session.get('title') or 'Untitled',
            'title': session.get('title') or 'Untitled',
            'model': session.get('model') or 'unknown',
            'profile': session.get('profile') or 'default',
            'workspace': session.get('workspace'),
            'project': _session_project_name(session),
            'updated_at': _fmt_ts(session.get('updated_at')),
            'message_count': _safe_int(session.get('message_count')),
            'input_tokens': _safe_int(session.get('input_tokens')),
            'output_tokens': _safe_int(session.get('output_tokens')),
            'estimated_cost': _safe_float(session.get('estimated_cost')),
            'children': [],
        }
        nodes.append(session_node)
        roots.append(session_node)

        tool_calls = session.get('tool_calls') or []
        for idx, tool in enumerate(tool_calls):
            if not isinstance(tool, dict):
                continue
            tool_id = tool.get('tid') or f'{sid}:tool:{idx}'
            tool_name = str(tool.get('name') or 'tool')
            node_type = 'agent' if tool_name in _TOOL_AGENT_NAMES else 'tool'
            tool_node = {
                'id': tool_id,
                'type': node_type,
                'label': _tool_label(tool),
                'name': tool_name,
                'session_id': sid,
                'assistant_msg_idx': tool.get('assistant_msg_idx'),
                'snippet': tool.get('snippet') or '',
                'args': tool.get('args') or {},
                'status': 'done',
            }
            nodes.append(tool_node)
            edges.append({'from': sid, 'to': tool_id, 'type': tool_name})
            session_node['children'].append(tool_node)

    return {
        'roots': roots,
        'nodes': nodes,
        'edges': edges,
        'session_count': len(roots),
        'tool_count': sum(1 for n in nodes if n.get('type') in {'tool', 'agent'}),
    }


def build_ops_briefs_payload(limit: int = 20) -> dict:
    return {
        'briefs': load_briefs(limit=limit),
        'recent_touched': load_recent_obsidian_touched(limit=50),
    }


def build_ops_ledger_payload(limit: int = 120) -> dict:
    return {
        'events': load_recent_ledger(limit=limit),
        'recent_touched': load_recent_obsidian_touched(limit=25),
    }
