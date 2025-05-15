// src/form-template/form-template.service.ts
import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient, FormTemplate, Prisma } from '@prisma/client';
import { CreateFormTemplateDto } from './dto/create-form-template.dto';
import { UpdateStructureDto } from './dto/update-structure.dto'; 
import { FormFieldDefinition } from '../common/interfaces/form-field.interface'; 

// Instancia de PrismaClient (mejoraría con inyección de dependencias más adelante)
const prisma = new PrismaClient();

@Injectable()
export class FormTemplateService {

  async create(createDto: CreateFormTemplateDto): Promise<FormTemplate> {
    // Verificar si ya existe una plantilla con el mismo uniqueCode
    const existing = await prisma.formTemplate.findUnique({
      where: { uniqueCode: createDto.uniqueCode },
    });
    if (existing) {
      throw new ConflictException(`Ya existe una plantilla con el código ${createDto.uniqueCode}`);
    }

    // Crear la nueva plantilla en la base de datos
    const newTemplate = await prisma.formTemplate.create({
      data: {
        uniqueCode: createDto.uniqueCode,
        name: createDto.name,
        description: createDto.description,
        // version e isActive usarán sus valores por defecto definidos en el schema
      },
    });
    return newTemplate;
  }

  async findAll(): Promise<FormTemplate[]> {
    return prisma.formTemplate.findMany({
      orderBy: { createdAt: 'desc' }, // Ordenar por fecha de creación descendente
    });
  }

  async findOne(id: number): Promise<FormTemplate | null> {
    const template = await prisma.formTemplate.findUnique({
      where: { id },
    });
    if (!template) {
         throw new NotFoundException(`Plantilla con ID ${id} no encontrada`);
    }
    return template;
  }

  async updateStructure(id: number, updateStructureDto: UpdateStructureDto): Promise<FormTemplate> {
    // 1. Validar unicidad de 'name' e 'id' dentro del array recibido
    const fieldNames = new Set<string>();
    const fieldIds = new Set<string>();
    for (const field of updateStructureDto.structureDefinition) {
        if (fieldNames.has(field.name)) {
            throw new BadRequestException(`El nombre de campo '${field.name}' está duplicado en la definición.`);
        }
        fieldNames.add(field.name);

        if (fieldIds.has(field.id)) {
            throw new BadRequestException(`El ID de campo '${field.id}' está duplicado en la definición.`);
        }
        fieldIds.add(field.id);
    }


    // 2. Verificar que la plantilla exista
    const existingTemplate = await this.findOne(id); // findOne ya lanza NotFoundException si no existe
    if (!existingTemplate) {
         // Esta línea es redundante si findOne lanza error, pero por claridad:
         throw new NotFoundException(`Plantilla con ID ${id} no encontrada`);
    }


    // 3. Actualizar la plantilla con la nueva estructura
    // Prisma espera un tipo compatible con JsonValue (any, string, number, boolean, object, array)
    // Nuestro DTO validado (que implementa la interfaz) es compatible.
    const updatedTemplate = await prisma.formTemplate.update({
      where: { id },
      data: {
        // Asegurarnos de que el tipo es correcto para Prisma.JsonValue
        structureDefinition: updateStructureDto.structureDefinition as unknown as Prisma.InputJsonValue,
        // Opcionalmente, podríamos incrementar la versión aquí
        // version: { increment: 1 }
      },
    });

    return updatedTemplate;
  }


 // --- Métodos Update y Delete (Los añadiremos más tarde) ---
 // async update(id: number, updateDto: UpdateFormTemplateDto): Promise<FormTemplate> { ... }
 // async remove(id: number): Promise<void> { ... }

}