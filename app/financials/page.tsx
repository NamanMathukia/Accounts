"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import StatCard from "../components/StatCard";

type Txn = {
  id: string;
  product_id: string;
  txn_type: "purchase" | "sale";
  count_packets: number;
  packet_size_grams: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  payment_status?: string;
};

type Expense = {
  id: string;
  category: string;
  amount: number;
  note?: string;
  created_at: string;
};

export default function FinancialsPage() {
  const [txns, setTxns] = useState<Txn[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState({
    revenue: 0,
    cost: 0,
    expenses: 0,
    profit: 0,
    pendingReceivables: 0,
  });

  const [byProduct, setByProduct] = useState<
    Record<string, { name: string; revenue: number; cost: number; profit: number; pending: number }>
  >({});

  useEffect(() => {
    load();
  }, []);

  async function load() {
    // 🔥 GET USER SESSION
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) return;

    const user_id = session.user.id;

    // -------------------------------
    // 🔥 Load Transactions (RLS-safe)
    // -------------------------------
    const { data: tx } = await supabase
      .from("transactions")
      .select("*, products(name)")
      .eq("user_id", user_id)            // ⭐ Required
      .order("created_at", { ascending: false });

    if (!tx) return;

    // -------------------------------
    // 🔥 Load Products (to map names)
    // -------------------------------
    const { data: prods } = await supabase
      .from("products")
      .select("id, name")
      .eq("user_id", user_id);          // ⭐ Required

    const prodMap: Record<string, string> = {};
    (prods || []).forEach((p: any) => (prodMap[p.id] = p.name));

    const normalized = (tx as any[]).map((t) => ({
      id: t.id,
      product_id: t.product_id,
      txn_type: t.txn_type,
      count_packets: t.count_packets,
      packet_size_grams: t.packet_size_grams,
      unit_price: Number(t.unit_price),
      total_price: Number(t.total_price),
      created_at: t.created_at,
      payment_status: t.payment_status,
    })) as Txn[];

    setTxns(normalized);

    // -------------------------------
    // 🔥 Load Expenses (RLS-safe)
    // -------------------------------
    const { data: exp } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", user_id)           // ⭐ Required
      .order("created_at", { ascending: false });

    const expenseList = exp || [];
    setExpenses(expenseList);

    const totalExpenses = expenseList.reduce(
      (sum, e) => sum + Number(e.amount || 0),
      0
    );

    // -------------------------------
    // 🔥 Compute Summary
    // -------------------------------
    let revenue = 0,
      cost = 0,
      pendingReceivables = 0;
    const bp: Record<string, any> = {};

    normalized.forEach((t) => {
      const pid = t.product_id;
      const name = prodMap[pid] || "Unknown";

      if (!bp[pid]) bp[pid] = { name, revenue: 0, cost: 0, pending: 0 };

      if (t.txn_type === "sale") {
        // Only count PAID sales as revenue
        if (t.payment_status === "paid") {
          revenue += t.total_price;
          bp[pid].revenue += t.total_price;
        } else {
          // Track pending (lend/udhaar) separately
          pendingReceivables += t.total_price;
          bp[pid].pending += t.total_price;
        }
      } else {
        cost += t.total_price;
        bp[pid].cost += t.total_price;
      }
    });

    Object.keys(bp).forEach(
      (k) => (bp[k].profit = (bp[k].revenue || 0) - (bp[k].cost || 0))
    );

    const profit = revenue - cost - totalExpenses;

    setSummary({ revenue, cost, expenses: totalExpenses, profit, pendingReceivables });
    setByProduct(bp);
  }

  return (
    <div className="fade-slide">
      <h2 style={{ fontSize: 20, fontWeight: 700 }}>Financials</h2>
      <p className="kicker mb-4">Revenue, cost, expenses and net profit</p>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-3 mb-4">
        <StatCard title="Total Revenue (Paid)" value={`₹${summary.revenue.toFixed(2)}`} className="fade" />
        <StatCard title="Pending Receivables (Udhaar)" value={`₹${summary.pendingReceivables.toFixed(2)}`} className="fade" />
        <StatCard title="Total Cost" value={`₹${summary.cost.toFixed(2)}`} className="fade" />
        <StatCard title="Total Expenses" value={`₹${summary.expenses.toFixed(2)}`} className="fade" />
        <StatCard title="Net Profit" value={`₹${summary.profit.toFixed(2)}`} className="fade" />
      </div>

      {/* By Product Breakdown */}
      <div className="card p-3 mt-3 fade-slide">
        <h3 style={{ fontWeight: 700 }}>By Product</h3>
        <div className="mt-3 space-y-2">
          {Object.keys(byProduct).length === 0 && (
            <div className="kicker">No product transactions yet</div>
          )}

          {Object.entries(byProduct).map(([pid, obj]) => (
            <div
              key={pid}
              className="p-3 bg-white/3 rounded-md flex justify-between items-center fade"
            >
              <div>
                <div style={{ fontWeight: 700 }}>{obj.name}</div>
                <div className="kicker">
                  Revenue: ₹{obj.revenue.toFixed(2)} • Cost: ₹{obj.cost.toFixed(2)}
                  {obj.pending > 0 && (
                    <span style={{ color: "#F59E0B" }}> • Pending: ₹{obj.pending.toFixed(2)}</span>
                  )}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, color: "var(--accent1)" }}>
                  ₹{obj.profit.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expense Summary */}
      <div className="card p-3 mt-4 fade-slide">
        <h3 style={{ fontWeight: 700 }}>Recent Expenses</h3>

        <div className="mt-3 space-y-2">
          {expenses.length === 0 && <div className="kicker">No expenses yet…</div>}

          {expenses.map((e) => (
            <div key={e.id} className="card p-3 fade">
              <div>
                <div className="font-bold text-red-400">₹{e.amount}</div>
                <div className="kicker">{e.category}</div>
                {e.note && (
                  <div className="text-sm text-gray-400">{e.note}</div>
                )}
                <div className="text-xs opacity-60 mt-1">
                  {new Date(e.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
