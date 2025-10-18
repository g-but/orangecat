# MCP Servers Setup

## 1. Install Dependencies

```bash
cd mcp-servers
npm install
```

## 2. GitHub Server

Create a GitHub Personal Access Token and expose it as `GITHUB_TOKEN`.

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with these permissions:
   - `repo` (Full control of private repositories)
   - `actions` (Actions access)
   - `admin:repo_hook` (Repository hooks)

Set Environment Variable

```bash
export GITHUB_TOKEN="your_github_token_here"
```

Or create a `.env` file:
```
GITHUB_TOKEN=your_github_token_here
```

## 3. Configure Claude Desktop (example)

Add to your Claude Desktop config file (`~/AppData/Roaming/Claude/claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": ["/path/to/orangecat/mcp-servers/github-server.js"],
      "env": { "GITHUB_TOKEN": "your_github_token_here" }
    },
    "fs": {
      "command": "node",
      "args": ["/path/to/orangecat/mcp-servers/fs-server.js"]
    },
    "shell": {
      "command": "node",
      "args": ["/path/to/orangecat/mcp-servers/shell-server.js"]
    },
    "git": {
      "command": "node",
      "args": ["/path/to/orangecat/mcp-servers/git-server.js"]
    },
    "lint": {
      "command": "node",
      "args": ["/path/to/orangecat/mcp-servers/lint-server.js"]
    },
    "jest": {
      "command": "node",
      "args": ["/path/to/orangecat/mcp-servers/jest-server.js"]
    },
    "supabase": {
      "command": "node",
      "args": ["/path/to/orangecat/mcp-servers/supabase-server.js"],
      "env": {
        "NEXT_PUBLIC_SUPABASE_URL": "...",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY": "...",
        "SUPABASE_SERVICE_ROLE_KEY": "optional"
      }
    }
  }
}
```

## 4. Vercel via MCP Adapter

We include a minimal OpenAPI file at `mcp-servers/vercel-openapi.json` so you can use `@vercel/mcp-adapter` to call Vercel endpoints. Set `VERCEL_TOKEN` in your environment.

Claude Desktop example:

```json
{
  "mcpServers": {
    "vercel": {
      "command": "mcp-adapter",
      "args": [
        "--openapi",
        "/path/to/orangecat/mcp-servers/vercel-openapi.json",
        "--name",
        "vercel"
      ],
      "env": { "VERCEL_TOKEN": "your_vercel_token" }
    }
  }
}
```

Run locally:

```bash
npm run mcp:vercel
```

## 5. Test Servers

```bash
cd mcp-servers
node github-server.js      # GitHub
node fs-server.js          # Filesystem (workspace-restricted)
node shell-server.js       # Shell (allowlist)
node git-server.js         # Git
node lint-server.js        # ESLint/Prettier
node jest-server.js        # Jest
node supabase-server.js    # Supabase
```

## 6. Available Tools (highlights)

Once configured, you'll have access to these tools in Claude/Codex:

- GitHub: repository/PRs/actions/secrets management
- FS: read/write/list/move/delete files within workspace
- Shell: run allowlisted commands (npm, next, jest, eslint, prettier, rg)
- Git: status/diff/branch/checkout/add/commit/push
- Lint: eslint check/fix, prettier check/write
- Jest: run tests by pattern or file
- Supabase: select/insert/update/count rows

## 7. Example Usage

After setup, you can ask Claude to:
- "Check the status of my latest GitHub Actions"
- "Add a new repository secret"
- "What are the current status checks for my latest commit?"
- "Trigger the deployment workflow"

The server will handle all GitHub API interactions automatically! 
