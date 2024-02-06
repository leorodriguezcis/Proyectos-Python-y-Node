import { HttpException, BadRequestException, NotFoundException } from '@nestjs/common';
import { BotException } from 'src/exceptions/BotException';
import { InvalidArgumentException } from 'src/exceptions/InvalidArgumentException';
import { NotFoundException as ChatBotNotFoundException } from 'src/exceptions/NotFoundException';
import Mapper from './AbstractMapper';

export class BotToHttpExceptionMapper extends Mapper<Error, HttpException> {
  private exceptions = [ChatBotNotFoundException, InvalidArgumentException];
  private httpErrors = {
    NotFoundException: NotFoundException,
    InvalidArgumentException: BadRequestException,
  };

  map(error: Error): HttpException {
    if (error instanceof BotException) {
      return this.mapChatbotException(error);
    }
    if (error instanceof HttpException) return error;
    return new BadRequestException('Bad Request');
  }

  private mapChatbotException(error: BotException) {
    const ExceptionType: typeof BotException | undefined = this.exceptions.find(
      (type) => error instanceof type,
    );
    const [Exception, message] =
      ExceptionType !== undefined
        ? [this.httpErrors[ExceptionType.name], error.message]
        : [BadRequestException, 'BadRequest'];
    return new Exception(message);
  }
}
