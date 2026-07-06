import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  // rawBody: true keeps the untouched request bytes on req.rawBody so the
  // Razorpay webhook signature can be verified against exactly what was sent.
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Enforce DTO validation everywhere. `whitelist` strips any property not
  // declared on the DTO, so a client can never inject fields we don't expect
  // (defense-in-depth against things like a smuggled `role` on registration).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : [/^http:\/\/localhost:\d+$/];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
  await app.listen(process.env.PORT || 4001);
}
bootstrap();
