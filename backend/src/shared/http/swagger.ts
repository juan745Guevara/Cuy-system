import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const SWAGGER_PATH = 'api-docs';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Sistema de Control de Animales — UNAS')
    .setDescription(
      [
        'API REST del sistema multigranja (Facultad de Zootecnia).',
        '',
        '**Autenticación:** haz `POST /api/v1/auth/login`, copia el `token` y pulsa **Authorize**.',
        '',
        '**Rutas de granja** (`/cuyes/*`, `/areas`, `/recintos`, `/audit`): requieren además las cabeceras',
        '`x-farm-id` (granja activa) y `x-species-id` (especie de la granja).',
        '',
        '**Superadmin:** solo puede usar `auth`, `users`, `farms` y `species`.',
      ].join('\n'),
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'jwt',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    customSiteTitle: 'API — Control de Animales UNAS',
    swaggerOptions: { persistAuthorization: true },
  });
}
