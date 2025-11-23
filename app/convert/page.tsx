"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import ConfirmButton from "../components/ConfirmButton";

export default function ConvertPage() {
  type Product = {
    id: string;
    name: string;
    stock_packets_250: number;
    stock_packets_500: number;
  };

  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState("");
  const [direction, setDirection] = useState("500to250");
  const [count, setCount] = useState(1);
  const [selected, setSelected] = useState<Product | null>(null);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // --------------------------------------------------------------------
  // LOAD USER ID (Needed for RPC & RLS)
  // --------------------------------------------------------------------
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user?.id) setUserId(session.user.id);
    }
    fetchUser();
  }, []);

  // --------------------------------------------------------------------
  // LOAD ALL PRODUCTS FOR THIS USER
  // --------------------------------------------------------------------
  useEffect(() => {
    if (!userId) return;
    loadProducts();
  }, [userId]);

  async function loadProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, stock_packets_250, stock_packets_500")
      .eq("user_id", userId); // 🟢 Filter by user

    if (!error) setProducts(data || []);
  }

  // --------------------------------------------------------------------
  // Handle product selection
  // --------------------------------------------------------------------
  function updateSelected(id: string) {
    setProductId(id);
    const prod = products.find((p) => p.id === id) || null;
    setSelected(prod);
    setErrorMsg("");
    setSuccessMsg("");
  }

  // --------------------------------------------------------------------
  // Validate stock before conversion
  // --------------------------------------------------------------------
  function validate() {
    if (!selected) return false;

    if (direction === "500to250") {
      if (count > selected.stock_packets_500) {
        setErrorMsg("Not enough 500g packets.");
        return false;
      }
    }

    if (direction === "250to500") {
      if (count * 2 > selected.stock_packets_250) {
        setErrorMsg("Not enough 250g packets.");
        return false;
      }
    }

    setErrorMsg("");
    return true;
  }

  // --------------------------------------------------------------------
  // Perform the conversion using RPC
  // --------------------------------------------------------------------
  async function convert() {
    if (!validate()) return;

    const { error } = await supabase.rpc("convert_packets", {
      p_id: productId,
      convert_dir: direction,
      qty: count,
      p_user_id: userId, // 🟢 Required for RLS
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setSuccessMsg("Conversion successful!");
    await loadProducts();
    updateSelected(productId);
  }

  return (
    <div className="card p-5 fade-slide">
      <h2 className="text-xl font-bold mb-4">Convert Packets</h2>

      {/* Product Dropdown */}
      <label className="kicker">Product</label>
      <select
        className="input mb-4"
        value={productId}
        onChange={(e) => updateSelected(e.target.value)}
      >
        <option value="">Select product</option>

        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      {/* Stock Display */}
      {selected && (
        <div className="mb-4 kicker">
          <div>Available stock:</div>

          <div className="mt-1">
            <span className="text-blue-600 font-semibold">
              {selected.stock_packets_500}
            </span>{" "}
            × 500g
          </div>

          <div>
            <span className="text-blue-600 font-semibold">
              {selected.stock_packets_250}
            </span>{" "}
            × 250g
          </div>
        </div>
      )}

      {/* Conversion Type */}
      <label className="kicker">Conversion Type</label>
      <select
        className="input mb-4"
        value={direction}
        onChange={(e) => {
          setDirection(e.target.value);
          setErrorMsg("");
          setSuccessMsg("");
        }}
      >
        <option value="500to250">1 × 500g → 2 × 250g</option>
        <option value="250to500">2 × 250g → 1 × 500g</option>
      </select>

      {/* Quantity */}
      <label className="kicker">How many conversions?</label>
      <input
        type="number"
        className="input mb-4"
        min={1}
        value={count}
        onChange={(e) => {
          setCount(Number(e.target.value));
          setErrorMsg("");
          setSuccessMsg("");
        }}
      />

      {/* Error */}
      {errorMsg && (
        <div className="text-red-500 font-semibold mb-3">{errorMsg}</div>
      )}

      {/* Success */}
      {successMsg && (
        <div className="text-green-500 font-semibold mb-3">{successMsg}</div>
      )}

      {/* Button */}
      <ConfirmButton
        className="btn-primary w-full"
        message="Convert packets?"
        onClick={convert}
      >
        Convert Packets
      </ConfirmButton>
    </div>
  );
}
