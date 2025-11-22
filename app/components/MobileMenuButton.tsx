"use client";

export default function MobileMenuButton() {
  function openMenu() {
    document.body.classList.add("sidebar-open");
  }

  return (
    <button className="mobile-menu-btn" onClick={openMenu}>
      ☰
    </button>
  );
}
