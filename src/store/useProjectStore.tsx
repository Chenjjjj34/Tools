import { createContext, useContext, useMemo, useReducer } from 'react'
import type { Project } from '../domain/project'
import { projectRepository } from '../features/storage/projectRepository'
type Action = { type: 'set'; project: Project } | { type: 'update'; update: Partial<Project> } | { type: 'undo' } | { type: 'redo' }
interface State { project?: Project; past: Project[]; future: Project[] }
function reducer(state: State, action: Action): State { if (action.type === 'set') return { project: action.project, past: [], future: [] }; if (!state.project) return state; if (action.type === 'update') { const project = { ...state.project, ...action.update, updatedAt: new Date().toISOString() }; void projectRepository.save(project); return { project, past: [...state.past.slice(-19), state.project], future: [] } } if (action.type === 'undo' && state.past.length) { const project = state.past.at(-1)!; return { project, past: state.past.slice(0,-1), future: [state.project, ...state.future] } } if (action.type === 'redo' && state.future.length) { const project = state.future[0]; return { project, past: [...state.past, state.project], future: state.future.slice(1) } } return state }
const ProjectContext = createContext<{ state: State; dispatch: React.Dispatch<Action> } | null>(null)
export function ProjectProvider({ children }: { children: React.ReactNode }) { const [state, dispatch] = useReducer(reducer, { past: [], future: [] }); const value = useMemo(() => ({ state, dispatch }), [state]); return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider> }
export function useProjectStore() { const value = useContext(ProjectContext); if (!value) throw new Error('ProjectProvider is required'); return value }
