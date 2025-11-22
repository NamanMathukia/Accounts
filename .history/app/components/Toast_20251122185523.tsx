"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

type ToastType = "success" | "error";

interface ToastContextType {
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  showSuccess: () => {},
  showError: () => {},
});

export const useToast = () => useContext(ToastContext);

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(
    null
  );

  const triggerToast = useCallback((msg: string, type: ToastType) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const showSuccess = useCallback(
    (msg: string) => triggerToast(msg, "success"),
    [triggerToast]
  );

  const showError = useCallback(
    (msg: string) => triggerToast(msg, "error"),
    [triggerToast]
  );

  return (
    <ToastContext.Provider value={{ showSuccess, showError }}>
      {children}

      {/* Toast UI */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "28px",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "12px 20px",
            borderRadius: "12px",
            fontSize: "15px",
            fontWeight: 500,
            color: "white",
            zIndex: 9999,
            maxWidth: "85%",
            textAlign: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
            animation: "fadeIn 0.25s ease",
            background:
              toast.type === "success"
                ? "#198754" // green
                : "#d9534f", // red
          }}
        >
          {toast.msg}
        </div>
      )}
    </ToastContext.Provider>
  );
}
