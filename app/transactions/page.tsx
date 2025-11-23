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
};

export default function TransactionsPage() {
  const [txns, setTxns] = useState<Txn[]>([]);

  useEffect(() => {
    loadTxns();
  }, []);

  async function loadTxns() {
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
    })) as Txn[];

    setTxns(normalized);
  }

  async function deleteTxn(t: Txn) {
    if (!confirm("Delete this transaction?")) return;

    // 🔥 Reverse packet effect before delete
    await supabase.rpc("update_packets_on_transaction", {
      p_id: t.product_id,
      t_type: t.txn_type === "purchase" ? "sale" : "purchase",
      pkt_size: t.packet_size_grams,
      pkt_count: t.count_packets,
    });

    // 🔥 Delete via API route (uses service_role)
    const res = await fetch("/api/delete-transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: t.id }),
    });

    if (!res.ok) {
      const e = await res.json();
      alert("Failed: " + e.error);
      return;
    }

    loadTxns();
  }

  return (
    <div className="card p-4">
      <h2 className="text-xl font-bold mb-4">Transactions</h2>

      <div
        className="overflow-x-auto"
        style={{
          width: "100%",
          WebkitOverflowScrolling: "touch",
          overflowX: "auto",
          paddingBottom: "6px",
        }}
      >
        <table
          className="table w-full"
          style={{ minWidth: "750px" }}
        >
          <thead>
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Product</th>
              <th className="p-3">Type</th>
              <th className="p-3">Packets</th>
              <th className="p-3">Unit</th>
              <th className="p-3">Total</th>
              <th className="p-3">Delete</th>
            </tr>
          </thead>

          <tbody>
            {txns.map((t) => (
              <tr key={t.id} className="border-b hover:bg-white/5">
                <td className="p-3">{new Date(t.created_at).toLocaleString()}</td>

                <td className="p-3 font-semibold">{t.product_name}</td>

                <td className="p-3 capitalize">{t.txn_type}</td>

                <td className="p-3">
                  {t.count_packets} × {t.packet_size_grams}g
                </td>

                <td className="p-3">₹{t.unit_price}</td>

                <td className="p-3 font-semibold text-cyan-300">
                  ₹{t.total_price}
                </td>

                <td className="p-3 text-center">
                  <ConfirmButton
                    className="btn-secondary"
                    message="Delete this transaction permanently?"
                    onClick={() => deleteTxn(t)}
                  >
                    🗑
                  </ConfirmButton>
                </td>
              </tr>
            ))}

            {txns.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center p-6 kicker">
                  No transactions found…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
