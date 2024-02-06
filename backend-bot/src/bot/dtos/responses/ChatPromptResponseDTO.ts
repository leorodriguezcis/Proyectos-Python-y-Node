import { ApiProperty } from '@nestjs/swagger';

export class ChatPromptResponseDTO {
  @ApiProperty()
  text: string;
}
