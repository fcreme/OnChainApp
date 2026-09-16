import { db } from '../config/database.js'
import { DEFAULT_DRIFT_THRESHOLDS, DEFAULT_TOLERANCES, DEFAULT_WEIGHTS } from '../config/constants.js'
import type { TransactionRow } from '../models/Transaction.js'

// Empties every data table and restores the default matching config.
// Call from beforeEach in any test that reads or writes the database.
export async function resetDatabase(): Promise<void> {
  await db.none(
    `TRUNCATE transactions, match_suggestions, rejected_pairs, audit_log,
       wallet_balances, wallet_risk_scores
     RESTART IDENTITY CASCADE`,
  )
  await db.none('DELETE FROM matching_config')
  await db.none(
    `INSERT INTO matching_config (key, value) VALUES
       ('weights', $1), ('tolerances', $2), ('drift_thresholds', $3)`,
    [JSON.stringify(DEFAULT_WEIGHTS), JSON.stringify(DEFAULT_TOLERANCES), JSON.stringify(DEFAULT_DRIFT_THRESHOLDS)],
  )
}

export const WALLET_A = '0x1111111111111111111111111111111111111111'
export const WALLET_B = '0x2222222222222222222222222222222222222222'

type TxFields = Partial<
  Pick<
    TransactionRow,
    | 'tx_hash' | 'source' | 'status' | 'type' | 'token_symbol' | 'token_address'
    | 'amount_gross' | 'amount_net' | 'gas_used' | 'sender_address' | 'receiver_address'
    | 'timestamp' | 'block_number' | 'matched_tx_id'
  >
>

let hashCounter = 0
function nextHash(): string {
  hashCounter += 1
  return `0x${hashCounter.toString(16).padStart(64, '0')}`
}

async function insertTransaction(fields: Required<Pick<TxFields, 'source' | 'status'>> & TxFields): Promise<TransactionRow> {
  return db.one<TransactionRow>(
    `INSERT INTO transactions
       (tx_hash, source, status, type, token_symbol, token_address, amount_gross, amount_net,
        gas_used, sender_address, receiver_address, timestamp, block_number, matched_tx_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     RETURNING *`,
    [
      fields.tx_hash ?? nextHash(),
      fields.source,
      fields.status,
      fields.type ?? 'Transfer',
      fields.token_symbol ?? 'DAI',
      fields.token_address ?? null,
      fields.amount_gross ?? '100',
      fields.amount_net ?? null,
      fields.gas_used ?? null,
      fields.sender_address === undefined ? WALLET_A : fields.sender_address,
      fields.receiver_address === undefined ? WALLET_B : fields.receiver_address,
      fields.timestamp ?? '1700000000000',
      fields.block_number ?? null,
      fields.matched_tx_id ?? null,
    ],
  )
}

// An on-chain anchor: DAI Transfer of 100 from WALLET_A to WALLET_B unless overridden.
export function insertAnchor(fields: TxFields = {}): Promise<TransactionRow> {
  return insertTransaction({ ...fields, source: 'onchain', status: fields.status ?? 'anchor' })
}

// An off-chain claim with the same defaults as insertAnchor, so the pair matches.
export function insertClaim(fields: TxFields = {}): Promise<TransactionRow> {
  return insertTransaction({ ...fields, source: fields.source ?? 'manual', status: fields.status ?? 'pending' })
}

export function getTransaction(id: number): Promise<TransactionRow> {
  return db.one<TransactionRow>('SELECT * FROM transactions WHERE id = $1', [id])
}
