import { betterAuth } from 'better-auth'
import { pool } from '@/lib/db'

const devPort = process.env.PORT ?? '3000'
const localDevUrl = `http://localhost:${devPort}`

const remoteBaseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.V0_RUNTIME_URL

const baseURL =
  process.env.BETTER_AUTH_URL ??
  (process.env.NODE_ENV === 'development' ? localDevUrl : remoteBaseUrl)

export const auth = betterAuth({
  database: pool,
  baseURL,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  trustedOrigins: [
    ...(process.env.NODE_ENV === 'development'
      ? [localDevUrl, `http://127.0.0.1:${devPort}`]
      : []),
    ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
      : []),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  // Cross-site cookies only for v0/remote dev previews (not plain localhost HTTP)
  ...(process.env.NODE_ENV === 'development' &&
  baseURL &&
  !baseURL.startsWith('http://localhost')
    ? {
        advanced: {
          defaultCookieAttributes: {
            sameSite: 'none' as const,
            secure: true,
          },
        },
      }
    : {}),
})
