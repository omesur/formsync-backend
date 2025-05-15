// src/user/user.module.ts
import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service'; // Importar Servicio

@Module({
  controllers: [UserController],
  providers: [UserService], // Proveer el servicio
  exports: [UserService], // Exportar el servicio si otros módulos lo necesitan
})
export class UserModule {}
