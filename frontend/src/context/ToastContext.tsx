import { createContext, useContext, ReactNode } from 'react';
import { useToast as useToastHook, Toast } from '@/hooks/useToast';

interface ToastContextType {
  toast: (props: Omit<Toast, 'id'>) => string;
  toasts: Toast[];
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const { toast, toasts, dismiss } = useToastHook();

  return (
    <ToastContext.Provider value={{ toast, toasts, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

