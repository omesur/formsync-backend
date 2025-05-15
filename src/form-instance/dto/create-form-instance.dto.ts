import { IsInt, IsNotEmpty, IsObject, IsOptional, IsEnum } from 'class-validator';
import { FormStatus } from '@prisma/client'; // Importar el enum generado

export class CreateFormInstanceDto {
  @IsInt()
  @IsNotEmpty()
  templateId: number;

  @IsObject() // Validación básica, la validación detallada se hará en el servicio
  @IsNotEmpty()
  data: Record<string, any>; // Usar Record<string, any> para un objeto JSON genérico

  @IsOptional()
  @IsEnum(FormStatus)
  status?: FormStatus; // Permitir especificar un estado inicial (ej: Submitted)
}