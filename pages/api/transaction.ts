// pages/api/transaction.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Admin client (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST allowed" });

  const { productId, txnType, packetSize, count, unitPrice, customerName, paymentMethod } = req.body;
  if (!productId || !txnType)
    return res.status(400).json({ error: "Missing required fields" });

  // Calculate values
  const qty = Number(packetSize) * Number(count);
  const total = Number(unitPrice) * Number(count);

  // Determine Payment Status
  let paymentStatus = "paid";
  if (txnType === "sale" && paymentMethod === "lend") {
    paymentStatus = "pending";
  }

  // -----------------------------
  // 1️⃣ Get user session from client headers
  // -----------------------------
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token)
    return res.status(401).json({ error: "Missing authorization token" });

  const {
    data: { user },
    error: userErr
  } = await supabaseAdmin.auth.getUser(token);

  if (userErr || !user?.id)
    return res.status(401).json({ error: "Invalid user token" });

  // -----------------------------
  // 2️⃣ Call RPC to insert transaction AND update product stock
  // -----------------------------
  const { error: rpcErr } = await supabaseAdmin.rpc(
    "insert_transaction_and_update_inventory",
    {
      p_product_id: productId,
      p_txn_type: txnType,
      p_quantity_grams: qty,
      p_packet_size_grams: Number(packetSize),
      p_count_packets: Number(count),
      p_unit_price: Number(unitPrice),
      p_total_price: total,
      p_user_id: user.id,
      p_notes: null,
      p_customer_name: customerName || null,
      p_payment_method: paymentMethod || null,
      p_payment_status: paymentStatus
    }
  );

  if (rpcErr) {
    console.error(rpcErr);
    return res.status(500).json({ error: rpcErr.message });
  }

  return res.status(200).json({ success: true });
}
