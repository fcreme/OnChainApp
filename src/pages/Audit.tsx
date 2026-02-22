import { useEffect } from 'react'
import { Container, Box } from '@mui/material'
import { Receipt as ReceiptIcon } from '@mui/icons-material'
import { PageHeader, FilterBar, HudChip, EmptyState } from './components/HudPrimitives'
import PageTransition from './components/PageTransition'
import AuditLogTable from './components/audit/AuditLogTable'
import { useAuditStore } from '../stores/useAuditStore'

const actionFilters = ['all', 'create_claim', 'suggest_match', 'approve_match', 'reject_match', 'force_reconcile'] as const

export default function Audit() {
  const {
    logs, isLoading, page, totalPages,
    actionFilter, setActionFilter, setPage,
    fetchLogs,
  } = useAuditStore()

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    fetchLogs()
  }, [page, actionFilter, fetchLogs])

  return (
    <PageTransition>
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 }, position: 'relative', zIndex: 1 }}>
        <PageHeader
          icon={<ReceiptIcon sx={{ fontSize: '1rem', color: '#14B8A6' }} />}
          title="Audit Trail"
          subtitle="Append-only log of all reconciliation actions"
        />

        {/* Filters */}
        <FilterBar>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            {actionFilters.map((a) => (
              <HudChip
                key={a}
                label={a === 'all' ? 'All Actions' : a.replace(/_/g, ' ')}
                active={actionFilter === (a === 'all' ? undefined : a)}
                onClick={() => setActionFilter(a === 'all' ? undefined : a)}
              />
            ))}
          </Box>
        </FilterBar>

        {/* Log table */}
        {!isLoading && logs.length === 0 ? (
          <EmptyState
            message="No audit entries"
            submessage="Actions like importing claims, running matching, and approving matches will appear here."
          />
        ) : (
          <AuditLogTable
            logs={logs}
            isLoading={isLoading}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </Container>
    </PageTransition>
  )
}
