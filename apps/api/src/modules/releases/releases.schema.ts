import { z } from "zod";

export const releaseSchema = z.object({
	id: z.string(),
	tag: z.string(),
	name: z.string(),
	body: z.string().nullable(),
	url: z.string(),
	prerelease: z.boolean(),
	publishedAt: z.date().nullable(),
	syncedAt: z.date(),
});

export type Release = z.infer<typeof releaseSchema>;
