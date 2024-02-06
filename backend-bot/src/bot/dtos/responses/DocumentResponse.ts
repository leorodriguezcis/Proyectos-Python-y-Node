import { ApiProperty } from '@nestjs/swagger';

export class DocumentResponse {
  @ApiProperty()
  url: string;
  @ApiProperty()
  filename: string;
}
