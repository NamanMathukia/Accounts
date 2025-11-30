export default function TransactionRow({ txn }: { txn: any }) {
  return (
    <tr className="border-b hover:bg-white/2">
      <td className="p-3">{new Date(txn.created_at).toLocaleString()}</td>
      <td className="p-3 capitalize">{txn.txn_type}</td>
      <td className="p-3">{txn.quantity_grams} g</td>
      <td className="p-3">{txn.count_packets}×{txn.packet_size_grams}g</td>
      <td className="p-3">₹{txn.unit_price}</td>
      <td className="p-3 font-semibold text-accent-light">₹{txn.total_price}</td>
    </tr>
  )
}
