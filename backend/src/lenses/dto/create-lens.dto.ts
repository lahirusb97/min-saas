import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateLensDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  coating?: string;

  @IsOptional()
  @IsString()
  factory?: string;

  @IsNumber()
  @Min(0)
  price!: number;
}
