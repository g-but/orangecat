'use client';

import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useToastStore, Toast as ToastType } from '@/hooks/useToast';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const colors = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
};

const iconColors = {
  success: 'text-green-500',
  error: 'text-red-500',
  info: 'text-blue-500',
  warning: 'text-yellow-500',
};

function ToastItem({ toast }: { toast: ToastType }) {
  const removeToast = useToastStore(state => state.removeToast);
  const Icon = icons[toast.type];

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm ${colors[toast.type]} animate-in slide-in-from-right duration-300`}
      role="alert"
    >
      <Icon className={`w-5 h-5 shrink-0 ${iconColors[toast.type]}`} />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 p-1 hover:bg-black/5 rounded transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useToastStore(state => state.toasts);

  return (
    <div
      className="fixed top-20 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} />
        </div>
      ))}
    </div>
  );
}
