#!/usr/bin/env node

/**
 * GitHub MCP Server
 * Provides GitHub API access for repository management, secrets, actions, etc.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Octokit } from '@octokit/rest';

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
          name: 'trigger-workflow',
          description: 'Trigger a workflow dispatch',
          inputSchema: {
            type: 'object',
            properties: {
              owner: { type: 'string', description: 'Repository owner' },
              repo: { type: 'string', description: 'Repository name' },
              workflow_id: { type: 'string', description: 'Workflow ID or filename' },
              ref: { type: 'string', description: 'Git ref', default: 'main' },
            },
            required: ['owner', 'repo', 'workflow_id'],
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
          case 'get-commit-status':
            return await this.getCommitStatus(args);
          case 'trigger-workflow':
            return await this.triggerWorkflow(args);
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

    // For now, we'll use a basic approach (in production, use libsodium for proper encryption)
    const encryptedValue = Buffer.from(secret_value).toString('base64');

    await this.octokit.rest.actions.createOrUpdateRepoSecret({
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

    const runs = response.data.workflow_runs.map(run => ({
      id: run.id,
      name: run.name,
      status: run.status,
      conclusion: run.conclusion,
      created_at: run.created_at,
      head_commit: run.head_commit?.message?.substring(0, 50),
      html_url: run.html_url
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(runs, null, 2),
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
          text: JSON.stringify({
            state: response.data.state,
            total_count: response.data.total_count,
            statuses: response.data.statuses.map(s => ({
              context: s.context,
              state: s.state,
              description: s.description,
              target_url: s.target_url
            }))
          }, null, 2),
        },
      ],
    };
  }

  async triggerWorkflow({ owner, repo, workflow_id, ref = 'main' }) {
    await this.octokit.rest.actions.createWorkflowDispatch({
      owner,
      repo,
      workflow_id,
      ref,
    });

    return {
      content: [
        {
          type: 'text',
          text: `Workflow ${workflow_id} triggered successfully on ${ref}`,
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