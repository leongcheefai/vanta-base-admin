import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/main.ts"],
	format: ["cjs"],
	outDir: "dist",
	splitting: false,
	// Bundle workspace TS source so plain `node` can execute it without tsx.
	noExternal: [/@vanta-base-admin\/.*/],
	// Keep all npm packages external. tsup/esbuild bundles ESM-only packages (like
	// better-auth) into CJS output by default, which deduplicates zod across two
	// incompatible versions (v3 from api, v4 from better-auth). Node.js v22+ can
	// require() ESM packages natively, so keeping them external is safe.
	external: [
		/^@(?!vanta-base-admin\/)/, // @scoped npm packages except workspace
		/^[a-zA-Z0-9]/, // unscoped npm packages (react, zod, express, etc.)
	],
});
