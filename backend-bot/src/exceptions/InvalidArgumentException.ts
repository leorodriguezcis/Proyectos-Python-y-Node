import { BotException } from './BotException';

export class InvalidArgumentException extends BotException {
  constructor(message?: string | Record<string, any>) {
    super({ statusCode: 400, message: message ?? 'Bad request' }, 400);
  }
}
