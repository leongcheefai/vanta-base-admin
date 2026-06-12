CREATE TABLE "roles" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "roles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" text NOT NULL,
	"permission" text NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_pk" PRIMARY KEY("role_id","permission")
);
--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "roles" ("id", "slug", "name", "is_system", "created_at", "updated_at")
VALUES
  ('role_admin', 'admin', 'Admin', true, now(), now()),
  ('role_user', 'user', 'User', true, now(), now());
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role_id" text;
--> statement-breakpoint
UPDATE "user" SET "role_id" = 'role_admin' WHERE "role" = 'admin';
--> statement-breakpoint
UPDATE "user" SET "role_id" = 'role_user' WHERE "role_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE restrict ON UPDATE no action;
