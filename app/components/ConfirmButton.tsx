"use client";

export default function ConfirmButton({
  children,
  onClick,
  className = "",
  message = "Are you sure?"
}: any) {
  return (
    <button
      className={className}
      onClick={(e) => {
        e.preventDefault();
        if (confirm(message)) {
          onClick();
        }
      }}
    >
      {children}
    </button>
  );
}
