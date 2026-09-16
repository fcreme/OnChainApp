import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import { sepolia } from 'wagmi/chains'
import { theme } from '../../theme'
import { useAppStore } from '../store/useAppStore'
import ActionsForm from './ActionsForm'

// src/lib/web3 builds a live wagmi config and boots the WalletConnect/AppKit
// modal (a real HTTP call) at import time. ConfirmDialog pulls it in, so stub
// the one export it uses — wallet/RPC wiring is genuinely external.
vi.mock('../../lib/web3', () => ({ config: {} }))

// useAppStore is mocked globally in src/setupTests.ts; drive it per test.
const mockUseAppStore = useAppStore as unknown as Mock

const RECIPIENT = '0x1234567890123456789012345678901234567890'

type StoreOverrides = {
  approve?: Mock
  transfer?: Mock
  mint?: Mock
  transactionStatus?: string
  isConnected?: boolean
  chainId?: number
}

function setStore(overrides: StoreOverrides = {}) {
  const full = {
    approve: vi.fn(),
    transfer: vi.fn(),
    mint: vi.fn(),
    transactionStatus: 'idle',
    isConnected: true,
    chainId: sepolia.id,
    ...overrides,
  }
  mockUseAppStore.mockImplementation((selector?: (s: typeof full) => unknown) =>
    selector ? selector(full) : full
  )
  return full
}

function renderForm() {
  return render(
    <ThemeProvider theme={theme}>
      <ActionsForm />
    </ThemeProvider>
  )
}

function actionButtons() {
  return {
    approve: screen.getByRole('button', { name: 'Approve' }),
    transfer: screen.getByRole('button', { name: 'Transfer' }),
    mint: screen.getByRole('button', { name: 'Mint' }),
  }
}

async function confirmDialog() {
  const dialog = await screen.findByRole('dialog')
  return dialog
}

