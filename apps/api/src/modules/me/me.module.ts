import { Module } from "@nestjs/common";
import { RolesModule } from "../roles/roles.module";
import { MeController } from "./me.controller";

@Module({
	imports: [RolesModule],
	controllers: [MeController],
})
export class MeModule {}
