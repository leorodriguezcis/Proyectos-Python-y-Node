import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Bot } from 'src/entities/bot';
import { Channel } from 'src/entities/channel';
import { User } from 'src/entities/user';

export const sqlClient = (): TypeOrmModuleOptions => ({
  type: 'mssql',
  host: process.env.SQL_HOST,
  username: process.env.SQL_USERNAME,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DB_NAME,
  entities: [Bot, Channel, User],
  synchronize: process.env.SQL_SYNCHRONIZE === 'true',
  logger: 'advanced-console',
  logging: ['warn', 'error'],
  extra: {
    trustServerCertificate: true,
  },
});
