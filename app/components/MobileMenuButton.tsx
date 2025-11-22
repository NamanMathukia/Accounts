"use client";

export default function MobileMenuButton() {
  return (
    <button
      className="mobile-menu-btn"
      onClick={() => document.body.classList.add("sidebar-open")}
    >
      ☰
    </button>
  );
}
