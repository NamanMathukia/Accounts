"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../components/Toast";
import ConfirmButton from "../components/ConfirmButton";
import { useRouter } from "next/navigation";

export default function AddTransactionPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [products, setProducts] = useState<any[]>([]);
  const [productId, setProductId] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  const [txnType, setTxnType] = useState("purchase");
  const [packetSize, setPacketSize] = useState(250);
  const [count, setCount] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);

  // Load products
  useEffect(() => {
    async function loadProducts() {
      const { data, error } = await supabase
        .from("products")
        .select(
          "id, name, stock_packets_250, stock_packets_500, default_unit_grams"
        )
        .order("name");

      if (error) return showToast("Failed to load products");
      setProducts(data || []);
    }

    loadProducts();
  }, []);

  // When product changes → update selectedProduct
  useEffect(() => {
    const prod = products.find((p) => p.id === productId);
    setSelectedProduct(prod || null);
  }, [productId, products]);

  // --------------------------
  // ADD TRANSACTION FUNCTION
  // --------------------------
  async function addTxn() {
    if (!productId) return showToast("Select a product");
    if (count <= 0) return showToast("Enter valid packet count");

    // Validate stock for sale
    if (txnType === "sale") {
      const availablePackets =
        packetSize === 500
          ? selectedProduct?.stock_packets_500 || 0
          : selectedProduct?.stock_packets_250 || 0;

      if (availablePackets < count) {
        return showToast(
          `Not enough stock.\nAvailable: ${availablePackets} packets`
        );
      }
    }

    const total = count * unitPrice;

    const { error } = await supabase.from("transactions").insert([
      {
        product_id: productId,
        txn_type: txnType,
        packet_size_grams: packetSize,
        count_packets: count,
        unit_price: unitPrice,
        total_price: total,
      },
    ]);

    if (error) return showToast("Failed to add transaction");

    showToast("Transaction added");
    router.push("/transactions");
  }

  return (
    <div className="fade">
      <div className="card p-6" style={{ marginTop: 12 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>
          Add Transaction
        </h2>
        <p className="kicker mb-4">Record a purchase or sale</p>

        <div className="space-y-6">
          {/* Product */}
          <div>
            <label className="kicker">Product</label>
            <select
              className="input mt-1"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="">Select product...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* LIVE STOCK PREVIEW */}
          {selectedProduct && (
            <div className="card p-4 fade-slide">
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                Current Stock:
              </div>

              <div className="kicker">
                500g: <b>{selectedProduct.stock_packets_500}</b> packets
              </div>
              <div className="kicker">
                250g: <b>{selectedProduct.stock_packets_250}</b> packets
              </div>

              {/* Auto-warning */}
              {txnType === "sale" &&
                ((packetSize === 500 &&
                  selectedProduct.stock_packets_500 < count) ||
                  (packetSize === 250 &&
                    selectedProduct.stock_packets_250 < count)) && (
                  <div style={{ color: "red", marginTop: 6 }}>
                    ⚠ Not enough stock!
                  </div>
                )}
            </div>
          )}

          {/* Transaction Type */}
          <div>
            <label className="kicker">Transaction Type</label>
            <select
              className="input mt-1"
              value={txnType}
              onChange={(e) => setTxnType(e.target.value)}
            >
              <option value="purchase">Purchase</option>
              <option value="sale">Sale</option>
            </select>
          </div>

          {/* Packet Size */}
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

          {/* Number of Packets */}
          <div>
            <label className="kicker">No. of Packets</label>
            <input
              type="number"
              className="input mt-1"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            />
          </div>

          {/* Price */}
          <div>
            <label className="kicker">Price per Packet (₹)</label>
            <input
              type="number"
              className="input mt-1"
              value={unitPrice}
              onChange={(e) => setUnitPrice(Number(e.target.value))}
            />
          </div>

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
              type="button"
              className="btn-secondary tap-scale"
              onClick={() => {
                setCount(1);
                setPacketSize(250);
                setTxnType("purchase");
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
