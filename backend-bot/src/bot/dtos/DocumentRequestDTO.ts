import { ApiProperty } from '@nestjs/swagger';

export class DocumentRequestDTO {
  @ApiProperty({
    type: 'file',
    required: true,
    items: { type: 'file', items: { type: 'string', format: 'binary' } },
  })
  document: Express.Multer.File;
}
