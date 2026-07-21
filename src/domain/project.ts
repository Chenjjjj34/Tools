import { z } from 'zod'

export const salesPeriods = ['2023', '2024', '2025', '2026H1'] as const
export type SalesPeriod = (typeof salesPeriods)[number]

export interface ProductImage {
  id?: string
  original?: Blob | string
  preview?: Blob | string
  mimeType?: string
  width?: number
  height?: number
}

export interface Product {
  id: string
  name: string
  sku: string
  launchYear: number
  launchMonth: number
  priceEur: number
  sales: Record<SalesPeriod, number | null>
  image?: ProductImage
}

export interface ChartSettings {
  mode: 'price' | 'sales'
  period: SalesPeriod
  labelDensity: number
  imageSize: number
  xMin?: number
  xMax?: number
  yMin?: number
  yMax?: number
}

export interface Insight {
  id: string
  ruleId: string
  title: string
  evidence: string
  text: string
  severity: 'info' | 'warning' | 'positive'
  productIds: string[]
}

export interface Annotation {
  id: string
  type: 'ellipse' | 'arrow' | 'text'
  x: number
  y: number
  width?: number
  height?: number
  x2?: number
  y2?: number
  text?: string
  color?: string
  mode?: 'price' | 'sales'
  period?: SalesPeriod
}

export interface Project {
  version: 1
  id: string
  name: string
  products: Product[]
  chart: ChartSettings
  insights: Insight[]
  annotations: Annotation[]
  updatedAt: string
}

const salesSchema = z.object({
  '2023': z.number().int().nonnegative().nullable(),
  '2024': z.number().int().nonnegative().nullable(),
  '2025': z.number().int().nonnegative().nullable(),
  '2026H1': z.number().int().nonnegative().nullable(),
})

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  sku: z.string(),
  launchYear: z.number().int().min(1900).max(2200),
  launchMonth: z.number().int().min(1).max(12),
  priceEur: z.number().finite().nonnegative(),
  sales: salesSchema,
  image: z.object({
    id: z.string().optional(), original: z.any().optional(), preview: z.any().optional(),
    mimeType: z.string().optional(), width: z.number().optional(), height: z.number().optional(),
  }).optional(),
})

export const ChartSettingsSchema = z.object({
  mode: z.enum(['price', 'sales']), period: z.enum(salesPeriods),
  labelDensity: z.number().finite(), imageSize: z.number().finite(),
  xMin: z.number().optional(), xMax: z.number().optional(), yMin: z.number().optional(), yMax: z.number().optional(),
})

export const InsightSchema = z.object({ id: z.string(), ruleId: z.string(), title: z.string(), evidence: z.string(), text: z.string(), severity: z.enum(['info', 'warning', 'positive']), productIds: z.array(z.string()) })
export const AnnotationSchema = z.object({ id: z.string(), type: z.enum(['ellipse', 'arrow', 'text']), x: z.number(), y: z.number(), width: z.number().optional(), height: z.number().optional(), x2: z.number().optional(), y2: z.number().optional(), text: z.string().optional(), color: z.string().optional(), mode: z.enum(['price', 'sales']).optional(), period: z.enum(salesPeriods).optional() })
export const ProjectSchema = z.object({ version: z.literal(1), id: z.string(), name: z.string(), products: z.array(ProductSchema), chart: ChartSettingsSchema, insights: z.array(InsightSchema), annotations: z.array(AnnotationSchema), updatedAt: z.string() })
