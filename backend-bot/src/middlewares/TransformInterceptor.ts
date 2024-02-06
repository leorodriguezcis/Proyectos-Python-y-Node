import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Bot } from 'src/entities/bot';
import { EntityToDTOMapper, MaybeArray } from 'src/mappers/EntityToDTOMapper';
import { ChatBotDTO } from 'src/utils/dtos';
import { ResponseDTO } from 'src/utils/ResponseDTO';

export class TransformInterceptor<T extends MaybeArray<Bot>>
  implements NestInterceptor<T, MaybeArray<ChatBotDTO>>
{
  private mapper: EntityToDTOMapper = new EntityToDTOMapper();

  constructor(private dtoCls?: typeof ResponseDTO) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<MaybeArray<ChatBotDTO>> {
    return next
      .handle()
      .pipe(map((data) => this.mapper.map(data, context.switchToHttp().getRequest(), this.dtoCls)));
  }
}
