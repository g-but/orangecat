# Claude Code Project Rules

## CRITICAL: Environment File Protection

**NEVER delete, remove, or modify `.env.local` files under ANY circumstances.**

### Why This Rule Exists

The `.env.local` file contains essential API keys and secrets that enable seamless access to:
- **Supabase** (database and authentication)
- **GitHub** (version control and deployments)
- **Vercel** (hosting and deployments)
- **MCP Servers** (tool integrations)
- Other critical development services

### The Problem

When `.env.local` is deleted or modified:
1. All MCP server access is immediately lost
2. CLI tools (Supabase CLI, GitHub CLI, Vercel CLI) stop working
3. Development workflow breaks completely
4. Manual retrieval of credentials from multiple services is required
5. Significant time is wasted re-configuring the environment

### Allowed Operations

- ✅ **READ** `.env.local` to check configuration
- ✅ **ADD** new environment variables when needed
- ✅ **MODIFY** existing variables when adding necessary info
- ❌ **NEVER** delete the file
- ❌ **NEVER** remove existing variables unless specifically asked by the user
- ❌ **NEVER** suggest cleanup that includes .env.local

### When Performing Cleanup

If cleanup operations are needed:
- **ALWAYS** explicitly exclude `.env.local` from deletion commands
- **ALWAYS** use patterns like `rm !(*.env*)` or explicit file lists
- **NEVER** use wildcards that could match .env files

### Enforcement

This rule applies to:
- Direct file operations (rm, delete, unlink)
- Cleanup scripts
- Git operations (never commit, but never delete)
- Build processes
- Any automated workflows

---

**Remember: Protecting `.env.local` is not optional. It is a hard requirement for maintaining a functional development environment.**
