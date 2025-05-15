// src/auth/auth.controller.ts
import {
    Controller,
    Request,
    Post,
    UseGuards,
    Body,
    HttpCode,
    HttpStatus,
    Get,
    UnauthorizedException, // Importar UnauthorizedException
  } from '@nestjs/common';
  import { AuthService } from './auth.service';
  import { LocalAuthGuard } from './guards/local-auth.guard';
  import { JwtAuthGuard } from './guards/jwt-auth.guard';
  // Quitamos RefreshTokenGuard por ahora, ya que el endpoint /refresh es público
  // import { RefreshTokenGuard } from './guards/refresh-token.guard';
  import { CreateUserDto } from './dto/create-user.dto';
  import { User } from '@prisma/client'; // Importar User
  
  @Controller('auth') // Prefijo para todas las rutas: /auth
  export class AuthController {
    constructor(private authService: AuthService) {}
  
    // --- Endpoint de Login ---
    @UseGuards(LocalAuthGuard) // Usa el guard de autenticación local (valida email/pass)
    @Post('login')
    @HttpCode(HttpStatus.OK) // Devolver un 200 OK
    async login(@Request() req: { user: Omit<User, 'password' | 'hashedRefreshToken'> }) {
      // Si llega aquí, LocalAuthGuard validó al usuario y lo puso en req.user
      // Tipamos correctamente req.user según lo que devuelve validateUser
      return this.authService.login(req.user); // Llama al servicio para generar { accessToken, refreshToken }
    }
  
    // --- Endpoint de Registro ---
    @Post('register')
    @HttpCode(HttpStatus.CREATED) // Es más semántico devolver 201 para registro
    async register(@Body() createUserDto: CreateUserDto) {
      // @Body() extrae y valida el cuerpo de la petición con el DTO
  
      // Transformar el DTO para que coincida con el tipo esperado por el servicio (manejo de name: undefined -> null)
      const userDataForService = {
        email: createUserDto.email,
        password: createUserDto.password,
        name: createUserDto.name === undefined ? null : createUserDto.name,
      };
  
      return this.authService.register(userDataForService);
    }
  
    // --- Endpoint de Ejemplo Protegido (Obtener Perfil) ---
    @UseGuards(JwtAuthGuard) // Usa el guard de autenticación JWT (valida el access token)
    @Get('profile')
    getProfile(@Request() req: { user: Omit<User, 'password' | 'hashedRefreshToken'> }) {
      // Si llega aquí, JwtAuthGuard validó el token y puso los datos del usuario en req.user
      // El tipo de req.user viene de lo que retorna JwtStrategy.validate
      return req.user; // Devuelve los datos del usuario obtenidos del token
    }
  
    // --- Endpoint de Refresh Token ---
    @Post('refresh') // Endpoint público, sin guards de autenticación aquí
    @HttpCode(HttpStatus.OK)
    async refreshTokens(@Body('refreshToken') rt: string) {
      // El cliente envía el refresh token en el cuerpo de la petición
  
      if (!rt) {
        // Validar que el refresh token se haya enviado
        throw new UnauthorizedException('Refresh token es requerido');
      }
  
      // Llamar a la función del servicio que valida el RT y genera nuevos tokens
      // Esta función (refreshTokenFromRequest) debe estar definida en AuthService
      return this.authService.refreshTokenFromRequest(rt);
    }
  
    // --- Endpoint de Logout ---
    @UseGuards(JwtAuthGuard) // Requiere un Access Token válido para saber a quién desloguear
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@Request() req: { user: { sub: number } }) { // Obtener userId 'sub' del payload del access token validado
      await this.authService.logout(req.user.sub);
      return { message: 'Logout exitoso' };
    }
  }