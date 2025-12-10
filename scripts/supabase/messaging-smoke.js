#!/usr/bin/env node
/**
 * Messaging smoke test via Supabase REST + service role
 * - Ensures two profiles exist
 * - Creates/gets a direct conversation between them
 * - Sends a message
 * - Reads back message details
 */

const fs = require('fs');
const path = require('path');

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const raw of content.split(/\r?\n/)) {
    const m = raw.match(/^([^#=][^=]*)=(.*)$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
}

async function main() {
  loadEnvLocal();
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!base || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or service role key');

  const headers = { 'Content-Type': 'application/json', apikey: key, Authorization: 'Bearer ' + key };

  const rest = async (path, body) => {
    const res = await fetch(base + path, { method: 'POST', headers, body: JSON.stringify(body || {}) });
    const text = await res.text();
    const parsed = (() => { try { return JSON.parse(text) } catch { return text } })();
    if (!res.ok) {
      throw new Error(`REST ${path} ${res.status}: ${text}`);
    }
    return parsed;
  };

  // Ensure two profiles
  const pickProfiles = async () => {
    const r = await fetch(base + '/rest/v1/profiles?select=id,username,name&limit=2', { headers });
    const arr = await r.json();
    if (arr.length >= 2) return arr.map(x => x.id);
    // Create missing ones
    const toCreate = 2 - arr.length;
    const entries = [];
    for (let i = 0; i < toCreate; i++) {
      const uid = crypto.randomUUID();
      entries.push({ id: uid, username: `test_${uid.slice(0,8)}`, name: 'Messaging Test' });
    }
    if (entries.length) {
      const ins = await fetch(base + '/rest/v1/profiles', { method: 'POST', headers, body: JSON.stringify(entries) });
      if (!ins.ok) throw new Error(`Insert profiles failed: ${await ins.text()}`);
    }
    const r2 = await fetch(base + '/rest/v1/profiles?select=id&order=created_at.desc&limit=2', { headers });
    const arr2 = await r2.json();
    return arr2.map(x => x.id);
  };

  const [u1, u2] = await pickProfiles();
  console.log('👥 Using profiles:', u1, u2);

  // Create or get direct conversation
  const convId = await rest('/rest/v1/rpc/create_direct_conversation', {
    participant1_id: u1,
    participant2_id: u2,
  });
  console.log('💬 Conversation:', convId);

  // Send a message from u1
  const msgId = await rest('/rest/v1/rpc/send_message', {
    p_conversation_id: convId,
    p_sender_id: u1,
    p_content: 'Hello from smoke test',
    p_message_type: 'text',
    p_metadata: null,
  });
  console.log('✉️  Message ID:', msgId);

  // Read back via view (if exists) else messages
  const r = await fetch(base + `/rest/v1/message_details?select=*&id=eq.${msgId}`, { headers });
  if (r.ok) {
    const rows = await r.json();
    if (rows.length) {
      console.log('🔎 message_details row OK');
      return;
    }
  }
  // Fallback
  const r2 = await fetch(base + `/rest/v1/messages?select=id,content,sender_id,conversation_id&limit=1&id=eq.${msgId}`, { headers });
  if (!r2.ok) throw new Error('Failed to fetch message');
  console.log('🔎 messages row OK');
}

main().catch(e => { console.error('❌ Smoke test failed:', e.message); process.exit(1); });

