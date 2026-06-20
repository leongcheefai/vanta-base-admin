import { Type } from "class-transformer";
import {
	IsNumber,
	IsOptional,
	IsString,
	MaxLength,
	Min,
	MinLength,
} from "class-validator";

export class UpdateProductDto {
	@IsOptional()
	@IsString()
	@MinLength(1)
	@MaxLength(200)
	name?: string;

	@IsOptional()
	@IsString()
	@MinLength(1)
	@MaxLength(100)
	sku?: string;

	@IsOptional()
	@IsString()
	@MaxLength(5000)
	description?: string;

	@IsOptional()
	@Type(() => Number)
	@IsNumber({ maxDecimalPlaces: 2 })
	@Min(0)
	price?: number;

	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	@Min(0)
	reorderPoint?: number;

	@IsOptional()
	@IsString()
	categoryId?: string | null;

	@IsOptional()
	@IsString()
	imageUrl?: string | null;
}
