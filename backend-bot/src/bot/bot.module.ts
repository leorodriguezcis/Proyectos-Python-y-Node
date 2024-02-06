import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { BotController } from './bot.controller';
import { HttpModule } from '@nestjs/axios';
import { TransactionService } from 'src/transaction/transaction.service';
import { AzureStorageService } from 'src/azure-storage/azure-storage.service';
import { ApiDocument } from 'src/service-client/api.document';
import { GenericChatbot } from 'src/bots/GenericChatbot';
import { BotBuilderAzure } from 'src/bot-azure-creator/azure-services';
import { MsTeamsBot } from 'src/bots/MsTeamsBot';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 50000,
      maxRedirects: 5,
    }),
    UsersModule,
  ],
  controllers: [BotController],
  providers: [
    BotService,
    TransactionService,
    AzureStorageService,
    ApiDocument,
    GenericChatbot,
    BotBuilderAzure,
    MsTeamsBot,
  ],
})
export class BotModule {}
