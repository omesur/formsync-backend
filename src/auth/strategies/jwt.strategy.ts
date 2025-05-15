// src/auth/strategies/jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../user/user.service';
import { Role } from '@prisma/client'; // Solo Role es necesario aquí
import { AuthenticatedUserPayload } from '../auth.service'; // Importar tipo

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private userService: UserService, // Inyectar UserService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  // Payload esperado del token, devuelve el payload seguro del usuario
  async validate(payload: { sub: number; email: string; role: Role }): Promise<AuthenticatedUserPayload> {
    // findUserById ahora devuelve el payload seguro (sin pass) o null
    const userPayload = await this.userService.findUserById(payload.sub);

    if (!userPayload || userPayload.role !== payload.role) {
        console.error('DEBUG: JwtStrategy validate - Validation FAILED!');
        throw new UnauthorizedException(/* ... */);
    }

    return userPayload;
  }
}