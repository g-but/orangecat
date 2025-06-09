#!/usr/bin/env node

/**
 * GitHub MCP Server
 * Provides GitHub API access for repository management, secrets, actions, etc.
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const { Octokit } = require('@octokit/rest');

class GitHubMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'github-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'get-repository-secrets',
          description: 'List all repository secrets',
          inputSchema: {
            type: 'object',
            properties: {
              owner: { type: 'string', description: 'Repository owner' },
              repo: { type: 'string', description: 'Repository name' },
            },
            required: ['owner', 'repo'],
          },
        },
        {
          name: 'create-repository-secret',
          description: 'Create or update a repository secret',
          inputSchema: {
            type: 'object',
            properties: {
              owner: { type: 'string', description: 'Repository owner' },
              repo: { type: 'string', description: 'Repository name' },
              secret_name: { type: 'string', description: 'Secret name' },
              secret_value: { type: 'string', description: 'Secret value' },
            },
            required: ['owner', 'repo', 'secret_name', 'secret_value'],
          },
        },
        {
          name: 'get-workflow-runs',
          description: 'Get recent workflow runs',
          inputSchema: {
            type: 'object',
            properties: {
              owner: { type: 'string', description: 'Repository owner' },
              repo: { type: 'string', description: 'Repository name' },
              per_page: { type: 'number', description: 'Number of runs to return', default: 10 },
            },
            required: ['owner', 'repo'],
          },
        },
        {
          name: 'trigger-workflow',
          description: 'Trigger a workflow dispatch',
          inputSchema: {
            type: 'object',
            properties: {
              owner: { type: 'string', description: 'Repository owner' },
              repo: { type: 'string', description: 'Repository name' },
              workflow_id: { type: 'string', description: 'Workflow ID or filename' },
              ref: { type: 'string', description: 'Git ref', default: 'main' },
              inputs: { type: 'object', description: 'Workflow inputs' },
            },
            required: ['owner', 'repo', 'workflow_id'],
          },
        },
        {
          name: 'get-branch-protection',
          description: 'Get branch protection rules',
          inputSchema: {
            type: 'object',
            properties: {
              owner: { type: 'string', description: 'Repository owner' },
              repo: { type: 'string', description: 'Repository name' },
              branch: { type: 'string', description: 'Branch name' },
            },
            required: ['owner', 'repo', 'branch'],
          },
        },
        {
          name: 'update-branch-protection',
          description: 'Update branch protection rules',
          inputSchema: {
            type: 'object',
            properties: {
              owner: { type: 'string', description: 'Repository owner' },
              repo: { type: 'string', description: 'Repository name' },
              branch: { type: 'string', description: 'Branch name' },
              protection: { type: 'object', description: 'Protection settings' },
            },
            required: ['owner', 'repo', 'branch', 'protection'],
          },
        },
        {
          name: 'get-commit-status',
          description: 'Get commit status checks',
          inputSchema: {
            type: 'object',
            properties: {
              owner: { type: 'string', description: 'Repository owner' },
              repo: { type: 'string', description: 'Repository name' },
              ref: { type: 'string', description: 'Commit SHA or ref' },
            },
            required: ['owner', 'repo', 'ref'],
          },
        },
        {
          name: 'create-file',
          description: 'Create or update a file in the repository',
          inputSchema: {
            type: 'object',
            properties: {
              owner: { type: 'string', description: 'Repository owner' },
              repo: { type: 'string', description: 'Repository name' },
              path: { type: 'string', description: 'File path' },
              content: { type: 'string', description: 'File content (base64 encoded)' },
              message: { type: 'string', description: 'Commit message' },
              branch: { type: 'string', description: 'Branch name', default: 'main' },
            },
            required: ['owner', 'repo', 'path', 'content', 'message'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get-repository-secrets':
            return await this.getRepositorySecrets(args);
          case 'create-repository-secret':
            return await this.createRepositorySecret(args);
          case 'get-workflow-runs':
            return await this.getWorkflowRuns(args);
          case 'trigger-workflow':
            return await this.triggerWorkflow(args);
          case 'get-branch-protection':
            return await this.getBranchProtection(args);
          case 'update-branch-protection':
            return await this.updateBranchProtection(args);
          case 'get-commit-status':
            return await this.getCommitStatus(args);
          case 'create-file':
            return await this.createFile(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${error.message}`,
            },
          ],
        };
      }
    });
  }

  async getRepositorySecrets({ owner, repo }) {
    const response = await this.octokit.rest.actions.listRepoSecrets({
      owner,
      repo,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  async createRepositorySecret({ owner, repo, secret_name, secret_value }) {
    // Get public key for encryption
    const keyResponse = await this.octokit.rest.actions.getRepoPublicKey({
      owner,
      repo,
    });

    // Encrypt the secret value (simplified - you'd use sodium for real encryption)
    const encryptedValue = Buffer.from(secret_value).toString('base64');

    const response = await this.octokit.rest.actions.createOrUpdateRepoSecret({
      owner,
      repo,
      secret_name,
      encrypted_value: encryptedValue,
      key_id: keyResponse.data.key_id,
    });

    return {
      content: [
        {
          type: 'text',
          text: `Secret ${secret_name} created/updated successfully`,
        },
      ],
    };
  }

  async getWorkflowRuns({ owner, repo, per_page = 10 }) {
    const response = await this.octokit.rest.actions.listWorkflowRunsForRepo({
      owner,
      repo,
      per_page,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  async triggerWorkflow({ owner, repo, workflow_id, ref = 'main', inputs = {} }) {
    const response = await this.octokit.rest.actions.createWorkflowDispatch({
      owner,
      repo,
      workflow_id,
      ref,
      inputs,
    });

    return {
      content: [
        {
          type: 'text',
          text: `Workflow ${workflow_id} triggered successfully`,
        },
      ],
    };
  }

  async getBranchProtection({ owner, repo, branch }) {
    const response = await this.octokit.rest.repos.getBranchProtection({
      owner,
      repo,
      branch,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  async updateBranchProtection({ owner, repo, branch, protection }) {
    const response = await this.octokit.rest.repos.updateBranchProtection({
      owner,
      repo,
      branch,
      ...protection,
    });

    return {
      content: [
        {
          type: 'text',
          text: `Branch protection updated for ${branch}`,
        },
      ],
    };
  }

  async getCommitStatus({ owner, repo, ref }) {
    const response = await this.octokit.rest.repos.getCombinedStatusForRef({
      owner,
      repo,
      ref,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  async createFile({ owner, repo, path, content, message, branch = 'main' }) {
    const response = await this.octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content,
      branch,
    });

    return {
      content: [
        {
          type: 'text',
          text: `File ${path} created/updated successfully`,
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('GitHub MCP server running on stdio');
  }
}

const server = new GitHubMCPServer();
server.run().catch(console.error); 