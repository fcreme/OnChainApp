import { describe, it, expect } from 'vitest'
import { db } from '../../config/database.js'

describe('test database', () => {
  it('has the reconciliation schema from the migrations', async () => {
    const rows = await db.map(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' ORDER BY table_name`,
      [],
      (r: { table_name: string }) => r.table_name,
    )
    expect(rows).toEqual([
      'audit_log',
      'match_suggestions',
      'matching_config',
      'rejected_pairs',
      'transactions',
      'wallet_balances',
      'wallet_risk_scores',
    ])
  })
})
