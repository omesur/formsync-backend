// src/common/storage/storage.service.ts
import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs'; // <--- Importar fs
import * as path from 'path'; // <--- Importar path
import { Response } from 'express'; // <--- Importar Response

@Injectable()
export class StorageService {
    private readonly uploadsLocalPath: string;

    constructor(private configService: ConfigService) {
        this.uploadsLocalPath = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(this.uploadsLocalPath)) {
            fs.mkdirSync(this.uploadsLocalPath, { recursive: true });
        }
    }

    async saveLocalFile(file: Express.Multer.File, userId: number): Promise<{ storageKey: string; filename: string; mimeType: string; size: number }> {
        // ... (pega aquí la lógica completa de saveLocalFile de la respuesta anterior) ...
        // Asegúrate que usa fs.promises.writeFile(fullPath, file.buffer);
         try {
             const originalFilename = file.originalname;
             const uniqueSuffix = uuidv4();
             const fileExtension = path.extname(originalFilename);
             const baseFilename = path.basename(originalFilename, fileExtension);
             const userUploadsPath = path.join(this.uploadsLocalPath, `user_${userId}`);
             if (!fs.existsSync(userUploadsPath)) {
                 fs.mkdirSync(userUploadsPath, { recursive: true });
             }
             const serverFilename = `${baseFilename.replace(/[^a-zA-Z0-9_-]/g, '_')}_${uniqueSuffix}${fileExtension}`;
             const storageKey = path.join(`user_${userId}`, serverFilename);
             const fullPath = path.join(this.uploadsLocalPath, storageKey);
             await fs.promises.writeFile(fullPath, file.buffer);
             return { storageKey, filename: originalFilename, mimeType: file.mimetype, size: file.size };
         } catch (error) {
             console.error("Error saving file locally:", error);
             throw new InternalServerErrorException("No se pudo guardar el archivo.");
         }
    }

    async serveLocalFile(storageKey: string, res: Response): Promise<void> {
         // ... (pega aquí la lógica completa de serveLocalFile de la respuesta anterior) ...
         // Debe usar path.join y res.sendFile(filePath, (err) => {...});
          const filePath = path.join(this.uploadsLocalPath, storageKey);
          if (fs.existsSync(filePath)) {
              res.sendFile(filePath, (err) => {
                  if (err) {
                      console.error("Error sending file:", err);
                  }
              });
          } else {
              throw new NotFoundException("Archivo no encontrado.");
          }
    }

     async deleteLocalFile(storageKey: string): Promise<void> {
          // ... (pega aquí la lógica completa de deleteLocalFile de la respuesta anterior) ...
          // Debe usar path.join y fs.promises.unlink(filePath);
           const filePath = path.join(this.uploadsLocalPath, storageKey);
           try {
               if (fs.existsSync(filePath)) {
                   await fs.promises.unlink(filePath);
                   console.log(`Successfully deleted local file ${filePath}`);
               } else {
                   console.warn(`Attempted to delete non-existent local file ${filePath}`);
               }
           } catch (error) {
               console.error(`Error deleting local file ${filePath}:`, error);
           }
     }
}