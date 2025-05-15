// src/user/user.service.ts
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaClient, User, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthenticatedUserPayload } from '../auth/auth.service'; // Importar el tipo compartido

// Define el tipo para la entrada de creación basado en lo que realmente viene del DTO
type CreateUserInput = Pick<User, 'email' | 'password'> & Partial<Pick<User, 'name'>>;

const prisma = new PrismaClient();

@Injectable()
export class UserService {

  // createUser: Acepta datos derivados del DTO, devuelve el User completo de la BD
  async createUser(data: CreateUserInput): Promise<User> {
    const existingUser = await this.findUserByEmail(data.email);
    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name, // Prisma maneja si es null/undefined
        // role: por defecto según el schema
      },
    });
    return newUser; // Devuelve el usuario completo (con pass hasheada)
  }

  // findUserByEmail: Devuelve el User completo (con pass hasheada) o null
  async findUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  // findUserById: Devuelve el payload seguro (sin pass) o null
  async findUserById(id: number): Promise<AuthenticatedUserPayload | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (user) {
      const { password, ...result } = user;
      return result as AuthenticatedUserPayload; // Casteo explícito para asegurar el tipo
    }
    return null;
  }
}