// src/form-template/form-template.controller.ts
import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import { FormTemplateService } from './form-template.service';
import { CreateFormTemplateDto } from './dto/create-form-template.dto';
import { UpdateStructureDto } from './dto/update-structure.dto';    
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Importar el guard
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator'; 
import { Role } from '../common/enums/role.enum';

@UseGuards(JwtAuthGuard) // ¡Proteger TODO el controlador! Solo usuarios logueados.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DocBuilder, Role.Admin)

@Controller('form-templates') // Prefijo de ruta: /form-templates
export class FormTemplateController {
  constructor(private readonly formTemplateService: FormTemplateService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DocBuilder, Role.Admin)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createFormTemplateDto: CreateFormTemplateDto) {
    // Al crear, structureDefinition será null inicialmente
    return this.formTemplateService.create(createFormTemplateDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    // Cualquiera logueado puede ver la lista de plantillas por ahora
    return this.formTemplateService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
     // ParseIntPipe valida que el id sea un número entero
    return this.formTemplateService.findOne(id);
  }

   // --- Actualizar Estructura (PATCH /:id/structure) ---
   @Patch(':id/structure') // <-- Nuevo endpoint
   @UseGuards(JwtAuthGuard, RolesGuard) // <-- Proteger con Auth y Rol
   @Roles(Role.DocBuilder, Role.Admin) // <-- Solo DocBuilder/Admin pueden definir estructura
   @HttpCode(HttpStatus.OK) // Devolver 200 OK
   updateStructure(
     @Param('id', ParseIntPipe) id: number,
     @Body() updateStructureDto: UpdateStructureDto // <-- Usar el nuevo DTO (con validación global activada)
   ) {
     return this.formTemplateService.updateStructure(id, updateStructureDto);
   }

  // --- Endpoints Update y Delete (Los añadiremos más tarde) ---
  // @Patch(':id')
  // update(...) { ... }
  //
  // @Delete(':id')
  // remove(...) { ... }
}