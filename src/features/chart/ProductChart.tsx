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
  const anchors = points.map((point) => ({ x: 4 + (point.x - minX) / xRange * 92, y: 5 + (point.y - minY) / range * 88 }))
  const displayPositions = placeWithoutOverlap(anchors, mode === 'sales' ? 30 : 8)

  return <div className="product-chart">
    <div className="axis-title-y">{mode === 'price' ? '售价（€）' : `${period} 销量`}</div>
    <div className="plot-area">
      {yTicks.map((value, index) => <div className="y-tick" key={index} style={{ bottom: `${index * 20}%` }}><span>{mode === 'price' ? value.toFixed(2) : Math.round(value).toLocaleString()}</span></div>)}
      {points.map((point, index) => {
        const anchor = anchors[index]
        const display = displayPositions[index]
        const moved = anchor.x !== display.x || anchor.y !== display.y
        return <div className="chart-card-group" key={point.id} style={{ left: `${display.x}%`, bottom: `${display.y}%` }}>
          <div className="chart-anchor" />
          {moved && <span className="card-origin" style={{ left: `${anchor.x - display.x}%`, bottom: `${anchor.y - display.y}%` }} />}
          <div className="chart-point" data-product-marker>
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

function placeWithoutOverlap(anchors: Array<{ x: number; y: number }>, minY: number) {
  const placed: Array<{ x: number; y: number }> = []
  const candidates: Array<[number, number]> = [[0, 0]]
  for (let radius = 1; radius <= 5; radius += 1) {
    candidates.push([0, radius * 16], [0, -radius * 16], [radius * 9, 0], [-radius * 9, 0], [radius * 9, radius * 16], [-radius * 9, radius * 16], [radius * 9, -radius * 16], [-radius * 9, -radius * 16])
  }
  for (const anchor of anchors) {
    const candidate = candidates.map(([dx, dy]) => ({ x: Math.min(95, Math.max(5, anchor.x + dx)), y: Math.min(92, Math.max(minY, anchor.y + dy)) })).find((position) => placed.every((other) => Math.abs(other.x - position.x) >= 8 || Math.abs(other.y - position.y) >= 14))
    placed.push(candidate ?? { x: anchor.x, y: anchor.y })
  }
  return placed
}

function formatMonth(value: number) {
  const year = Math.floor(value)
  const month = Math.min(12, Math.max(1, Math.round((value - year) * 12) + 1))
  return `${year}-${String(month).padStart(2, '0')}`
}
