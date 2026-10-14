import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { StockMovementType } from '@prisma/client';

const toBool = ({ value }: { value: any }) => value === true || value === 'true' || value === '1';

const MOVEMENT_TYPES = Object.values(StockMovementType);
/** Reasons an admin can pick for a manual change (sales come from orders). */
const MANUAL_REASONS = ['RESTOCK', 'ADJUSTMENT', 'RETURN', 'DAMAGE'] as const;

export class InventoryQueryDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsIn(['all', 'in', 'low', 'out']) status?: 'all' | 'in' | 'low' | 'out';
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsIn(['available', 'title', 'sold', 'value', 'updated']) sort?: string;
  @IsOptional() @IsIn(['asc', 'desc']) order?: 'asc' | 'desc';
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(500) limit?: number;
  /** Return every row (for spreadsheet export). */
  @IsOptional() @Transform(toBool) @IsBoolean() all?: boolean;
}

export class AdjustStockDto {
  /** add = received, remove = taken out, set = physical recount. */
  @IsOptional() @IsIn(['add', 'remove', 'set']) mode?: 'add' | 'remove' | 'set';
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(1_000_000) quantity?: number;
  @IsOptional() @IsIn(MANUAL_REASONS) reason?: (typeof MANUAL_REASONS)[number];
  @IsOptional() @IsString() @MaxLength(300) note?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100_000) lowStockThreshold?: number;
}

export class MovementsQueryDto {
  @IsOptional() @IsString() productId?: string;
  @IsOptional() @IsIn(MOVEMENT_TYPES) type?: StockMovementType;
  @IsOptional() @IsIn(['ONLINE', 'OFFLINE']) channel?: 'ONLINE' | 'OFFLINE';
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() from?: string;
  @IsOptional() @IsString() to?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(500) limit?: number;
  @IsOptional() @Transform(toBool) @IsBoolean() all?: boolean;
}

export class ImportStockRowDto {
  @IsOptional() @IsString() sku?: string;
  @Type(() => Number) @IsNumber() quantity: number;
  /** Spreadsheet line number, echoed back in the report. */
  @IsOptional() @Type(() => Number) @IsInt() line?: number;
}

export class ImportStockDto {
  /** set = the sheet is a stock count; add = the sheet lists goods received. */
  @IsIn(['set', 'add']) mode: 'set' | 'add';
  @IsArray() @ArrayMaxSize(5000) @ValidateNested({ each: true }) @Type(() => ImportStockRowDto)
  rows: ImportStockRowDto[];
  @IsOptional() @IsBoolean() dryRun?: boolean;
  @IsOptional() @IsString() @MaxLength(300) note?: string;
}
