import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCopyToClipboard } from '../useCopyToClipboard'

describe('useCopyToClipboard', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with null copiedText', () => {
    const { result } = renderHook(() => useCopyToClipboard())
    expect(result.current.copiedText).toBeNull()
  })

  it('copies text and sets copiedText', async () => {
    const { result } = renderHook(() => useCopyToClipboard())
    await act(async () => {
      await result.current.copy('hello')
    })
    expect(result.current.copiedText).toBe('hello')
  })

  it('resets copiedText after delay', async () => {
    const { result } = renderHook(() => useCopyToClipboard(1000))
    await act(async () => {
      await result.current.copy('hello')
    })
    expect(result.current.copiedText).toBe('hello')

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current.copiedText).toBeNull()
  })
})
