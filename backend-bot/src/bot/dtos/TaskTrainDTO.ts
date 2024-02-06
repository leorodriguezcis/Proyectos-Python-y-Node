import { ApiProperty } from '@nestjs/swagger';

export class TaskTrainDTO {
  @ApiProperty()
  group_id: number;
  @ApiProperty()
  status_docs: string;
}
