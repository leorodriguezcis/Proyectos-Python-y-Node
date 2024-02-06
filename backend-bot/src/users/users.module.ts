import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { HashService } from 'src/auth/utils/hash.service';
import { TransactionService } from 'src/transaction/transaction.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, HashService, TransactionService],
  exports: [UsersService],
})
export class UsersModule {}
