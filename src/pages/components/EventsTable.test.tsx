import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import { theme } from '../../theme'
import { useAppStore, type AppEvent } from '../store/useAppStore'
import EventsTable from './EventsTable'

// src/lib/web3 builds a live wagmi config and boots the WalletConnect/AppKit
// modal (a real HTTP call) at import time. TransactionDetailDrawer pulls it in,
// so stub the one export it uses — wallet/RPC wiring is genuinely external.
vi.mock('../../lib/web3', () => ({ config: {} }))

// useAppStore is mocked globally in src/setupTests.ts; drive it per test.
const mockUseAppStore = useAppStore as unknown as Mock

function setStore(state: { events: AppEvent[]; isLoadingEvents?: boolean }) {
  const full = { isLoadingEvents: false, ...state }
  mockUseAppStore.mockImplementation((selector?: (s: typeof full) => unknown) =>
    selector ? selector(full) : full
  )
}

function makeEvent(overrides: Partial<AppEvent> = {}): AppEvent {
  return {
    type: 'Transfer',
    token: 'DAI',
    amount: '1',
    from: '0x1111111111111111111111111111111111111111',
    to: '0x2222222222222222222222222222222222222222',
    tx: '0xaaaaaaaaaa1111111111111111111111111111111111111111111111111111aa',
    ...overrides,
  }
}

function renderTable() {
  return render(
    <ThemeProvider theme={theme}>
      <EventsTable />
    </ThemeProvider>
  )
}

describe('EventsTable', () => {
  beforeEach(() => {
    setStore({ events: [] })
  })

  it('invites the user to make a transaction when there are no events', () => {
    renderTable()

    expect(screen.getByText('No events yet')).toBeInTheDocument()
    expect(
      screen.getByText('Perform a transfer, approval, or mint to see events here')
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /view all/i })).not.toBeInTheDocument()
  })

  it('shows placeholders instead of the empty state while the first events load', () => {
    setStore({ events: [], isLoadingEvents: true })

    renderTable()

    expect(screen.getByText('Recent Events')).toBeInTheDocument()
    expect(screen.queryByText('No events yet')).not.toBeInTheDocument()
  })

  it('summarises the events by type', () => {
    setStore({
      events: [
        makeEvent({ type: 'Transfer' }),
        makeEvent({ type: 'Transfer' }),
        makeEvent({ type: 'Approval', token: 'USDC' }),
        makeEvent({ type: 'Mint' }),
      ],
    })

    renderTable()

    expect(screen.getByText('2 transfers')).toBeInTheDocument()
    expect(screen.getByText('1 approvals')).toBeInTheDocument()
    expect(screen.getByText('1 mints')).toBeInTheDocument()
  })

  it('previews only the three newest events, newest first', () => {
    setStore({
      events: [
        makeEvent({ amount: '1' }),
        makeEvent({ amount: '2' }),
        makeEvent({ amount: '3' }),
        makeEvent({ amount: '4' }),
      ],
    })

    renderTable()

    const previewed = screen.getAllByText(/^\d+ DAI$/).map((el) => el.textContent)
    expect(previewed).toEqual(['4 DAI', '3 DAI', '2 DAI'])
  })

  it('lists every event in a table when "View all" is clicked', () => {
    setStore({
      events: [
        makeEvent({ amount: '10', tx: '0xfeed0000000000000000000000000000000000000000000000000000000000ff' }),
        makeEvent({
          type: 'Approval',
          token: 'USDC',
          amount: '20',
          tx: '0xbeef1111000000000000000000000000000000000000000000000000000000ff',
        }),
      ],
    })

    renderTable()
    fireEvent.click(screen.getByRole('button', { name: /view all/i }))

    for (const header of ['Type', 'Token', 'Amount', 'From', 'To', 'Tx', 'Date']) {
      expect(screen.getByRole('columnheader', { name: header })).toBeInTheDocument()
    }

    const rows = screen.getAllByRole('row')
    expect(rows).toHaveLength(3) // header + one row per event

    // Newest event first
    expect(within(rows[1]).getByText('Approval')).toBeInTheDocument()
    expect(within(rows[1]).getByText('20')).toBeInTheDocument()
    expect(within(rows[2]).getByText('Transfer')).toBeInTheDocument()
    expect(within(rows[2]).getByText('10')).toBeInTheDocument()

    const txLink = within(rows[2]).getByRole('link', { name: '0xfeed0000...' })
    expect(txLink).toHaveAttribute(
      'href',
      'https://sepolia.etherscan.io/tx/0xfeed0000000000000000000000000000000000000000000000000000000000ff'
    )
    expect(txLink).toHaveAttribute('target', '_blank')
  })

  it('shortens addresses in the table', () => {
    const event = makeEvent({ amount: '7' })
    setStore({ events: [event] })

    renderTable()
    fireEvent.click(screen.getByRole('button', { name: /view all/i }))

    expect(screen.getByText('0x1111...1111')).toBeInTheDocument()
    expect(screen.getByText('0x2222...2222')).toBeInTheDocument()
    expect(screen.queryByText(event.from as string)).not.toBeInTheDocument()
  })

  it('opens the transaction details panel for a previewed event', () => {
    const event = makeEvent({ amount: '42' })
    setStore({ events: [event] })

    renderTable()
    expect(screen.queryByText('Transaction Details')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('42 DAI'))

    expect(screen.getByText('Transaction Details')).toBeInTheDocument()
    expect(screen.getByText(event.from as string)).toBeInTheDocument()
    expect(screen.getByText(event.tx)).toBeInTheDocument()
  })
})
