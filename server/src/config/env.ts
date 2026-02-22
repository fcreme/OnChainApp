import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  SEPOLIA_RPC_URL: z.string().url().default('https://ethereum-sepolia-rpc.publicnode.com'),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DEFAULT_MIN_SCORE: z.coerce.number().min(0).max(100).default(70),
})

export type Env = z.infer<typeof envSchema>

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    console.error('Invalid environment variables:')
    for (const issue of result.error.issues) {
      console.error(`  ${issue.path.join('.')}: ${issue.message}`)
    }
    process.exit(1)
  }
  return result.data
}

export const env = loadEnv()
