import { z } from 'zod'

export const createCheckoutSchema = z.object({
  priceId: z.string().min(1),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
})

export const createPortalSchema = z.object({
  returnUrl: z.string().url(),
})

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>
export type CreatePortalInput = z.infer<typeof createPortalSchema>
