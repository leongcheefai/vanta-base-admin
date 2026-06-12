import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD, Reflector } from "@nestjs/core";
import { GlobalExceptionFilter } from "./common/filters/http-exception.filter";
import { AuthGuard } from "./common/guards/auth.guard";
import { AuthModule } from "./modules/auth/auth.module";
import { BillingModule } from "./modules/billing/billing.module";
import { FeedbackModule } from "./modules/feedback/feedback.module";
import { HealthModule } from "./modules/health/health.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { MeModule } from "./modules/me/me.module";
import { MetricsModule } from "./modules/metrics/metrics.module";
import { ReleasesModule } from "./modules/releases/releases.module";
import { UploadsModule } from "./modules/uploads/uploads.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
	imports: [
		AuthModule,
		BillingModule,
		FeedbackModule,
		HealthModule,
		InventoryModule,
		MeModule,
		MetricsModule,
		ReleasesModule,
		UploadsModule,
		UsersModule,
	],
	providers: [
		Reflector,
		{ provide: APP_GUARD, useClass: AuthGuard },
		{ provide: APP_FILTER, useClass: GlobalExceptionFilter },
	],
})
export class AppModule {}
