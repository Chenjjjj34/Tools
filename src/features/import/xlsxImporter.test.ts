import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import { readFile } from 'node:fs/promises'
import { importWorkbook } from './xlsxImporter'

function workbookBuffer(rows: unknown[][]): ArrayBuffer {
  const wb = XLSX.utils.book_new(); const ws = XLSX.utils.aoa_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, 'Products')
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
}

describe('xlsx importer', () => {
  it('imports the supplied workbook and all embedded images', async () => {
    const project = await importWorkbook(await readFile('src/test/fixtures/product-review.xlsx'))
    expect(project.products).toHaveLength(15)
    expect(project.products.filter((product) => product.image?.preview).length).toBe(15)
    expect(project.products.find((product) => product.sku === '151501C')?.sales).toEqual({ '2023': 27, '2024': 1953, '2025': 5958, '2026H1': 39 })
  })

  it('imports rows by header and preserves 2026H1', async () => {
    const data = workbookBuffer([
      ['image', 'name', 'sku', 'launchYear', 'launchMonth', 'sales2023', 'sales2024', 'sales2025', 'sales2026H1', 'priceEur'],
      ['/', 'Widget', '151501C', 2024, 3, 27, 1953, 5958, 39, 55.99],
    ])
    const project = await importWorkbook(data)
    expect(project.products).toHaveLength(1)
    expect(project.products[0].sales['2026H1']).toBe(39)
  })

  it('returns warnings and excludes invalid rows', async () => {
    const data = workbookBuffer([['name', 'sku', 'launchYear', 'launchMonth', 'sales2023', 'priceEur'], ['Bad', 'X', 2024, 2, -1, -5]])
    const project = await importWorkbook(data)
    expect(project.products).toHaveLength(0)
    expect(project.warnings.length).toBeGreaterThan(0)
  })

  it('rejects workbooks missing required columns', async () => {
    await expect(importWorkbook(workbookBuffer([['name', 'sku'], ['A', 'A']]))).rejects.toThrow(/Missing required columns/)
  })
})
