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
  const [packetSize, setPacketSize] = useState<number>(500);
  const [count, setCount] = useState<number>(1);

  // price per KG (NEW)
  const [pricePerKg, setPricePerKg] = useState<number>(0);

  // Sale-specific fields
  const [customerName, setCustomerName] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "gpay" | "lend">("cash");

  const router = useRouter();

  // ------------------------------
  // LOAD PRODUCTS
  // ------------------------------
  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    // 🔥 Required for RLS
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) return;

    // 🔥 Filter only the logged-in user's products
    const { data } = await supabase
      .from("products")
      .select("id, name, stock_packets_250, stock_packets_500")
      .eq("user_id", session.user.id)
      .order("name");

    setProducts((data || []) as Product[]);
  }

  function onSelectProduct(id: string) {
    setProductId(id);
    const p = products.find((x) => x.id === id) || null;
    setSelectedProduct(p);
  }

  // ------------------------------
  // OLD FORMAT — API CALL (KEPT SAME)
  // ------------------------------
  async function addTxn() {
    if (!productId) return alert("Select a product");

    // Validate sale-specific fields
    if (txnType === "sale" && !customerName.trim()) {
      return alert("Please enter customer name for sale transactions");
    }

    const unitPrice = (pricePerKg / 1000) * packetSize;
    const totalPrice = unitPrice * count;

    // Prevent sale if no stock
    if (txnType === "sale") {
      const available =
        packetSize === 500
          ? selectedProduct?.stock_packets_500 || 0
          : selectedProduct?.stock_packets_250 || 0;

      if (available < count) {
        return alert(
          `Not enough stock.\nAvailable: ${available}\nRequested: ${count}`
        );
      }
    }

    // ⭐ MUST include user session token for RLS
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      alert("Not logged in");
      return;
    }

    const res = await fetch("/api/transaction", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`, // ⭐ REQUIRED
      },
      body: JSON.stringify({
        productId,
        txnType,
        packetSize,
        count,
        unitPrice,
        totalPrice,
        customerName: txnType === "sale" ? customerName : null,
        paymentMethod: txnType === "sale" ? paymentMethod : null,
      }),
    });

    if (!res.ok) {
      const e = await res.json();
      alert("Failed: " + e.error);
      return;
    }

    alert("Transaction added");
    router.push("/transactions");
  }


  // ------------------------------
  // UTILS
  // ------------------------------
  function totalGrams(p: Product | null) {
    if (!p) return 0;
    return (p.stock_packets_500 || 0) * 500 + (p.stock_packets_250 || 0) * 250;
  }

  return (
    <div className="fade">
      <div className="card p-6 mt-12">
        <h2 className="page-title">
          Add Transaction
        </h2>

        <div className="space-y-6">
          {/* Transaction Type */}
          <div>
            <label className="kicker">Transaction Type</label>
            <div className="radio-container">
              <label className={`radio-option ${txnType === "purchase" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="txnType"
                  value="purchase"
                  checked={txnType === "purchase"}
                  onChange={() => setTxnType("purchase")}
                />
                <span>
                  Purchase
                </span>
              </label>

              <label className={`radio-option ${txnType === "sale" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="txnType"
                  value="sale"
                  checked={txnType === "sale"}
                  onChange={() => setTxnType("sale")}
                />
                <span>
                  Sale
                </span>
              </label>
            </div>
          </div>

          {/* Product */}
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

          {/* Inventory Preview */}
          {selectedProduct && (
            <div className="card p-4 card-light-blue">
              <div className="kicker mb-1">Available Stock</div>

              {(selectedProduct.stock_packets_500 || 0) > 0 && (
                <div>{selectedProduct.stock_packets_500} × 500g</div>
              )}
              {(selectedProduct.stock_packets_250 || 0) > 0 && (
                <div>{selectedProduct.stock_packets_250} × 250g</div>
              )}

              {(selectedProduct.stock_packets_250 || 0) === 0 &&
                (selectedProduct.stock_packets_500 || 0) === 0 && (
                  <div className="text-muted-gray">0 packets</div>
                )}

              <div className="kicker mt-1">
                Total: {totalGrams(selectedProduct)} g
              </div>
            </div>
          )}

          {/* SALE SPECIFIC FIELDS */}
          {txnType === "sale" && (
            <>
              <div>
                <label className="kicker">Customer Name</label>
                <input
                  type="text"
                  className="input mt-1"
                  placeholder="Enter customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div>
                <label className="kicker">Payment Method</label>
                <select
                  className="input mt-1"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                >
                  <option value="cash">Cash</option>
                  <option value="gpay">GPay</option>
                  <option value="lend">Lend (Udhaar)</option>
                </select>
              </div>
            </>
          )}

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

          {/* Count */}
          <div>
            <label className="kicker">Packets</label>
            <div className="flex-row gap-8 mt-1">
              <button
                type="button"
                onClick={() => setCount(Math.max(1, count - 1))}
                className="counter-btn"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                className="input input-center"
                style={{ flex: 1 }}
                value={count}
                onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))}
              />
              <button
                type="button"
                onClick={() => setCount(count + 1)}
                className="counter-btn"
              >
                +
              </button>
            </div>
          </div>

          {/* Price per KG */}
          <div>
            <label className="kicker">Price per KG (₹)</label>

            {/* Quick preset buttons */}
            <div className="flex-row gap-8 mt-2 mb-8">
              {[500, 600, 700, 800].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setPricePerKg(preset)}
                  className={`preset-btn ${pricePerKg === preset ? "active" : ""}`}
                >
                  ₹{preset}
                </button>
              ))}
            </div>

            <div className="flex-row gap-8">
              <button
                type="button"
                onClick={() => setPricePerKg(Math.max(0, pricePerKg - 10))}
                className="counter-btn"
              >
                −
              </button>
              <input
                type="number"
                min={0}
                step={10}
                className="input input-center"
                style={{ flex: 1 }}
                value={pricePerKg}
                onChange={(e) => setPricePerKg(Math.max(0, Number(e.target.value) || 0))}
              />
              <button
                type="button"
                onClick={() => setPricePerKg(pricePerKg + 10)}
                className="counter-btn"
              >
                +
              </button>
            </div>
          </div>

          {/* Total Preview */}
          {pricePerKg > 0 && count > 0 && (
            <div className="card p-4 card-blue-accent">
              <div className="kicker">Total Amount</div>
              <div className="text-xl" style={{ color: "#164B8A" }}>
                ₹{((pricePerKg / 1000) * packetSize * count).toFixed(2)}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4">
            <ConfirmButton
              className="btn-primary"
              message="Add this transaction?"
              onClick={addTxn}
            >
              Add Transaction
            </ConfirmButton>

            <button
              className="btn-secondary"
              type="button"
              onClick={() => {
                setProductId("");
                setSelectedProduct(null);
                setTxnType("purchase");
                setPacketSize(250);
                setCount(1);
                setPricePerKg(0);
                setCustomerName("");
                setPaymentMethod("cash");
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
