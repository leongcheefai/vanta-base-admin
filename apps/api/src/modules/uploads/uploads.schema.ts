import { z } from "zod";

export const presignAvatarSchema = z.object({
	contentType: z.enum(["image/png", "image/jpeg", "image/webp"]),
	size: z
		.number()
		.int()
		.positive()
		.max(5 * 1024 * 1024), // 5 MB
});

export type PresignAvatarInput = z.infer<typeof presignAvatarSchema>;
