"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./components/Sidebar";
import MobileMenuButton from "./components/MobileMenuButton";

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname?.startsWith("/login");

  useEffect(() => {
    if (isLogin) document.body.classList.add("login-page");
    else document.body.classList.remove("login-page");
  }, [isLogin]);

  if (isLogin) return <div id="login-container">{children}</div>;

  return (
    <div className="layout-wrapper">
      <Sidebar />

      <div className="topbar enhanced-topbar">
        <MobileMenuButton />

        {/* Better aligned logo + title */}
        <div className="app-brand fade-slide">
          <img
            src="/logo.png"
            alt="Accounts App Logo"
            className="app-logo"
          />
          <h1 className="app-title">Accounts App</h1>
        </div>
      </div>

      <main className="main-content fade">{children}</main>
    </div>
  );
}
