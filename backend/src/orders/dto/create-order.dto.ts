import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { LensSide, OrderStatus, SourceType } from '../entities/order.entity';

export class CreateOrderDto {
  @IsInt()
  customerId!: number;

  @IsOptional()
  @IsInt()
  visionTestId?: number;

  @IsEnum(SourceType)
  frameSourceType!: SourceType;

  @IsOptional()
  @IsInt()
  frameStockId?: number;

  @IsOptional()
  @IsString()
  frameBrand?: string;

  @IsOptional()
  @IsString()
  frameCode?: string;

  @IsOptional()
  @IsString()
  frameColor?: string;

  @IsNumber()
  @Min(0)
  framePrice!: number;

  @IsEnum(SourceType)
  lensSourceType!: SourceType;

  @IsOptional()
  @IsInt()
  lensId?: number;

  @IsEnum(LensSide)
  lensSide!: LensSide;

  @IsOptional()
  @IsString()
  lensFactory?: string;

  @IsOptional()
  @IsString()
  lensTypeName?: string;

  @IsOptional()
  @IsString()
  lensCoating?: string;

  @IsNumber()
  @Min(0)
  lensPrice!: number;

  @IsOptional()
  @IsString()
  prescriptionNote?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  payment?: number;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}
