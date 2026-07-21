# Product Chart Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deployable browser-only tool that imports the supplied product-review Excel workbook, edits product data and images, renders linked price/sales charts, supports analysis annotations, and exports PNG, PDF, Excel, and project backups.

**Architecture:** A Vite React TypeScript single-page application keeps a normalized `Project` model as the single source of truth. Feature modules own Excel parsing, IndexedDB persistence, chart rendering, rule-based analysis, annotation state, and exports; UI pages communicate only through the project store. All business data remains in the browser.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, SheetJS (`xlsx`), JSZip, ECharts, Dexie, AG Grid Community, react-easy-crop, html-to-image, jsPDF, Zod.

---

## File Structure

- `package.json`, `vite.config.ts`, `tsconfig*.json`: build and test configuration.
- `src/domain/project.ts`: canonical product, sales, chart, annotation, and project types.
- `src/domain/validation.ts`: import/edit validation and missing-value normalization.
- `src/features/import/xlsxImporter.ts`: workbook XML, shared strings, cell images, and row mapping.
- `src/features/export/xlsxExporter.ts`: workbook regeneration with edited rows and images.
- `src/features/storage/projectRepository.ts`: IndexedDB projects and bounded snapshots.
- `src/features/editor/ProductGrid.tsx`: editable product table and image actions.
- `src/features/editor/ImageEditorDialog.tsx`: product image replacement and cropping.
- `src/features/chart/chartModel.ts`: deterministic price/sales series and label model.
- `src/features/chart/ProductChart.tsx`: ECharts custom product markers and sparklines.
- `src/features/analysis/analyzeProject.ts`: explainable price and sales insights.
- `src/features/annotations/AnnotationEditor.tsx`: circles, arrows, and text annotations.
- `src/features/export/exporters.ts`: PNG, PDF, and project backup import/export.
- `src/store/useProjectStore.tsx`: reducer, undo/redo, autosave, and derived analysis.
- `src/pages/*.tsx`: four-step workflow pages.
- `src/App.tsx`, `src/styles.css`: shell, navigation, responsive layout, and error states.
- `src/**/*.test.ts(x)`: tests colocated with each feature.
- `e2e/product-workflow.spec.ts`: complete import-edit-chart-export browser flow.

### Task 1: Scaffold the application and test harness

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/App.test.tsx`
- Create: `src/styles.css`

- [ ] **Step 1: Create the Vite React TypeScript package manifest**

Use scripts `dev`, `build`, `test`, `test:run`, and `e2e`; add the libraries listed in the plan header and Playwright as a development dependency.

- [ ] **Step 2: Write the failing shell test**

```tsx
it('shows the four workflow steps', () => {
  render(<App />)
  expect(screen.getByText('数据编辑')).toBeInTheDocument()
  expect(screen.getByText('图表制作')).toBeInTheDocument()
  expect(screen.getByText('分析与标注')).toBeInTheDocument()
  expect(screen.getByText('导出')).toBeInTheDocument()
})
```

- [ ] **Step 3: Run the test and verify failure**

Run: `npm run test:run -- src/App.test.tsx`
Expected: FAIL because the application shell does not exist.

- [ ] **Step 4: Implement the four-step application shell**

Create an accessible header, project status area, four-tab navigation, empty-state import prompt, and restrained desktop/tablet styles matching the approved full-width tab layout.

- [ ] **Step 5: Verify the shell**

Run: `npm run test:run -- src/App.test.tsx && npm run build`
Expected: test PASS and production build succeeds.

### Task 2: Define the canonical project model and validation

**Files:**
- Create: `src/domain/project.ts`
- Create: `src/domain/validation.ts`
- Create: `src/domain/validation.test.ts`

- [ ] **Step 1: Write failing normalization tests**

```ts
it.each(['/', '', undefined])('maps %p to missing sales', value => {
  expect(normalizeOptionalCount(value)).toBeNull()
})

