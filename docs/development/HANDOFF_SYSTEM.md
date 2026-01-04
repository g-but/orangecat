# Handoff System Documentation

**Created:** 2025-01-28  
**Last Modified:** 2025-01-28  
**Last Modified Summary:** Initial creation of handoff system documentation

---

## 🎯 Purpose

The handoff system enables seamless transitions between different AI agents and compute providers, ensuring continuity of work and context preservation across sessions.

---

## 📋 Commands

### `h` or `handoff`

**Purpose**: Create or update the handoff document with current session work.

**When to use:**
- At the end of a development session
- Before switching to a different AI agent
- When you want to document current progress
- Before taking a break

**What it does:**
1. Reads existing handoff document (if it exists)
2. Updates it with current session's accomplishments
3. Documents recommended next steps
4. Saves to standardized location: `docs/development/SESSION_HANDOFF.md`

**Example:**
```
User: h
Agent: [Creates/updates SESSION_HANDOFF.md with current work]
```

---

### `pickup`

**Purpose**: Read the handoff document and continue from where the previous session left off.

**When to use:**
- At the start of a new session
- When switching to a different AI agent
- When resuming work after a break

**What it does:**
1. Reads the handoff document: `docs/development/SESSION_HANDOFF.md`
2. Summarizes previous session's work
3. Identifies recommended next steps
4. Asks which direction to proceed (or starts with recommended option)
5. Continues from where the previous agent left off

**Example:**
```
User: pickup
Agent: [Reads SESSION_HANDOFF.md]
Agent: "Previous session accomplished X, Y, Z. Recommended next step is A. Should I proceed with A, or would you like to do something else?"
```

---

## 📁 File Locations

### Handoff Document
- **Location**: `docs/development/SESSION_HANDOFF.md`
- **Purpose**: Current session handoff information
- **Updated**: Every time `h` or `handoff` is called
- **Read**: Every time `pickup` is called

### Handoff Template
- **Location**: `docs/development/HANDOFF_TEMPLATE.md`
- **Purpose**: Template structure for handoff documents
- **Updated**: Only when handoff structure changes

---

## 📝 Handoff Document Structure

The handoff document follows this structure (see `HANDOFF_TEMPLATE.md` for details):

1. **Session Summary** - What was the main focus?
2. **What We've Accomplished** - Detailed list of changes
3. **Metrics** - Code quality, performance, documentation metrics
4. **Recommended Next Steps** - Options with reasoning
5. **Key Patterns Established** - Code patterns to follow
6. **Files Modified/Created** - Complete file list
7. **Lessons Learned** - Key insights
8. **Quick Start for Next Session** - How to continue
9. **Reference Documents** - Related docs
10. **Notes for Next Developer** - Important context
11. **Context for [Agent Name]** - Agent-specific guidance

---

## 🔄 Workflow

### Ending a Session

```
1. User types: h
2. Agent reads existing SESSION_HANDOFF.md (if exists)
3. Agent updates it with current session work
4. Agent saves to docs/development/SESSION_HANDOFF.md
5. Agent confirms: "Handoff document updated. Ready for next session."
```

### Starting a New Session

```
1. User types: pickup
2. Agent reads docs/development/SESSION_HANDOFF.md
3. Agent summarizes previous work
4. Agent presents recommended next steps
5. Agent asks: "Should I proceed with [recommended option], or would you like to do something else?"
6. User responds, agent continues
```

---

## ✅ Best Practices

### For Handoff (`h`)

1. **Be Comprehensive**: Include all important changes, not just the latest
2. **Be Specific**: List exact files, line counts, patterns
3. **Be Actionable**: Next steps should be clear and executable
4. **Be Contextual**: Include user's goals and philosophy
5. **Update Dates**: Always update "Last Modified" date

### For Pickup (`pickup`)

1. **Read Carefully**: Understand what was done and why
2. **Summarize Clearly**: Present previous work concisely
3. **Recommend Wisely**: Suggest the best next step based on context
4. **Ask for Confirmation**: Don't assume, ask which direction to go
5. **Continue Seamlessly**: Pick up exactly where left off

---

## 🎯 Agent Requirements

All AI agents must:

1. **Recognize Commands**: Understand `h`, `handoff`, and `pickup`
2. **Follow Template**: Use `HANDOFF_TEMPLATE.md` structure
3. **Update Standard Location**: Always save to `docs/development/SESSION_HANDOFF.md`
4. **Preserve Context**: Maintain user's goals and philosophy
5. **Be Consistent**: Follow same format every time

---

## 📚 Integration with Agent Guides

All agent guides (`docs/guides/ai/*.md`) include:

1. **Handoff System Section**: Explains `h`/`handoff` and `pickup` commands
2. **Quick Reference Table**: Includes handoff commands
3. **Standardized Location**: Points to `docs/development/SESSION_HANDOFF.md`

---

## 🔍 Example Scenarios

### Scenario 1: Switching from Claude to Cursor

```
[Claude Session]
User: "Let's refactor the products route"
Claude: [Refactors products route]
User: "h"
Claude: [Updates SESSION_HANDOFF.md with refactoring work]

[Cursor Session]
User: "pickup"
Cursor: [Reads SESSION_HANDOFF.md]
Cursor: "Previous session refactored products route. Recommended next: apply same patterns to services route. Proceed?"
User: "Yes"
Cursor: [Applies patterns to services route]
```

### Scenario 2: Resuming After Break

```
[Morning Session]
User: "Let's add caching layer"
Agent: [Starts caching implementation]
User: "h"
Agent: [Documents partial progress]

[Afternoon Session]
User: "pickup"
Agent: [Reads handoff]
Agent: "Previous session started caching layer. Recommended: complete Redis setup. Continue?"
User: "Yes"
Agent: [Completes caching implementation]
```

---

## 🚀 Benefits

1. **Continuity**: Work continues seamlessly across sessions
2. **Context Preservation**: No loss of context when switching agents
3. **Efficiency**: Next agent knows exactly where to start
4. **Documentation**: Natural documentation of development progress
5. **Flexibility**: Easy to switch between different AI providers

---

## 📝 Notes

- The handoff document is **overwritten** each time `h` is called (not appended)
- Always include the **recommended next step** with reasoning
- Include **user's philosophy** and **goals** for context
- Update **dates** every time the document is modified
- Use the **template** to ensure consistency

---

**Remember**: The handoff system is designed to make switching between AI agents as seamless as possible. Always be comprehensive, specific, and actionable.


