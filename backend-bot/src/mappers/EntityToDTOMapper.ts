import { Injectable } from '@nestjs/common/decorators';
import { Bot } from 'src/entities/bot';
import { UnknownException } from 'src/exceptions/UnknownException';
import { ChatBotDTO } from 'src/utils/dtos';
import { ResponseDTO } from 'src/utils/ResponseDTO';
import Mapper from './AbstractMapper';
export type MaybeArray<T> = T | Array<T>;

@Injectable()
export class EntityToDTOMapper extends Mapper<Bot, ChatBotDTO> {
  map<T extends Bot, R extends ChatBotDTO>(source: T, request?: any, dtoCls?: typeof ResponseDTO): R;
  map<T extends Bot, R extends ChatBotDTO>(
    source: Array<T>,
    request?: any,
    dtoCls?: typeof ResponseDTO,
  ): Array<R>;

  map(source: MaybeArray<Bot>, request: any = {}, dtoCls?: typeof ResponseDTO): MaybeArray<ChatBotDTO> {
    if (!dtoCls) throw new UnknownException('Unknown error');
    if (source instanceof Array) return source.map((source) => this.map(source, request, dtoCls));
    return dtoCls.from(source, request, this);
  }
}
