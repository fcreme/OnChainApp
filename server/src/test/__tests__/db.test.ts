import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../../config/database.js'
import { resetDatabase, insertAnchor, insertClaim } from '../db.js'

describe('test database helpers', () => {
  beforeEach(resetDatabase)

  it('inserts an anchor and a claim that describe the same transfer', async () => {
    const anchor = await insertAnchor()
    const claim = await insertClaim()

    expect(anchor).toMatchObject({ source: 'onchain', status: 'anchor', type: 'Transfer', token_symbol: 'DAI' })
    expect(claim).toMatchObject({ source: 'manual', status: 'pending', type: 'Transfer', token_symbol: 'DAI' })
    expect(Number(claim.amount_gross)).toBe(Number(anchor.amount_gross))
    expect(claim.sender_address).toBe(anchor.sender_address)
    expect(claim.receiver_address).toBe(anchor.receiver_address)
    expect(claim.tx_hash).not.toBe(anchor.tx_hash)
  })

  it('starts each test from empty tables and the default config', async () => {
    await insertAnchor()
    await db.none(`UPDATE matching_config SET value = '{"amount": 1}' WHERE key = 'weights'`)

    await resetDatabase()

    const { count } = await db.one<{ count: string }>('SELECT COUNT(*) AS count FROM transactions')
    const weights = await db.one<{ value: unknown }>(`SELECT value FROM matching_config WHERE key = 'weights'`)
    expect(Number(count)).toBe(0)
    expect(weights.value).toEqual({ amount: 40, address: 30, time: 20, token: 10 })
    expect((await insertAnchor()).id).toBe(1)
  })
})
