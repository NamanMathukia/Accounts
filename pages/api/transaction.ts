// pages/api/transaction.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST' })

  const { productId, txnType, packetSize, count, unitPrice } = req.body
  if (!productId || !txnType) return res.status(400).json({ error: 'Missing fields' })

  const qty = Number(packetSize) * Number(count)
  const total = Number(unitPrice) * Number(count)

  const { error } = await supabaseAdmin.rpc('insert_transaction_and_update_inventory', {
    p_product_id: productId,
    p_txn_type: txnType,
    p_quantity_grams: qty,
    p_packet_size_grams: Number(packetSize),
    p_count_packets: Number(count),
    p_unit_price: Number(unitPrice),
    p_total_price: total,
    p_notes: null
  })

  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json({ ok: true })
}
