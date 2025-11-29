import { createClient } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";

// Admin client to bypass RLS for updates if needed, though standard client should work if policies allow update
// Using admin client to be safe and consistent with other writes
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { transactionId } = req.body;

    if (!transactionId) {
        return res.status(400).json({ error: "Missing transactionId" });
    }

    // 1. Verify User (Optional but recommended for security context, though we use Admin client)
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
        return res.status(401).json({ error: "Missing authorization token" });
    }

    const {
        data: { user },
        error: userErr,
    } = await supabaseAdmin.auth.getUser(token);

    if (userErr || !user) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    // 2. Update the transaction
    const { error } = await supabaseAdmin
        .from("transactions")
        .update({ payment_status: "paid" })
        .eq("id", transactionId)
        .eq("user_id", user.id); // Ensure user owns the transaction

    if (error) {
        console.error("Error updating transaction:", error);
        return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true });
}
