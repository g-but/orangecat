import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'OrangeCat - The Bitcoin Super-App';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0ABAB5 0%, #089B96 50%, #067A76 100%)',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 120,
          height: 120,
          borderRadius: 28,
          background: 'linear-gradient(135deg, #F97316, #EA580C)',
          marginBottom: 32,
          fontSize: 64,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}
      >
        🐾
      </div>
      {/* Title */}
      <div
        style={{
          display: 'flex',
          fontSize: 64,
          fontWeight: 800,
          color: 'white',
          marginBottom: 16,
          letterSpacing: '-0.02em',
        }}
      >
        OrangeCat
      </div>
      {/* Subtitle */}
      <div
        style={{
          display: 'flex',
          fontSize: 28,
          color: 'rgba(255,255,255,0.9)',
          marginBottom: 48,
        }}
      >
        The Bitcoin Super-App
      </div>
      {/* Features */}
      <div
        style={{
          display: 'flex',
          gap: 24,
        }}
      >
        {['Commerce', 'Finance', 'Community', 'AI'].map(feature => (
          <div
            key={feature}
            style={{
              display: 'flex',
              padding: '10px 24px',
              borderRadius: 100,
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            {feature}
          </div>
        ))}
      </div>
    </div>,
    { ...size }
  );
}
