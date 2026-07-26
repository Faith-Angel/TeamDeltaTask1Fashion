'use client';

import React from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useUIStore, type Toast } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

const toastIcons = {
  success: <CheckCircle className="h-5 w-5 text-success" />,
  error: <AlertCircle className="h-5 w-5 text-error" />,
  warning: <AlertTriangle className="h-5 w-5 text-warning" />,
  info: <Info className="h-5 w-5 text-primary" />,
};

const toastStyles = {
  success: 'border-success/20 bg-success/10',
  error: 'border-error/20 bg-error/10',
  warning: 'border-warning/20 bg-warning/10',
  info: 'border-primary/20 bg-primary/10',
};

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useUIStore();

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4 shadow-lg min-w-[300px] max-w-[400px]',
        toastStyles[toast.type]
      )}
    >
      <span aria-hidden="true">{toastIcons[toast.type]}</span>
      <p className="flex-1 text-sm text-textPrimary">{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 rounded-md p-1 hover:bg-black/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4 text-textSecondary" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useUIStore();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
