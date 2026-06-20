import { IsEnum, IsInt, IsPositive, Max } from "class-validator";

export class PresignAvatarDto {
  @IsEnum(["image/png", "image/jpeg", "image/webp"])
  contentType!: "image/png" | "image/jpeg" | "image/webp";

  @IsInt()
  @IsPositive()
  @Max(5 * 1024 * 1024)
  size!: number;
}
