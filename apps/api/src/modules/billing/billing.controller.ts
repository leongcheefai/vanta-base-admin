import {
	BadRequestException,
	Body,
	Controller,
	Get,
	Post,
	Req,
} from "@nestjs/common";
import type { RawBodyRequest } from "@nestjs/common";
import type { Request } from "express";
import {
	CurrentUser,
	type SessionUser,
} from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { BillingService } from "./billing.service";
import type { CreateCheckoutDto } from "./dto/create-checkout.dto";
import type { CreatePortalDto } from "./dto/create-portal.dto";

@Controller("billing")
export class BillingController {
	constructor(private readonly billingService: BillingService) {}

	@Public()
	@Get("config")
	getConfig() {
		return this.billingService.getConfig();
	}

	@Get("invoices")
	listInvoices(@CurrentUser() user: SessionUser) {
		return this.billingService.listInvoices(user.id);
	}

	@Get("subscription")
	async getSubscription(@CurrentUser() user: SessionUser) {
		const subscription = await this.billingService.getSubscription(user.id);
		return { subscription: subscription ?? null };
	}

	@Post("checkout")
	createCheckout(
		@CurrentUser() user: SessionUser,
		@Body() dto: CreateCheckoutDto,
	) {
		return this.billingService.createCheckoutSession(user.id, dto);
	}

	@Post("portal")
	createPortal(@CurrentUser() user: SessionUser, @Body() dto: CreatePortalDto) {
		return this.billingService.createPortalSession(user.id, dto);
	}

	@Public()
	@Post("webhook")
	async handleWebhook(@Req() req: RawBodyRequest<Request>) {
		const signature = req.headers["stripe-signature"];
		if (!signature || typeof signature !== "string") {
			throw new BadRequestException("Missing Stripe signature");
		}
		const rawBody = req.rawBody?.toString("utf8");
		if (!rawBody) throw new BadRequestException("Missing request body");
		await this.billingService.handleWebhook(rawBody, signature);
		return { received: true };
	}
}
