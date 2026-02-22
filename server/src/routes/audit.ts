import { Router } from 'express'
import { auditService } from '../services/AuditService.js'
import { validate } from '../middleware/validation.js'
import { AuditQuerySchema } from '../models/AuditLog.js'

const router = Router()

// GET /audit — Paginated audit logs
router.get('/', validate(AuditQuerySchema, 'query'), async (req, res, next) => {
  try {
    const { logs, total } = await auditService.query(req.query as never)
    const query = req.query as { page?: number; limit?: number }
    const page = query.page ?? 1
    const limit = query.limit ?? 50

    res.json({
      success: true,
      data: {
        logs,
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

export default router
