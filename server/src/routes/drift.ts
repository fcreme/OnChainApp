import { Router } from 'express'
import { driftService } from '../services/DriftService.js'

const router = Router()

// GET /drift — All drift summaries
router.get('/', async (_req, res, next) => {
  try {
    const drifts = await driftService.getAll()
    res.json({ success: true, data: { drifts } })
  } catch (err) {
    next(err)
  }
})

// GET /drift/:wallet — Drift for specific wallet
router.get('/:wallet', async (req, res, next) => {
  try {
    const drifts = await driftService.getByWallet(req.params.wallet)
    res.json({ success: true, data: { drifts } })
  } catch (err) {
    next(err)
  }
})

// POST /drift/sync — Force recompute all drifts
router.post('/sync', async (_req, res, next) => {
  try {
    const drifts = await driftService.syncAll()
    res.json({
      success: true,
      data: {
        synced: drifts.length,
        drifts,
      },
    })
  } catch (err) {
    next(err)
  }
})

export default router
