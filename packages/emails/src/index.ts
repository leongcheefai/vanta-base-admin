import { render } from '@react-email/render'
import type { ReactElement } from 'react'
import { Resend } from 'resend'
import { serverEnv } from '@praxor-kit/env'
import { PaymentFailedEmail } from './templates/payment-failed'
import { ResetPasswordEmail } from './templates/reset-password'
import { VerifyEmail } from './templates/verify-email'
import { WelcomeEmail } from './templates/welcome'

// Update to your verified Resend sender domain before going live
const FROM = 'Praxor Kit <noreply@kit.praxor.dev>'

const resend = serverEnv.RESEND_API_KEY ? new Resend(serverEnv.RESEND_API_KEY) : null

async function send(to: string, subject: string, element: ReactElement) {
  if (!resend) {
    console.warn(`[emails] RESEND_API_KEY not set — skipping "${subject}" to ${to}`)
    return
  }
  const html = await render(element)
  await resend.emails.send({ from: FROM, to, subject, html })
}

export async function sendWelcomeEmail(to: string, name: string) {
  await send(to, 'Welcome to Praxor Kit', WelcomeEmail({ name }))
}

export async function sendVerifyEmail(to: string, url: string) {
  await send(to, 'Verify your email', VerifyEmail({ url }))
}

export async function sendResetPasswordEmail(to: string, url: string) {
  await send(to, 'Reset your password', ResetPasswordEmail({ url }))
}

export async function sendPaymentFailedEmail(to: string, appUrl: string) {
  await send(to, 'Action required: payment failed', PaymentFailedEmail({ appUrl }))
}