it('does not annualize 2026H1', () => {
  const product = parseProductRow({ sku: '151501C', sales2026H1: 39 })
  expect(product.sales['2026H1']).toBe(39)
})
```

- [ ] **Step 2: Run tests and verify failure**

Run: `npm run test:run -- src/domain/validation.test.ts`
Expected: FAIL because types and normalization functions are missing.

- [ ] **Step 3: Implement exact domain types**

```ts
export type SalesPeriod = '2023' | '2024' | '2025' | '2026H1'
export interface Product {
  id: string; name: string; sku: string; launchYear: number; launchMonth: number
  priceEur: number; sales: Record<SalesPeriod, number | null>; image?: ProductImage
}
export interface Project {
  version: 1; id: string; name: string; products: Product[]
  chart: ChartSettings; insights: Insight[]; annotations: Annotation[]; updatedAt: string
}
```

Implement Zod-backed validation for year, month, non-negative price, non-negative integer sales, duplicate SKU warnings, and invalid row exclusion from calculations.

- [ ] **Step 4: Verify domain behavior**

Run: `npm run test:run -- src/domain/validation.test.ts`
Expected: all normalization and validation tests PASS.

### Task 3: Import the supplied Excel workbook and embedded images

**Files:**
- Create: `src/features/import/xlsxImporter.ts`
- Create: `src/features/import/xlsxImporter.test.ts`
- Copy fixture: `src/test/fixtures/product-review.xlsx`

- [ ] **Step 1: Add the supplied workbook as a test fixture**

Copy `D:\桌面\产品复盘数据(3） - 副本.xlsx` to the fixture path without modifying the source file.

- [ ] **Step 2: Write failing integration assertions**

```ts
it('imports all rows and DISPIMG images', async () => {
  const project = await importWorkbook(await fixtureBuffer('product-review.xlsx'))
  expect(project.products).toHaveLength(15)
  expect(project.products.filter(p => p.image)).toHaveLength(15)
  expect(project.products.find(p => p.sku === '151501C')?.sales).toEqual({
    '2023': 27, '2024': 1953, '2025': 5958, '2026H1': 39
  })
})
```

- [ ] **Step 3: Run the importer test and verify failure**

Run: `npm run test:run -- src/features/import/xlsxImporter.test.ts`
Expected: FAIL because `importWorkbook` is not implemented.

- [ ] **Step 4: Implement workbook parsing**

Use JSZip to read `xl/sharedStrings.xml`, `xl/worksheets/sheet1.xml`, `xl/cellimages.xml`, `xl/_rels/cellimages.xml.rels`, and `xl/media/*`. Resolve each `DISPIMG` ID to a media relationship, map columns by header text rather than fixed position, convert media bytes to Blob URLs, and return import warnings alongside the project.

- [ ] **Step 5: Test malformed workbooks**

Add assertions for missing required columns, invalid numeric cells, missing image relationships, duplicate SKU, and `/` values.

- [ ] **Step 6: Verify importer tests**

Run: `npm run test:run -- src/features/import/xlsxImporter.test.ts`
Expected: sample and malformed workbook tests PASS.

### Task 4: Add browser persistence, project backups, and undo/redo

**Files:**
- Create: `src/features/storage/projectRepository.ts`
- Create: `src/features/storage/projectRepository.test.ts`
- Create: `src/store/useProjectStore.tsx`
- Create: `src/store/useProjectStore.test.tsx`

- [ ] **Step 1: Write failing persistence tests**

```ts
it('keeps the newest ten snapshots', async () => {
  for (let i = 0; i < 12; i++) await repository.saveSnapshot(makeProject(i))
  expect(await repository.listSnapshots(projectId)).toHaveLength(10)
})
```

Test reducer actions for import, edit, replace image, add annotation, undo, and redo.

- [ ] **Step 2: Implement the repository and reducer**

Create Dexie tables for projects, image blobs, and snapshots. Debounce autosave by 500 ms, retain ten snapshots per project, expose save status, and use a bounded in-memory undo/redo stack.

- [ ] **Step 3: Verify storage behavior**

Run: `npm run test:run -- src/features/storage src/store`
Expected: persistence, snapshot retention, autosave state, undo, and redo tests PASS.

### Task 5: Build Excel-like product editing and image replacement

**Files:**
- Create: `src/pages/DataEditorPage.tsx`
- Create: `src/features/editor/ProductGrid.tsx`
- Create: `src/features/editor/ImageEditorDialog.tsx`
- Create: `src/features/editor/ProductGrid.test.tsx`

- [ ] **Step 1: Write failing editor tests**

```tsx
it('updates the project when price changes', async () => {
  render(<ProductGrid products={[product]} onChange={onChange} />)
  await userEvent.clear(screen.getByDisplayValue('55.99'))
  await userEvent.type(screen.getByRole('textbox', { name: '售价（欧元）' }), '49.99')
  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ priceEur: 49.99 }))
})
```

Add tests for invalid sales, sorting, filtering, row insertion/deletion, and image replacement.

- [ ] **Step 2: Implement the grid and validation feedback**

Configure AG Grid columns for the canonical fields, custom image cells, numeric parsers, missing-value display, row actions, sorting/filtering, clipboard paste, and inline errors.

- [ ] **Step 3: Implement image editing**

Use `react-easy-crop` in a modal, preserve the original Blob, create a normalized preview, and dispatch `replaceProductImage` only after confirmation.

- [ ] **Step 4: Verify editor behavior**

Run: `npm run test:run -- src/features/editor`
Expected: all editing and image tests PASS.

### Task 6: Render linked price and sales product charts

**Files:**
- Create: `src/features/chart/chartModel.ts`
- Create: `src/features/chart/chartModel.test.ts`
- Create: `src/features/chart/ProductChart.tsx`
- Create: `src/features/chart/ProductChart.test.tsx`
- Create: `src/pages/ChartPage.tsx`

- [ ] **Step 1: Write failing chart-model tests**

```ts
it('uses price in price mode and selected sales in sales mode', () => {
  expect(buildPoint(product, { mode: 'price' }).y).toBe(55.99)
  expect(buildPoint(product, { mode: 'sales', period: '2025' }).y).toBe(5958)
})

it('omits missing sales points instead of plotting zero', () => {
  expect(buildPoint(productWithout2023, { mode: 'sales', period: '2023' })).toBeNull()
})
```

- [ ] **Step 2: Implement deterministic chart models**

Build monthly X coordinates, selected Y values, product marker metadata, four-period sparkline arrays with gaps, axis bounds, label density rules, and tooltip content.

- [ ] **Step 3: Implement the ECharts custom series**

Render a stable-size product image marker, SKU, price, and SVG-free canvas sparkline in a custom series. Add price/sales segmented control, sales-period selector, label density, image size, axis settings, zoom, tooltip, and fit-to-canvas controls.

- [ ] **Step 4: Test and visually verify the chart**

Run: `npm run test:run -- src/features/chart`
Expected: chart-model and interaction tests PASS.

Open the sample workbook at desktop and tablet widths; verify all 15 products render and dense labels remain inspectable through hover.

### Task 7: Add explainable analysis and manual annotations

**Files:**
- Create: `src/features/analysis/analyzeProject.ts`
- Create: `src/features/analysis/analyzeProject.test.ts`
- Create: `src/features/annotations/AnnotationEditor.tsx`
- Create: `src/features/annotations/AnnotationEditor.test.tsx`
- Create: `src/pages/AnalysisPage.tsx`

- [ ] **Step 1: Write failing analysis tests**

Test quantile segment assignment, consecutive-period growth/decline, new-product ramp detection, main price-band detection, and insufficient-data suppression.

- [ ] **Step 2: Implement pure analysis rules**

Return structured `Insight` values containing rule ID, title, evidence, editable display text, severity, and affected product IDs. Never compare `2026H1` as a full year or treat null as zero.

- [ ] **Step 3: Implement annotation editing**

Provide tools for dashed ellipse, arrow, and text. Store normalized canvas coordinates and bind each annotation to chart mode plus optional sales period. Support select, drag, resize, recolor, edit text, delete, undo, and redo.

- [ ] **Step 4: Verify analysis and annotations**

Run: `npm run test:run -- src/features/analysis src/features/annotations`
Expected: rule and annotation interaction tests PASS.

### Task 8: Implement PNG, PDF, Excel, and project exports

**Files:**
- Create: `src/features/export/exporters.ts`
- Create: `src/features/export/exporters.test.ts`
- Create: `src/features/export/xlsxExporter.ts`
- Create: `src/features/export/xlsxExporter.test.ts`
- Create: `src/pages/ExportPage.tsx`

- [ ] **Step 1: Write failing export tests**

Test project JSON round-trip including image blobs, workbook field order and images, PNG scale/background options, and landscape PDF dimensions.

- [ ] **Step 2: Implement project backup round-trip**

Export a versioned ZIP containing `project.json` and original/preview images. On import, validate version and hashes before replacing current state.

- [ ] **Step 3: Implement visual exports**

Use `html-to-image` at 1x/2x/4x resolution with white or transparent background. Insert the resulting image into a landscape jsPDF page while preserving aspect ratio.

- [ ] **Step 4: Implement Excel export**

Write the ten approved columns in original order, convert null sales to `/`, embed current product images, and verify the exported workbook can be re-imported with 15 products and images.

- [ ] **Step 5: Verify all exports**

Run: `npm run test:run -- src/features/export`
Expected: project, Excel, PNG, and PDF tests PASS.

### Task 9: Integrate the complete workflow and error states

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Create: `src/components/ImportDialog.tsx`
- Create: `src/components/ErrorBoundary.tsx`
- Create: `e2e/product-workflow.spec.ts`
- Create: `playwright.config.ts`

- [ ] **Step 1: Write the failing end-to-end workflow**

```ts
test('imports, edits, charts, annotates, persists, and exports', async ({ page }) => {
  await page.goto('/')
  await page.setInputFiles('input[type=file]', 'src/test/fixtures/product-review.xlsx')
  await expect(page.getByText('15 款产品')).toBeVisible()
  await page.getByRole('tab', { name: '图表制作' }).click()
  await expect(page.locator('[data-product-marker]')).toHaveCount(15)
  await page.reload()
  await expect(page.getByText('15 款产品')).toBeVisible()
})
```

- [ ] **Step 2: Connect all pages to the project store**

Wire import, autosave, validation banners, four-step navigation, chart state, analysis edits, annotations, exports, keyboard undo/redo, and storage warnings into the shell.

- [ ] **Step 3: Add actionable error handling**

Show explicit missing-column lists, invalid-cell links, image placeholders, failed-save recovery actions, storage-quota backup action, and export retry messages. Add an ErrorBoundary that preserves the most recent saved project.

- [ ] **Step 4: Run full automated verification**

Run: `npm run test:run && npm run build && npm run e2e`
Expected: unit/component tests PASS, production build succeeds, and complete workflow PASSes.

- [ ] **Step 5: Run responsive visual verification**

Capture Playwright screenshots at `1440x900`, `1024x768`, and `768x1024`. Verify navigation, table controls, chart markers, labels, dialogs, and export controls do not overlap or clip.

### Task 10: Prepare static deployment and handoff

**Files:**
- Create: `README.md`
- Create: `.gitignore`
- Create: `public/sample-template.xlsx`
- Modify: `vite.config.ts`

- [ ] **Step 1: Document use and data safety**

Explain import requirements, four-step workflow, local-only storage, backup/restore, export formats, browser support, and the warning that clearing browser data removes local projects.

- [ ] **Step 2: Add deployment configuration**

Ensure all assets use relative/static-safe paths and document deployment to a static host. Include the supplied workbook structure as a downloadable clean template without private working data.

- [ ] **Step 3: Run final verification**

Run: `npm run test:run && npm run build && npm run e2e`
Expected: all checks PASS with no console errors.

Serve `dist` locally and import the supplied workbook one final time. Verify 15 products and images, both chart modes, all four periods, annotations, reload persistence, and every export format.

## Plan Self-Review

- Spec coverage: all sections map to Tasks 2–10.
- Missing-value and `2026H1` semantics are explicitly tested in Tasks 2, 3, 6, and 7.
- Embedded Excel images are tested on import and export.
- Local persistence, history, backup, and recovery are covered.
- The approved four-tab layout and full-width chart page are covered.
- No cloud login, scraping, annualization, or opaque generated analysis is introduced.
