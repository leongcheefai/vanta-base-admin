import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	Query,
	Req,
} from "@nestjs/common";
import type { Request } from "express";
import { PERMISSIONS } from "../../common/constants/permissions";
import {
	CurrentUser,
	type SessionUser,
} from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import type { AuditContext } from "../audit/audit.service";
import { CustomersService } from "./customers.service";
import type { CreateCustomerDto } from "./dto/create-customer.dto";
import type { ListCustomersDto } from "./dto/list-customers.dto";
import type { UpdateCustomerDto } from "./dto/update-customer.dto";

function extractCtx(req: Request): AuditContext {
	return {
		ipAddress: req.ip ?? null,
		userAgent: req.get("user-agent") ?? null,
	};
}

@Controller("customers")
export class CustomersController {
	constructor(private readonly customersService: CustomersService) {}

	@Get()
	@Permissions(PERMISSIONS.CUSTOMERS_READ)
	list(@Query() query: ListCustomersDto) {
		return this.customersService.list(query);
	}

	@Post()
	@Permissions(PERMISSIONS.CUSTOMERS_CREATE)
	create(
		@Req() req: Request,
		@CurrentUser() user: SessionUser,
		@Body() dto: CreateCustomerDto,
	) {
		return this.customersService.create(user.id, dto, extractCtx(req));
	}

	@Get(":id")
	@Permissions(PERMISSIONS.CUSTOMERS_READ)
	findById(@Param("id") id: string) {
		return this.customersService.findById(id);
	}

	@Patch(":id")
	@Permissions(PERMISSIONS.CUSTOMERS_EDIT)
	update(
		@Req() req: Request,
		@CurrentUser() actor: SessionUser,
		@Param("id") id: string,
		@Body() dto: UpdateCustomerDto,
	) {
		return this.customersService.update(id, dto, actor.id, extractCtx(req));
	}

	@Delete(":id")
	@Permissions(PERMISSIONS.CUSTOMERS_DELETE)
	softDelete(
		@Req() req: Request,
		@CurrentUser() actor: SessionUser,
		@Param("id") id: string,
	) {
		return this.customersService.softDelete(id, actor.id, extractCtx(req));
	}
}
