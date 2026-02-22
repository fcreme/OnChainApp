import { useEffect, useState, useCallback } from 'react'
import { Container, Box, Button } from '@mui/material'
import {
  CompareArrows as CompareArrowsIcon,
  PlayArrow as RunIcon,
  Upload as ImportIcon,
  Sync as SyncIcon,
} from '@mui/icons-material'
import { PageHeader, StatCard, FilterBar, FilterBarSearch, HudChip, EmptyState } from './components/HudPrimitives'
import PageTransition from './components/PageTransition'
import SuggestionsTable from './components/reconciliation/SuggestionsTable'
import MatchDetailDrawer from './components/reconciliation/MatchDetailDrawer'
import ClaimsImportDialog from './components/reconciliation/ClaimsImportDialog'
import BatchActionBar from './components/reconciliation/BatchActionBar'
import DriftAlertCard from './components/reconciliation/DriftAlertCard'
import { useReconciliationStore } from '../stores/useReconciliationStore'
import { useDriftStore } from '../stores/useDriftStore'
import { useToastStore } from '../stores/useToastStore'
import type { SuggestionResponse } from '../api/reconciliation'

const statusFilters = ['all', 'pending', 'approved', 'rejected'] as const
const tokenFilters = ['all', 'DAI', 'USDC'] as const

