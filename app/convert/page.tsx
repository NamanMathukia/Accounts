"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import ConfirmButton from "../components/ConfirmButton";

export default function ConvertPage() {
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState("");
  const [direction, setDirection] = useState("500to250");
  const [count, setCount] = useState(1);
  const [selected, setSelected] = useState<any>(null);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Load all products
  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    const { data } = await supabase
      .from("products")
      .select("id, name, stock_packets_250, stock_packets_500");
    setProducts(data || []);
  }

  // Load selected product’s data
  function updateSelected(id: string) {
    setProductId(id);
    const found = products.find((p: any) => p.id === id);
    setSelected(found || null);
    setErrorMsg("");
    setSuccessMsg("");
  }

  // Validate before converting
  function validate(): boolean {
    if (!selected) return false;
    const p = selected;

    // 500g → 250g (1 => 2)
    if (direction === "500to250") {
      if (count > p.stock_packets_500) {
        setErrorMsg("Not enough 500g packets available.");
        return false;
      }
    }

    // 250g → 500g (2 => 1)
    if (direction === "250to500") {
      if (count * 2 > p.stock_packets_250) {
        setErrorMsg("Not enough 250g packets available.");
        return false;
      }
    }

    setErrorMsg("");
    return true;
  }

  // Perform conversion through RPC
  async function convert() {
    if (!validate()) return;

    const { error } = await supabase.rpc("convert_packets", {
      p_id: productId,
      convert_dir: direction,
      qty: count,
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setSuccessMsg("Conversion successful!");
    setErrorMsg("");

    // Refresh product list + selected product state
    await loadProducts();
    updateSelected(productId);
  }

  return (
    <div className="card p-5">
      <h2 className="text-xl font-bold mb-4">Convert Packets</h2>

      {/* Product Dropdown */}
      <label className="kicker">Product</label>
      <select
        className="input mb-4 select-dark"
        value={productId}
        onChange={(e) => updateSelected(e.target.value)}
      >
        <option value="">Select product</option>
        {products.map((p: any) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      {/* Stock display */}
      {selected && (
        <div className="mb-4 text-sm kicker">
          <div>Available stock:</div>
          <div className="mt-1">
            <span className="text-cyan-300 font-semibold">
              {selected.stock_packets_500}
            </span>{" "}
            × 500g
          </div>
          <div>
            <span className="text-cyan-300 font-semibold">
              {selected.stock_packets_250}
            </span>{" "}
            × 250g
          </div>
        </div>
      )}

      {/* Conversion Direction */}
      <label className="kicker">Conversion Type</label>
      <select
        className="input mb-4 select-dark"
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

      {/* Error Message */}
      {errorMsg && (
        <div className="text-red-400 mb-3 font-semibold">{errorMsg}</div>
      )}

      {/* Success Message */}
      {successMsg && (
        <div className="text-green-400 mb-3 font-semibold">{successMsg}</div>
      )}

      {/* Convert Button */}
      <ConfirmButton
  className="btn-primary w-full"
  message="Are you sure you want to convert packets?"
  onClick={convert}
>
  Convert Packets
</ConfirmButton>

    </div>
  );
}
