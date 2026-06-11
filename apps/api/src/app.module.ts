import { Module } from '@nestjs/common'
import { APP_FILTER, APP_GUARD, Reflector } from '@nestjs/core'
import { AuthGuard } from './common/guards/auth.guard'
import { GlobalExceptionFilter } from './common/filters/http-exception.filter'

@Module({
  providers: [
    Reflector,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  ],
})
export class AppModule {}
