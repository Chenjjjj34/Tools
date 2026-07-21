import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import type { Product } from '../../domain/project'
import { ProductGrid } from './ProductGrid'

const initial: Product = { id: '1', name: 'A', sku: 'SKU-A', launchYear: 2024, launchMonth: 5, priceEur: 39.99, sales: { '2023': null, '2024': 10, '2025': 20, '2026H1': 8 } }

function Harness() { const [products, setProducts] = useState([initial]); return <><ProductGrid products={products} onChange={setProducts} /><output>{JSON.stringify(products[0])}</output></> }

describe('ProductGrid', () => {
  it('updates all coordinate-driving fields in controlled state', async () => {
    render(<Harness />)
    const user = userEvent.setup()
    const month = screen.getByLabelText('SKU-A 上架月份'); await user.clear(month); await user.type(month, '9')
    const price = screen.getByLabelText('SKU-A 售价'); await user.clear(price); await user.type(price, '49.99')
    const sales = screen.getByLabelText('SKU-A 2025 销量'); await user.clear(sales); await user.type(sales, '99')
    expect(screen.getByRole('status').textContent).toContain('"launchMonth":9')
    expect(screen.getByRole('status').textContent).toContain('"priceEur":49.99')
    expect(screen.getByRole('status').textContent).toContain('"2025":99')
  })
})
