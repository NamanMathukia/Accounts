"use client";

export default function StatCard({
  title,
  value,
  accent = "var(--accent2)",
  className = "",
}: {
  title: string;
  value: string | number;
  accent?: string;
  className?: string;   // ⭐ REQUIRED
}) {
  return (
    <div className={`card p-3 flex justify-between items-center ${className}`}>
      <div>
        <div className="kicker">{title}</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: accent }}>
          {value}
        </div>
      </div>
    </div>
  );
}
