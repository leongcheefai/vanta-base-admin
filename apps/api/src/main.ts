import 'reflect-metadata'
import './load-env'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { serverEnv } from '@vanta-base-admin/env'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true })
  app.enableCors({
    origin: [serverEnv.APP_URL, serverEnv.WEB_URL],
    credentials: true,
  })
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  )
  await app.listen(serverEnv.PORT)
  console.log(`API listening on http://localhost:${serverEnv.PORT}`)
}

bootstrap()
