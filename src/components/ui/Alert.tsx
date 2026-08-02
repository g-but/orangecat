import * as React from 'react';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AlertProps {
  children: ReactNode;
  variant?: 'success' | 'error' | 'warning' | 'info' | 'destructive';
  className?: string;
}

export function Alert({ children, variant = 'info', className }: AlertProps) {
  const variants = {
    success: 'border-success/25 bg-success/10 text-success',
    error: 'border-destructive/25 bg-destructive/10 text-destructive',
    warning: 'border-warning/30 bg-warning/10 text-fg-primary',
    info: 'border-border-subtle bg-muted/30 text-fg-primary',
    destructive: 'border-destructive/25 bg-destructive/10 text-destructive',
  };

  return (
    <div className={cn('p-4 rounded-md border', variants[variant], className)}>{children}</div>
  );
}

export function AlertDescription({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn('text-sm [&_p]:leading-relaxed', className)}>{children}</div>;
}
