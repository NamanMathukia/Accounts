"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function Sidebar() {
  const [profile, setProfile] = useState<{
    name: string | null;
    email: string | null;
    phone: string | null;
  }>({
    name: null,
    email: null,
    phone: null,
  });

  function closeMenu() {
    document.body.classList.remove("sidebar-open");
  }

  useEffect(() => {
    async function loadUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) return;

      const meta = session.user.user_metadata || {};

      const name = meta.name ?? "User"; // never undefined
      const phone = meta.phone ?? null;

      // Remove fake email
      const email =
        session.user.email && !session.user.email.endsWith("@phone.user")
          ? session.user.email
          : null;

      setProfile({
        name,
        email,
        phone,
      });
    }

    loadUser();
  }, []);

  async function logout() {
    const confirmLogout = confirm("Are you sure you want to logout?");
    if (!confirmLogout) return;

    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const links = [
    { name: "Dashboard", href: "/", icon: "🏠" },
    { name: "Add Product", href: "/add-product", icon: "➕" },
    { name: "Add Transaction", href: "/add-transaction", icon: "🔄" },
    { name: "Expenses", href: "/expenses", icon: "💸" },
    { name: "Transactions", href: "/transactions", icon: "🧾" },
    { name: "Convert Packets", href: "/convert", icon: "🔁" },
    { name: "Financials", href: "/financials", icon: "📊" },
  ];

  return (
    <>
      <div className="sidebar-overlay" onClick={closeMenu}></div>

      <div className="sidebar-drawer fancy-sidebar">
        <button className="sidebar-close" onClick={closeMenu}>
          ✕
        </button>

        {/* User Info */}
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {profile.name ? profile.name.charAt(0).toUpperCase() : "U"}
          </div>

          <div className="sidebar-email text-bold">
            {profile.name}
          </div>

          <div className="sidebar-email kicker" style={{ opacity: 0.7 }}>
            {profile.phone || profile.email || "—"}
          </div>
        </div>

        <div className="sidebar-scroll">
          <div className="sidebar-list">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className="sidebar-item"
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}

            <button className="sidebar-item" onClick={logout}>
              <span className="sidebar-icon">🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
