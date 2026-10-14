import { IsNotEmpty, IsString, IsNumber, IsBoolean, IsOptional, Min, IsIn, IsArray, ArrayMaxSize, ValidateNested, IsInt, MaxLength } from 'class-validator';
import { Type, Transform } from 'class-transformer';

const toBool = ({ value }: { value: any }) =>
  value === true || value === 'true' || value === '1';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  compareAtPrice?: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  costPrice?: number | null;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsBoolean()
  @IsOptional()
  halalCertified?: boolean;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  images?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  stock?: number;
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  price?: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  compareAtPrice?: number | null;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  costPrice?: number | null;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsBoolean()
  @IsOptional()
  halalCertified?: boolean;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  images?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;
}

export class SearchProductsDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  categorySlug?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  limit?: number = 10;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  minPrice?: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  maxPrice?: number;

  @IsBoolean()
  @Transform(toBool)
  @IsOptional()
  halalOnly?: boolean;

  @IsBoolean()
  @Transform(toBool)
  @IsOptional()
  featuredOnly?: boolean;

  @IsBoolean()
  @Transform(toBool)
  @IsOptional()
  onSaleOnly?: boolean;

  @IsBoolean()
  @Transform(toBool)
  @IsOptional()
  includeInactive?: boolean;

  @IsString()
  @IsIn(['newest', 'price_low', 'price_high', 'featured'])
  @IsOptional()
  sort?: string;
}

/** One spreadsheet row. Blank cells on an existing SKU leave that field alone. */
export class ImportProductRowDto {
  @IsOptional() @IsString() sku?: string;
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @IsOptional() @IsString() @MaxLength(80) category?: string;
  @IsOptional() @Type(() => Number) @IsNumber() price?: number;
  @IsOptional() @Type(() => Number) @IsNumber() compareAtPrice?: number;
  @IsOptional() @Type(() => Number) @IsNumber() costPrice?: number;
  @IsOptional() @Type(() => Number) @IsNumber() stock?: number;
  @IsOptional() @IsBoolean() halalCertified?: boolean;
  @IsOptional() @IsBoolean() isFeatured?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString() imageUrl?: string;
  /** Extra gallery image URLs. */
  @IsOptional() @IsArray() @IsString({ each: true }) images?: string[];
  @IsOptional() @Type(() => Number) @IsInt() line?: number;
}

export class ImportProductsDto {
  @IsArray() @ArrayMaxSize(5000) @ValidateNested({ each: true }) @Type(() => ImportProductRowDto)
  rows: ImportProductRowDto[];
  @IsOptional() @IsBoolean() dryRun?: boolean;
}

export class BulkProductsDto {
  @IsArray() @ArrayMaxSize(1000) @IsString({ each: true }) ids: string[];
  @IsIn(['activate', 'hide', 'feature', 'unfeature', 'delete']) action: string;
}
