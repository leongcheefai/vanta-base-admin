import { IsString, IsUrl, MinLength } from 'class-validator'

export class CreateCheckoutDto {
  @IsString()
  @MinLength(1)
  priceId: string

  @IsUrl()
  successUrl: string

  @IsUrl()
  cancelUrl: string
}
