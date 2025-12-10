import { NextRequest, NextResponse } from 'next/server'

// Ensure Node.js runtime for fs access
export const runtime = 'nodejs'
import fs from 'fs/promises'
import path from 'path'

// Dev-only helper route to apply messaging migrations via Supabase Management API
// Requires SUPABASE_ACCESS_TOKEN and NEXT_PUBLIC_SUPABASE_URL in env.
// Will refuse to run in production.

function getProjectRefFromUrl(url: string): string | null {
  try {
    const u = new URL(url)
    // Expected: https://<ref>.supabase.co
    const host = u.hostname // <ref>.supabase.co
    const parts = host.split('.')
    if (parts.length >= 3 && parts[1] === 'supabase' && parts[2] === 'co') {
      return parts[0]
    }
    return null
  } catch {
    return null
  }
}

export async function POST(_req: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Disabled in production' }, { status: 403 })
    }

    const token = process.env.SUPABASE_ACCESS_TOKEN
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const projectRef = supabaseUrl ? getProjectRefFromUrl(supabaseUrl) : null

    if (!token || !projectRef) {
      return NextResponse.json({ error: 'Missing SUPABASE_ACCESS_TOKEN or project ref' }, { status: 400 })
    }

    const root = process.cwd()
    const files = [
      // Base messaging schema and functions (tables, RLS, send_message, create_direct_conversation)
      'supabase/migrations/20251207_create_private_messaging.sql',
      // Group conversation helper (SECURITY DEFINER)
      'supabase/migrations/20251208_create_group_conversation_function.sql',
      // View fixes for per-user conversations and message details
      'supabase/migrations/20251208_fix_messaging_views.sql',
    ]

    const contents: string[] = []
    for (const rel of files) {
      const full = path.join(root, rel)
      const sql = await fs.readFile(full, 'utf8')
      contents.push(sql)
    }

    // Apply each migration sequentially for clearer error reporting
    const results: Array<{ file: string; status: number; ok: boolean; body: any }> = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const sql = contents[i]

      const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql }),
      })

      const body = await res.text().catch(() => '')
      const parsed = (() => { try { return JSON.parse(body) } catch { return body } })()
      results.push({ file, status: res.status, ok: res.ok, body: parsed })

      if (!res.ok) {
        return NextResponse.json({ error: 'Migration failed', results }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 })
  }
}
