import { useState } from 'react'
import type { Product, SalesPeriod } from '../domain/project'
import { ProductChart } from '../features/chart/ProductChart'

export function ChartPage({ products }: { products: Product[] }) {
  const [mode, setMode] = useState<'price' | 'sales'>('price')
  const [period, setPeriod] = useState<SalesPeriod>('2025')
  return <>
    <div className="chart-controls">
      <button className={mode === 'price' ? 'selected' : ''} onClick={() => setMode('price')}>价格分布</button>
      <button className={mode === 'sales' ? 'selected' : ''} onClick={() => setMode('sales')}>销量分布</button>
      {mode === 'sales' && <select aria-label="销量周期" value={period} onChange={(event) => setPeriod(event.target.value as SalesPeriod)}><option value="2023">2023</option><option value="2024">2024</option><option value="2025">2025</option><option value="2026H1">2026H1</option></select>}
    </div>
    <ProductChart products={products} mode={mode} period={period} />
  </>
}
