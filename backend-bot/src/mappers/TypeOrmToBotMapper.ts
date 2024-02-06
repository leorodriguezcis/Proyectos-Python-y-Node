import { BotException } from 'src/exceptions/BotException';
import Mapper from './AbstractMapper';
import { EntityNotFoundError, QueryFailedError, TypeORMError } from 'typeorm';
import { UnknownException } from 'src/exceptions/UnknownException';
import { NotFoundException } from '@nestjs/common';
import { InvalidArgumentException } from 'src/exceptions/InvalidArgumentException';

export class TypeOrmToBotException extends Mapper<Error, BotException> {
  map(error: Error): BotException {
    console.log(error);
    if (error instanceof TypeORMError) {
      return this.typeORMToBotException(error);
    }
    if (error instanceof BotException) return error;
    return new UnknownException('Unknown error');
  }

  private typeORMToBotException(error: TypeORMError): BotException {
    if (error instanceof EntityNotFoundError) {
      return new NotFoundException('Not found');
    }
    if (error instanceof QueryFailedError) {
      return new InvalidArgumentException('Invalid argument');
    }
    return new UnknownException('Unknown error');
  }
}
