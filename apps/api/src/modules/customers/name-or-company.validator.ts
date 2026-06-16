import {
	type ValidationArguments,
	ValidatorConstraint,
	type ValidatorConstraintInterface,
	registerDecorator,
} from "class-validator";

@ValidatorConstraint({ name: "hasNameOrCompany", async: false })
export class HasNameOrCompanyConstraint
	implements ValidatorConstraintInterface
{
	validate(_value: unknown, args: ValidationArguments): boolean {
		const obj = args.object as {
			firstName?: string;
			lastName?: string;
			company?: string;
		};
		return !!(
			obj.firstName?.trim() ||
			obj.lastName?.trim() ||
			obj.company?.trim()
		);
	}

	defaultMessage(): string {
		return "At least one of firstName, lastName, or company is required";
	}
}

export function HasNameOrCompany() {
	// biome-ignore lint/complexity/noBannedTypes: class-validator registerDecorator requires Function
	return (object: object, propertyName: string) => {
		registerDecorator({
			name: "hasNameOrCompany",
			// biome-ignore lint/complexity/noBannedTypes: class-validator registerDecorator requires Function
			target: (object as { constructor: Function }).constructor,
			propertyName,
			validator: HasNameOrCompanyConstraint,
		});
	};
}
