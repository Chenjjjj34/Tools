import { useState } from 'react'
import type { Project } from './domain/project'
import { analyzeProducts } from './features/analysis/analyzeProject'
import { importWorkbook } from './features/import/xlsxImporter'
import { ChartPage } from './pages/ChartPage'
import { DataEditorPage } from './pages/DataEditorPage'

const steps = ['数据编辑', '图表制作', '分析与标注', '导出']

export default function App() {
  const [active, setActive] = useState(0)
  const [project, setProject] = useState<Project | null>(null)
  const [error, setError] = useState('')

  async function load(file?: File) {
    if (!file) return
    try {
      setError('')
      setProject(await importWorkbook(file))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Excel 导入失败')
    }
  }

  return <div className="app-shell">
    <header className="topbar">
      <div><div className="eyebrow">PRODUCT INTELLIGENCE</div><h1>产品上架图</h1></div>
      <label className="file-button" role="button">导入 Excel<input type="file" accept=".xlsx" onChange={(event) => load(event.target.files?.[0])} /></label>
    </header>
    <nav className="stepper" aria-label="工作流程">{steps.map((step, index) => <button className={index === active ? 'step active' : 'step'} role="tab" aria-selected={index === active} onClick={() => setActive(index)} key={step}>{index + 1} {step}</button>)}</nav>
    <main className="page">
      <section className="page-heading"><h2>{steps[active]}</h2><span className="count-chip">{project?.products.length ?? 0} 款产品</span></section>
      {error && <div className="error-banner">{error}</div>}
      {!project ? <section className="empty-state"><h3>导入产品数据</h3><p>选择包含产品图片、SKU、上架年月、销量和售价的 Excel 文件。</p><label className="primary" role="button">选择 Excel 文件<input type="file" accept=".xlsx" onChange={(event) => load(event.target.files?.[0])} /></label></section>
        : active === 0 ? <DataEditorPage products={project.products} onChange={(products) => setProject({ ...project, products, updatedAt: new Date().toISOString() })} />
        : active === 1 ? <ChartPage products={project.products} />
        : active === 2 ? <section className="analysis-list">{analyzeProducts(project.products).map((insight) => <article className="insight" key={insight.id}><h3>{insight.title}</h3><p>{insight.text}</p></article>)}</section>
        : <section className="export-panel"><button onClick={() => downloadProject(project)}>导出项目备份</button></section>}
    </main>
  </div>
}

function downloadProject(project: Project) {
  const anchor = document.createElement('a')
  anchor.href = URL.createObjectURL(new Blob([JSON.stringify(project)], { type: 'application/json' }))
  anchor.download = 'product-chart-project.json'
  anchor.click()
}
