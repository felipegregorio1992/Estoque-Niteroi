"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type ToastFn = (text: string, error?: boolean) => void;

const ToastContext = createContext<ToastFn>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ text: string; error: boolean } | null>(
    null
  );

  const show = useCallback<ToastFn>((text, error = false) => {
    setToast({ text, error });
    window.setTimeout(() => setToast(null), 4200);
  }, []);

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <div
          className={`fixed right-5 bottom-5 max-w-sm text-white px-4 py-3.5 rounded-xl shadow-lg font-bold text-sm z-50 ${
            toast.error ? "bg-danger" : "bg-[#173e2a]"
          }`}
        >
          {toast.text}
        </div>
      )}
    </ToastContext.Provider>
  );
}
