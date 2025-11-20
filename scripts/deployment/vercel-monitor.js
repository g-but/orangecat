#!/usr/bin/env node
/**
 * Vercel Deployment Monitor
 * - Watches the latest production deployment for the configured project.
 * - Streams logs and retries deployment if it fails (optional).
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function readEnvToken() {
  if (process.env.VERCEL_TOKEN) return process.env.VERCEL_TOKEN;
  const envPath = path.join(process.cwd(), '.env.local');
  try {
    const text = fs.readFileSync(envPath, 'utf8');
    const m = text.match(/^VERCEL_TOKEN\s*=\s*(.+)$/m);
    if (m) return m[1].trim();
  } catch {}
  return null;
}

function readVercelProject() {
  const p = path.join(process.cwd(), '.vercel', 'project.json');
  const proj = JSON.parse(fs.readFileSync(p, 'utf8'));
  return { orgId: proj.orgId, projectId: proj.projectId };
}

async function apiFetch(url, token) {
  const fetch = (await import('node-fetch')).default;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const text = await res.text();
  try {
    return { status: res.status, body: JSON.parse(text) };
  } catch {
    return { status: res.status, body: { text } };
  }
}

function log(...args) {
  console.log('[vercel-monitor]', ...args);
}

async function main() {
  const token = await readEnvToken();
  if (!token) {
    console.error('VERCEL_TOKEN is not set. Set it in env or .env.local');
    process.exit(1);
  }
  const { projectId } = readVercelProject();

  // List latest deployments for this project
  const listUrl = `https://api.vercel.com/v13/deployments?projectId=${projectId}&limit=5`;
  const { status, body } = await apiFetch(listUrl, token);
  if (status !== 200) {
    console.error('Failed to list deployments:', body);
    process.exit(1);
  }
  const deployments = body.deployments || body;
  const prod = deployments.find(d => d.target === 'production') || deployments[0];
  if (!prod) {
    console.error('No deployments found for project');
    process.exit(1);
  }
  log('Latest deployment:', prod.uid, prod.readyState, prod.url);

  // If building, tail logs until ready/failed
  if (prod.readyState === 'BUILDING' || prod.readyState === 'QUEUED') {
    log('Deployment in progress; following logs...');
    await followLogs(prod.url, token);
  }

  // If error, attempt a redeploy
  if (prod.readyState === 'ERROR' || prod.readyState === 'CANCELED') {
    console.error('Deployment failed. Attempting redeploy...');
    await vercelDeploy(token);
    // Poll again
    await pollReady(projectId, token);
  } else if (prod.readyState === 'READY') {
    log('Deployment is READY:', `https://${prod.url}`);
  } else {
    // Unknown state; poll once
    await pollReady(projectId, token);
  }
}

async function followLogs(url, token) {
  return new Promise(resolve => {
    const child = spawn('vercel', ['logs', url, '--follow', `--token=${token}`], {
      stdio: 'inherit',
    });
    child.on('close', () => resolve(undefined));
  });
}

async function vercelDeploy(token) {
  return new Promise((resolve, reject) => {
    const child = spawn('vercel', ['deploy', '--prod', `--token=${token}`], {
      stdio: 'inherit',
    });
    child.on('close', code =>
      code === 0 ? resolve(undefined) : reject(new Error('vercel deploy failed'))
    );
  });
}

async function pollReady(projectId, token) {
  for (let i = 0; i < 20; i++) {
    const { body } = await apiFetch(
      `https://api.vercel.com/v13/deployments?projectId=${projectId}&limit=1`,
      token
    );
    const d = (body.deployments || body)[0];
    log('State:', d.readyState);
    if (d.readyState === 'READY') {
      log('Deployment is READY:', `https://${d.url}`);
      return;
    }
    if (d.readyState === 'ERROR' || d.readyState === 'CANCELED') {
      console.error('Deployment failed again.');
      return;
    }
    await new Promise(r => setTimeout(r, 15000));
  }
  console.warn('Polling finished without READY state. Check Vercel dashboard.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
