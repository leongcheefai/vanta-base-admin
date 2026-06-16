import { buildDisplayName } from "./build-display-name";

describe("buildDisplayName", () => {
	it("merges first and last name with a space", () => {
		expect(buildDisplayName({ firstName: "Jane", lastName: "Smith" })).toBe(
			"Jane Smith",
		);
	});

	it("returns first name only when last name is absent", () => {
		expect(buildDisplayName({ firstName: "Jane", lastName: null })).toBe(
			"Jane",
		);
	});

	it("returns last name only when first name is absent", () => {
		expect(buildDisplayName({ firstName: null, lastName: "Smith" })).toBe(
			"Smith",
		);
	});

	it("falls back to company when no person name is present", () => {
		expect(
			buildDisplayName({
				firstName: null,
				lastName: null,
				company: "Acme Corp",
			}),
		).toBe("Acme Corp");
	});

	it("falls back to company when person name is whitespace only", () => {
		expect(
			buildDisplayName({
				firstName: "  ",
				lastName: "  ",
				company: "Acme Corp",
			}),
		).toBe("Acme Corp");
	});

	it("returns empty string when all fields are absent", () => {
		expect(
			buildDisplayName({ firstName: null, lastName: null, company: null }),
		).toBe("");
	});

	it("trims whitespace from name components", () => {
		expect(buildDisplayName({ firstName: " Jane ", lastName: " Smith " })).toBe(
			"Jane Smith",
		);
	});

	it("trims whitespace from company", () => {
		expect(buildDisplayName({ company: "  Acme Corp  " })).toBe("Acme Corp");
	});

	it("prefers person name over company when both are present", () => {
		expect(
			buildDisplayName({
				firstName: "Jane",
				lastName: "Smith",
				company: "Acme Corp",
			}),
		).toBe("Jane Smith");
	});

	it("handles undefined fields", () => {
		expect(buildDisplayName({ company: "Acme Corp" })).toBe("Acme Corp");
	});
});
