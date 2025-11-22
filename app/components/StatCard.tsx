"use client";

export default function StatCard({ title, value, accent }: { title: string; value: string | number; accent?: string }) {
  return (
    <div className="card p-3 flex justify-between items-center">
      <div>
        <div className="kicker">{title}</div>
        <div style={{fontSize:18,fontWeight:700, color: accent || "var(--accent2)"}}>{value}</div>
      </div>
    </div>
  );
}
