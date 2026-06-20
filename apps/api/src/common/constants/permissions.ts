export const PERMISSIONS = {
	USERS_READ: "users:read",
	USERS_CREATE: "users:create",
	USERS_EDIT: "users:edit",
	USERS_DELETE: "users:delete",
	USERS_BAN: "users:ban",
	USERS_SESSIONS: "users:sessions",
	ROLES_READ: "roles:read",
	ROLES_WRITE: "roles:write",
	ROLES_ASSIGN: "roles:assign",
	CUSTOMERS_READ: "customers:read",
	CUSTOMERS_CREATE: "customers:create",
	CUSTOMERS_EDIT: "customers:edit",
	CUSTOMERS_DELETE: "customers:delete",
	AUDIT_READ: "audit:read",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);
