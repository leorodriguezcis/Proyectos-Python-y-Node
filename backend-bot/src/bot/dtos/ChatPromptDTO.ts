import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ChatPromptDTO {
  @ApiProperty()
  @IsString()
  prompt: string;
}
