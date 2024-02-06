import { BotException } from 'src/exceptions/BotException';
import { DocumentException } from 'src/exceptions/DocumentException';
import Mapper from './AbstractMapper';

export class DocumentExceptionMapper extends Mapper<DocumentException, BotException> {
  map(error: DocumentException): BotException {
    return new BotException(error.message, error.status);
  }
}
