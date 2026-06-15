import "reflect-metadata";
import { validate } from "class-validator";
import { IsOptional, IsString } from "class-validator";
import { HasNameOrCompany, HasNameOrCompanyConstraint } from "./name-or-company.validator";
import type { ValidationArguments } from "class-validator";

class CreateShapeDto {
	@IsOptional()
	@IsString()
	firstName?: string;

	@IsOptional()
	@IsString()
	lastName?: string;

	@IsOptional()
	@IsString()
	company?: string;

	@HasNameOrCompany()
	_nameOrCompany?: undefined;
}

function makeArgs(obj: object): ValidationArguments {
	return {
		value: undefined,
		constraints: [],
		targetName: "TestDto",
		object: obj,
		property: "_nameOrCompany",
	};
}

describe("HasNameOrCompanyConstraint", () => {
	const constraint = new HasNameOrCompanyConstraint();

	it("accepts object with firstName", () => {
		expect(constraint.validate(undefined, makeArgs({ firstName: "Jane" }))).toBe(true);
	});

	it("accepts object with lastName", () => {
		expect(constraint.validate(undefined, makeArgs({ lastName: "Smith" }))).toBe(true);
	});

	it("accepts object with company only (company-only shape)", () => {
		expect(constraint.validate(undefined, makeArgs({ company: "Acme Corp" }))).toBe(true);
	});

	it("accepts object with all three fields (create shape)", () => {
		expect(
			constraint.validate(
				undefined,
				makeArgs({ firstName: "Jane", lastName: "Smith", company: "Acme" }),
			),
		).toBe(true);
	});

	it("rejects object with none of the fields (empty create shape)", () => {
		expect(constraint.validate(undefined, makeArgs({}))).toBe(false);
	});

	it("rejects object where all fields are empty strings", () => {
		expect(
			constraint.validate(undefined, makeArgs({ firstName: "", lastName: "", company: "" })),
		).toBe(false);
	});

	it("rejects object where all fields are whitespace (update shape with only whitespace)", () => {
		expect(
			constraint.validate(
				undefined,
				makeArgs({ firstName: "  ", lastName: "  ", company: "  " }),
			),
		).toBe(false);
	});

	it("returns a descriptive default message", () => {
		expect(constraint.defaultMessage()).toContain("firstName");
	});
});

describe("HasNameOrCompany decorator integration", () => {
	it("passes when firstName is provided (create shape)", async () => {
		const dto = Object.assign(new CreateShapeDto(), { firstName: "Jane" });
		const errors = await validate(dto);
		expect(errors.filter((e) => e.property === "_nameOrCompany")).toHaveLength(0);
	});

	it("passes when company only is provided (create shape)", async () => {
		const dto = Object.assign(new CreateShapeDto(), { company: "Acme Corp" });
		const errors = await validate(dto);
		expect(errors.filter((e) => e.property === "_nameOrCompany")).toHaveLength(0);
	});

	it("fails when no name fields provided (empty create shape)", async () => {
		const dto = new CreateShapeDto();
		const errors = await validate(dto);
		expect(errors.filter((e) => e.property === "_nameOrCompany").length).toBeGreaterThan(0);
	});
});
