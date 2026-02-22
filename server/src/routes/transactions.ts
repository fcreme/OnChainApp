import { Router } from 'express'
import { transactionService } from '../services/TransactionService.js'
import { blockchainSyncService } from '../services/BlockchainSyncService.js'
import { validate } from '../middleware/validation.js'
import {
  ImportClaimsSchema,
  TransactionQuerySchema,
  toTransactionResponse,
} from '../models/Transaction.js'
import { AppError } from '../middleware/errorHandler.js'
import { z } from 'zod'

const router = Router()

// POST /claims — Import off-chain claims
router.post('/claims', validate(ImportClaimsSchema), async (req, res, next) => {
  try {
    const { claims } = req.body
    const actor = (req.headers['x-actor'] as string) || 'system'

    const { imported, failed } = await transactionService.importClaims(claims, actor)

    res.status(201).json({
      success: true,
      data: {
        imported: imported.length,
        failed: failed.length,
        transactions: imported.map(toTransactionResponse),
        errors: failed,
      },
    })
  } catch (err) {
    next(err)
  }
})

// GET /transactions — List with filters + pagination
router.get('/', validate(TransactionQuerySchema, 'query'), async (req, res, next) => {
  try {
    const { transactions, total } = await transactionService.query(req.query as never)
    const query = req.query as { page?: number; limit?: number }
    const page = query.page ?? 1
    const limit = query.limit ?? 50

    res.json({
      success: true,
      data: {
        transactions: transactions.map(toTransactionResponse),
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit),
        },
      },
    })
  } catch (err) {
    next(err)
  }
})

// GET /transactions/stats — Summary statistics
router.get('/stats', async (_req, res, next) => {
  try {
    const stats = await transactionService.getStats()
    res.json({ success: true, data: stats })
  } catch (err) {
    next(err)
  }
})

// GET /transactions/:id — Single transaction
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) throw new AppError(400, 'Invalid transaction ID', 'INVALID_INPUT')

    const tx = await transactionService.getById(id)
    if (!tx) throw new AppError(404, 'Transaction not found', 'NOT_FOUND')

    res.json({ success: true, data: toTransactionResponse(tx) })
  } catch (err) {
    next(err)
  }
})

// POST /sync-anchors — Trigger blockchain sync
const SyncSchema = z.object({
  wallet: z.string().min(42).max(42),
})

router.post('/sync-anchors', validate(SyncSchema), async (req, res, next) => {
  try {
    const { wallet } = req.body
    const result = await blockchainSyncService.syncAnchors(wallet)

    res.json({
      success: true,
      data: result,
    })
  } catch (err) {
    next(err)
  }
})

export default router
