import { ApiProperty } from '@nestjs/swagger';

export class DocumentsRequestDTO {
  @ApiProperty({
    type: 'array',
    required: true,
    items: { type: 'file', format: 'binary' },
  })
  documents: Express.Multer.File[];
}
