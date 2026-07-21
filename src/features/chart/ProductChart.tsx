import type { Product, SalesPeriod } from '../../domain/project'
import { buildPoint, buildSparkline } from './chartModel'

export function ProductChart({ products, mode, period }: { products: Product[]; mode: 'price' | 'sales'; period: SalesPeriod }) {
  const points = products.map((product) => buildPoint(product, mode, period)).filter(Boolean) as Array<NonNullable<ReturnType<typeof buildPoint>>>
  if (!points.length) return <div className="chart-empty">当前周期没有可绘制的数据</div>
  const maxY = Math.max(...points.map((point) => point.y), 1)
  const minY = Math.min(...points.map((point) => point.y), 0)
  const range = Math.max(maxY - minY, 1)
  const minX = Math.min(...points.map((point) => point.x)) - 0.08
  const maxX = Math.max(...points.map((point) => point.x)) + 0.08
  const xRange = Math.max(maxX - minX, 1)
  const yTicks = Array.from({ length: 6 }, (_, index) => minY + range * index / 5)
  const xTicks = Array.from({ length: Math.floor(xRange * 4) + 1 }, (_, index) => minX + index / 4).filter((value) => value <= maxX)

  return <div className="product-chart">
    <div className="axis-title-y">{mode === 'price' ? '售价（€）' : `${period} 销量`}</div>
    <div className="plot-area">
      {yTicks.map((value, index) => <div className="y-tick" key={index} style={{ bottom: `${index * 20}%` }}><span>{mode === 'price' ? value.toFixed(2) : Math.round(value).toLocaleString()}</span></div>)}
      {points.map((point, index) => {
        const x = 4 + (point.x - minX) / xRange * 92
        const y = 5 + (point.y - minY) / range * 88
        const offset = collisionOffset(points, index, x, y, minX, xRange, minY, range)
        return <div className="chart-card-group" key={point.id} style={{ left: `${x}%`, bottom: `${y}%` }}>
          <div className="chart-anchor" />
          {offset !== 0 && <span className="card-leader" style={{ height: `${Math.abs(offset)}px`, transform: `rotate(${offset < 0 ? 180 : 0}deg)` }} />}
          <div className="chart-point" data-product-marker style={{ transform: `translate(-50%, calc(-50% - ${offset}px))` }}>
            {point.product.image?.preview && <img src={String(point.product.image.preview)} alt="" />}
            <b>{point.product.sku}</b>
            <small>{mode === 'price' ? `€${point.product.priceEur.toFixed(2)}` : point.y.toLocaleString()}　{buildSparkline(point.product).map((value) => value == null ? '—' : '▮').join('')}</small>
          </div>
        </div>
      })}
    </div>
    <div className="x-ticks">{xTicks.map((value) => <span key={value}>{formatMonth(value)}</span>)}<b>上架年月</b></div>
  </div>
}

function collisionOffset(points: Array<NonNullable<ReturnType<typeof buildPoint>>>, index: number, x: number, y: number, minX: number, xRange: number, minY: number, yRange: number) {
  let lane = 0
  for (let previous = 0; previous < index; previous += 1) {
    const px = 4 + (points[previous].x - minX) / xRange * 92
    const py = 5 + (points[previous].y - minY) / yRange * 88
    if (Math.abs(px - x) < 8 && Math.abs(py - y) < 14) lane += 1
  }
  return lane === 0 ? 0 : (lane % 2 ? 1 : -1) * Math.ceil(lane / 2) * 92
}

function formatMonth(value: number) {
  const year = Math.floor(value)
  const month = Math.min(12, Math.max(1, Math.round((value - year) * 12) + 1))
  return `${year}-${String(month).padStart(2, '0')}`
}
