"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useToast } from "./components/Toast";

type Product = {
  id: string;
  name: string;
  default_unit_grams: number;
  stock_packets_250?: number;
  stock_packets_500?: number;
};

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const { showToast } = useToast();

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);

    // 🔥 1. Fetch session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user_id = session?.user?.id;
    if (!user_id) {
      showToast("User not logged in");
      setLoading(false);
      return;
    }

    // 🔥 2. RLS: Filter by user_id
    const { data, error } = await supabase
      .from("products")
      .select("id, name, default_unit_grams, stock_packets_250, stock_packets_500")
      .eq("user_id", user_id)
      .order("name", { ascending: true });

    if (error) {
      showToast("Failed to load products");
      setLoading(false);
      return;
    }

    setProducts((data || []) as Product[]);
    setLoading(false);
  }

  function formatStock(p: Product) {
    const s500 = p.stock_packets_500 || 0;
    const s250 = p.stock_packets_250 || 0;

    const parts: string[] = [];
    if (s500 > 0) parts.push(`${s500} × 500g`);
    if (s250 > 0) parts.push(`${s250} × 250g`);

    return parts.join("   ·   ") || "0 packets";
  }

  function totalGrams(p: Product) {
    return (p.stock_packets_500 || 0) * 500 + (p.stock_packets_250 || 0) * 250;
  }

  return (
    <div className="fade">
      {/* Title */}
      <div className="mb-5">
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text)" }}>
          Inventory
        </h1>
        <p className="kicker" style={{ marginTop: 2 }}>
          Current stock overview
        </p>
      </div>

      {/* Skeleton Loading */}
      {loading && (
        <div className="space-y-4">
          <div className="card p-4 pulse" style={{ height: 90 }} />
          <div className="card p-4 pulse" style={{ height: 90 }} />
          <div className="card p-4 pulse" style={{ height: 90 }} />
        </div>
      )}

      {/* Product List */}
      {!loading && (
        <div className="space-y-4">
          {products.length === 0 && (
            <div className="card p-4 kicker text-center">
              No products added yet.
            </div>
          )}

          {products.map((p) => (
            <div
              key={p.id}
              className="card fade-slide p-4"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px",
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{p.name}</div>
                <div className="kicker">
                  Default Size: {p.default_unit_grams} g
                </div>
              </div>

              <div style={{ textAlign: "right", minWidth: 130 }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 16,
                    color: "var(--accent)",
                  }}
                >
                  {formatStock(p)}
                </div>
                <div className="kicker">{totalGrams(p)} g total</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
