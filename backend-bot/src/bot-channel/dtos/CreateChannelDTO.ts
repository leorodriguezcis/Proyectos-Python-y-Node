import { ApiProperty } from '@nestjs/swagger';

export class CreateChannelDTO {
  @ApiProperty({ default: 'msteams' })
  channel: string;
  @ApiProperty()
  appId: string;
  @ApiProperty()
  appPassword: string;
  @ApiProperty()
  tenant: string;
  @ApiProperty()
  resource: string;
  @ApiProperty()
  subscriptionId: string;
}
