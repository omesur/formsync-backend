// src/common/storage/storage.controller.ts
import {
    Controller,
    Post, Get, Query, UseGuards, Request, BadRequestException, Param,
    UploadedFile, UseInterceptors, Res, 
    ForbiddenException, NotFoundException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Response } from 'express'; // <--- Asegurar import
import { PrismaClient } from '@prisma/client'; // <--- Asegurar import
import * as path from 'path'; // <--- Importar path
import * as fs from 'fs'; // <--- Importar fs

const prisma = new PrismaClient(); // O inyectar PrismaService

@UseGuards(JwtAuthGuard)
@Controller('storage')
export class StorageController {
    constructor(private readonly storageService: StorageService) {}

    private getUserId(req: any): number {
        if (!req.user?.id) throw new Error("User ID not found");
        return req.user.id;
    }

    @Post('upload-local')
    @UseInterceptors(FileInterceptor('file'))
    async uploadLocalFile(
        @Request() req,
        @UploadedFile() file: Express.Multer.File,
    ) {
         // ... (pega aquí la lógica completa de uploadLocalFile de la respuesta anterior) ...
          if (!file) throw new BadRequestException('No se proporcionó ningún archivo.');
          const userId = this.getUserId(req);
          const fileInfo = await this.storageService.saveLocalFile(file, userId);
          return { storageKey: fileInfo.storageKey, filename: fileInfo.filename, mimeType: fileInfo.mimeType, size: fileInfo.size };
    }

    @Get('download-local/file/:fileId')
    async downloadLocalFileById(
         @Request() req,
         @Param('fileId') fileIdParam: string,
         @Res() res: Response,
     ) {
         // ... (pega aquí la lógica completa de downloadLocalFileById de la respuesta anterior) ...
         // Debe buscar en BD, verificar permiso y usar res.download(filePath, filename);
          const fileId = parseInt(fileIdParam, 10);
          if (isNaN(fileId)) throw new BadRequestException('ID de archivo inválido.');
          const userId = this.getUserId(req);
          const fileRecord = await prisma.uploadedFile.findUnique({ where: { id: fileId } });
          if (!fileRecord) throw new NotFoundException(/*...*/);
          if (fileRecord.ownerUserId !== userId) throw new ForbiddenException(/*...*/);
          const filePath = path.join(process.cwd(), 'uploads', fileRecord.storageKey);
           if (fs.existsSync(filePath)) {
               res.download(filePath, fileRecord.filename, (err) => {
                   if (err && !res.headersSent) {
                      console.error("Error sending file with res.download:", err);
                      res.status(500).send("Error al descargar el archivo.");
                   } else if (err) {
                      console.error("Error sending file after headers sent:", err);
                   }
               });
           } else {
               throw new NotFoundException("Archivo físico no encontrado en el servidor.");
           }
     }
}