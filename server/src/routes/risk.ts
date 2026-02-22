import { Router } from 'express'
import { riskScoringService } from '../services/RiskScoringService.js'

const router = Router()

// GET /risk — All wallet risk scores
router.get('/', async (_req, res, next) => {
  try {
    const scores = await riskScoringService.getAll()
    res.json({ success: true, data: { scores } })
  } catch (err) {
    next(err)
  }
})

// GET /risk/:wallet — Risk for specific wallet
router.get('/:wallet', async (req, res, next) => {
  try {
    const result = await riskScoringService.getByWallet(req.params.wallet)
    if (!result) {
      // Calculate on-the-fly if not cached
      const calculated = await riskScoringService.calculate(req.params.wallet)
      res.json({ success: true, data: calculated })
      return
    }
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
})

// POST /risk/recalculate — Recalculate all
router.post('/recalculate', async (_req, res, next) => {
  try {
    const scores = await riskScoringService.recalculateAll()
    res.json({
      success: true,
      data: { recalculated: scores.length, scores },
    })
  } catch (err) {
    next(err)
  }
})

export default router
