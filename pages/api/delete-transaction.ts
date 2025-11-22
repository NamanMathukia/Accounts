import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, serviceRole)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Only POST allowed' })

  const { id } = req.body
  if (!id) return res.status(400).json({ error: 'Transaction id missing' })

  const { error } = await supabaseAdmin.rpc('delete_transaction_and_update_inventory', { t_id: id })

  if (error) return res.status(500).json({ error: error.message })

  res.status(200).json({ success: true })
}
