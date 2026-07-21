import type { Product, SalesPeriod } from '../../domain/project'
import { buildPoint, buildSparkline } from './chartModel'

export function ProductChart({ products, mode, period }: { products: Product[]; mode: 'price' | 'sales'; period: SalesPeriod }) {
  const points = products.map((product) => buildPoint(product, mode, period)).filter(Boolean) as Array<NonNullable<ReturnType<typeof buildPoint>>>
  const maxY = Math.max(...points.map((point) => point.y), 1)
  const minY = Math.min(...points.map((point) => point.y), 0)
  const range = Math.max(maxY - minY, 1)
  const minMonth = Math.min(...points.map((point) => point.x), 2023)
  const maxMonth = Math.max(...points.map((point) => point.x), 2026.99)
  const monthRange = Math.max(maxMonth - minMonth, 1)
  const yTicks = Array.from({ length: 6 }, (_, index) => minY + (range * index) / 5)
  const xTicks = Array.from({ length: Math.ceil(monthRange * 4) + 1 }, (_, index) => minMonth + index / 4).filter((value) => value <= maxMonth + 0.01)
  const occupied: Array<{ x: number; y: number }> = []
  return <div className="product-chart">
    <div className="axis-title-y">{mode === 'price' ? '售价（€）' : `${period} 销量`}</div>
    <div className="plot-area">
      {yTicks.map((value, index) => <div className="y-tick" key={value} style={{ bottom: `${index * 20}%` }}><span>{mode === 'price' ? value.toFixed(2) : Math.round(value).toLocaleString()}</span></div>)}
      {points.map((point) => {
        const product = point.product
        const anchorX = 4 + ((point.x - minMonth) / monthRange) * 92
        const anchorY = 5 + ((point.y - minY) / range) * 88
        let offsetX = 0
        let offsetY = 0
        while (occupied.some((item) => Math.abs(item.x - (anchorX + offsetX)) < 8 && Math.abs(item.y - (anchorY + offsetY)) < 15)) offsetY = offsetY > 0 ? -offsetY - 18 : 18
        occupied.push({ x: anchorX + offsetX, y: anchorY + offsetY })
        return <div className="chart-card-group" key={product.id} style={{ left: `${anchorX}%`, bottom: `${anchorY}%` }}>
          {(offsetX !== 0 || offsetY !== 0) && <span className="card-leader" style={{ height: `${Math.abs(offsetY)}px`, transform: `translateX(${offsetX}px) rotate(${offsetY < 0 ? 180 : 0}deg)` }} />}
          <div className="chart-anchor" />
          <div className="chart-point" data-product-marker title={`${product.sku} · ${point.y}`} style={{ transform: `translate(calc(-50% + ${offsetX}px), calc(-50% - ${offsetY}px))` }}>
            {product.image?.preview && <img src={String(product.image.preview)} alt="" />}
            <b>{product.sku}</b><small>{mode === 'price' ? `€${product.priceEur.toFixed(2)}` : point.y.toLocaleString()}　{buildSparkline(product).map((value) => value == null ? '—' : '▮').join('')}</small>
          </div>
        </div>
      })}
    </div>
    <div className="x-ticks">{xTicks.map((value) => <span key={value}>{Math.floor(value)}-{String(Math.round((value % 1) * 12) + 1).padStart(2, '0')}</span>)}<b>上架年月</b></div>
  </div>
}
