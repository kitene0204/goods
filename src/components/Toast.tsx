import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'info' | 'error';
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none w-full max-w-md px-4">
      {toasts.map((toast) => {
        const bgColors = {
          success: 'bg-emerald-950/95 border-emerald-500/60 text-emerald-100 shadow-emerald-950/50',
          error: 'bg-rose-950/95 border-rose-500/60 text-rose-100 shadow-rose-950/50',
          info: 'bg-slate-900/95 border-blue-500/60 text-blue-100 shadow-slate-950/50',
        }[toast.type];

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border shadow-xl backdrop-blur-md text-xs sm:text-sm font-semibold transition-all animate-in slide-in-from-bottom-2 fade-in duration-200 w-full ${bgColors}`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
              <span className="truncate">{toast.text}</span>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
