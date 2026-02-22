import { create } from 'zustand'
import { fetchAuditLogs } from '../api/audit'
import type { AuditLogResponse } from '../api/audit'

interface AuditState {
  logs: AuditLogResponse[]
  isLoading: boolean
  page: number
  totalPages: number
  total: number
  actionFilter: string | undefined
  entityFilter: string | undefined
  actorFilter: string | undefined

  fetchLogs: () => Promise<void>
  setPage: (page: number) => void
  setActionFilter: (action: string | undefined) => void
  setEntityFilter: (entity: string | undefined) => void
  setActorFilter: (actor: string | undefined) => void
}

export const useAuditStore = create<AuditState>((set, get) => ({
  logs: [],
  isLoading: false,
  page: 1,
  totalPages: 1,
  total: 0,
  actionFilter: undefined,
  entityFilter: undefined,
  actorFilter: undefined,

  fetchLogs: async () => {
    const { page, actionFilter, entityFilter, actorFilter } = get()
    set({ isLoading: true })
    try {
      const result = await fetchAuditLogs({
        page,
        limit: 30,
        action: actionFilter || undefined,
        entity_type: entityFilter || undefined,
        actor: actorFilter || undefined,
      })
      set({
        logs: result.logs,
        total: result.pagination.total,
        totalPages: result.pagination.total_pages,
      })
    } catch {
      // Silent fail
    } finally {
      set({ isLoading: false })
    }
  },

  setPage: (page) => { set({ page }); get().fetchLogs() },
  setActionFilter: (actionFilter) => { set({ actionFilter, page: 1 }); get().fetchLogs() },
  setEntityFilter: (entityFilter) => { set({ entityFilter, page: 1 }); get().fetchLogs() },
  setActorFilter: (actorFilter) => { set({ actorFilter, page: 1 }); get().fetchLogs() },
}))
