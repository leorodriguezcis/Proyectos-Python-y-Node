import { Module } from '@nestjs/common';
import { AzureStorageService } from './azure-storage.service';
import { AzureStorageController } from './azure-storage.controller';

@Module({
  controllers: [AzureStorageController],
  providers: [AzureStorageService],
})
export class AzureStorageModule {}
