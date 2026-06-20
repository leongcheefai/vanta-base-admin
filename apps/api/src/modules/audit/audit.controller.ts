import { Controller, Get, Query } from "@nestjs/common";
import { PERMISSIONS } from "../../common/constants/permissions";
import { Permissions } from "../../common/decorators/permissions.decorator";
import type { AuditService } from "./audit.service";
import type { ListAuditDto } from "./dto/list-audit.dto";

@Controller("audit")
export class AuditController {
	constructor(private readonly auditService: AuditService) {}

	@Get()
	@Permissions(PERMISSIONS.AUDIT_READ)
	list(@Query() query: ListAuditDto) {
		return this.auditService.list({
			actor: query.actor,
			action: query.action,
			targetType: query.targetType,
			from: query.from ? new Date(query.from) : undefined,
			to: query.to ? new Date(query.to) : undefined,
			limit: query.limit,
			offset: query.offset,
		});
	}
}
