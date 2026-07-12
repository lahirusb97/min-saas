import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateAccessoryDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsInt()
  @Min(0)
  qty!: number;

  @IsInt()
  @Min(0)
  price!: number;
}
