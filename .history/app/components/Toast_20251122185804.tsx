"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

type ToastContextType = {
  showToast: (msg: string) => void;
};

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

export default function ToastProvider({ children }: any) {
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast UI */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "28px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#164B8A",
            color: "white",
            padding: "12px 20px",
            borderRadius: "12px",
            fontSize: "15px",
            fontWeight: 500,
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            animation: "fadeIn 0.25s ease",
            zIndex: 9999,
            maxWidth: "85%",
            textAlign: "center",
          }}
        >
          {toast}
        </div>
      )}
    </ToastContext.Provider>
  );
}
