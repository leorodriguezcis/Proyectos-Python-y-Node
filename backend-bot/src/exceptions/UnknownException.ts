import { BotException } from './BotException';

export class UnknownException extends BotException {
  constructor(message?: string) {
    super({ statusCode: 400, message: message ?? 'Bad request' }, 400);
  }
}
