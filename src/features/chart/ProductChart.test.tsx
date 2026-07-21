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
    expect(price.getByText('2025-01')).toBeInTheDocument()
    price.unmount()
    const sales = render(<ProductChart products={[product]} mode="sales" period="2025" />)
    expect(sales.container.querySelectorAll('[data-product-marker]')).toHaveLength(1)
  })
})
