// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config'; // Importar ConfigModule
import { FormTemplateModule } from './form-template/form-template.module';
import { FormTemplateService } from './form-template/form-template.service';
import { FormTemplateController } from './form-template/form-template.controller';
import { FormInstanceModule } from './form-instance/form-instance.module';
import { FormInstanceService } from './form-instance/form-instance.service';
import { FormInstanceController } from './form-instance/form-instance.controller';
import { StorageModule } from './common/storage/storage.module';
import { StorageService } from './common/storage/storage.service';


@Module({
  imports: [
    ConfigModule.forRoot({ // Configurar para que sea global
      isGlobal: true,
    }),
    AuthModule,
    UserModule,
    FormTemplateModule,
    FormInstanceModule,
    StorageModule,
  ],
  controllers: [AppController, FormTemplateController, FormInstanceController],
  providers: [AppService, FormTemplateService, FormInstanceService, StorageService],
})
export class AppModule {}