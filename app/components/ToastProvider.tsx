import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

type Toast = { id: string; message: string; level?: 'info' | 'error' | 'warning' };

const ToastContext = createContext<{
  show: (message: string, level?: Toast['level']) => void;
} | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, level: Toast['level'] = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setToasts((s) => [...s, { id, message, level }]);
    // auto-remove after 5s
    setTimeout(() => setToasts((s) => s.filter((t) => t.id !== id)), 5000);
  }, []);

  useEffect(() => {
    // cleanup on unmount
    return () => setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div aria-live="polite" className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`max-w-xs rounded p-3 text-sm shadow-lg border ${
              t.level === 'error' ? 'bg-red-600 text-white' : 'bg-white text-black'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export default ToastProvider;
