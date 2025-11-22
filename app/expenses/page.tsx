"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import ConfirmButton from "../components/ConfirmButton";

export default function ExpensesPage() {
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [note, setNote] = useState("");
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    loadExpenses();
  }, []);

  async function loadExpenses() {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setExpenses(data || []);
  }

  async function addExpense() {
    if (!category.trim() || !amount) {
      alert("Category and amount are required");
      return;
    }

    const { error } = await supabase.from("expenses").insert([
      {
        category,
        amount,
        note: note.trim() || null,
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    setCategory("");
    setAmount("");
    setNote("");
    loadExpenses();
    alert("Expense added successfully");
  }

  async function deleteExpense(id: string) {
    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadExpenses();
  }

  return (
    <div className="card p-5 fade-slide">
      <h2 className="text-xl font-bold mb-4">Expenses</h2>

      {/* Form */}
      <div className="space-y-3 mb-6">
        <div>
          <label className="kicker">Category</label>
          <input
            className="input mt-1"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Transport, Electricity, Rent..."
          />
        </div>

        <div>
          <label className="kicker">Amount (₹)</label>
          <input
            type="number"
            className="input mt-1"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </div>

        <div>
          <label className="kicker">Notes (optional)</label>
          <textarea
            className="input mt-1"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Any details..."
          />
        </div>

        <ConfirmButton
          className="btn-primary tap-scale"
          message="Add this expense?"
          onClick={addExpense}
        >
          Add Expense
        </ConfirmButton>
      </div>

      {/* List */}
      <h3 className="font-semibold mb-2">Recent Expenses</h3>
      <div className="space-y-3">
        {expenses.map((e: any) => (
          <div key={e.id} className="card p-3 fade">
            <div className="flex justify-between">
              <div>
                <div className="font-bold text-cyan-300">₹{e.amount}</div>
                <div className="kicker">{e.category}</div>
                {e.note && <div className="text-sm text-gray-300">{e.note}</div>}
                <div className="text-xs opacity-60">
                  {new Date(e.created_at).toLocaleString()}
                </div>
              </div>

              <ConfirmButton
                className="btn-secondary tap-scale"
                message="Delete this expense?"
                onClick={() => deleteExpense(e.id)}
              >
                🗑
              </ConfirmButton>
            </div>
          </div>
        ))}

        {expenses.length === 0 && (
          <div className="card p-4 kicker text-center">No expenses added yet…</div>
        )}
      </div>
    </div>
  );
}
