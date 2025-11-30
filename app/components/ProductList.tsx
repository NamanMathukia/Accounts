export default function ProductList({ products, humanize }: { products: any[]; humanize?: (n: number) => string }) {
  return (
    <div className="space-y-3">
      {products.map(p => (
        <div key={p.id} className="card p-4 flex justify-between items-center">
          <div>
            <div className="text-bold">{p.name}</div>
            <div className="kicker">Default: {p.default_unit_grams}g</div>
          </div>
          <div className="text-right">
            <div className="text-bold" style={{ color: 'var(--accent2)' }}>{humanize ? humanize(p.stock) : `${p.stock} g`}</div>
            <div className="kicker">{p.stock} g</div>
          </div>
        </div>
      ))}
    </div>
  )
}
