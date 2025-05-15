// src/common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum'; // Importar nuestro enum de TS

export const ROLES_KEY = 'roles'; // Una clave para identificar los metadatos de roles
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);