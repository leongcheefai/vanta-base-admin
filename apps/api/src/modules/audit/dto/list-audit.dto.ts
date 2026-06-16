import { Type } from "class-transformer";
import {
	IsDateString,
	IsIn,
	IsNumber,
	IsOptional,
	IsString,
	Min,
} from "class-validator";

export class ListAuditDto {
	@IsOptional()
	@IsString()
	actor?: string;

	@IsOptional()
	@IsString()
	action?: string;

	@IsOptional()
	@IsIn(["user", "role"])
	targetType?: "user" | "role";

	@IsOptional()
	@IsDateString()
	from?: string;

	@IsOptional()
	@IsDateString()
	to?: string;

	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	@Min(1)
	limit?: number;

	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	@Min(0)
	offset?: number;
}
