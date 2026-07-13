import { IsNotEmpty, IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBannerDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  subtitle?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  ctaLabel?: string;

  @IsString()
  @IsOptional()
  link?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export class UpdateBannerDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  subtitle?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  ctaLabel?: string;

  @IsString()
  @IsOptional()
  link?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
