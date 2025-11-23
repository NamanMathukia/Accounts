import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 🔥 Service-role client (full DB access, bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, serviceRole);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Only POST allowed" });

  const { id, user_id } = req.body;

  // ✔ Validate input
  if (!id) return res.status(400).json({ error: "Transaction id missing" });
  if (!user_id)
    return res
      .status(400)
      .json({ error: "User ID missing. You must send the user's id." });

  // ✔ Safety: Ensure this transaction belongs to this user
  const { data: txn, error: fetchError } = await supabaseAdmin
    .from("transactions")
    .select("user_id")
    .eq("id", id)
    .single();

  if (fetchError) {
    return res.status(500).json({ error: "Transaction lookup failed" });
  }

  if (!txn || txn.user_id !== user_id) {
    return res.status(403).json({ error: "Not allowed to delete this item" });
  }

  // ✔ Call RPC to reverse inventory + delete transaction
  const { error } = await supabaseAdmin.rpc(
    "delete_transaction_and_update_inventory",
    { t_id: id }
  );

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ success: true });
}
