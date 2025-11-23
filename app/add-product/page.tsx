"use client";

import React, { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import ConfirmButton from "../components/ConfirmButton";
import { useToast } from "../components/Toast";

export default function AddProductPage() {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState<number>(250);
  const router = useRouter();
  const { showToast } = useToast();

  async function addProduct() {
    if (!name.trim()) return showToast("Product name required");

    // 🔥 Get logged-in user (required for RLS)
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return showToast("Not logged in");
    }

    // 🔥 Insert product WITH user_id
    const { data, error } = await supabase
      .from("products")
      .insert([
        {
          name,
          default_unit_grams: unit,
          user_id: session.user.id, // REQUIRED
        },
      ])
      .select();

    if (error) {
      console.error(error);
      return showToast("Error adding product");
    }

    showToast("Product added");
    router.push("/");
  }

  return (
    <div className="fade">
      <div className="card p-6" style={{ marginTop: 12 }}>
        <h2
          style={{
            fontSize: 24,
            fontWeight: 700,
            marginBottom: 8,
            color: "var(--text)",
          }}
        >
          Add Product
        </h2>

        <p className="kicker mb-4">Create a new inventory item</p>

        <div className="space-y-6">
          {/* NAME */}
          <div>
            <label className="kicker">Product Name</label>
            <input
              className="input mt-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Sugar, Rice..."
            />
          </div>

          {/* DEFAULT PACKET */}
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

          {/* BUTTONS */}
          <div className="flex gap-4 mt-2">
            <ConfirmButton
              className="btn-primary tap-scale"
              message="Add this product?"
              onClick={addProduct}
            >
              Add Product
            </ConfirmButton>

            <button
              type="button"
              onClick={() => {
                setName("");
                setUnit(250);
              }}
              className="btn-secondary tap-scale"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
