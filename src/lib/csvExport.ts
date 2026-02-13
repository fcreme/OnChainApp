import type { AppEvent } from '../pages/store/useAppStore'

export function exportEventsToCSV(events: AppEvent[]) {
  const headers = ['Type', 'Token', 'Amount', 'From', 'To', 'Transaction Hash']
  const rows = events.map(e => [
    e.type,
    e.token,
    e.amount,
    e.from || '',
    e.to || '',
    e.tx
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(field => `"${field}"`).join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const date = new Date().toISOString().split('T')[0]

  const link = document.createElement('a')
  link.href = url
  link.download = `onchain-history-${date}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
