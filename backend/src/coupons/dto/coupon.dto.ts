import { IsNotEmpty, IsString, IsNumber, IsBoolean, IsOptional, IsIn, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCouponDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsIn(['PERCENT', 'FIXED'])
  type: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  value: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  minOrderAmount?: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  maxDiscount?: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  usageLimit?: number;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}

export class UpdateCouponDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsIn(['PERCENT', 'FIXED'])
  @IsOptional()
  type?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  value?: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  minOrderAmount?: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  maxDiscount?: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  usageLimit?: number;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsDateString()
  @IsOptional()
  expiresAt?: string | null;
}

export class ValidateCouponDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  subtotal: number;
}
