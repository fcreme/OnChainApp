import { Router } from 'express'
import { db } from '../config/database.js'
import { auditService } from '../services/AuditService.js'
import { validate } from '../middleware/validation.js'
import { z } from 'zod'
import { AppError } from '../middleware/errorHandler.js'

const router = Router()

// GET /config/matching — Get current config
router.get('/matching', async (_req, res, next) => {
  try {
    const rows = await db.manyOrNone<{ key: string; value: unknown; description: string }>(
      'SELECT key, value, description FROM matching_config',
    )

    const config: Record<string, unknown> = {}
    for (const row of rows) {
      config[row.key] = row.value
    }

    res.json({ success: true, data: config })
  } catch (err) {
    next(err)
  }
})

// PUT /config/matching — Update config
const UpdateConfigSchema = z.object({
  weights: z.object({
    amount: z.number().min(0).max(100),
    address: z.number().min(0).max(100),
    time: z.number().min(0).max(100),
    token: z.number().min(0).max(100),
  }).refine(
    (w) => w.amount + w.address + w.time + w.token === 100,
    { message: 'Weights must sum to 100' },
  ).optional(),
  tolerances: z.object({
    amount_percent: z.number().min(0).max(1),
    time_window_ms: z.number().int().min(0),
    block_window: z.number().int().min(0),
  }).optional(),
  drift_thresholds: z.object({
    alert_percent: z.number().min(0).max(100),
    critical_percent: z.number().min(0).max(100),
  }).optional(),
  actor: z.string().min(1).default('system'),
})

router.put('/matching', validate(UpdateConfigSchema), async (req, res, next) => {
  try {
    const { weights, tolerances, drift_thresholds, actor } = req.body
    const updates: Array<{ key: string; value: unknown }> = []

    if (weights) updates.push({ key: 'weights', value: weights })
    if (tolerances) updates.push({ key: 'tolerances', value: tolerances })
    if (drift_thresholds) updates.push({ key: 'drift_thresholds', value: drift_thresholds })

    if (updates.length === 0) {
      throw new AppError(400, 'No config fields provided', 'INVALID_INPUT')
    }

    for (const { key, value } of updates) {
      const prev = await db.oneOrNone<{ value: unknown }>(
        'SELECT value FROM matching_config WHERE key = $1',
        [key],
      )

      await db.none(
        `UPDATE matching_config SET value = $2, updated_at = NOW(), updated_by = $3 WHERE key = $1`,
        [key, JSON.stringify(value), actor],
      )

      await auditService.log(
        'update_config',
        'config',
        null,
        actor,
        prev ? { [key]: prev.value } : null,
        { [key]: value },
      )
    }

    // Return updated config
    const rows = await db.manyOrNone<{ key: string; value: unknown }>(
      'SELECT key, value FROM matching_config',
    )
    const config: Record<string, unknown> = {}
    for (const row of rows) {
      config[row.key] = row.value
    }

    res.json({ success: true, data: config })
  } catch (err) {
    next(err)
  }
})

export default router
