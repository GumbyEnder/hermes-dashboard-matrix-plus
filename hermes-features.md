# Hermes Dashboard Matrix Plus
# Current Feature Set

Generated: 2026-04-15

## Core Dashboard

- Theme-aware operator dashboard with distinct Matrix and Amber header media
- Real Hermes-backed chat using start/stream endpoints instead of placeholder replies
- Live CPU, memory, disk, and network metrics in the header
- Shared alert center fed from real ops ledger events
- Centralized frontend API/error handling and shared polling behavior

## Agents

- Profile list sourced from Hermes profiles
- Create, clone, switch active, and delete profile actions
- Per-agent tabs for:
  - Overview
  - Sessions
  - Config
  - Cron
  - Gateway

## Sessions

- Per-agent session listing
- Search sessions by title/model/project
- Rename
- Export
- Pin / unpin
- Archive / unarchive
- Clear
- Delete

## Config And Files

- Editable `SOUL.md`
- Editable `config.yaml`
- Workspace file browsing with text preview dialogs
- Reusable markdown/text viewer/editor for operator-facing files

## Skills

- Real skills inventory
- Category grouping
- Enable / disable controls
- Detail views for skill descriptions and markdown content

## Projects

- Project list from backend metadata
- Recent briefs view with text preview
- Recent ledger activity view
- Persisted per-project Kanban board with:
  - Todo
  - In Progress
  - Done

## Notes And Todos

- Notes backed by Hermes state
- Editable note content
- Todos sourced from real stored data rather than placeholder cards

## Operations

- Gateway status
- Gateway logs
- Gateway start / stop / restart
- Cron list / create / run / pause / resume / delete
- Maintenance panel for update checks, update apply, and session cleanup

## Reports

- Time windows:
  - 1 hour
  - 24 hours
  - 7 days
  - 30 days
- Headline totals
- Trend graphs
- Real backend-driven reporting instead of fake summary data

## Credits

- Hermes Web UI / Hermes Agent by the Hermes ecosystem
- `xaspx/hermes-control-interface` as a useful parity and ops reference
- `NousResearch`
- `Teknium`
