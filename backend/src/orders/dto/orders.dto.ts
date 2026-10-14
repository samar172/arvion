import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { OrderStatus, SalesChannel } from '@prisma/client';
import { Type } from 'class-transformer';

export class CheckoutItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;
}

export class CheckoutDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items: CheckoutItemDto[];

  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @IsNotEmpty()
  shippingAddress: string;

  @IsString()
  @IsOptional()
  couponCode?: string;
}

export class VerifyPaymentDto {
  @IsString()
  @IsNotEmpty()
  razorpayOrderId: string;

  @IsString()
  @IsNotEmpty()
  razorpayPaymentId: string;

  @IsString()
  @IsNotEmpty()
  razorpaySignature: string;
}

export const SHOP_PAYMENT_METHODS = ['CASH', 'UPI', 'CARD', 'OTHER'] as const;

export class OrdersQueryDto {
  @IsOptional() @IsIn(Object.values(SalesChannel)) channel?: SalesChannel;
  @IsOptional() @IsIn(Object.values(OrderStatus)) status?: OrderStatus;
  @IsOptional() @IsString() from?: string;
  @IsOptional() @IsString() to?: string;
}

export class UpdateOrderStatusDto {
  @IsIn(Object.values(OrderStatus)) status: OrderStatus;
}

export class OfflineSaleItemDto {
  @IsString() @IsNotEmpty() productId: string;
  @Type(() => Number) @IsInt() @Min(1) quantity: number;
  /** Override the catalogue price (e.g. a negotiated shop price). */
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) unitPrice?: number;
}

export class OfflineSaleDto {
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(200) @ValidateNested({ each: true }) @Type(() => OfflineSaleItemDto)
  items: OfflineSaleItemDto[];
  @IsOptional() @IsString() @MaxLength(120) customerName?: string;
  @IsOptional() @IsString() @MaxLength(30) customerPhone?: string;
  @IsOptional() @IsIn(SHOP_PAYMENT_METHODS) paymentMethod?: (typeof SHOP_PAYMENT_METHODS)[number];
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) discountAmount?: number;
  @IsOptional() @IsString() @MaxLength(300) note?: string;
  /** Backdate a sale recorded after the fact (ISO date). */
  @IsOptional() @IsString() soldAt?: string;
}

export class ImportOfflineSaleRowDto {
  @IsOptional() @IsString() bill?: string;
  @IsOptional() @IsString() date?: string;
  @IsOptional() @IsString() sku?: string;
  @Type(() => Number) @IsNumber() quantity: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) unitPrice?: number;
  @IsOptional() @IsIn(SHOP_PAYMENT_METHODS) paymentMethod?: (typeof SHOP_PAYMENT_METHODS)[number];
  @IsOptional() @IsString() @MaxLength(120) customerName?: string;
  @IsOptional() @IsString() @MaxLength(30) customerPhone?: string;
  @IsOptional() @Type(() => Number) @IsInt() line?: number;
}

export class ImportOfflineSalesDto {
  @IsArray() @ArrayMaxSize(5000) @ValidateNested({ each: true }) @Type(() => ImportOfflineSaleRowDto)
  rows: ImportOfflineSaleRowDto[];
  @IsOptional() @IsBoolean() dryRun?: boolean;
}
