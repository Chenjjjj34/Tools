import type { Product } from '../domain/project'; import { ProductGrid } from '../features/editor/ProductGrid'
export function DataEditorPage({ products, onChange }: { products: Product[]; onChange: (products: Product[]) => void }) { return <><div className="sub-toolbar"><b>{products.length} 款产品</b><span>支持排序、筛选和单元格编辑</span></div><ProductGrid products={products} onChange={onChange} /></> }
