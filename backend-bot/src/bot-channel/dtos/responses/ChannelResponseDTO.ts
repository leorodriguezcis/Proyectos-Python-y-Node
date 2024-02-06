import { ApiProperty } from '@nestjs/swagger';
import { ChannelStatus } from 'src/entities/channel';

export class ChannelResponseDTO {
  @ApiProperty()
  id: number;
  @ApiProperty()
  name: string;
  @ApiProperty({ enum: ChannelStatus })
  status: ChannelStatus;
}
