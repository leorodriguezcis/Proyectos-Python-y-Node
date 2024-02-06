import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BotModule } from './bot/bot.module';
import { sqlClient } from './config/sql-client';
import { AzureStorageModule } from './azure-storage/azure-storage.module';
import { Bot } from './entities/bot';
import { BotChannelModule } from './bot-channel/bot-channel.module';
import { Channel } from './entities/channel';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { User } from './entities/user';

const entities = [Bot, Channel, User];
@Module({
  imports: [
    TypeOrmModule.forFeature(entities),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AzureStorageModule,
    TypeOrmModule.forRoot(sqlClient()),
    BotModule,
    BotChannelModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
