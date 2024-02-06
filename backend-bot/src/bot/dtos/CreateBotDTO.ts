/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateBotDTO {
  @IsString()
  @ApiProperty()
  name: string;

  @IsString()
  @ApiProperty()
  objective: string;

  @IsOptional()
  @ApiProperty({
    type: 'file',
    required: false,
    items: { type: 'file', items: { type: 'string', format: 'binary' } },
  })
  avatar: Express.Multer.File;

  @ApiProperty({
    type: 'array',
    required: true,
    items: { type: 'file', format: 'binary' },
  })
  documents: Express.Multer.File[];
}
