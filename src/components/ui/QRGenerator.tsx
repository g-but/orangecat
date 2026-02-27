'use client';

import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';

interface QRGeneratorProps {
  value: string;
  size?: number;
  className?: string;
  includeMargin?: boolean;
  level?: 'L' | 'M' | 'Q' | 'H';
}

export default function QRGenerator({
  value,
  size = 200,
  className,
  includeMargin = true,
  level = 'M',
}: QRGeneratorProps) {
  if (!value) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gray-100 rounded-lg text-gray-400 text-sm',
          className
        )}
        style={{ width: size, height: size }}
      >
        No value
      </div>
    );
  }

  return (
    <div className={cn('inline-flex items-center justify-center', className)}>
      <QRCodeSVG value={value} size={size} includeMargin={includeMargin} level={level} />
    </div>
  );
}
