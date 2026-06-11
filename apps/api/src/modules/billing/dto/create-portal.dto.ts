import { IsUrl } from "class-validator";

export class CreatePortalDto {
	@IsUrl()
	returnUrl!: string;
}
