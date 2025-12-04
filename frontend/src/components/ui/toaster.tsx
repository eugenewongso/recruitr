import { useToast } from '@/context/ToastContext';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="pointer-events-auto bg-white  border border-slate-200  rounded-lg shadow-lg p-4 min-w-[300px] max-w-[420px]"
          >
            <div className="flex items-start gap-3">
              {toast.variant === 'success' && (
                <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              )}
              {toast.variant === 'error' && (
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              )}
              
              <div className="flex-1 min-w-0">
                {toast.title && (
                  <p className="font-semibold text-slate-900  text-sm">
                    {toast.title}
                  </p>
                )}
                {toast.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {toast.description}
                  </p>
                )}
              </div>
              
              <button
                onClick={() => dismiss(toast.id)}
                className="shrink-0 text-slate-400 hover:text-slate-600  transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

