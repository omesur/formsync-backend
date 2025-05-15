// src/auth/guards/refresh-token.guard.ts
import { AuthGuard } from '@nestjs/passport';
import { Injectable, ExecutionContext, UnauthorizedException, CanActivate  } from '@nestjs/common';


// Este guard es un poco diferente. No usaremos una estrategia Passport directa aquí.
// Su propósito principal es extraer el userId y el refreshToken del request.
// La validación profunda la hará el servicio.
@Injectable()
export class RefreshTokenGuard implements CanActivate { // No extiende AuthGuard directamente
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user as { sub: number, refreshToken: string }; // Esperamos esto del request

        // Intentaremos extraer el refresh token y el user ID de la estrategia JwtAuthGuard
        // (si se aplicó y validó el access token, aunque podría haber expirado)
        // O podríamos extraer el refresh token de un header específico o del body.
        // Por simplicidad, asumiremos que el refresh token viene en el body o header
        // y el userId se extrae de alguna forma (quizás del access token expirado si es posible)

        // --- Alternativa Simplificada: Extraer del Request ---
        // Asumimos que el controlador pondrá user y rt en el request tras una validación previa (si la hay)
        // O que el refresh token se envía directamente y el servicio lo valida completo.

        // Por ahora, solo verificamos que el request tenga la estructura esperada
        // if (!user || !user.sub || !user.refreshToken) {
        //     throw new UnauthorizedException('Refresh token o ID de usuario faltante');
        // }

        // Versión más simple: Dejar que el controlador extraiga y pase al servicio.
        // El guard podría solo verificar que el request sea para la ruta correcta
        // o realizar una validación muy básica si el token viene en un header específico.
        // Por ahora, lo dejamos pasar para que el servicio haga la validación completa.
        return true; // La validación real se hará en el servicio `refreshToken`
    }
}