import { IsEnum, IsString, MaxLength, MinLength } from "class-validator";

export class CreateFeedbackDto {
	@IsEnum(["bug", "feature", "other"])
	type!: "bug" | "feature" | "other";

	@IsString()
	@MinLength(1)
	@MaxLength(2000)
	message!: string;
}
