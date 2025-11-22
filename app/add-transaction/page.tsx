"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import ConfirmButton from "../components/ConfirmButton";
import { useToast } from "../components/Toast";

type Product = {
  id: string;
  name: string;
  stock_packets_250?: number;
  stock_packets_500?: number;
};

export default function AddTransactionPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [txnType, setTxnType] = useState<"purchase" | "sale">("purchase");
  const [packetSize, setPacketSize] = useState<number>(250);
  const [count, setCount] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);

  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, stock_packets_250, stock_packets_500")
      .order("name");

    if (error) return showToast("Failed to load products");
    setProducts(data || []);
  }

  function onSelectProduct(id: string) {
    setProductId(id);
    const p = products.find((x) => x.id === id) || null;
    setSelectedProduct(p);
  }

  async function addTxn() {
    if (!productId) return showToast("Select a product");
    if (count <= 0) return showToast("Enter valid packet count");
    if (unitPrice <= 0) return showToast("Enter valid price");

    const total = count * unitPrice;

    // -----------------------------
    // 🚨 Prevent sale if no stock
    // -----------------------------
    if (txnType === "sale") {
      if (!selectedProduct) return showToast("Product not loaded yet");

      const availablePackets =
        packetSize === 500
          ? (selectedProduct.stock_packets_500 || 0)
          : (selectedProduct.stock_packets_250 || 0);

      if (availablePackets < count) {
        return showToast(
          `Not enough stock.\nAvailable: ${availablePackets} packets`
        );
      }
    }

    // 👉 REQUIRED FIX FOR SUPABASE
    const quantityGrams = packetSize * count;

    const { error } = await supabase.from("transactions").insert([
      {
        product_id: productId,
        txn_type: txnType,
        packet_size_grams: packetSize,
        count_packets: count,
        unit_price: unitPrice,
        total_price: total,
        quantity_grams: quantityGrams, // ⭐ FIX
      },
    ]);

    if (error) return showToast("Failed to add transaction");

    showToast("Transaction added");
    router.push("/transactions");
  }

  function totalGrams(p: Product | null) {
    if (!p) return 0;
    return (p.stock_packets_500 || 0) * 500 + (p.stock_packets_250 || 0) * 250;
  }

  return (
    <div className="fade">
      <div className="card p-6" style={{ marginTop: 12 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
          Add Transaction
        </h2>
        <p className="kicker mb-4">Record a purchase or sale</p>

        <div className="space-y-6">
          {/* PRODUCT */}
          <div>
            <label className="kicker">Product</label>
            <select
              className="input mt-1"
              value={productId}
              onChange={(e) => onSelectProduct(e.target.value)}
            >
              <option value="">Select product…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* INVENTORY PREVIEW */}
          {selectedProduct && (
            <div
              className="card p-4 fade-slide"
              style={{ background: "#F8FAFF", borderColor: "#E1E8F5" }}
            >
              <div className="kicker mb-1">Available Stock</div>

              <div style={{ fontSize: 16, fontWeight: 600, color: "#164B8A" }}>
                {(selectedProduct.stock_packets_500 || 0) > 0 && (
                  <div>{selectedProduct.stock_packets_500} × 500g</div>
                )}

                {(selectedProduct.stock_packets_250 || 0) > 0 && (
                  <div>{selectedProduct.stock_packets_250} × 250g</div>
                )}

                {(selectedProduct.stock_packets_500 || 0) === 0 &&
                  (selectedProduct.stock_packets_250 || 0) === 0 && (
                    <div style={{ color: "#777" }}>0 packets</div>
                  )}
              </div>

              <div className="kicker mt-1">
                Total: {totalGrams(selectedProduct)} g
              </div>
            </div>
          )}

          {/* TRANSACTION TYPE */}
          <div>
            <label className="kicker">Transaction Type</label>
            <select
              className="input mt-1"
              value={txnType}
              onChange={(e) => setTxnType(e.target.value as any)}
            >
              <option value="purchase">Purchase</option>
              <option value="sale">Sale</option>
            </select>
          </div>

          {/* PACKET SIZE */}
          <div>
            <label className="kicker">Packet Size</label>
            <select
              className="input mt-1"
              value={packetSize}
              onChange={(e) => setPacketSize(Number(e.target.value))}
            >
              <option value={250}>250 g</option>
              <option value={500}>500 g</option>
            </select>
          </div>

          {/* PACKETS */}
          <div>
            <label className="kicker">No. of Packets</label>
            <input
              type="number"
              min={1}
              className="input mt-1"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            />
          </div>

          {/* PRICE */}
          <div>
            <label className="kicker">Price per Packet (₹)</label>
            <input
              type="number"
              min={1}
              className="input mt-1"
              value={unitPrice}
              onChange={(e) => setUnitPrice(Number(e.target.value))}
            />
          </div>

          {/* TOTAL PREVIEW */}
          {count > 0 && unitPrice > 0 && (
            <div
              className="card p-4 fade-slide"
              style={{ background: "#F0F4FF", borderColor: "#D2DBF0" }}
            >
              <div className="kicker">Total Amount</div>
              <div
                style={{ fontSize: 22, fontWeight: 700, color: "#164B8A" }}
              >
                ₹{count * unitPrice}
              </div>
            </div>
          )}

          {/* BUTTONS */}
          <div className="flex gap-4 mt-2">
            <ConfirmButton
              className="btn-primary tap-scale"
              message="Add this transaction?"
              onClick={addTxn}
            >
              Add Transaction
            </ConfirmButton>

            <button
              className="btn-secondary tap-scale"
              type="button"
              onClick={() => {
                setProductId("");
                setSelectedProduct(null);
                setTxnType("purchase");
                setPacketSize(250);
                setCount(1);
                setUnitPrice(0);
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
