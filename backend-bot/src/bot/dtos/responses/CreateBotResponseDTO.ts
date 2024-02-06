/* eslint-disable @typescript-eslint/no-unused-vars */
import { ApiProperty } from '@nestjs/swagger';
import { Bot, BotStatus } from 'src/entities/bot';
import { toInstance } from 'src/utils/instanciator';
import { ResponseDTO } from 'src/utils/ResponseDTO';

export class CreateBotResponseDTO extends ResponseDTO {
  @ApiProperty()
  id: number;
  @ApiProperty()
  name: string;
  @ApiProperty()
  objective: string;
  @ApiProperty()
  active: boolean;
  @ApiProperty({ enum: BotStatus })
  status: BotStatus;

  static from(botEntity: Bot): CreateBotResponseDTO {
    const { active, name, id, status, objective } = botEntity;
    return toInstance(CreateBotResponseDTO, {
      id,
      name,
      objective,
      active,
      status,
    });
  }
}
