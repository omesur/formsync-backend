// src/form-template/dto/create-form-template.dto.ts
import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateFormTemplateDto {
  @IsString()
  @IsNotEmpty({ message: 'El código único es obligatorio' })
  @MaxLength(50, { message: 'El código único no puede exceder los 50 caracteres'})
  uniqueCode: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(255, { message: 'El nombre no puede exceder los 255 caracteres'})
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000, { message: 'La descripción no puede exceder los 1000 caracteres'})
  description?: string;

  // No incluimos structureDefinition, version, isActive aquí,
  // se manejarán con valores por defecto o lógica interna.
}