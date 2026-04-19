import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status!: 'ok';

  @ApiProperty({ example: 'up' })
  database!: 'up';

  @ApiProperty({ example: 42.13 })
  uptime!: number;

  @ApiProperty({ example: '2026-04-19T08:00:00.000Z' })
  timestamp!: string;
}
