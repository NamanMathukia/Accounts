"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import ConfirmButton from "../components/ConfirmButton";

type Txn = {
  id: string;
  product_id: string;
  product_name?: string;
  txn_type: "purchase" | "sale";
  count_packets: number;
  packet_size_grams: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  customer_name?: string;
  payment_method?: string;
  payment_status?: string;
};

export default function TransactionsPage() {
  const [txns, setTxns] = useState<Txn[]>([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTxns();
  }, []);

  async function loadTxns() {
    setLoading(true);
    // 🔥 1. GET USER
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user_id = session?.user?.id;
    if (!user_id) return;

    // 🔥 2. FILTER BY USER (RLS requirement)
    const { data: tx } = await supabase
      .from("transactions")
      .select("*, products(name)")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    setLoading(false);

    if (!tx) {
      setTxns([]);
      return;
    }

    // Normalize
    const normalized = (tx as any[]).map((t) => ({
      id: t.id,
      product_id: t.product_id,
      product_name: t.products?.name || "Unknown",
      txn_type: t.txn_type,
      count_packets: t.count_packets,
      packet_size_grams: t.packet_size_grams,
      unit_price: Number(t.unit_price),
      total_price: Number(t.total_price),
      created_at: t.created_at,
      customer_name: t.customer_name,
      payment_method: t.payment_method,
      payment_status: t.payment_status,
    })) as Txn[];

    setTxns(normalized);
  }

  async function markPaid(t: Txn) {
    if (!confirm(`Mark transaction for ${t.customer_name || "Customer"} as PAID?`)) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      alert("Not logged in");
      return;
    }

    const res = await fetch("/api/mark-paid", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ transactionId: t.id }),
    });

    if (!res.ok) {
      const e = await res.json();
      alert("Failed: " + e.error);
      return;
    }

    // Refresh list
    loadTxns();
  }

  async function deleteTxn(t: Txn) {
    if (!confirm("Delete this transaction?")) return;

    // ✅ Get logged-in user's ID
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user_id = session?.user?.id;
    if (!user_id) {
      alert("Not logged in");
      return;
    }

    // 🔄 Reverse inventory first
    await supabase.rpc("update_packets_on_transaction", {
      p_id: t.product_id,
      t_type: t.txn_type === "purchase" ? "sale" : "purchase",
      pkt_size: t.packet_size_grams,
      pkt_count: t.count_packets,
    });

    // ❌ Your old request did NOT send user_id
    const res = await fetch("/api/delete-transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: t.id,
        user_id, // ✅ REQUIRED
      }),
    });

    if (!res.ok) {
      const { error } = await res.json();
      alert("Failed: " + error);
      return;
    }

    loadTxns();
  }

  return (
    <div className="card p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Transactions</h2>
        <button
          onClick={loadTxns}
          className="btn-secondary btn-small"
        >
          🔄 Refresh
        </button>
      </div>

      <div
        className="overflow-x-auto"
        style={{
          width: "100%",
          WebkitOverflowScrolling: "touch",
          overflowX: "auto",
          paddingBottom: "6px",
        }}
      >
        <table className="table w-full min-w-900">
          <thead>
            <tr>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Product</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Details</th>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-right">Total</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {txns.map((t) => (
              <tr key={t.id} className="border-b hover:bg-slate-50 transition-colors">
                <td className="p-3 text-sm text-slate-600">
                  {new Date(t.created_at).toLocaleDateString()}
                </td>

                <td className="p-3 font-semibold text-slate-800">{t.product_name}</td>

                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold uppercase ${t.txn_type === "purchase"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-emerald-100 text-emerald-700"
                      }`}
                  >
                    {t.txn_type}
                  </span>
                </td>

                <td className="p-3 text-sm text-slate-600">
                  {t.count_packets} × {t.packet_size_grams}g
                </td>

                <td className="p-3 text-sm">
                  {t.customer_name ? (
                    <div className="font-medium text-slate-700">{t.customer_name}</div>
                  ) : (
                    <span className="text-slate-400 italic">-</span>
                  )}
                  {t.payment_method && (
                    <div className="text-xs text-slate-500 capitalize">
                      {t.payment_method}
                    </div>
                  )}
                </td>

                <td className="p-3">
                  {t.payment_status === "pending" ? (
                    <button
                      onClick={() => markPaid(t)}
                      style={{
                        padding: "8px 14px",
                        background: "#FEF3C7",
                        color: "#92400E",
                        fontSize: "13px",
                        fontWeight: 600,
                        borderRadius: "8px",
                        border: "1px solid #FDE68A",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = "#FDE68A";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = "#FEF3C7";
                      }}
                    >
                      ⏳ Pending
                    </button>
                  ) : (
                    <span style={{
                      padding: "6px 12px",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#64748B",
                      background: "#F1F5F9",
                      borderRadius: "8px",
                      display: "inline-block",
                    }}>
                      ✓ Paid
                    </span>
                  )}
                </td>

                <td className="p-3 text-right font-bold text-slate-800">
                  ₹{t.total_price.toLocaleString()}
                </td>

                <td className="p-3 text-center">
                  <ConfirmButton
                    className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                    message="Delete this transaction permanently?"
                    onClick={() => deleteTxn(t)}
                  >
                    <span className="text-emoji">🗑</span>
                  </ConfirmButton>
                </td>
              </tr>
            ))}

            {txns.length === 0 && !loading && (
              <tr>
                <td colSpan={8} className="text-center p-8 text-slate-400 italic">
                  No transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
