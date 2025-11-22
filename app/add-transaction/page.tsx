"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import ConfirmButton from "../components/ConfirmButton";

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

  /* NEW FIELD */
  const [pricePerKg, setPricePerKg] = useState<number>(0);

  const router = useRouter();

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    const { data } = await supabase
      .from("products")
      .select("id, name, stock_packets_250, stock_packets_500")
      .order("name");

    setProducts(data || []);
  }

  function onSelectProduct(id: string) {
    setProductId(id);
    const p = products.find((x) => x.id === id) || null;
    setSelectedProduct(p);
  }

  /* Convert price per KG → price per packet */
  function calculateUnitPrice() {
    if (!pricePerKg) return 0;

    if (packetSize === 250) return pricePerKg * 0.25;
    if (packetSize === 500) return pricePerKg * 0.5;

    return 0;
  }

  async function addTxn() {
    if (!productId) return alert("Select a product");
    if (count <= 0) return alert("Enter valid packet count");
    if (pricePerKg <= -1) return alert("Enter valid price per KG");

    const unitPrice = calculateUnitPrice();
    const total = count * unitPrice;

    // Prevent sale when insufficient stock
    if (txnType === "sale") {
      if (!selectedProduct) return alert("Product not loaded");

      const available =
        packetSize === 500
          ? (selectedProduct.stock_packets_500 || 0)
          : (selectedProduct.stock_packets_250 || 0);

      if (available < count) {
        return alert(
          `Not enough stock.\nAvailable: ${available} packets\nRequested: ${count}`
        );
      }
    }

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

    if (error) return alert("Failed to add transaction");

    alert("Transaction added");
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

          {/* STOCK PREVIEW */}
          {selectedProduct && (
            <div
              className="card p-4 fade-slide"
              style={{
                background: "#F8FAFF",
                borderColor: "#E1E8F5",
              }}
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

          {/* ENTER PRICE PER KG */}
          <div>
            <label className="kicker">Price per KG (₹)</label>
            <input
              type="number"
              min={1}
              className="input mt-1"
              value={pricePerKg}
              onChange={(e) => setPricePerKg(Number(e.target.value))}
              placeholder="Ex: 210, 320 …"
            />
          </div>

          {/* AUTO PRICE PREVIEW */}
          {pricePerKg > 0 && (
            <div
              className="card p-4 fade-slide"
              style={{ background: "#F0F4FF", borderColor: "#D2DBF0" }}
            >
              <div className="kicker">Computed Price per Packet</div>
              <div
                style={{ fontSize: 18, fontWeight: 700, color: "#164B8A" }}
              >
                ₹{calculateUnitPrice().toFixed(2)}
              </div>

              {count > 0 && (
                <>
                  <div className="kicker mt-2">Total Amount</div>
                  <div
                    style={{ fontSize: 22, fontWeight: 700, color: "#164B8A" }}
                  >
                    ₹{(count * calculateUnitPrice()).toFixed(2)}
                  </div>
                </>
              )}
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
                setPricePerKg(0);
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
