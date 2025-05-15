// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module'; // Importar UserModule
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config'; // Para leer secretos
import { LocalStrategy } from './strategies/local.strategy'; // Importar
import { JwtStrategy } from './strategies/jwt.strategy';   // Importar
// Importaremos las estrategias aquí después de crearlas
// import { LocalStrategy } from './strategies/local.strategy';
// import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UserModule, // Para poder usar UserService
    PassportModule,
    ConfigModule, // Asegurarse de que ConfigModule esté disponible
    JwtModule.registerAsync({ // Configuración asíncrona para leer el secreto
      imports: [ConfigModule], // Importar ConfigModule aquí también
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'), // Leer secreto del .env
        signOptions: { expiresIn: '60m' }, // Token expira en 60 minutos
      }),
    }),
  ],
  controllers: [AuthController],
  // Registraremos los providers (AuthService y Strategies) aquí
  providers: [AuthService, LocalStrategy, JwtStrategy],
})
export class AuthModule {}