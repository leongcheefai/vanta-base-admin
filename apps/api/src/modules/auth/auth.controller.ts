import { All, Controller, Req, Res } from "@nestjs/common";
import type { RawBodyRequest } from "@nestjs/common";
import { auth } from "@vanta-base-admin/auth";
import type { Request, Response } from "express";
import { Public } from "../../common/decorators/public.decorator";

@Public()
@Controller()
export class AuthController {
	@All("/api/auth/*")
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
		// Copy every header except Set-Cookie with res.set. Set-Cookie needs
		// special handling: a single response can carry multiple Set-Cookie
		// headers (e.g. session_token + dont_remember on a non-remembered
		// sign-in), and res.set overwrites on each call — so iterating with
		// res.set would keep only the last cookie and silently drop the rest.
		webResponse.headers.forEach((value: string, key: string) => {
			if (key.toLowerCase() === "set-cookie") return;
			res.set(key, value);
		});
		// getSetCookie() returns each Set-Cookie as its own array entry;
		// res.append emits them as separate headers.
		for (const cookie of webResponse.headers.getSetCookie()) {
			res.append("set-cookie", cookie);
		}
		const responseBody = await webResponse.text();
		res.send(responseBody);
	}
}
