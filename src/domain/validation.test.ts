import { describe, expect, it } from 'vitest'
import {
  normalizeOptionalCount,
  parseProductRow,
  validateProductRows,
} from './validation'

describe('domain validation', () => {
  it.each(['/', '', undefined])('maps %p to missing sales', (value) => {
    expect(normalizeOptionalCount(value)).toBeNull()
  })

  it('does not annualize 2026H1', () => {
    const product = parseProductRow({ sku: '151501C', sales2026H1: 39 })
    expect(product.sales['2026H1']).toBe(39)
  })

  it('normalizes numeric strings and preserves missing values as null', () => {
    const product = parseProductRow({
      id: 'x', name: 'Widget', sku: 'SKU-X', launchYear: '2024', launchMonth: '3',
      priceEur: '12.5', sales2023: '/', sales2024: '10', sales2025: '', sales2026H1: undefined,
    })
    expect(product.priceEur).toBe(12.5)
    expect(product.sales).toEqual({ '2023': null, '2024': 10, '2025': null, '2026H1': null })
  })

  it('reports negative price, non-integer sales, and invalid month', () => {
    const result = validateProductRows([
      { sku: 'A', priceEur: -1, sales2023: 1.2, launchMonth: 13 },
    ])
    expect(result.rows[0].valid).toBe(false)
    expect(result.rows[0].issues.map((i) => i.field)).toEqual(expect.arrayContaining(['priceEur', 'sales.2023', 'launchMonth']))
  })

  it('reports duplicate SKUs', () => {
    const result = validateProductRows([{ sku: 'D' }, { sku: 'D' }])
    expect(result.rows.every((r) => r.issues.some((i) => i.code === 'duplicate_sku'))).toBe(true)
  })

  it('excludes invalid rows from valid products', () => {
    const result = validateProductRows([
      { sku: 'ok', priceEur: 1, launchYear: 2024, launchMonth: 1 },
      { sku: 'bad', priceEur: -2, launchYear: 2024, launchMonth: 1 },
    ])
    expect(result.products.map((p) => p.sku)).toEqual(['ok'])
  })
})
