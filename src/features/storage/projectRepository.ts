import Dexie, { type Table } from 'dexie'
import type { Project } from '../../domain/project'

interface ProjectRecord extends Project { key: string }
interface SnapshotRecord { id?: number; projectId: string; project: Project; createdAt: string }
class ProjectDatabase extends Dexie {
  projects!: Table<ProjectRecord, string>
  snapshots!: Table<SnapshotRecord, number>
  constructor() { super('product-chart-tool'); this.version(1).stores({ projects: 'key,updatedAt', snapshots: '++id,projectId,createdAt' }) }
}
export const projectDb = new ProjectDatabase()
export const projectRepository = {
  async save(project: Project) { await projectDb.projects.put({ ...project, key: project.id }); return project },
  async load(id: string) { const record = await projectDb.projects.get(id); if (!record) return undefined; const { key: _key, ...project } = record; return project },
  async saveSnapshot(project: Project) { await projectDb.snapshots.add({ projectId: project.id, project, createdAt: new Date().toISOString() }); const rows = await projectDb.snapshots.where('projectId').equals(project.id).sortBy('createdAt'); if (rows.length > 10) await projectDb.snapshots.bulkDelete(rows.slice(0, rows.length - 10).map((row) => row.id!)) },
  async listSnapshots(projectId: string) { return projectDb.snapshots.where('projectId').equals(projectId).reverse().sortBy('createdAt') },
}
