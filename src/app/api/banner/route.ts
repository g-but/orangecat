import { NextRequest, NextResponse } from 'next/server'
import supabaseAdmin from '@/services/supabase/admin'
import sharp from 'sharp'

const BUCKET_NAME = 'banners'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const BANNER_WIDTH = 1200 // Standard banner width
const BANNER_HEIGHT = 400 // Standard banner height

/**
 * POST /api/banner
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

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File size too large. Maximum size is 10MB.' }, { status: 400 })
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ 
      error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF files are allowed.' 
    }, { status: 400 })
  }

  try {
    // ── Ensure bucket exists ────────────────────────────────────────────────────
    try {
      const { data: buckets, error: listErr } = await supabaseAdmin.storage.listBuckets()
      if (listErr) {
        console.error('[banner] listBuckets error', listErr)
        // if we cannot list, assume bucket exists and continue
      } else if (!buckets?.some((b) => b.id === BUCKET_NAME)) {
        const { error: createErr } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
          public: true,
        })
        if (createErr) {
          console.error('[banner] createBucket error', createErr)
          return NextResponse.json({ error: createErr.message }, { status: 500 })
        }
      }
    } catch (e: any) {
      console.error('[banner] bucket ensure error', e)
      // Continue – upload may still succeed if bucket exists
    }

    // ── Process image with sharp ────────────────────────────────────────────────
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Process the image: resize, optimize, and convert to WebP
    let processedImage: Buffer
    
    try {
      processedImage = await sharp(buffer)
        .resize(BANNER_WIDTH, BANNER_HEIGHT, {
          fit: 'cover', // Crop to fit banner dimensions
          position: 'center', // Center the crop
        })
        .webp({ 
          quality: 80, // Good quality for banners
          effort: 6   // High compression effort
        })
        .toBuffer()
    } catch (sharpError) {
      console.error('[banner] sharp processing error', sharpError)
      return NextResponse.json({ error: 'Failed to process image' }, { status: 500 })
    }

    // ── Upload processed file ──────────────────────────────────────────────────
    const timestamp = Date.now()
    const filePath = `${userId}/${timestamp}.webp` // Always save as WebP
    
    const { error: uploadErr } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(filePath, processedImage, {
        contentType: 'image/webp',
        upsert: true,
        cacheControl: '31536000', // 1 year cache
      })
      
    if (uploadErr) {
      console.error('[banner] upload error', uploadErr)
      return NextResponse.json({ error: uploadErr.message }, { status: 500 })
    }

    // ── Get public URL ──────────────────────────────────────────────────────────
    const { data } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(filePath)

    return NextResponse.json({ 
      publicUrl: data.publicUrl,
      size: processedImage.length,
      dimensions: { width: BANNER_WIDTH, height: BANNER_HEIGHT }
    })

  } catch (error: any) {
    console.error('[banner] unexpected error', error)
    return NextResponse.json({ 
      error: 'An unexpected error occurred while processing the banner' 
    }, { status: 500 })
  }
} 