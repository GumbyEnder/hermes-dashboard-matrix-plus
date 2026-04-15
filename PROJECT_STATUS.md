# Project Status

## Summary

Hermes Dashboard Matrix Plus began as a local extension of Hermes Web UI and has grown into a more visual, operations-focused dashboard that keeps the Hermes backend intact while replacing large sections of the frontend experience.

The current state is a hybrid project:

- original Python server and Hermes integration remain in place
- backend routes were extended to support richer dashboard workflows
- a React/Vite frontend redesign now drives most of the Matrix Plus user experience
- media-backed themes, editable notes, file previews, and live ops data are now first-class parts of the UI

## What Is Real Today

The following areas were specifically moved away from placeholder or fake data during this build cycle:

- header system metrics now use real `/api/ops/resources` data
- chat uses the real Hermes streaming flow
- notes persist back to Hermes
- todos come from Hermes-backed notes instead of random placeholders
- reports use backend data with real time-window filtering
- workspaces browse real files
- markdown and text previews can be edited where a real file path exists
- profiles resolve real profile files from `~/.hermes/profiles/<profile>/`
- skills list uses real backend state and supports enable/disable actions

## Major Additions In This Snapshot

### Backend

- dashboard asset routing updated to prefer staged redesign assets
- media asset aliasing added for theme header videos
- text-file read/save endpoints added for editable markdown and config flows
- profile content resolution corrected for non-default Hermes profiles
- login asset wiring fixed so password auth actually functions

### Frontend

- theme-specific header videos for Matrix and Amber skins
- streaming chat UX
- expanded chat composer for longer prompts
- editable markdown/text dialogs
- clickable notes ledger and brief viewers
- clickable workspace and project file previews
- collapsible skill categories with per-skill actions
- reporting cards and graphs with time filters

## Current Build Direction

This repository is not trying to be a minimal fork. It is explicitly aiming for:

- a more visual operator dashboard
- better use of Hermes data already present on disk
- fewer placeholder widgets
- better inspectability for notes, profiles, files, and reports
- theme personality without disconnecting from the underlying Hermes system

## Architecture Notes

The project currently has two frontend paths:

- `static/`
  legacy server-rendered / vanilla JS assets
- `redesign_src2/`
  the main React/Vite redesign used for Matrix Plus

The Python backend continues to be the single integration point for Hermes state, auth, file access, profile resolution, notes, sessions, and streaming chat.

## What Still Needs Work

- stronger end-to-end test coverage for dashboard interactions
- tighter packaging and deployment flow for the redesigned frontend
- more robust task/workspace UX
- cleanup of older redesign remnants that are no longer the active path

## Publishing Notes

This public export was intentionally sanitized before publication:

- machine-local `.env` excluded
- local recovery logs excluded
- local screenshots and ad hoc archive files excluded
- active runtime password excluded

The result is meant to be safe to share, clone, build, and extend.
