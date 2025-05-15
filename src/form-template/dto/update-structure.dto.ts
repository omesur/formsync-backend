import { Type } from 'class-transformer';
import {
  IsArray,
  ValidateNested,
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  IsBoolean,
  IsEnum,
  IsOptional,
  MaxLength,
  ArrayMinSize,
  IsObject,
  ValidateIf, // <-- Importante para validar 'options' condicionalmente
  ArrayNotEmpty,
} from 'class-validator';
import {
  FormFieldDefinition,
  FormFieldOption,
  FormFieldType,
  FormFieldValidations,
} from '../../common/interfaces/form-field.interface'; // Importar interfaz

// DTO para validar las opciones de select/radio
class FormFieldOptionDto implements FormFieldOption {
  @IsNotEmpty() // value puede ser string o number, difícil validar tipo exacto sin sobrecarga
  value: string | number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  label: string;
}

// DTO para validar el objeto de validaciones extra
class FormFieldValidationsDto implements FormFieldValidations {
   @IsOptional() @IsInt() @Min(0) minLength?: number;
   @IsOptional() @IsInt() @Min(1) maxLength?: number;
   @IsOptional() @IsString() pattern?: string;
   @IsOptional() @IsInt() min?: number; // Simplificado como Int, podría ser Date
   @IsOptional() @IsInt() max?: number; // Simplificado como Int, podría ser Date
   @IsOptional() @IsArray() @IsString({ each: true }) allowedMimeTypes?: string[];
}


// DTO para validar cada objeto dentro del array structureDefinition
class FormFieldDefinitionDto implements FormFieldDefinition {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsInt()
  @Min(0)
  order: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string; // TODO: Añadir validación de unicidad en el servicio

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  label: string;

  @IsEnum( // Validar contra los tipos permitidos
      ['text', 'number', 'date', 'select', 'checkbox', 'radio', 'file', 'textarea', 'email', 'password'],
      { message: 'Tipo de campo inválido' }
  )
  type: FormFieldType;

  @IsBoolean()
  required: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  placeholder?: string;

  // Validar 'options' solo si el tipo es 'select' o 'radio'
  @ValidateIf(o => o.type === 'select' || o.type === 'radio')
  @IsArray({ message: 'Las opciones deben ser un array para tipos select/radio'})
  @ArrayNotEmpty({ message: 'Debe proporcionar al menos una opción para tipos select/radio'})
  @ValidateNested({ each: true }) // Validar cada objeto dentro del array
  @Type(() => FormFieldOptionDto) // Especificar el tipo de objeto anidado
  options?: FormFieldOptionDto[];

  @IsOptional()
  @IsObject()
  @ValidateNested() // Validar el objeto anidado
  @Type(() => FormFieldValidationsDto) // Especificar el tipo
  validations?: FormFieldValidationsDto;

  @IsOptional()
  defaultValue?: any; // Difícil validar tipo aquí, depende del 'type' del campo
}


// DTO principal que espera un array de FormFieldDefinitionDto
export class UpdateStructureDto {
  @IsArray()
  @ValidateNested({ each: true }) // Validar cada objeto en el array
  @Type(() => FormFieldDefinitionDto) // Especificar el tipo de los objetos
  // @ArrayMinSize(1) // Opcional: requerir al menos un campo
  structureDefinition: FormFieldDefinitionDto[];
}