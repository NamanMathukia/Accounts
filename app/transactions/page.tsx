"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import ConfirmButton from "../components/ConfirmButton";

export default function TransactionsPage() {
  const [txns, setTxns] = useState([]);

  useEffect(() => {
    loadTxns();
  }, []);

  async function loadTxns() {
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });

    setTxns(data || []);
  }

  async function deleteTxn(t: any) {
    if (!confirm("Delete this transaction?")) return;

    // 1) Reverse packet counts
    await supabase.rpc("update_packets_on_transaction", {
      p_id: t.product_id,
      t_type: t.txn_type === "purchase" ? "sale" : "purchase",
      pkt_size: t.packet_size_grams,
      pkt_count: t.count_packets
    });

    // 2) Delete the transaction
    const res = await fetch("/api/delete-transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: t.id })
    });

    if (!res.ok) {
      alert("Failed to delete");
      return;
    }

    loadTxns();
  }

  return (
    <div className="card p-4">
      <h2 className="text-xl font-bold mb-2">Transactions</h2>

      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Type</th>
              <th className="p-3">Packets</th>
              <th className="p-3">Unit</th>
              <th className="p-3">Total</th>
              <th className="p-3">Delete</th>
            </tr>
          </thead>

          <tbody>
            {txns.map((t: any) => (
              <tr key={t.id} className="border-b hover:bg-white/5">
                <td className="p-3">{new Date(t.created_at).toLocaleString()}</td>
                <td className="p-3 capitalize">{t.txn_type}</td>
                <td className="p-3">{t.count_packets} × {t.packet_size_grams}g</td>
                <td className="p-3">₹{t.unit_price}</td>
                <td className="p-3 font-semibold text-cyan-300">₹{t.total_price}</td>

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
                <td colSpan={6} className="text-center p-6 kicker">No transactions found…</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
