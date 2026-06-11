import { All, Controller, Req, Res } from "@nestjs/common";
import type { RawBodyRequest } from "@nestjs/common";
import { auth } from "@vanta-base-admin/auth";
import type { Request, Response } from "express";
import { Public } from "../../common/decorators/public.decorator";

@Public()
@Controller()
export class AuthController {
	@All("/api/auth/*path")
	async handleAuth(@Req() req: RawBodyRequest<Request>, @Res() res: Response) {
		const proto = req.protocol;
		const host = req.get("host") ?? "localhost";
		const url = `${proto}://${host}${req.originalUrl}`;

		const headers = new Headers();
		for (const [key, value] of Object.entries(req.headers)) {
			if (value !== undefined) {
				headers.set(key, Array.isArray(value) ? value.join(", ") : value);
			}
		}

		const hasBody = req.method !== "GET" && req.method !== "HEAD";
		const body = hasBody
			? (req.rawBody?.toString("binary") ?? undefined)
			: undefined;

		const webRequest = new Request(url, {
			method: req.method,
			headers,
			body,
			// @ts-ignore — duplex required by some Node runtimes for body streams
			duplex: "half",
		});

		const webResponse = await auth.handler(webRequest);

		res.status(webResponse.status);
		webResponse.headers.forEach((value: string, key: string) =>
			res.set(key, value),
		);
		const responseBody = await webResponse.text();
		res.send(responseBody);
	}
}
