import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	Query,
} from "@nestjs/common";
import {
	CurrentUser,
	type SessionUser,
} from "../../common/decorators/current-user.decorator";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { CreateMovementDto } from "./dto/create-movement.dto";
import { CreateProductDto } from "./dto/create-product.dto";
import { ListProductsDto } from "./dto/list-products.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { InventoryService } from "./inventory.service";

@Controller("inventory")
export class InventoryController {
	constructor(private readonly inventoryService: InventoryService) {}

	// ─── Categories ──────────────────────────────────────────────────────────

	@Get("categories")
	listCategories(@CurrentUser() user: SessionUser) {
		return this.inventoryService.listCategories(user.id);
	}

	@Post("categories")
	createCategory(
		@CurrentUser() user: SessionUser,
		@Body() dto: CreateCategoryDto,
	) {
		return this.inventoryService.createCategory(user.id, dto);
	}

	@Patch("categories/:id")
	updateCategory(
		@CurrentUser() user: SessionUser,
		@Param("id") id: string,
		@Body() dto: UpdateCategoryDto,
	) {
		return this.inventoryService.updateCategory(user.id, id, dto);
	}

	@Delete("categories/:id")
	deleteCategory(@CurrentUser() user: SessionUser, @Param("id") id: string) {
		return this.inventoryService.deleteCategory(user.id, id);
	}

	// ─── Products ────────────────────────────────────────────────────────────

	@Get("products")
	listProducts(
		@CurrentUser() user: SessionUser,
		@Query() query: ListProductsDto,
	) {
		return this.inventoryService.listProducts(user.id, query);
	}

	@Post("products")
	createProduct(
		@CurrentUser() user: SessionUser,
		@Body() dto: CreateProductDto,
	) {
		return this.inventoryService.createProduct(user.id, dto);
	}

	@Get("products/:id")
	getProduct(@CurrentUser() user: SessionUser, @Param("id") id: string) {
		return this.inventoryService.getProduct(user.id, id);
	}

	@Patch("products/:id")
	updateProduct(
		@CurrentUser() user: SessionUser,
		@Param("id") id: string,
		@Body() dto: UpdateProductDto,
	) {
		return this.inventoryService.updateProduct(user.id, id, dto);
	}

	@Delete("products/:id")
	softDeleteProduct(@CurrentUser() user: SessionUser, @Param("id") id: string) {
		return this.inventoryService.softDeleteProduct(user.id, id);
	}

	// ─── Movements ───────────────────────────────────────────────────────────

	@Post("products/:id/movements")
	createMovement(
		@CurrentUser() user: SessionUser,
		@Param("id") productId: string,
		@Body() dto: CreateMovementDto,
	) {
		return this.inventoryService.createMovement(user.id, productId, dto);
	}

	@Get("products/:id/movements")
	listMovements(
		@CurrentUser() user: SessionUser,
		@Param("id") productId: string,
	) {
		return this.inventoryService.listMovements(user.id, productId);
	}
}
