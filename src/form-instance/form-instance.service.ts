// src/form-instance/form-instance.service.ts
import {
  Injectable, Inject, NotFoundException, ForbiddenException,
  BadRequestException, InternalServerErrorException
} from '@nestjs/common';
import { PrismaClient, FormInstance as PrismaFormInstance, FormStatus, Prisma, FormTemplate as PrismaFormTemplate, UploadedFile as PrismaUploadedFile } from '@prisma/client';
import { CreateFormInstanceDto } from './dto/create-form-instance.dto';
import { UpdateFormInstanceDto } from './dto/update-form-instance.dto';
import { FormFieldDefinition } from '../common/interfaces/form-field.interface';
import { StorageService } from '../common/storage/storage.service';

const prisma = new PrismaClient();

const getStatusLabel = (status: FormStatus): string => {
  switch (status) {
      case FormStatus.Draft: return 'Borrador';
      case FormStatus.Submitted: return 'Enviado';
      case FormStatus.Approved: return 'Aprobado';
      case FormStatus.Rejected: return 'Rechazado';
      case FormStatus.Signed: return 'Firmado';
      case FormStatus.Archived: return 'Archivado';
      default: return status;
  }
};

const formInstanceWithDetailsArgs = Prisma.validator<Prisma.FormInstanceDefaultArgs>()({
  include: {
      template: true,
      uploadedFiles: true,
  },
});

type FormInstanceWithDetails = Prisma.FormInstanceGetPayload<typeof formInstanceWithDetailsArgs>;

@Injectable()
export class FormInstanceService {

  constructor(@Inject(StorageService) private storageService: StorageService) {}

  private async validateInstanceData(templateId: number, data: Record<string, any>): Promise<void> {
      // ... (como antes, pero puedes añadir validación para objetos de archivo si es necesario)
      const template = await prisma.formTemplate.findUnique({
          where: { id: templateId },
          select: { structureDefinition: true }
      });
      if (!template || !template.structureDefinition) {
          console.warn(`Plantilla ${templateId} no encontrada o sin estructura. Saltando validación.`);
          return;
      }
      const structure = template.structureDefinition as unknown as FormFieldDefinition[];
      const requiredFields = structure.filter(field => field.required && field.type !== 'file'); // No validar 'required' de archivo aquí
      const receivedKeys = Object.keys(data);

      for (const field of requiredFields) {
          if (!receivedKeys.includes(field.name) || data[field.name] == null || data[field.name] === '') {
               throw new BadRequestException(`El campo requerido '${field.label}' (${field.name}) falta.`);
          }
      }
      // ... (resto de validaciones o advertencias)
  }


  async create(createDto: CreateFormInstanceDto, userId: number): Promise<PrismaFormInstance> {
      const template = await prisma.formTemplate.findUnique({ where: { id: createDto.templateId } });
      if (!template) {
          throw new NotFoundException(`Plantilla con ID ${createDto.templateId} no encontrada.`);
      }

      // Validar datos no-archivo
      await this.validateInstanceData(createDto.templateId, createDto.data);

      // Separar datos de archivo de los datos regulares
      const fileDataFields: Record<string, { storageKey: string; filename: string; mimeType?: string; size?: number }> = {};
      const regularData: Record<string, any> = {};
      const structure = (template.structureDefinition as unknown as FormFieldDefinition[]) || [];
      const fileFieldNames = new Set(structure.filter(f => f.type === 'file').map(f => f.name));

      for (const key in createDto.data) {
          const value = createDto.data[key];
          // Asumimos que el frontend envía { storageKey, filename, mimeType, size } para archivos
          if (fileFieldNames.has(key) && value && typeof value === 'object' && value.storageKey && value.filename) {
              fileDataFields[key] = value;
          } else {
              regularData[key] = value;
          }
      }

      // --- Usar Transacción Prisma para crear instancia y archivos ---
      try {
          const newInstanceWithFiles = await prisma.$transaction(async (tx) => {
              // 1. Crear la FormInstance con datos regulares
              const newInstance = await tx.formInstance.create({
                  data: {
                      data: regularData as Prisma.InputJsonValue,
                      status: createDto.status || FormStatus.Draft,
                      templateId: createDto.templateId,
                      ownerUserId: userId,
                  },
              });

              // 2. Crear los registros UploadedFile asociados
              for (const fieldName in fileDataFields) {
                  const fileInfo = fileDataFields[fieldName];
                  await tx.uploadedFile.create({
                      data: {
                          filename: fileInfo.filename,
                          storageKey: fileInfo.storageKey,
                          mimeType: fileInfo.mimeType || 'application/octet-stream',
                          size: fileInfo.size || 0,
                          fieldName: fieldName,
                          ownerUserId: userId,
                          formInstanceId: newInstance.id, // Asociar con la instancia recién creada
                      }
                  });
              }

              // 3. Devolver la instancia con sus relaciones (incluyendo la plantilla para consistencia)
              // Prisma Client dentro de una transacción no siempre permite includes complejos directamente
              // así que recargamos fuera si es necesario o devolvemos solo la instancia.
              // Para simplificar, devolvemos la instancia y el frontend puede recargar si necesita todo.
              // O, mejor, hacemos una última query dentro de la transacción para devolver todo.
              return tx.formInstance.findUnique({
                  where: { id: newInstance.id },
                  include: {
                      template: true,
                      uploadedFiles: true // Incluir los archivos recién creados
                  }
              });
          });

          if (!newInstanceWithFiles) { // Comprobación por si algo muy raro pasa en la transacción
              throw new InternalServerErrorException("No se pudo crear la instancia con archivos.");
          }
          return newInstanceWithFiles;

      } catch (error) {
          console.error("Error en transacción de creación de instancia y archivos:", error);
          // Si es un error de Prisma o cualquier otro, se revierte la transacción
          // Podríamos intentar borrar los archivos físicos si tenemos las storageKeys, pero es complejo
          throw new InternalServerErrorException("Error al crear la instancia del formulario.");
      }
  }


