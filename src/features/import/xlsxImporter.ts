import * as XLSX from 'xlsx'
import JSZip from 'jszip'
import type { Project, Product } from '../../domain/project'
import { validateProductRows } from '../../domain/validation'

export interface ImportWarning { row?: number; field?: string; code: string; message: string }
export interface ImportResult extends Project { warnings: ImportWarning[] }

const aliases: Record<string, string> = {
  '主图': 'image', '图片': 'image', '品名': 'name', '产品名': 'name', '产品SKU': 'sku', 'SKU': 'sku',
  '上架年份': 'launchYear', '上架年': 'launchYear', '上架月份': 'launchMonth', '上架月': 'launchMonth',
  '2023销量': 'sales2023', '2023销售量': 'sales2023', '2023': 'sales2023',
  '2024销量': 'sales2024', '2024销售量': 'sales2024', '2024': 'sales2024',
  '2025销量': 'sales2025', '2025销售量': 'sales2025', '2025': 'sales2025',
  '2026年上半年销量': 'sales2026H1', '2026上半年销量': 'sales2026H1', '2026H1': 'sales2026H1',
  '售价（欧元）': 'priceEur', '售价(欧元)': 'priceEur', '售价': 'priceEur', '价格': 'priceEur',
}

function canonicalHeader(value: unknown): string {
  const key = String(value ?? '').trim()
  if (aliases[key]) return aliases[key]
  if (/^2023/.test(key)) return 'sales2023'
  if (/^2024/.test(key)) return 'sales2024'
  if (/^2025/.test(key)) return 'sales2025'
  if (/^2026/.test(key)) return 'sales2026H1'
  if (key === '主图') return 'image'
  if (key === '品名') return 'name'
  if (key === '产品父SKU') return 'sku'
  if (key === '上架年份') return 'launchYear'
  if (key === '上架月份') return 'launchMonth'
  if (key === '售价（欧元）') return 'priceEur'
  if (key.includes('SKU')) return 'sku'
  if (key.includes('品名')) return 'name'
  if (key.includes('年份')) return 'launchYear'
  if (key.includes('月份')) return 'launchMonth'
  if (key.includes('售价') || key.includes('价格')) return 'priceEur'
  if (key.includes('主图') || key.includes('图片')) return 'image'
  return key
}

export async function importWorkbook(input: ArrayBuffer | Uint8Array | Blob): Promise<ImportResult> {
  const bytes = input instanceof Blob ? new Uint8Array(await input.arrayBuffer()) : input
  const workbook = XLSX.read(bytes, { type: 'array', cellDates: false })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  if (!sheet) throw new Error('Workbook has no worksheets')
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: undefined, raw: true })
  if (!matrix.length) throw new Error('Worksheet is empty')
  const headerIndex = matrix.findIndex((row) => {
    const normalized = (row ?? []).map(canonicalHeader)
    return normalized.includes('sku') && normalized.includes('launchYear')
  })
  let resolvedHeaderIndex = headerIndex
  if (resolvedHeaderIndex < 0) {
    const fallback = matrix.findIndex((row) => (row ?? []).some((cell) => String(cell ?? '').trim().toLowerCase() === 'sku'))
    if (fallback < 0) throw new Error('Missing required columns: name, sku, launchYear, launchMonth, priceEur')
    resolvedHeaderIndex = fallback
  }
  const headers = (matrix[resolvedHeaderIndex] ?? []).map(canonicalHeader)
  const required = ['name', 'sku', 'launchYear', 'launchMonth', 'priceEur']
  const missing = required.filter((field) => !headers.includes(field))
  if (missing.length) throw new Error(`Missing required columns: ${missing.join(', ')}`)
  const imageMap = await extractEmbeddedImages(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes))
  const rawRows = matrix.slice(resolvedHeaderIndex + 1).map((cells) => {
    const row: Record<string, unknown> = {}
    headers.forEach((header, index) => { if (header) row[header] = cells[index] })
    const imageCell = cells[headers.indexOf('image')]
    const match = String(imageCell ?? '').match(/DISPIMG\("([^"]+)"/i)
    if (match && imageMap.has(match[1])) row.image = imageMap.get(match[1])
    else if (match || imageCell === '/' || imageCell == null || imageCell === '') delete row.image
    return row
  }).filter((row) => Object.values(row).some((value) => value !== undefined && value !== ''))
  const validated = validateProductRows(rawRows)
  const now = new Date().toISOString()
  const project: ImportResult = {
    version: 1,
    id: crypto.randomUUID(),
    name: workbook.Props?.Title || 'Imported project',
    products: validated.products,
    chart: { mode: 'price', period: '2025', labelDensity: 1, imageSize: 48 },
    insights: [], annotations: [], updatedAt: now,
    warnings: validated.rows.flatMap((row, index) => row.issues.map((issue) => ({ ...issue, row: index + 2 }))),
  }
  return project
}

async function extractEmbeddedImages(input: Uint8Array): Promise<Map<string, Product['image']>> {
  const result = new Map<string, Product['image']>()
  const zip = await JSZip.loadAsync(input)
  const cellXml = await zip.file('xl/cellimages.xml')?.async('string')
  const relXml = await zip.file('xl/_rels/cellimages.xml.rels')?.async('string')
  if (!cellXml || !relXml) return result
  const relationships = new Map<string, string>()
  for (const rel of relXml.matchAll(/<Relationship\b[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)) {
    const target = rel[2].replace(/^\.\//, '')
    relationships.set(rel[1], target.startsWith('xl/') ? target : `xl/${target}`)
  }
  for (const image of cellXml.matchAll(/<xdr:cNvPr\b[^>]*name="([^"]+)"[^>]*\/>[\s\S]*?<a:blip\b[^>]*r:embed="([^"]+)"/g)) {
    const id = image[1]; const target = relationships.get(image[2]); if (!target) continue
    const file = zip.file(target); if (!file) continue
    const data = await file.async('base64'); const mime = target.toLowerCase().endsWith('.jpg') || target.toLowerCase().endsWith('.jpeg') ? 'image/jpeg' : 'image/png'
    result.set(id, { id, original: `data:${mime};base64,${data}`, preview: `data:${mime};base64,${data}`, mimeType: mime })
  }
  return result
}

export async function importWorkbookWithWarnings(input: ArrayBuffer | Uint8Array | Blob): Promise<{ project: Project; warnings: ImportWarning[] }> {
  const result = await importWorkbook(input)
  const { warnings, ...project } = result
  return { project, warnings }
}
