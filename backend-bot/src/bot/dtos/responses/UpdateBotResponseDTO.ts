import { ApiProperty } from '@nestjs/swagger';

export class UpdateBotResponseDTO {
  @ApiProperty()
  isUpdated: boolean;
}
