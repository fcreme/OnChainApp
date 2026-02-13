import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock DOM APIs used by csvExport
beforeEach(() => {
  vi.resetModules()
  // Mock URL.createObjectURL / revokeObjectURL
  global.URL.createObjectURL = vi.fn(() => 'blob:test')
  global.URL.revokeObjectURL = vi.fn()

  // Mock link element click/append/remove
  const mockLink = {
    href: '',
    download: '',
    click: vi.fn(),
  }
  vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLElement)
  vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node)
  vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node)
})

describe('exportEventsToCSV', () => {
  it('generates correct headers', async () => {
    const blobSpy = vi.fn()
    global.Blob = vi.fn((parts) => {
      blobSpy(parts?.[0])
      return {} as Blob
    }) as unknown as typeof Blob

    const { exportEventsToCSV } = await import('../csvExport')
    exportEventsToCSV([])

    const csv = blobSpy.mock.calls[0][0] as string
    expect(csv.startsWith('Type,Token,Amount,From,To,Transaction Hash')).toBe(true)
  })

  it('includes event data in rows', async () => {
    const blobSpy = vi.fn()
    global.Blob = vi.fn((parts) => {
      blobSpy(parts?.[0])
      return {} as Blob
    }) as unknown as typeof Blob

    const { exportEventsToCSV } = await import('../csvExport')
    exportEventsToCSV([
      {
        type: 'Transfer',
        token: 'DAI',
        amount: '10',
        from: '0xabc',
        to: '0xdef',
        tx: '0x123',
      },
    ])

    const csv = blobSpy.mock.calls[0][0] as string
    const lines = csv.split('\n')
    expect(lines).toHaveLength(2)
    expect(lines[1]).toContain('"Transfer"')
    expect(lines[1]).toContain('"DAI"')
    expect(lines[1]).toContain('"10"')
    expect(lines[1]).toContain('"0xabc"')
    expect(lines[1]).toContain('"0xdef"')
    expect(lines[1]).toContain('"0x123"')
  })

  it('handles empty from/to', async () => {
    const blobSpy = vi.fn()
    global.Blob = vi.fn((parts) => {
      blobSpy(parts?.[0])
      return {} as Blob
    }) as unknown as typeof Blob

    const { exportEventsToCSV } = await import('../csvExport')
    exportEventsToCSV([
      {
        type: 'Mint',
        token: 'USDC',
        amount: '5',
        tx: '0xaaa',
      },
    ])

    const csv = blobSpy.mock.calls[0][0] as string
    const lines = csv.split('\n')
    // from and to should be empty strings in quotes
    expect(lines[1]).toContain('""')
  })
})
