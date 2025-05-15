import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { FormInstanceService } from './form-instance.service';
import { CreateFormInstanceDto } from './dto/create-form-instance.dto';
import { UpdateFormInstanceDto } from './dto/update-form-instance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Guard que adjunta req.user

@UseGuards(JwtAuthGuard) // Proteger todos los endpoints con autenticación JWT
@Controller('form-instances') // Prefijo de ruta PLURAL
export class FormInstanceController {
  constructor(private readonly formInstanceService: FormInstanceService) {}

  /**
   * Helper para extraer el ID del usuario desde el objeto Request adjuntado por JwtAuthGuard.
   * @param req - El objeto Request de Express/NestJS.
   * @returns El ID numérico del usuario.
   * @throws Error si el ID no se encuentra (no debería pasar si JwtAuthGuard está activo).
   */
  private getUserId(req: any): number {
      // Accedemos a 'id' porque nuestra JwtStrategy devuelve el objeto User completo de Prisma
      if (!req.user?.id) {
         throw new Error("Error interno: ID de usuario no encontrado en el request.");
      }
      return req.user.id;
  }

  /**
   * Crea una nueva instancia de formulario.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createFormInstanceDto: CreateFormInstanceDto, @Request() req) {
    const userId = this.getUserId(req);
    return this.formInstanceService.create(createFormInstanceDto, userId);
  }

  /**
   * Obtiene todas las instancias de formulario pertenecientes al usuario autenticado.
   */
  @Get('/my') // Ruta específica para las instancias propias
  findAllForUser(@Request() req) {
    const userId = this.getUserId(req);
    return this.formInstanceService.findAllForUser(userId);
  }

  /**
   * Obtiene una instancia de formulario específica por su ID, verificando propiedad.
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const userId = this.getUserId(req);
    return this.formInstanceService.findOneForUser(id, userId);
  }

  /**
   * Actualiza una instancia de formulario existente por su ID, verificando propiedad.
   */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFormInstanceDto: UpdateFormInstanceDto,
    @Request() req
  ) {
    const userId = this.getUserId(req);
    return this.formInstanceService.update(id, updateFormInstanceDto, userId);
  }

  /**
   * (Opcional) Elimina una instancia de formulario por su ID, verificando propiedad.
   */
  // @Delete(':id')
  // @HttpCode(HttpStatus.NO_CONTENT) // Status 204 para eliminación exitosa sin contenido
  // remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
  //   const userId = this.getUserId(req);
  //   // El servicio se encarga de la lógica y verificación de propiedad
  //   return this.formInstanceService.remove(id, userId);
  // }
}