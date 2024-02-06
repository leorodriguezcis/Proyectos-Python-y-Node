import { BotException } from './BotException';

export class NotFoundException extends BotException {
  constructor(message?: string) {
    super({ statusCode: 404, message: message ?? 'Not found' }, 404);
  }
}
