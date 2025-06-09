# GitHub MCP Server Setup

## 1. Install Dependencies

```bash
cd mcp-servers
npm install
```

## 2. Create GitHub Personal Access Token

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with these permissions:
   - `repo` (Full control of private repositories)
   - `actions` (Actions access)
   - `admin:repo_hook` (Repository hooks)

## 3. Set Environment Variable

```bash
export GITHUB_TOKEN="your_github_token_here"
```

Or create a `.env` file:
```
GITHUB_TOKEN=your_github_token_here
```

## 4. Configure Claude Desktop

Add to your Claude Desktop config file (`~/AppData/Roaming/Claude/claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": ["/path/to/orangecat/mcp-servers/github-server.js"],
      "env": {
        "GITHUB_TOKEN": "your_github_token_here"
      }
    }
  }
}
```

## 5. Test the Server

```bash
cd mcp-servers
node github-server.js
```

## 6. Available Tools

Once configured, you'll have access to these tools in Claude:

- `get-repository-secrets` - List repository secrets
- `create-repository-secret` - Add/update secrets
- `get-workflow-runs` - Check GitHub Actions status
- `get-commit-status` - Check commit status checks
- `trigger-workflow` - Manually trigger workflows

## 7. Example Usage

After setup, you can ask Claude to:
- "Check the status of my latest GitHub Actions"
- "Add a new repository secret"
- "What are the current status checks for my latest commit?"
- "Trigger the deployment workflow"

The server will handle all GitHub API interactions automatically! 