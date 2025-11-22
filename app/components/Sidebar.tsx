"use client";

import Link from "next/link";

export default function Sidebar() {
  function closeMenu() {
    document.body.classList.remove("sidebar-open");
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
      {/* Overlay */}
      <div className="sidebar-overlay" onClick={closeMenu}></div>

      {/* Drawer */}
      <div className="sidebar-drawer fancy-sidebar">
        <button className="sidebar-close" onClick={closeMenu}>✕</button>

        <h2 className="sidebar-title">Menu</h2>

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
        </div>
      </div>
    </>
  );
}