describe('ActionsForm', () => {
  beforeEach(() => {
    setStore()
  })

  it('renders the token, amount and address controls with DAI preselected', () => {
    renderForm()

    expect(screen.getByRole('combobox')).toHaveTextContent('DAI')
    expect(screen.getByPlaceholderText('Amount')).toHaveValue('')
    expect(screen.getByPlaceholderText('Address (spender or recipient)')).toHaveValue('')

    const buttons = actionButtons()
    expect(buttons.approve).toBeInTheDocument()
    expect(buttons.transfer).toBeInTheDocument()
    expect(buttons.mint).toBeInTheDocument()
  })

  it('offers the built-in tokens in the token select', () => {
    renderForm()

    fireEvent.mouseDown(screen.getByRole('combobox'))

    const options = screen.getAllByRole('option')
    expect(options.map((o) => o.textContent)).toEqual(['DAI', 'USDC'])
  })

  it('asks the user to connect and blocks every action while disconnected', () => {
    setStore({ isConnected: false })

    renderForm()

    expect(
      screen.getByText('Please connect your wallet to interact with the contracts')
    ).toBeInTheDocument()
    const buttons = actionButtons()
    expect(buttons.approve).toBeDisabled()
    expect(buttons.transfer).toBeDisabled()
    expect(buttons.mint).toBeDisabled()
  })

  it('asks the user to switch network and blocks every action off Sepolia', () => {
    setStore({ isConnected: true, chainId: 1 })

    renderForm()

    expect(
      screen.getByText('Please switch to Sepolia network to interact with the contracts')
    ).toBeInTheDocument()
    const buttons = actionButtons()
    expect(buttons.approve).toBeDisabled()
    expect(buttons.transfer).toBeDisabled()
    expect(buttons.mint).toBeDisabled()
  })

  it('enables every action once connected to Sepolia', () => {
    renderForm()

    expect(
      screen.queryByText('Please connect your wallet to interact with the contracts')
    ).not.toBeInTheDocument()
    const buttons = actionButtons()
    expect(buttons.approve).toBeEnabled()
    expect(buttons.transfer).toBeEnabled()
    expect(buttons.mint).toBeEnabled()
  })

  it('blocks every action while a transaction is pending', () => {
    setStore({ transactionStatus: 'pending' })

    renderForm()

    const buttons = actionButtons()
    expect(buttons.approve).toBeDisabled()
    expect(buttons.transfer).toBeDisabled()
    expect(buttons.mint).toBeDisabled()
  })

  it('confirms an approval before sending it, then clears the form', async () => {
    const store = setStore()

    renderForm()

    fireEvent.change(screen.getByPlaceholderText('Amount'), { target: { value: '100' } })
    fireEvent.change(screen.getByPlaceholderText('Address (spender or recipient)'), {
      target: { value: RECIPIENT },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }))

    const dialog = await confirmDialog()
    expect(within(dialog).getByText('Confirm Approve')).toBeInTheDocument()
    expect(within(dialog).getByText('Spender')).toBeInTheDocument()
    expect(within(dialog).getByText('0x1234...7890')).toBeInTheDocument()
    expect(store.approve).not.toHaveBeenCalled()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }))

    await waitFor(() => {
      expect(store.approve).toHaveBeenCalledWith('DAI', RECIPIENT, '100')
    })
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Amount')).toHaveValue('')
    })
    expect(screen.getByPlaceholderText('Address (spender or recipient)')).toHaveValue('')
  })

  it('transfers the entered amount to the entered address after confirmation', async () => {
    const store = setStore()

    renderForm()

    fireEvent.change(screen.getByPlaceholderText('Amount'), { target: { value: '50' } })
    fireEvent.change(screen.getByPlaceholderText('Address (spender or recipient)'), {
      target: { value: RECIPIENT },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Transfer' }))

    const dialog = await confirmDialog()
    expect(within(dialog).getByText('Recipient')).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }))

    await waitFor(() => {
      expect(store.transfer).toHaveBeenCalledWith('DAI', RECIPIENT, '50')
    })
  })

  it('mints without requiring an address', async () => {
    const store = setStore()

    renderForm()

    fireEvent.change(screen.getByPlaceholderText('Amount'), { target: { value: '1000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Mint' }))

    const dialog = await confirmDialog()
    expect(within(dialog).queryByText('Recipient')).not.toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }))

    await waitFor(() => {
      expect(store.mint).toHaveBeenCalledWith('DAI', '1000')
    })
  })

  it('abandons the action when the confirmation is cancelled', async () => {
    const store = setStore()

    renderForm()

    fireEvent.change(screen.getByPlaceholderText('Amount'), { target: { value: '100' } })
    fireEvent.change(screen.getByPlaceholderText('Address (spender or recipient)'), {
      target: { value: RECIPIENT },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }))

    const dialog = await confirmDialog()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    expect(store.approve).not.toHaveBeenCalled()
    expect(screen.getByPlaceholderText('Amount')).toHaveValue('100')
  })

  it('refuses a non-positive amount with a visible error instead of submitting', async () => {
    const store = setStore()

    renderForm()

    fireEvent.change(screen.getByPlaceholderText('Amount'), { target: { value: '0' } })
    fireEvent.change(screen.getByPlaceholderText('Address (spender or recipient)'), {
      target: { value: RECIPIENT },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }))

    const dialog = await confirmDialog()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }))

    expect(
      await screen.findByText('Please enter a valid amount greater than 0')
    ).toBeInTheDocument()
    expect(store.approve).not.toHaveBeenCalled()
  })

  it('refuses a malformed address with a visible error instead of submitting', async () => {
    const store = setStore()

    renderForm()

    fireEvent.change(screen.getByPlaceholderText('Amount'), { target: { value: '10' } })
    fireEvent.change(screen.getByPlaceholderText('Address (spender or recipient)'), {
      target: { value: '0xnot-an-address' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Transfer' }))

    const dialog = await confirmDialog()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }))

    expect(
      await screen.findByText('Invalid address. Must start with 0x and have 42 characters')
    ).toBeInTheDocument()
    expect(store.transfer).not.toHaveBeenCalled()
  })
})
