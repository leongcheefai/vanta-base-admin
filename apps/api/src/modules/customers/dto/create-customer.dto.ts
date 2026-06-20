import { IsEmail, IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import { HasNameOrCompany } from "../name-or-company.validator";

export class CreateCustomerDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  lastName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(500)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  company?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  notes?: string;

  @IsOptional()
  @IsIn(["active", "inactive"])
  status?: "active" | "inactive";

  @HasNameOrCompany()
  _nameOrCompany?: undefined;
}
