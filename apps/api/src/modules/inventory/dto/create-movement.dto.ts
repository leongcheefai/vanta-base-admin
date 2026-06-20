import { Type } from "class-transformer";
import {
	IsEnum,
	IsInt,
	IsOptional,
	IsString,
	NotEquals,
} from "class-validator";

export type MovementType =
	| "restock"
	| "sale"
	| "adjustment"
	| "return"
	| "damage"
	| "loss";

export class CreateMovementDto {
	@IsEnum(["restock", "sale", "adjustment", "return", "damage", "loss"])
	type!: MovementType;

	@Type(() => Number)
	@IsInt()
	@NotEquals(0)
	delta!: number;

	@IsOptional()
	@IsString()
	notes?: string;

	@IsOptional()
	@IsString()
	reference?: string;
}