  async findAllForUser(userId: number): Promise<PrismaFormInstance[]> {
      return prisma.formInstance.findMany({
          where: { ownerUserId: userId },
          orderBy: { createdAt: 'desc' },
          include: {
              template: { select: { id: true, name: true, uniqueCode: true } },
              uploadedFiles: { select: { id: true, filename: true, fieldName: true } } // Incluir info básica de archivos
          }
      });
  }


  async findOneForUser(instanceId: number, userId: number): Promise<FormInstanceWithDetails> {
      const instance = await prisma.formInstance.findUnique({
          where: { id: instanceId },
          include: {
              template: true, // Incluir plantilla completa
              uploadedFiles: true // <-- ¡INCLUIR LOS ARCHIVOS ADJUNTOS!
          }
      });

      if (!instance) {
          throw new NotFoundException(`Instancia con ID ${instanceId} no encontrada.`);
      }
      if (instance.ownerUserId !== userId) {
          throw new ForbiddenException('No tienes permiso para acceder a esta instancia.');
      }
      return instance;
  }


  async update(instanceId: number, updateDto: UpdateFormInstanceDto, userId: number): Promise<PrismaFormInstance> {
      const existingInstance = await this.findOneForUser(instanceId, userId); // Ya incluye uploadedFiles
      if (existingInstance.status !== FormStatus.Draft) {
          throw new ForbiddenException(`No se puede editar un formulario en estado '${getStatusLabel(existingInstance.status)}'.`);
      }

      const regularDataUpdate: Record<string, any> = {};
      const newFileReferences: Record<string, any> = {}; // Para la lógica de actualización de archivos (futuro)

      const templateFromInstance = existingInstance.template as PrismaFormTemplate | null | undefined;

      if (updateDto.data) {
        if (!templateFromInstance) {
          // Esto sería muy raro si la relación es obligatoria y el include funciona
          console.error(`Error: No se encontró la plantilla asociada a la instancia ${instanceId} al actualizar.`);
          throw new InternalServerErrorException("No se pudo obtener la estructura de la plantilla para la validación.");
      }
      const templateStructure = (templateFromInstance.structureDefinition as unknown as FormFieldDefinition[]) || [];
          const fileFieldNames = new Set(templateStructure.filter(f => f.type === 'file').map(f => f.name));

          for (const key in updateDto.data) {
              const value = updateDto.data[key];
              if (fileFieldNames.has(key)) {
                  // Si el valor es un objeto con storageKey, es una referencia a un archivo (nuevo o existente)
                  // Si es null, significa que se quiere eliminar/desasociar el archivo
                  // Esta lógica se manejaría en una transacción con los pasos descritos arriba.
                  // Por ahora, simplemente NO incluimos los campos de archivo en 'regularDataUpdate'
                  // y asumimos que el frontend envía solo los archivos que deben permanecer o ser nuevos.
                  if (value && typeof value === 'object' && value.storageKey) {
                       newFileReferences[key] = value; // Guardar para futura lógica de creación/actualización de UploadedFile
                  } else if (value === null) {
                       newFileReferences[key] = null; // Marcar para posible eliminación
                  }
              } else {
                  regularDataUpdate[key] = value;
              }
          }
      }
      // ---- FIN LÓGICA SIMPLIFICADA ----

      // En una implementación completa, la actualización de UploadedFile y FormInstance iría en una transacción.
      // Por ahora, solo actualizamos los datos JSON y el estado.
      const updatedInstance = await prisma.formInstance.update({
          where: { id: instanceId },
          data: {
              data: updateDto.data ? (regularDataUpdate as Prisma.InputJsonValue) : undefined, // Solo datos no-archivo
              status: updateDto.status,
              // La actualización de la relación uploadedFiles se haría manejando los 'connect' y 'disconnect'
              // o creando/eliminando registros UploadedFile directamente en la transacción.
          },
          include: { template: true, uploadedFiles: true }
      });
      return updatedInstance;
  }
}