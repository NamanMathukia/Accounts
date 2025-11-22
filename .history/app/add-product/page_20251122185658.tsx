"use client";

import React, { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import ConfirmButton from "../components/ConfirmButton";
import { useToast } from "../components/Toast";

const { showSuccess, showError } = useToast();

export default function AddProductPage() {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState<number>(250);
  const router = useRouter();

  async function handleAdd() {
    if (!name.trim()) {
      showError("Product name is required");
      return;
    }

    // Insert product
    const { data, error } = await supabase
      .from("products")
      .insert([{ name, default_unit_grams: unit }])
      .select();

    if (error) {
      showError(error.message);
      return;
    }

    // Initialize stock
    const { error: stockErr } = await supabase.from("inventory").insert([
      {
        product_id: data[0].id,
        stock_grams: 0,
      },
    ]);

    if (stockErr) {
      showError("Product created but failed to initialize stock");
      return;
    }

    showSuccess("Product added successfully");
    router.push("/");
  }

  return (
    <div className="fade card p-5" style={{ marginTop: 10 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
        Add New Product
      </h2>
      <p className="kicker mb-4">Create an item in your inventory</p>

      <div className="space-y-4 mt-4">
        {/* Name */}
        <div>
          <label className="kicker">Product Name</label>
          <input
            className="input mt-1"
            value={name}
            placeholder="Example: Sugar, Rice..."
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Default Packet Size */}
        <div>
          <label className="kicker">Default Packet Size</label>
          <select
            className="input mt-1"
            value={String(unit)}
            onChange={(e) => setUnit(Number(e.target.value))}
          >
            <option value={250}>250 g</option>
            <option value={500}>500 g</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-3">
          <ConfirmButton
            className="btn-primary tap-scale"
            message="Add this product?"
            onClick={handleAdd}
          >
            Add Product
          </ConfirmButton>

          <button
            type="button"
            className="btn-secondary tap-scale"
            onClick={() => {
              setName("");
              setUnit(250);
            }}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
