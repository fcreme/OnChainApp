import { Router } from 'express'
import { matchingEngine } from '../services/MatchingEngine.js'
import { reconciliationService } from '../services/ReconciliationService.js'
import { validate } from '../middleware/validation.js'
import {
  SuggestionQuerySchema,
  ReconcileSchema,
  RejectSchema,
  RunMatchingSchema,
  BatchReconcileSchema,
} from '../models/Suggestion.js'
import { toTransactionResponse } from '../models/Transaction.js'

const router = Router()

// GET /suggestions — List match suggestions
router.get('/suggestions', validate(SuggestionQuerySchema, 'query'), async (req, res, next) => {
  try {
    const { suggestions, total } = await reconciliationService.getSuggestions(
      req.query as never,
    )
    const query = req.query as { page?: number; limit?: number }
    const page = query.page ?? 1
    const limit = query.limit ?? 50

    res.json({
      success: true,
      data: {
        suggestions: suggestions.map((s) => ({
          ...s,
          anchor: toTransactionResponse(s.anchor),
          claim: toTransactionResponse(s.claim),
        })),
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

// POST /run-matching — Trigger matching engine
router.post('/run-matching', validate(RunMatchingSchema), async (req, res, next) => {
  try {
    const { token, min_score } = req.body
    const result = await matchingEngine.generateSuggestions(token, min_score)

    res.json({
      success: true,
      data: result,
    })
  } catch (err) {
    next(err)
  }
})

// POST /reconcile — Approve a match
router.post('/reconcile', validate(ReconcileSchema), async (req, res, next) => {
  try {
    const { anchor_id, claim_id, force, actor } = req.body
    const { anchor, claim } = await reconciliationService.approve(
      anchor_id, claim_id, actor, force,
    )

    res.json({
      success: true,
      data: {
        anchor: toTransactionResponse(anchor),
        claim: toTransactionResponse(claim),
      },
    })
  } catch (err) {
    next(err)
  }
})

// POST /reject — Reject a match
router.post('/reject', validate(RejectSchema), async (req, res, next) => {
  try {
    const { anchor_id, claim_id, reason, actor } = req.body
    await reconciliationService.reject(anchor_id, claim_id, actor, reason)

    res.json({ success: true, data: { rejected: true } })
  } catch (err) {
    next(err)
  }
})

// POST /batch-reconcile — Approve multiple
router.post('/batch-reconcile', validate(BatchReconcileSchema), async (req, res, next) => {
  try {
    const { pairs, actor } = req.body
    const result = await reconciliationService.batchApprove(pairs, actor)

    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
})

export default router
