import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db, schema } from '@praxor-kit/db'
import { serverEnv } from '@praxor-kit/env'
import { sendResetPasswordEmail, sendVerifyEmail, sendWelcomeEmail } from '@praxor-kit/emails'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  secret: serverEnv.BETTER_AUTH_SECRET,
  baseURL: serverEnv.BETTER_AUTH_URL,
  trustedOrigins: [serverEnv.APP_URL],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string }) => {
      await sendVerifyEmail(user.email, url)
    },
    sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => {
      await sendResetPasswordEmail(user.email, url)
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // fire-and-forget — email failure must not break signup
          sendWelcomeEmail(user.email, user.name).catch((err) =>
            console.error('[auth] welcome email failed', err),
          )
        },
      },
    },
  },
  socialProviders: {
    ...(serverEnv.GOOGLE_CLIENT_ID && serverEnv.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: serverEnv.GOOGLE_CLIENT_ID,
            clientSecret: serverEnv.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
  },
})

export type Auth = typeof auth
