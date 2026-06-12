import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class EditUserDto {
	@IsOptional()
	@IsString()
	@MinLength(1)
	@MaxLength(100)
	name?: string;

	@IsOptional()
	@IsEnum(["admin", "user"])
	role?: "admin" | "user";
}
