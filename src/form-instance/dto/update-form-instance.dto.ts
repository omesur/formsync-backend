import { IsObject, IsOptional, IsEnum } from 'class-validator';
import { FormStatus } from '@prisma/client';

export class UpdateFormInstanceDto {
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @IsOptional()
  @IsEnum(FormStatus)
  status?: FormStatus;
}