export default function Reconciliation() {
  const {
    suggestions, stats, isLoading, page, totalPages,
    minScore, tokenFilter, statusFilter,
    setMinScore, setTokenFilter, setStatusFilter, setPage,
    fetchSuggestions, fetchStats, runMatching, approve, reject, forceReconcile, batchApprove,
    importClaims, syncAnchors,
  } = useReconciliationStore()

  const { drifts, fetchDrifts } = useDriftStore()
  const { addToast } = useToastStore()

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [drawerSuggestion, setDrawerSuggestion] = useState<SuggestionResponse | null>(null)
  const [importOpen, setImportOpen] = useState(false)

  useEffect(() => {
    fetchSuggestions()
    fetchStats()
    fetchDrifts()
  }, [fetchSuggestions, fetchStats, fetchDrifts])

  useEffect(() => {
    fetchSuggestions()
  }, [page, minScore, tokenFilter, statusFilter, fetchSuggestions])

  const handleRunMatching = useCallback(async () => {
    try {
      const result = await runMatching()
      addToast({ message: `Matching complete: ${result.new_suggestions} new suggestions`, severity: 'success' })
      fetchSuggestions()
      fetchStats()
    } catch {
      addToast({ message: 'Matching failed', severity: 'error' })
    }
  }, [runMatching, addToast, fetchSuggestions, fetchStats])

  const handleSyncAnchors = useCallback(async () => {
    try {
      const result = await syncAnchors()
      addToast({ message: `Synced ${result.imported} anchors from chain`, severity: 'success' })
      fetchStats()
    } catch {
      addToast({ message: 'Sync failed', severity: 'error' })
    }
  }, [syncAnchors, addToast, fetchStats])

  const handleApprove = useCallback(async (s: SuggestionResponse) => {
    try {
      await approve(s.anchor.id, s.claim.id)
      addToast({ message: 'Match approved', severity: 'success' })
      fetchSuggestions()
      fetchStats()
    } catch {
      addToast({ message: 'Approve failed', severity: 'error' })
    }
  }, [approve, addToast, fetchSuggestions, fetchStats])

  const handleReject = useCallback(async (s: SuggestionResponse, reason: string) => {
    try {
      await reject(s.anchor.id, s.claim.id, reason)
      addToast({ message: 'Match rejected', severity: 'success' })
      setDrawerSuggestion(null)
      fetchSuggestions()
      fetchStats()
    } catch {
      addToast({ message: 'Reject failed', severity: 'error' })
    }
  }, [reject, addToast, fetchSuggestions, fetchStats])

  const handleForce = useCallback(async (s: SuggestionResponse) => {
    try {
      await forceReconcile(s.anchor.id, s.claim.id)
      addToast({ message: 'Force reconciled', severity: 'success' })
      setDrawerSuggestion(null)
      fetchSuggestions()
      fetchStats()
    } catch {
      addToast({ message: 'Force reconcile failed', severity: 'error' })
    }
  }, [forceReconcile, addToast, fetchSuggestions, fetchStats])

  const handleBatchApprove = useCallback(async () => {
    const pairs = suggestions
      .filter((s) => selectedIds.has(s.id))
      .map((s) => ({ anchor_id: s.anchor.id, claim_id: s.claim.id }))
    try {
      const result = await batchApprove(pairs)
      addToast({ message: `Batch: ${result.approved} approved, ${result.failed} failed`, severity: 'success' })
      setSelectedIds(new Set())
      fetchSuggestions()
      fetchStats()
    } catch {
      addToast({ message: 'Batch approve failed', severity: 'error' })
    }
  }, [suggestions, selectedIds, batchApprove, addToast, fetchSuggestions, fetchStats])

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const criticalDrifts = drifts.filter((d) => d.alert_level === 'critical' || d.alert_level === 'warning')

  return (
    <PageTransition>
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 }, position: 'relative', zIndex: 1 }}>
        <PageHeader
          icon={<CompareArrowsIcon sx={{ fontSize: '1rem', color: '#14B8A6' }} />}
          title="Reconciliation"
          subtitle="Match on-chain anchors to off-chain claims"
        />

        {/* Drift alerts ribbon */}
        {criticalDrifts.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1.5, mb: 3, overflowX: 'auto', pb: 0.5 }}>
            {criticalDrifts.slice(0, 3).map((d) => (
              <Box key={`${d.wallet_address}-${d.token_symbol}`} sx={{ minWidth: 280, flex: '0 0 auto' }}>
                <DriftAlertCard drift={d} />
              </Box>
            ))}
          </Box>
        )}

        {/* Stats */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
          <StatCard label="Total Anchors" count={stats?.total_anchors ?? '-'} color="#14B8A6" index={0} />
          <StatCard label="Pending Claims" count={stats?.pending_claims ?? '-'} color="#ffb347" index={1} />
          <StatCard label="Reconciled" count={stats?.reconciled ?? '-'} color="#a4cf5e" index={2} />
          <StatCard label="Match Rate" count={stats ? `${((stats.reconciled / Math.max(stats.total_anchors, 1)) * 100).toFixed(0)}%` : '-'} color="#8b5cf6" index={3} />
        </Box>

        {/* Actions bar */}
        <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<RunIcon sx={{ fontSize: '0.9rem !important' }} />}
            onClick={handleRunMatching}
            sx={{ fontSize: '0.8rem', bgcolor: '#14B8A6', '&:hover': { bgcolor: '#0f9a87' } }}
          >
            Run Matching
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<SyncIcon sx={{ fontSize: '0.9rem !important' }} />}
            onClick={handleSyncAnchors}
            sx={{ fontSize: '0.8rem' }}
          >
            Sync Anchors
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ImportIcon sx={{ fontSize: '0.9rem !important' }} />}
            onClick={() => setImportOpen(true)}
            sx={{ fontSize: '0.8rem' }}
          >
            Import Claims
          </Button>
        </Box>

        {/* Filters */}
        <FilterBar>
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            {statusFilters.map((s) => (
              <HudChip
                key={s}
                label={s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                active={statusFilter === (s === 'all' ? undefined : s)}
                onClick={() => setStatusFilter(s === 'all' ? undefined : s)}
              />
            ))}
          </Box>
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            {tokenFilters.map((t) => (
              <HudChip
                key={t}
                label={t === 'all' ? 'All Tokens' : t}
                active={tokenFilter === (t === 'all' ? undefined : t)}
                onClick={() => setTokenFilter(t === 'all' ? undefined : t)}
              />
            ))}
          </Box>
          <FilterBarSearch
            value={String(minScore)}
            onChange={(v) => setMinScore(Number(v) || 0)}
            placeholder="Min score..."
          />
        </FilterBar>

        {/* Suggestions list */}
        {!isLoading && suggestions.length === 0 ? (
          <EmptyState
            message="No suggestions yet"
            submessage="Import claims and run the matching engine to generate match suggestions."
          />
        ) : (
          <SuggestionsTable
            suggestions={suggestions}
            isLoading={isLoading}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            onRowClick={(s) => setDrawerSuggestion(s)}
            onApprove={handleApprove}
            onReject={(s) => handleReject(s, '')}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
          />
        )}
      </Container>

      {/* Detail drawer */}
      <MatchDetailDrawer
        suggestion={drawerSuggestion}
        open={!!drawerSuggestion}
        onClose={() => setDrawerSuggestion(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        onForce={handleForce}
      />

      {/* Batch action bar */}
      <BatchActionBar
        count={selectedIds.size}
        onApproveAll={handleBatchApprove}
        onClear={() => setSelectedIds(new Set())}
      />

      {/* Import dialog */}
      <ClaimsImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={async (claims) => {
          const result = await importClaims(claims)
          fetchStats()
          return result
        }}
      />
    </PageTransition>
  )
}
