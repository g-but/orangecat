import { NextRequest, NextResponse } from 'next/server'
import supabaseAdmin from '@/services/supabase/admin'

const BUCKET_NAME = 'avatars'

/**
 * POST /api/avatar
 * Body: multipart/form-data with fields { file: File, userId: string }
 * Returns JSON { publicUrl: string }
 */
export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const userId = formData.get('userId') as string | null

  if (!file || !userId) {
    return NextResponse.json({ error: 'Missing file or userId' }, { status: 400 })
  }

  // ── Ensure bucket exists ────────────────────────────────────────────────────
  try {
    const { data: buckets, error: listErr } = await supabaseAdmin.storage.listBuckets()
    if (listErr) {
      console.error('[avatar] listBuckets error', listErr)
      // if we cannot list, assume bucket exists and continue
    } else if (!buckets?.some((b) => b.id === BUCKET_NAME)) {
      const { error: createErr } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
        public: true,
      })
      if (createErr) {
        console.error('[avatar] createBucket error', createErr)
        return NextResponse.json({ error: createErr.message }, { status: 500 })
      }
    }
  } catch (e: any) {
    console.error('[avatar] bucket ensure error', e)
    // Continue – upload may still succeed if bucket exists
  }

  // ── Upload file ─────────────────────────────────────────────────────────────
  const ext = file.name.split('.').pop() || 'jpg'
  const filePath = `${userId}/${Date.now()}.${ext}`
  const { error: uploadErr } = await supabaseAdmin.storage.from(BUCKET_NAME).upload(filePath, file, {
    contentType: file.type,
    upsert: true,
  })
  if (uploadErr) {
    console.error('[avatar] upload error', uploadErr)
    return NextResponse.json({ error: uploadErr.message }, { status: 500 })
  }

  const { data } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(filePath)

  return NextResponse.json({ publicUrl: data.publicUrl })
} 