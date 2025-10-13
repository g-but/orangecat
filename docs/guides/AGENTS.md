# AGENTS.md - Orange Cat Multi-Agent Development

## 🤖 Available AI Agents

### **Cursor Models (Primary IDE)**
- **Code-Supernova-1-Million** - 1M context, complex architecture
- **Grok Code** - Real-time knowledge, quick fixes
- **Claude Code** - TypeScript/backend expertise
- **Other Models** - Latest GPT models, etc.

### **Agent Selection Guide**
- **Complex Architecture & ML Models** → Code-Supernova-1-Million
- **TypeScript/Node.js/API Work** → Claude Code
- **Quick Fixes & Research** → Grok Code
- **Frontend/React Development** → Latest GPT or Claude Code

### **Coordination Commands**
- `make ho MESSAGE="handoff message"` - Quick handoff
- `make model-select TASK="task description"` - Get model recommendation
- `make claim AGENT=model AREA="area" SUMMARY="summary" ETA="30m"` - Claim task
- `bash scripts/smoke.sh` - Health checks (customize for Orange Cat)

## Orange Cat Project Overview
Bitcoin-powered crowdfunding platform built for transparency and impact with native Bitcoin and Lightning Network support.

## Contributing With AI Agents
- Use Cursor's "Apply" feature to implement changes
- Models auto-detect project structure
- Update TASK_QUEUE.md when claiming/completing tasks
- Log all activities in AGENTS_SYNC.md

