import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { env } from './config/env.js'
import { testConnection } from './config/database.js'
import { errorHandler } from './middleware/errorHandler.js'

// Routes
import healthRouter from './routes/health.js'
import transactionsRouter from './routes/transactions.js'
import reconciliationRouter from './routes/reconciliation.js'
import driftRouter from './routes/drift.js'
import riskRouter from './routes/risk.js'
import auditRouter from './routes/audit.js'
import configRouter from './routes/config.js'

const app = express()

// ── Middleware ──
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }))
app.use(express.json({ limit: '5mb' }))

// Request logging (development)
if (env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`)
    next()
  })
}

// ── API Routes ──
const api = express.Router()
api.use('/health', healthRouter)
api.use('/transactions', transactionsRouter)
api.use('/reconciliation', reconciliationRouter)
api.use('/drift', driftRouter)
api.use('/risk', riskRouter)
api.use('/audit', auditRouter)
api.use('/config', configRouter)

app.use('/api/v1', api)

// ── Error Handler ──
app.use(errorHandler)

// ── Start ──
async function start() {
  const dbOk = await testConnection()
  if (!dbOk) {
    console.error('Failed to connect to database. Check DATABASE_URL.')
    process.exit(1)
  }
  console.log('Database connected')

  app.listen(env.PORT, () => {
    console.log(`OnChain Reconciliation Engine running on port ${env.PORT}`)
    console.log(`  API: http://localhost:${env.PORT}/api/v1`)
    console.log(`  Health: http://localhost:${env.PORT}/api/v1/health`)
    console.log(`  Environment: ${env.NODE_ENV}`)
  })
}

start()
