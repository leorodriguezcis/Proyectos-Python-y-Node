/* eslint-disable @typescript-eslint/no-unused-vars */
import { Module } from '@nestjs/common';
import { BotChannelService } from './bot-channel.service';
import { BotChannelController } from './bot-channel.controller';
import { TransactionService } from 'src/transaction/transaction.service';
import { BullModule } from '@nestjs/bull';
import { BotBuilderAzure } from 'src/bot-azure-creator/azure-services';
import { ChannelProcessorConsumer } from '../processors/bot-channel-processor';
import { AzureStorageService } from 'src/azure-storage/azure-storage.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisClient } from 'src/config/redis-client';
import { UsersModule } from 'src/users/users.module';
@Module({
  imports: [
    ConfigModule.forRoot(),
    BullModule.forRoot({
      redis: redisClient(),
    }),
    BullModule.registerQueueAsync({
      name: 'channel',
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: redisClient(),
      }),
      inject: [ConfigService],
    }),
    HttpModule.register({
      timeout: 50000,
      maxRedirects: 5,
    }),
    UsersModule,
  ],
  controllers: [BotChannelController],
  providers: [
    BotChannelService,
    TransactionService,
    BotBuilderAzure,
    ChannelProcessorConsumer,
    AzureStorageService,
  ],
})
export class BotChannelModule {}
