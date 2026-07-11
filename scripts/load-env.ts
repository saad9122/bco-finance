import { loadEnvConfig } from '@next/env'

// dev=true loads .env.development.local (same as `next dev`)
loadEnvConfig(process.cwd(), true)
