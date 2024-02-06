import { ApiProperty } from '@nestjs/swagger';
import { Bot, BotStatus } from 'src/entities/bot';
import { toInstance } from 'src/utils/instanciator';
import { ResponseDTO } from 'src/utils/ResponseDTO';

export class PartialBotResponseDTO extends ResponseDTO {
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
  @ApiProperty()
  avatar: string | null;

  static from(botEntity: Bot): PartialBotResponseDTO {
    const { active, name, id, status, objective, avatar } = botEntity;
    return toInstance(PartialBotResponseDTO, { active, name, id, status, objective, avatar });
  }
}
