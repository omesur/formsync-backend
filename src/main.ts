// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'; // Importar ValidationPipe

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS (Cross-Origin Resource Sharing) - ¡Importante para el frontend!
  app.enableCors({
     origin: '*', // Permite cualquier origen (para desarrollo) - ¡Configura esto de forma más restrictiva en producción!
     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
     credentials: true,
   });


  // Habilitar validaciones globales usando class-validator
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Ignora propiedades que no estén definidas en el DTO
    forbidNonWhitelisted: true, // Lanza un error si se envían propiedades no definidas
    transform: true, // Transforma el payload a una instancia del DTO
  }));

  await app.listen(3001); // Usaremos el puerto 3001 para el backend (React suele usar el 3000)
  console.log(`Backend corriendo en: ${await app.getUrl()}`);
}
bootstrap();