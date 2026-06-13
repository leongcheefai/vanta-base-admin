import {
	IsArray,
	IsIn,
	IsOptional,
	IsString,
	MaxLength,
	MinLength,
} from "class-validator";
import { ALL_PERMISSIONS } from "../../../common/constants/permissions";

export class UpdateRoleDto {
	@IsOptional()
	@IsString()
	@MinLength(1)
	@MaxLength(50)
	name?: string;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	@IsIn(ALL_PERMISSIONS, { each: true })
	permissions?: string[];
}
