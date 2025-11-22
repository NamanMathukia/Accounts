"use client";

import Link from "next/link";

export default function Sidebar() {
  function closeMenu() {
    document.body.classList.remove("sidebar-open");
  }

  return (
    <>
      {/* Dark overlay behind drawer */}
      <div className="sidebar-overlay" onClick={closeMenu}></div>

      {/* Sliding Drawer */}
      <aside className="sidebar-drawer">
        <button className="sidebar-close" onClick={closeMenu}>✕</button>

        <h2 className="sidebar-title">Menu</h2>

        <nav className="sidebar-links">
          <Link href="/" onClick={closeMenu}>Dashboard</Link>
          <Link href="/add-product" onClick={closeMenu}>Add Product</Link>
          <Link href="/add-transaction" onClick={closeMenu}>Add Transaction</Link>
          <Link href="/expenses" className="sidebar-link">Expenses</Link>
          <Link href="/transactions" onClick={closeMenu}>Transactions</Link>
          <Link href="/convert" onClick={closeMenu}>Convert Packets</Link>
          <Link href="/financials" onClick={closeMenu}>Financials</Link>
        </nav>
      </aside>
    </>
  );
}
