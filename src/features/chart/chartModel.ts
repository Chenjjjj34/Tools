import type { Product, SalesPeriod } from '../../domain/project'
export function buildPoint(product: Product, mode: 'price' | 'sales', period: SalesPeriod = '2025') { const y = mode === 'price' ? product.priceEur : product.sales[period]; return y == null ? null : { id: product.id, x: product.launchYear + (product.launchMonth - 1) / 12, y, product } }
export function buildSparkline(product: Product) { return (['2023','2024','2025','2026H1'] as const).map((period) => product.sales[period]) }
