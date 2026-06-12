import {
	IsEmail,
	IsEnum,
	IsOptional,
	IsString,
	MaxLength,
	MinLength,
} from "class-validator";

export class CreateUserDto {
	@IsString()
	@MinLength(1)
	@MaxLength(100)
	name!: string;

	@IsEmail()
	email!: string;

	@IsString()
	@MinLength(8)
	@MaxLength(100)
	password!: string;

	@IsOptional()
	@IsEnum(["admin", "user"])
	role?: "admin" | "user" = "user";
}
