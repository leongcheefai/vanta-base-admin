import { BadRequestException } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'
import { BillingController } from './billing.controller'
import { BillingService } from './billing.service'

vi.mock('@vanta-base-admin/db', () => ({
  db: {},
  schema: {},
}))

vi.mock('@vanta-base-admin/env', () => ({
  serverEnv: {},
}))

vi.mock('../../lib/stripe', () => ({
  stripe: {},
}))

const mockUser = { id: 'u1' } as any
const mockConfig = { plans: [] }
const mockCheckout = { url: 'https://checkout.stripe.com/pay/xxx' }

describe('BillingController', () => {
  let controller: BillingController
  let service: BillingService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillingController],
      providers: [{
        provide: BillingService,
        useValue: {
          getConfig: vi.fn().mockResolvedValue(mockConfig),
          listInvoices: vi.fn().mockResolvedValue([]),
          getSubscription: vi.fn().mockResolvedValue(null),
          createCheckoutSession: vi.fn().mockResolvedValue(mockCheckout),
          createPortalSession: vi.fn().mockResolvedValue({ url: 'https://billing.stripe.com' }),
          handleWebhook: vi.fn().mockResolvedValue(undefined),
        },
      }],
    }).compile()
    controller = module.get(BillingController)
    service = module.get(BillingService)
  })

  it('getConfig returns config', async () => {
    expect(await controller.getConfig()).toEqual(mockConfig)
  })

  it('createCheckout returns url', async () => {
    const dto = { priceId: 'price_1', successUrl: 'https://app.example.com/success', cancelUrl: 'https://app.example.com/cancel' }
    expect(await controller.createCheckout(mockUser, dto)).toEqual(mockCheckout)
  })

  it('handleWebhook throws BadRequestException when signature missing', async () => {
    const req: any = { rawBody: Buffer.from('{}'), headers: {} }
    await expect(controller.handleWebhook(req)).rejects.toThrow(BadRequestException)
  })

  it('handleWebhook calls service when signature present', async () => {
    const req: any = { rawBody: Buffer.from('{}'), headers: { 'stripe-signature': 'sig_xxx' } }
    await controller.handleWebhook(req)
    expect(service.handleWebhook).toHaveBeenCalledWith('{}', 'sig_xxx')
  })
})
