import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  Min,
} from 'class-validator';

export class DeleteUsersDto {
  @ApiProperty({ example: [1, 2, 3] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @Transform(({ value }: { value: unknown }) =>
    Array.isArray(value) ? value.map((item) => Number(item)) : value,
  )
  @IsInt({ each: true })
  @Min(1, { each: true })
  accountIds: number[];
}
