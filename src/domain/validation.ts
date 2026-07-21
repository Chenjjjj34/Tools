import { z } from 'zod'
import type { Product, SalesPeriod } from './project'
import { ProductSchema, salesPeriods } from './project'

export interface ValidationIssue { field: string; code: string; message: string }
export interface ValidatedRow { product: Product | null; valid: boolean; issues: ValidationIssue[] }
export interface ValidationResult { rows: ValidatedRow[]; products: Product[]; warnings: ValidationIssue[] }

export function normalizeOptionalCount(value: unknown): number | null {
  if (value === undefined || value === null) return null
  if (typeof value === 'string') {
    const text = value.trim()
    if (!text || text === '/') return null
    const n = Number(text)
    return Number.isFinite(n) ? n : null
  }
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function text(value: unknown): string { return value == null ? '' : String(value).trim() }
function num(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(text(value))
  return Number.isFinite(n) ? n : fallback
}

export function parseProductRow(row: Record<string, unknown>): Product {
  const sales = Object.fromEntries(salesPeriods.map((period) => [period, normalizeOptionalCount(row[`sales${period}`] ?? row[period])])) as Product['sales']
  const sku = text(row.sku ?? row.SKU)
  const product: Product = {
    id: text(row.id) || sku || crypto.randomUUID(),
    name: text(row.name ?? row.productName ?? row['品名']),
    sku,
    launchYear: num(row.launchYear ?? row.year ?? row['上架年份']),
    launchMonth: num(row.launchMonth ?? row.month ?? row['上架月份']),
    priceEur: num(row.priceEur ?? row.price ?? row['售价（欧元）']),
    sales,
    image: row.image as Product['image'],
  }
  return product
}

function productIssues(product: Product): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (!product.sku) issues.push({ field: 'sku', code: 'required', message: 'SKU is required' })
  if (!Number.isInteger(product.launchYear) || product.launchYear < 1900 || product.launchYear > 2200) issues.push({ field: 'launchYear', code: 'invalid_year', message: 'Launch year is invalid' })
  if (!Number.isInteger(product.launchMonth) || product.launchMonth < 1 || product.launchMonth > 12) issues.push({ field: 'launchMonth', code: 'invalid_month', message: 'Launch month must be 1-12' })
  if (!Number.isFinite(product.priceEur) || product.priceEur < 0) issues.push({ field: 'priceEur', code: 'invalid_price', message: 'Price must be non-negative' })
  for (const period of salesPeriods) {
    const value = product.sales[period]
    if (value !== null && (!Number.isInteger(value) || value < 0)) issues.push({ field: `sales.${period}`, code: 'invalid_sales', message: 'Sales must be a non-negative integer' })
  }
  const parsed = ProductSchema.safeParse(product)
  if (!parsed.success && issues.length === 0) {
    for (const issue of parsed.error.issues) issues.push({ field: issue.path.join('.'), code: issue.code, message: issue.message })
  }
  return issues
}

export function validateProductRows(rows: Array<Record<string, unknown> | Product>): ValidationResult {
  const products = rows.map((row) => parseProductRow(row as Record<string, unknown>))
  const skuCounts = new Map<string, number>()
  products.forEach((p) => skuCounts.set(p.sku, (skuCounts.get(p.sku) ?? 0) + 1))
  const validated = products.map((product) => {
    const issues = productIssues(product)
    if (product.sku && (skuCounts.get(product.sku) ?? 0) > 1) issues.push({ field: 'sku', code: 'duplicate_sku', message: 'SKU is duplicated' })
    return { product: issues.length ? null : product, valid: issues.length === 0, issues }
  })
  return { rows: validated, products: validated.flatMap((r) => r.product ? [r.product] : []), warnings: validated.flatMap((r) => r.issues.filter((i) => i.code === 'duplicate_sku')) }
}
