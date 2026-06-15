import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { PERMISSIONS } from "../../common/constants/permissions";
import {
	CurrentUser,
	type SessionUser,
} from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { CustomersService } from "./customers.service";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { ListCustomersDto } from "./dto/list-customers.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";

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
	create(@CurrentUser() user: SessionUser, @Body() dto: CreateCustomerDto) {
		return this.customersService.create(user.id, dto);
	}

	@Get(":id")
	@Permissions(PERMISSIONS.CUSTOMERS_READ)
	findById(@Param("id") id: string) {
		return this.customersService.findById(id);
	}

	@Patch(":id")
	@Permissions(PERMISSIONS.CUSTOMERS_EDIT)
	update(@Param("id") id: string, @Body() dto: UpdateCustomerDto) {
		return this.customersService.update(id, dto);
	}

	@Delete(":id")
	@Permissions(PERMISSIONS.CUSTOMERS_DELETE)
	softDelete(@Param("id") id: string) {
		return this.customersService.softDelete(id);
	}
}
