import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dimensions: string[] }> }
) {
  try {
    // Properly await params before destructuring
    const { dimensions } = await params;
    
    // Parse dimensions (e.g., ['400', '250'] from /api/placeholder/400/250)
    const width = dimensions && dimensions[0] ? parseInt(dimensions[0]) : 400;
    const height = dimensions && dimensions[1] ? parseInt(dimensions[1]) : 250;
    
    // Validate dimensions
    if (width > 2000 || height > 2000 || width < 10 || height < 10) {
      return new NextResponse('Invalid dimensions', { status: 400 });
    }
    
    // Generate a simple SVG placeholder
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <rect x="10" y="10" width="${width - 20}" height="${height - 20}" fill="#e5e7eb" stroke="#d1d5db" stroke-width="2" rx="8"/>
        <text x="50%" y="50%" text-anchor="middle" dy="0.3em" fill="#6b7280" font-family="Arial, sans-serif" font-size="14">
          ${width} × ${height}
        </text>
      </svg>
    `;
    
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 