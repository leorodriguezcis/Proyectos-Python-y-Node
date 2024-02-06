import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateBotDTO {
  @IsString()
  @ApiProperty({ required: false })
  name: string;

  @IsString()
  @ApiProperty({ required: false })
  objective: string;

  @ApiProperty({
    type: 'file',
    required: false,
    items: { type: 'file', items: { type: 'string', format: 'binary' } },
  })
  avatar: Express.Multer.File;

  @IsString()
  @ApiProperty({ required: false })
  newMemberWelcome: string;

  @IsString()
  @ApiProperty({ required: false })
  inactivityMessage: string;
}
