// app/layout.tsx
import "./globals.css";
import React from "react";
import ToastProvider from "./components/Toast";
import AppLayoutWrapper from "./AppLayoutWrapper";

export const metadata = {
  title: "Accounts App",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <AppLayoutWrapper>{children}</AppLayoutWrapper>
        </ToastProvider>
      </body>
    </html>
  );
}
