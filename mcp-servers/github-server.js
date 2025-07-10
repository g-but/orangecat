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
import _sodium from 'libsodium-wrappers';

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

    // Validate GitHub token
    if (!process.env.GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN environment variable is required');
    }

    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    this.setupToolHandlers();
  }

  async initializeSodium() {
    await _sodium.ready;
    this.sodium = _sodium;
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'get-repository-info',
          description: 'Get basic repository information',
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
              inputs: { type: 'object', description: 'Workflow inputs' },
            },
            required: ['owner', 'repo', 'workflow_id'],
          },
        },
        {
          name: 'get-pull-requests',
          description: 'Get pull requests for a repository',
          inputSchema: {
            type: 'object',
            properties: {
              owner: { type: 'string', description: 'Repository owner' },
              repo: { type: 'string', description: 'Repository name' },
              state: { type: 'string', description: 'PR state (open, closed, all)', default: 'open' },
              per_page: { type: 'number', description: 'Number of PRs to return', default: 10 },
            },
            required: ['owner', 'repo'],
          },
        },
        {
          name: 'get-issues',
          description: 'Get issues for a repository',
          inputSchema: {
            type: 'object',
            properties: {
              owner: { type: 'string', description: 'Repository owner' },
              repo: { type: 'string', description: 'Repository name' },
              state: { type: 'string', description: 'Issue state (open, closed, all)', default: 'open' },
              per_page: { type: 'number', description: 'Number of issues to return', default: 10 },
            },
            required: ['owner', 'repo'],
          },
        },
        {
          name: 'fix_deployment_blockers',
          description: 'Automatically fix the issues blocking deployment (failing tests, security issues, build errors)',
          inputSchema: {
            type: 'object',
            properties: {
              owner: { type: 'string', description: 'Repository owner', default: 'g-but' },
              repo: { type: 'string', description: 'Repository name', default: 'orangecat' },
              auto_fix: { type: 'boolean', description: 'Whether to automatically apply fixes', default: true }
            }
          }
        },
        {
          name: 'check_deployment_status',
          description: 'Check current deployment status and what\'s blocking it',
          inputSchema: {
            type: 'object',
            properties: {
              owner: { type: 'string', description: 'Repository owner', default: 'g-but' },
              repo: { type: 'string', description: 'Repository name', default: 'orangecat' }
            }
          }
        },
        {
          name: 'setup_vercel_secrets',
          description: 'Set up missing Vercel secrets for automatic deployment',
          inputSchema: {
            type: 'object',
            properties: {
              owner: { type: 'string', description: 'Repository owner', default: 'g-but' },
              repo: { type: 'string', description: 'Repository name', default: 'orangecat' },
              vercel_token: { type: 'string', description: 'Vercel token' },
              vercel_org_id: { type: 'string', description: 'Vercel org ID' },
              vercel_project_id: { type: 'string', description: 'Vercel project ID' }
            }
          }
        },
        {
          name: 'force_deploy_now',
          description: 'Force deployment by temporarily bypassing failing checks',
          inputSchema: {
            type: 'object',
            properties: {
              owner: { type: 'string', description: 'Repository owner', default: 'g-but' },
              repo: { type: 'string', description: 'Repository name', default: 'orangecat' },
              bypass_tests: { type: 'boolean', description: 'Bypass failing tests', default: false }
            }
          }
        },
        {
          name: 'get_repo_secrets',
          description: 'List all repository secrets',
          inputSchema: {
            type: 'object',
            properties: {
              owner: { type: 'string', description: 'Repository owner', default: 'g-but' },
              repo: { type: 'string', description: 'Repository name', default: 'orangecat' }
            }
          }
        },
        {
          name: 'auto_fix_and_deploy',
          description: 'Comprehensive auto-fix: analyze failures, apply fixes, and redeploy',
          inputSchema: {
            type: 'object',
            properties: {
              owner: { type: 'string', description: 'Repository owner', default: 'g-but' },
              repo: { type: 'string', description: 'Repository name', default: 'orangecat' }
            }
          }
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get-repository-info':
            return await this.getRepositoryInfo(args);
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
          case 'get-pull-requests':
            return await this.getPullRequests(args);
          case 'get-issues':
            return await this.getIssues(args);
          case 'fix_deployment_blockers':
            return await this.fixDeploymentBlockers(args);
          case 'check_deployment_status':
            return await this.checkDeploymentStatus(args);
          case 'setup_vercel_secrets':
            return await this.setupVercelSecrets(args);
          case 'force_deploy_now':
            return await this.forceDeployNow(args);
          case 'get_repo_secrets':
            return await this.getRepoSecrets(args);
          case 'auto_fix_and_deploy':
            return await this.autoFixAndDeploy(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        console.error(`Error executing ${name}:`, error);
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async getRepositoryInfo({ owner, repo }) {
    try {
      const response = await this.octokit.rest.repos.get({
        owner,
        repo,
      });

      const repoInfo = {
        name: response.data.name,
        full_name: response.data.full_name,
        description: response.data.description,
        private: response.data.private,
        default_branch: response.data.default_branch,
        language: response.data.language,
        stargazers_count: response.data.stargazers_count,
        forks_count: response.data.forks_count,
        open_issues_count: response.data.open_issues_count,
        created_at: response.data.created_at,
        updated_at: response.data.updated_at,
        html_url: response.data.html_url,
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(repoInfo, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get repository info: ${error.message}`);
    }
  }

  async getRepositorySecrets({ owner, repo }) {
    try {
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
    } catch (error) {
      throw new Error(`Failed to get repository secrets: ${error.message}`);
    }
  }

  async createRepositorySecret({ owner, repo, secret_name, secret_value }) {
    try {
      // Initialize sodium if not already done
      if (!this.sodium) {
        await this.initializeSodium();
      }

      // Get public key for encryption
      const keyResponse = await this.octokit.rest.actions.getRepoPublicKey({
        owner,
        repo,
      });

      const publicKey = keyResponse.data.key;
      const keyId = keyResponse.data.key_id;

      // Encrypt the secret using libsodium
      const publicKeyBytes = this.sodium.from_base64(publicKey, this.sodium.base64_variants.ORIGINAL);
      const secretBytes = this.sodium.from_string(secret_value);
      
      const encryptedBytes = this.sodium.crypto_box_seal(secretBytes, publicKeyBytes);
      const encryptedValue = this.sodium.to_base64(encryptedBytes, this.sodium.base64_variants.ORIGINAL);

      await this.octokit.rest.actions.createOrUpdateRepoSecret({
        owner,
        repo,
        secret_name,
        encrypted_value: encryptedValue,
        key_id: keyId,
      });

      return {
        content: [
          {
            type: 'text',
            text: `Secret ${secret_name} created/updated successfully`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to create repository secret: ${error.message}`);
    }
  }

  async getWorkflowRuns({ owner, repo, per_page = 10 }) {
    try {
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
        updated_at: run.updated_at,
        head_branch: run.head_branch,
        head_commit: run.head_commit?.message?.substring(0, 80),
        html_url: run.html_url,
        workflow_id: run.workflow_id,
        run_number: run.run_number,
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(runs, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get workflow runs: ${error.message}`);
    }
  }

  async getCommitStatus({ owner, repo, ref }) {
    try {
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
              sha: response.data.sha,
              statuses: response.data.statuses.map(s => ({
                context: s.context,
                state: s.state,
                description: s.description,
                target_url: s.target_url,
                created_at: s.created_at,
                updated_at: s.updated_at,
              }))
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get commit status: ${error.message}`);
    }
  }

  async triggerWorkflow({ owner, repo, workflow_id, ref = 'main', inputs = {} }) {
    try {
      await this.octokit.rest.actions.createWorkflowDispatch({
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
            text: `Workflow ${workflow_id} triggered successfully on ${ref}${Object.keys(inputs).length > 0 ? ` with inputs: ${JSON.stringify(inputs)}` : ''}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to trigger workflow: ${error.message}`);
    }
  }

  async getPullRequests({ owner, repo, state = 'open', per_page = 10 }) {
    try {
      const response = await this.octokit.rest.pulls.list({
        owner,
        repo,
        state,
        per_page,
      });

      const prs = response.data.map(pr => ({
        number: pr.number,
        title: pr.title,
        state: pr.state,
        created_at: pr.created_at,
        updated_at: pr.updated_at,
        head: {
          ref: pr.head.ref,
          sha: pr.head.sha.substring(0, 7),
        },
        base: {
          ref: pr.base.ref,
        },
        user: pr.user.login,
        html_url: pr.html_url,
        draft: pr.draft,
        mergeable: pr.mergeable,
        mergeable_state: pr.mergeable_state,
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(prs, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get pull requests: ${error.message}`);
    }
  }

  async getIssues({ owner, repo, state = 'open', per_page = 10 }) {
    try {
      const response = await this.octokit.rest.issues.listForRepo({
        owner,
        repo,
        state,
        per_page,
      });

      const issues = response.data
        .filter(issue => !issue.pull_request) // Filter out pull requests
        .map(issue => ({
          number: issue.number,
          title: issue.title,
          state: issue.state,
          created_at: issue.created_at,
          updated_at: issue.updated_at,
          user: issue.user.login,
          labels: issue.labels.map(label => label.name),
          assignees: issue.assignees.map(assignee => assignee.login),
          html_url: issue.html_url,
          comments: issue.comments,
        }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(issues, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get issues: ${error.message}`);
    }
  }

  async fixDeploymentBlockers({ owner, repo, auto_fix = true }) {
    try {
      // This is a placeholder for actual deployment blocking fix logic.
      // In a real scenario, this would involve running tests, fixing issues,
      // and potentially pushing changes to the repository.
      const message = `Attempting to fix deployment blockers for ${owner}/${repo}. Auto-fix: ${auto_fix}.`;
      console.log(message);
      return {
        content: [
          {
            type: 'text',
            text: message,
          },
        ],
      };
    } catch (error) {
      console.error(`Failed to fix deployment blockers: ${error.message}`);
      return {
        content: [
          {
            type: 'text',
            text: `Failed to fix deployment blockers: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async checkDeploymentStatus({ owner, repo }) {
    try {
      // This is a placeholder for actual deployment status check logic.
      // In a real scenario, this would involve querying Vercel API
      // or checking GitHub Actions workflow runs.
      const message = `Checking deployment status for ${owner}/${repo}.`;
      console.log(message);
      return {
        content: [
          {
            type: 'text',
            text: message,
          },
        ],
      };
    } catch (error) {
      console.error(`Failed to check deployment status: ${error.message}`);
      return {
        content: [
          {
            type: 'text',
            text: `Failed to check deployment status: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async setupVercelSecrets({ owner, repo, vercel_token, vercel_org_id, vercel_project_id }) {
    try {
      // This is a placeholder for actual Vercel secrets setup logic.
      // In a real scenario, this would involve creating secrets in the repository
      // and potentially pushing them to Vercel.
      const message = `Setting up Vercel secrets for ${owner}/${repo}. Vercel Token: ${vercel_token ? 'Present' : 'Missing'}, Org ID: ${vercel_org_id ? 'Present' : 'Missing'}, Project ID: ${vercel_project_id ? 'Present' : 'Missing'}.`;
      console.log(message);
      return {
        content: [
          {
            type: 'text',
            text: message,
          },
        ],
      };
    } catch (error) {
      console.error(`Failed to setup Vercel secrets: ${error.message}`);
      return {
        content: [
          {
            type: 'text',
            text: `Failed to setup Vercel secrets: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async forceDeployNow({ owner, repo, bypass_tests = false }) {
    try {
      // This is a placeholder for actual force deployment logic.
      // In a real scenario, this would involve bypassing failing checks
      // and potentially triggering a new deployment.
      const message = `Forcing deployment for ${owner}/${repo}. Bypassing tests: ${bypass_tests}.`;
      console.log(message);
      return {
        content: [
          {
            type: 'text',
            text: message,
          },
        ],
      };
    } catch (error) {
      console.error(`Failed to force deploy now: ${error.message}`);
      return {
        content: [
          {
            type: 'text',
            text: `Failed to force deploy now: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async getRepoSecrets({ owner, repo }) {
    try {
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
    } catch (error) {
      throw new Error(`Failed to get repository secrets: ${error.message}`);
    }
  }

  async autoFixAndDeploy({ owner, repo }) {
    try {
      // This is a placeholder for actual auto-fix and deploy logic.
      // In a real scenario, this would involve analyzing failures,
      // applying fixes, and redeploying.
      const message = `Attempting comprehensive auto-fix and deploy for ${owner}/${repo}.`;
      console.log(message);
      return {
        content: [
          {
            type: 'text',
            text: message,
          },
        ],
      };
    } catch (error) {
      console.error(`Failed to auto-fix and deploy: ${error.message}`);
      return {
        content: [
          {
            type: 'text',
            text: `Failed to auto-fix and deploy: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async run() {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error('GitHub MCP server running on stdio');
    } catch (error) {
      console.error('Failed to start GitHub MCP server:', error);
      process.exit(1);
    }
  }
}

const server = new GitHubMCPServer();
server.run().catch(console.error); 