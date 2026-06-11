import { Test, type TestingModule } from '@nestjs/testing'
import { HealthController } from './health.controller'

describe('HealthController', () => {
  let controller: HealthController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile()
    controller = module.get(HealthController)
  })

  it('returns ok: true', () => {
    expect(controller.check()).toEqual({ ok: true })
  })
})
