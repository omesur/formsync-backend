// src/common/storage/storage.module.ts
import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller'; 
// ConfigModule ya debería ser global si seguiste los pasos anteriores

@Module({
    controllers: [StorageController],
    providers: [StorageService],
    exports: [StorageService], // <-- Exportar para que otros módulos puedan usarlo
})
export class StorageModule {}