import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateVisionTestDto {
  @IsInt()
  customerId!: number;

  @IsOptional()
  @IsBoolean()
  hasVisionDetails?: boolean;

  @IsOptional()
  @IsString()
  rSph?: string;

  @IsOptional()
  @IsString()
  rCyl?: string;

  @IsOptional()
  @IsString()
  rAxis?: string;

  @IsOptional()
  @IsString()
  rAdd?: string;

  @IsOptional()
  @IsString()
  rVa?: string;

  @IsOptional()
  @IsString()
  lSph?: string;

  @IsOptional()
  @IsString()
  lCyl?: string;

  @IsOptional()
  @IsString()
  lAxis?: string;

  @IsOptional()
  @IsString()
  lAdd?: string;

  @IsOptional()
  @IsString()
  lVa?: string;

  @IsOptional()
  @IsString()
  pd?: string;

  @IsOptional()
  @IsString()
  height?: string;

  @IsOptional()
  @IsString()
  rightPd?: string;

  @IsOptional()
  @IsString()
  leftPd?: string;

  @IsOptional()
  @IsString()
  rightHeight?: string;

  @IsOptional()
  @IsString()
  leftHeight?: string;

  @IsOptional()
  @IsString()
  refractionRemark?: string;

  @IsOptional()
  @IsBoolean()
  sugar?: boolean;

  @IsOptional()
  @IsBoolean()
  cataract?: boolean;

  @IsOptional()
  @IsString()
  abnormalities?: string;
}
