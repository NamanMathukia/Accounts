"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

type ToastContextType = {
  showToast: (msg: string) => void;
};

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);

    // Auto-hide after 2.5 sec
    setTimeout(() => setToast(null), 2500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Bubble */}
      {toast && (
        <div className="toast-popup fade-slide">
          {toast}
        </div>
      )}
    </ToastContext.Provider>
  );
}
