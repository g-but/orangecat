#!/usr/bin/env bash
set -euo pipefail

# Quick handoff command
MESSAGE=${1:-"Handoff to next agent"}
export AGENT_NAME="${AGENT_NAME:-Cursor}"

echo "🔄 Initiating handoff from $AGENT_NAME..."
echo ""
echo "## $(date -u +%Y-%m-%dT%H:%M:%SZ) — Agent: $AGENT_NAME" >> AGENTS_SYNC.md
echo "- Summary: $MESSAGE" >> AGENTS_SYNC.md
echo "- Changes: N/A (handoff)" >> AGENTS_SYNC.md
echo "- Commands: ho command executed" >> AGENTS_SYNC.md
echo "- Notes/Asks: Ready for next agent to continue" >> AGENTS_SYNC.md
echo "" >> AGENTS_SYNC.md

echo "✅ Handoff logged to AGENTS_SYNC.md"
echo "🚀 Ready for next agent!"
