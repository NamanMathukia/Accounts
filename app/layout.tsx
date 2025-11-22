// app/layout.tsx
import "./globals.css";
import React from "react";
import MobileMenuButton from "./components/MobileMenuButton";
import Sidebar from "./components/Sidebar";
import ToastProvider from "./components/Toast"; // ✅ added

export const metadata = {
  title: "Accounts App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Toast Provider wraps the whole UI */}
        <ToastProvider>
          <div className="layout-wrapper">
            {/* Mobile Sidebar */}
            <Sidebar />

            <div className="topbar">
              <MobileMenuButton />
              <div>
                <h1 className="app-title">Accounts App</h1>
              </div>
            </div>

            {/* Main Content */}
            <main className="main-content fade">{children}</main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
