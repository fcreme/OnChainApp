import { Router } from 'express'
import { testConnection } from '../config/database.js'

const router = Router()

router.get('/', async (_req, res) => {
  const dbConnected = await testConnection()

  res.json({
    success: true,
    data: {
      status: dbConnected ? 'ok' : 'degraded',
      database: dbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  })
})

export default router
