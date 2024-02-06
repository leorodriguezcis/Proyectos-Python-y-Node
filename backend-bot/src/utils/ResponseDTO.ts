import { Bot } from 'src/entities/bot';
import { UnknownException } from 'src/exceptions/UnknownException';
import { EntityToDTOMapper, MaybeArray } from 'src/mappers/EntityToDTOMapper';
import { ChatBotDTO } from 'src/utils/dtos';

export abstract class ResponseDTO {
  static from(entity: Bot, request: any, mapper: EntityToDTOMapper): MaybeArray<ChatBotDTO> {
    throw new UnknownException('Unknown error');
  }
}
