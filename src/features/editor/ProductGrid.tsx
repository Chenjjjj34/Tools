import type { Product, SalesPeriod } from '../../domain/project'

const periods: SalesPeriod[] = ['2023', '2024', '2025', '2026H1']

export function ProductGrid({ products, onChange }: { products: Product[]; onChange: (products: Product[]) => void }) {
  const update = (id: string, transform: (product: Product) => Product) => onChange(products.map((product) => product.id === id ? transform(product) : product))
  return <div className="product-grid-wrap"><table className="product-grid"><thead><tr><th>图片</th><th>产品名称</th><th>SKU</th><th>上架年份</th><th>上架月份</th><th>售价（欧元）</th>{periods.map((period) => <th key={period}>{period} 销量</th>)}</tr></thead><tbody>{products.map((product) => <tr key={product.id}>
    <td>{product.image?.preview ? <img className="grid-image" src={String(product.image.preview)} alt="" /> : '—'}</td>
    <td><input aria-label={`${product.sku} 产品名称`} value={product.name} onChange={(event) => update(product.id, (item) => ({ ...item, name: event.target.value }))} /></td>
    <td><input aria-label={`${product.sku} SKU`} value={product.sku} onChange={(event) => update(product.id, (item) => ({ ...item, sku: event.target.value }))} /></td>
    <td><input aria-label={`${product.sku} 上架年份`} type="number" value={product.launchYear} onChange={(event) => update(product.id, (item) => ({ ...item, launchYear: Number(event.target.value) }))} /></td>
    <td><input aria-label={`${product.sku} 上架月份`} type="number" min="1" max="12" value={product.launchMonth} onChange={(event) => update(product.id, (item) => ({ ...item, launchMonth: Number(event.target.value) }))} /></td>
    <td><input aria-label={`${product.sku} 售价`} type="number" step="0.01" value={product.priceEur} onChange={(event) => update(product.id, (item) => ({ ...item, priceEur: Number(event.target.value) }))} /></td>
    {periods.map((period) => <td key={period}><input aria-label={`${product.sku} ${period} 销量`} type="number" value={product.sales[period] ?? ''} onChange={(event) => update(product.id, (item) => ({ ...item, sales: { ...item.sales, [period]: event.target.value === '' ? null : Number(event.target.value) } }))} /></td>)}
  </tr>)}</tbody></table></div>
}
