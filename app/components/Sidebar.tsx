"use client";

export default function Sidebar() {
  function closeMenu() {
    document.body.classList.remove("sidebar-open");
  }

  return (
    <>
      {/* Overlay */}
      <div className="sidebar-overlay" onClick={closeMenu}></div>

      {/* Drawer */}
      <div className="sidebar-drawer">
        <button className="sidebar-close" onClick={closeMenu}>✕</button>

        <h2 className="sidebar-title">Menu</h2>

        <div className="sidebar-links">
          <a href="/">Dashboard</a>
          <a href="/add-product">Add Product</a>
          <a href="/add-transaction">Add Transaction</a>
          <a href="/expenses">Expenses</a>
          <a href="/transactions">Transactions</a>
          <a href="/convert">Convert Packets</a>
          <a href="/financials">Financials</a>
        </div>
      </div>
    </>
  );
}
