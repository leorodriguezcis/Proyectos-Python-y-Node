import { ApiProperty } from '@nestjs/swagger';
import { Bot } from 'src/entities/bot';
import { toInstance } from 'src/utils/instanciator';
import { PartialBotResponseDTO } from './PartialBotResponseDTO';

export class BotResponseDTO extends PartialBotResponseDTO {
  @ApiProperty()
  newMemberWelcome: string;
  @ApiProperty()
  inactivityMessage: string;

  static from(botEntity: Bot): PartialBotResponseDTO {
    const { active, name, id, status, objective, inactivityMessage, newMemberWelcome } = botEntity;
    return toInstance(PartialBotResponseDTO, {
      active,
      name,
      id,
      status,
      objective,
      inactivityMessage,
      newMemberWelcome,
    });
  }
}
