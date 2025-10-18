#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js')
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js')
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js')
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

function resolveCwd(cwd) {
  const root = process.cwd()
  const full = path.resolve(root, cwd || '.')
  const rel = path.relative(root, full)
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error('cwd escapes workspace')
  return full
}

function binPath(bin) {
  const local = path.join(process.cwd(), 'node_modules', '.bin', bin)
  return fs.existsSync(local) ? local : bin
}

function run(cmd, args, opt = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd: opt.cwd, env: process.env, shell: false })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', d => { stdout += d.toString() })
    child.stderr.on('data', d => { stderr += d.toString() })
    child.on('close', code => resolve({ code, stdout, stderr }))
  })
}

class JestServer {
  constructor() {
    this.server = new Server({ name: 'jest-server', version: '1.0.0' }, { capabilities: { tools: {} } })
    this.jest = binPath('jest')
    this.setup()
  }

  setup() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        { name: 'jest_run', description: 'Run Jest with optional pattern', inputSchema: { type: 'object', properties: { cwd: { type: 'string' }, testPathPattern: { type: 'string' }, coverage: { type: 'boolean', default: false }, updateSnapshots: { type: 'boolean', default: false }, ci: { type: 'boolean', default: true }, silent: { type: 'boolean', default: false } } } },
        { name: 'jest_file', description: 'Run a specific test file', inputSchema: { type: 'object', required: ['file'], properties: { cwd: { type: 'string' }, file: { type: 'string' }, updateSnapshots: { type: 'boolean', default: false } } } }
      ]
    }))

    this.server.setRequestHandler(CallToolRequestSchema, async (req) => {
      const name = req.params.name
      const a = req.params.arguments || {}
      try {
        const cwd = resolveCwd(a.cwd || '.')
        switch (name) {
          case 'jest_run': {
            const args = []
            if (a.ci) args.push('--ci')
            if (a.coverage) args.push('--coverage')
            if (a.silent) args.push('--silent')
            if (a.updateSnapshots) args.push('--updateSnapshot')
            if (a.testPathPattern) args.push('--testPathPattern', a.testPathPattern)
            const r = await run(this.jest, args, { cwd })
            return { content: [{ type: 'json', json: { code: r.code, stdout: r.stdout, stderr: r.stderr } }] }
          }
          case 'jest_file': {
            const args = [a.file]
            if (a.updateSnapshots) args.push('--updateSnapshot')
            const r = await run(this.jest, args, { cwd })
            return { content: [{ type: 'json', json: { code: r.code, stdout: r.stdout, stderr: r.stderr } }] }
          }
          default:
            return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true }
        }
      } catch (err) {
        return { content: [{ type: 'text', text: `❌ ${name} error: ${err?.message || String(err)}` }], isError: true }
      }
    })
  }

  async run() {
    const transport = new StdioServerTransport()
    await this.server.connect(transport)
    console.error('Jest MCP Server running on stdio')
  }
}

new JestServer().run()

