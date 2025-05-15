// src/common/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum'; // Importar nuestro enum de TS
import { User } from '@prisma/client'; // Importar el tipo User de Prisma

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {} // Inyectar Reflector para leer metadatos

  canActivate(context: ExecutionContext): boolean {
    // 1. Obtener los roles requeridos del metadata (@Roles decorator)
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(), // Prioridad al metadata del método
      context.getClass(),   // Luego al metadata de la clase
    ]);

    // Si no se especifican roles requeridos, permitir el acceso (o denegar por defecto, según política)
    if (!requiredRoles) {
      return true; // O podrías retornar false si quieres que @Roles sea siempre obligatorio
    }

    // 2. Obtener el objeto usuario del request (añadido por JwtAuthGuard)
    const request = context.switchToHttp().getRequest();
    const user = request.user as User; // Asegurar que el tipo es correcto

    // Si no hay usuario adjunto (ej: JwtAuthGuard no se usó antes), denegar acceso
    if (!user || !user.role) {
         return false;
    }

    // 3. Comparar el rol del usuario con los roles requeridos
    // Verificar si el rol del usuario está incluido en la lista de roles requeridos
    return requiredRoles.some((role) => user.role === role);
  }
}