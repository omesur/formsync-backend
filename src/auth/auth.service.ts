// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, ForbiddenException  } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, Role } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient(); 

// Definir el tipo explícito para usuario sin contraseña
export type AuthenticatedUserPayload = Omit<User, 'password'>;

// Tipo para la entrada del método register, debe coincidir con CreateUserDto
type RegisterUserInput = Pick<User, 'email' | 'password'> & Partial<Pick<User, 'name'>>;


@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}


    // --- Funciones Helper ---
    private async hashData(data: string): Promise<string> {
        return bcrypt.hash(data, 10);
    }

    private async generateTokens(userId: number, email: string, role: Role) {
        const accessTokenPayload = { sub: userId, email, role };
        const refreshTokenPayload = { sub: userId }; // Refresh token solo necesita el ID

        const [accessToken, refreshToken] = await Promise.all([
            // Access Token (usa JwtService configurado en el módulo)
            this.jwtService.signAsync(accessTokenPayload, {
                secret: this.configService.get<string>('JWT_SECRET'),
                expiresIn: this.configService.get<string>('JWT_EXPIRATION_TIME'),
            }),
            // Refresh Token (firma manual)
            this.jwtService.signAsync(refreshTokenPayload, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
                expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION_TIME'),
            }),
        ]);

        return {
            accessToken,
            refreshToken,
        };
    }

    private async updateRefreshTokenHash(userId: number, refreshToken: string) {
        const hashedRefreshToken = await this.hashData(refreshToken);
        await prisma.user.update({
            where: { id: userId },
            data: { hashedRefreshToken },
        });
    }

    // validateUser: Compara pass, devuelve payload seguro o null
    async validateUser(email: string, pass: string): Promise<Omit<User, 'password' | 'hashedRefreshToken'> | null> {
        const user = await this.userService.findUserByEmail(email);
        if (user && user.password && await bcrypt.compare(pass, user.password)) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, hashedRefreshToken, ...result } = user; // Excluir también el hash del refresh
        return result;
        }
        return null;
    }

    // login: Espera el payload seguro
    async login(user: Omit<User, 'password' | 'hashedRefreshToken'>) {
        // Generar ambos tokens
        const tokens = await this.generateTokens(user.id, user.email, user.role);
        // Guardar el hash del NUEVO refresh token en la BD
        await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

        return tokens; // Devolver ambos tokens
    }

    // register: Acepta datos del DTO, llama a userService, devuelve payload seguro
    async register(createUserDto: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'role' | 'hashedRefreshToken'>) {
        const user = await this.userService.createUser(createUserDto);
        // No generamos tokens aquí, solo registramos. El usuario debe hacer login después.
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, hashedRefreshToken, ...result } = user;
        return result;
    }

    async refreshToken(userId: number, rt: string) {
        // 1. Encontrar usuario
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.hashedRefreshToken) {
            throw new ForbiddenException('Acceso Denegado (Usuario o token no encontrado)');
        }

        // 2. Comparar el refresh token proporcionado con el hash almacenado
        const rtMatches = await bcrypt.compare(rt, user.hashedRefreshToken);
        if (!rtMatches) {
            throw new ForbiddenException('Acceso Denegado (Token inválido)');
        }

        // 3. (Opcional pero recomendado) Verificar la firma y expiración del refresh token JWT en sí mismo
        try {
            await this.jwtService.verifyAsync(rt, { secret: this.configService.get<string>('JWT_REFRESH_SECRET')});
        } catch (error) {
            // Si falla la verificación JWT (expirado o firma inválida), denegar
            // Y limpiar el token viejo de la BD por seguridad
            await this.logout(user.id);
            throw new ForbiddenException('Acceso Denegado (Token expirado o inválido)');
        }


        // 4. Generar NUEVOS tokens (incluyendo un nuevo refresh token - ROTACIÓN)
        const tokens = await this.generateTokens(user.id, user.email, user.role);
        // 5. Actualizar el hash del NUEVO refresh token en la BD
        await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

        return tokens; // Devolver los nuevos tokens
    }

    async logout(userId: number) {
        // Eliminar el hash del refresh token de la BD
        await prisma.user.updateMany({
            where: {
                id: userId,
                hashedRefreshToken: { not: null }, // Solo actualizar si existe
            },
            data: { hashedRefreshToken: null },
        });
    }

    async refreshTokenFromRequest(rt: string) {
        try {
            // 1. Verificar el refresh token JWT y extraer payload (sub = userId)
            const payload = await this.jwtService.verifyAsync<{ sub: number }>(rt, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
                // Opcional: puedes añadir ignoreExpiration: true aquí si quieres
                // manejar la expiración *después* de comparar el hash,
                // pero verificarla aquí es más seguro y rápido.
            });
  
            // 2. Llamar a la lógica principal de refresh (que compara hashes, etc.)
            //    con el userId extraído del payload del token verificado.
            return this.refreshToken(payload.sub, rt);
  
        } catch (error) {
            // Si verifyAsync falla (expirado, firma inválida, etc.)
            console.error("Error verifying refresh token in refreshTokenFromRequest:", error);
            // Lanzamos ForbiddenException para indicar que el refresh token no es válido.
            // No podemos limpiar el hash aquí fácilmente porque no sabemos qué usuario era
            // si la verificación del token falló. La limpieza ocurre en refreshToken si
            // la verificación inicial pasa pero la comparación de hash falla, o si el token
            // expira justo después de pasar la verificación inicial (manejado en el catch de refreshToken).
            throw new ForbiddenException('Acceso Denegado (Refresh Token inválido o expirado)');
        }
    }
}