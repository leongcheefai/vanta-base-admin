import { db, schema } from "@vanta-base-admin/db";
import {
  sendChangeEmailConfirmationEmail,
  sendDeleteAccountEmail,
  sendResetPasswordEmail,
  sendVerifyEmail,
  sendWelcomeEmail,
} from "@vanta-base-admin/emails";
import { serverEnv } from "@vanta-base-admin/env";
// Google OAuth imports intentionally removed — internal tooling uses admin-provisioned accounts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { eq } from "drizzle-orm";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  secret: serverEnv.BETTER_AUTH_SECRET,
  baseURL: serverEnv.BETTER_AUTH_URL,
  trustedOrigins: [serverEnv.APP_URL],
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    requireEmailVerification: false,
    sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string }) => {
      await sendVerifyEmail(user.email, url);
    },
    sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => {
      await sendResetPasswordEmail(user.email, url);
    },
  },
  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async ({
        user,
        newEmail,
        url,
      }: {
        user: { email: string };
        newEmail: string;
        url: string;
      }) => {
        await sendChangeEmailConfirmationEmail(newEmail, url, user.email);
      },
    },
    deletion: {
      enabled: true,
      sendDeleteAccountVerification: async ({
        user,
        url,
      }: {
        user: { email: string };
        url: string;
      }) => {
        await sendDeleteAccountEmail(user.email, url);
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Assign roleId based on the role slug set by Better Auth
          const roleSlug = (user as { role?: string | null }).role ?? "user";
          const role = await db.query.roles.findFirst({
            where: eq(schema.roles.slug, roleSlug),
          });
          if (role) {
            await db
              .update(schema.user)
              .set({ roleId: role.id })
              .where(eq(schema.user.id, user.id));
          }

          // fire-and-forget — email failure must not break signup
          sendWelcomeEmail(user.email, user.name).catch((err) =>
            console.error("[auth] welcome email failed", err),
          );
        },
      },
    },
  },
  plugins: [admin()],
});

export type Auth = typeof auth;
