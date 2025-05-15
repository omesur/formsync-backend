// src/auth/strategies/local.strategy.ts
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service'; // Importaremos AuthService después de crearlo

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    // Configura passport-local para usar 'email' como usernameField
    super({ usernameField: 'email' });
  }

  // Esta función es llamada por Passport cuando se usa el LocalAuthGuard
  async validate(email: string, pass: string): Promise<any> {
    const user = await this.authService.validateUser(email, pass);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    // Lo que retorna esta función se añade a request.user
    return user;
  }
}