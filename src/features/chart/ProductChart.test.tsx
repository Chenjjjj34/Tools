import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Product } from '../../domain/project'
import { ProductChart } from './ProductChart'

const product: Product = {
  id: 'one', name: 'Product', sku: 'SKU-1', launchYear: 2025, launchMonth: 6,
  priceEur: 39.99, sales: { '2023': null, '2024': 10, '2025': 20, '2026H1': 8 },
  image: { preview: 'data:image/png;base64,AA==' },
}

describe('ProductChart', () => {
  it('renders one marker at a real data anchor in both modes', () => {
    const price = render(<ProductChart products={[product]} mode="price" period="2025" />)
    expect(price.container.querySelectorAll('[data-product-marker]')).toHaveLength(1)
    expect(price.getByText('2025-05')).toBeInTheDocument()
    price.unmount()
    const sales = render(<ProductChart products={[product]} mode="sales" period="2025" />)
    expect(sales.container.querySelectorAll('[data-product-marker]')).toHaveLength(1)
  })

  it('moves only colliding cards to unique display positions', () => {
    const products = [0, 1, 2].map((index) => ({ ...product, id: String(index), sku: `SKU-${index}` }))
    const single = render(<ProductChart products={[products[0]]} mode="price" period="2025" />)
    const originalPosition = `${single.container.querySelector<HTMLElement>('.chart-card-group')?.style.left}/${single.container.querySelector<HTMLElement>('.chart-card-group')?.style.bottom}`
    single.unmount()
    const view = render(<ProductChart products={products} mode="price" period="2025" />)
    const positions = [...view.container.querySelectorAll<HTMLElement>('.chart-card-group')].map((element) => `${element.style.left}/${element.style.bottom}`)
    expect(new Set(positions).size).toBe(3)
    expect(positions[0]).toBe(originalPosition)
  })
})
