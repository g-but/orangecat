# AI Agent Guides - Symlinked Location

**📍 Location:** This directory contains symlinks to the actual guides in `docs/guides/ai/`

## Why Symlinks?

- **Backward Compatibility**: Agents that reference `.ai-guides/` will still work
- **Better Organization**: Actual files are in `docs/guides/ai/` for better visibility  
- **Single Source of Truth**: All edits should be made in `docs/guides/ai/`

## Quick Links

All files here are symlinks to `docs/guides/ai/`:
- **COMMON.md** ⭐ - Single source of truth (via symlink)
- **claude.md** - Claude-specific workflows (via symlink)
- **cursor.md** - Cursor-specific patterns (via symlink)
- **gemini.md** - Gemini-specific workflows (via symlink)
- **codex.md** - Codex CLI-specific patterns (via symlink)
- **agents.md** - Universal agent reference (via symlink)

## For AI Agents

**Both locations work:**
- `.ai-guides/` (symlinks - for backward compatibility)
- `docs/guides/ai/` (actual files - preferred location)

**Reading order:**
1. **First**: Read `COMMON.md` (all shared content)
2. **Second**: Read agent-specific guide (e.g., `claude.md`)

## Tool-Specific Notes

- **Claude**: Uses `.claude/RULES.md` (stays in `.claude/` directory) ✅
- **Cursor**: Uses `.cursor/rules/*.mdc` (stays in `.cursor/` directory) ✅
- **Gemini CLI**: Looks for `GEMINI.md` in project root (can be added if needed)
- **Custom Guides**: Located in `docs/guides/ai/` with symlinks here for compatibility

---

**Last Updated:** 2025-01-30  
**Status:** Symlinks created for backward compatibility
