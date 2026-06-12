import { Transform, Type } from "class-transformer";
import {
	IsBoolean,
	IsEnum,
	IsInt,
	IsOptional,
	IsString,
	Max,
	Min,
} from "class-validator";

export class ListUsersDto {
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(100)
	limit?: number = 20;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(0)
	offset?: number = 0;

	@IsOptional()
	@IsString()
	search?: string;

	@IsOptional()
	@IsString()
	role?: string;

	@IsOptional()
	@Transform(({ value }) => value === "true")
	@IsBoolean()
	banned?: boolean;

	@IsOptional()
	@Transform(({ value }) => value === "true")
	@IsBoolean()
	includeDeleted?: boolean = false;

	@IsOptional()
	@IsEnum(["createdAt", "name", "email"])
	sortBy?: "createdAt" | "name" | "email" = "createdAt";
}
