import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
  toast,
} from "@vanta-base-admin/ui";
import { ArrowLeft, Shield, Smartphone } from "lucide-react";
import { Link, useParams } from "react-router";
import { useRevokeUserSessions, useUser } from "../../../lib/users";

function SessionRow({
  session,
}: {
  session: {
    id: string;
    createdAt: string;
    expiresAt: string;
    ipAddress: string | null;
    userAgent: string | null;
  };
}) {
  const agent = session.userAgent ?? "Unknown device";
  const ip = session.ipAddress ?? "—";
  return (
    <div className="flex items-start gap-3 py-3">
      <Smartphone size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{agent}</p>
        <p className="text-xs text-muted-foreground">
          {ip} · Started{" "}
          {new Date(session.createdAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
          {" · "}Expires{" "}
          {new Date(session.expiresAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </p>
      </div>
    </div>
  );
}

export function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useUser(id ?? "");
  const revoke = useRevokeUserSessions(id ?? "");

  async function handleRevokeSessions() {
    try {
      const result = await revoke.mutateAsync();
      toast.success(
        `Revoked ${result.revoked} session${result.revoked !== 1 ? "s" : ""}`,
      );
    } catch {
      toast.error("Failed to revoke sessions");
    }
  }

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">Loading user…</p>
    );
  }

  if (error || !data) {
    return (
      <p className="text-sm text-destructive">
        Failed to load user. The account may not exist.
      </p>
    );
  }

  const { user, subscription, sessions } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard/admin/users">
            <ArrowLeft size={14} />
            Back to users
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="size-14">
                <AvatarImage src={user.image ?? undefined} />
                <AvatarFallback>
                  {user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Separator />
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Role</dt>
                <dd>
                  <Badge variant="outline" className="capitalize">
                    {user.role ?? "user"}
                  </Badge>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Email verified</dt>
                <dd>{user.emailVerified ? "Yes" : "No"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Joined</dt>
                <dd>
                  {new Date(user.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </dd>
              </div>
              {user.banned && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Ban reason</dt>
                  <dd className="max-w-48 text-right text-destructive">
                    {user.banReason}
                  </dd>
                </div>
              )}
              {user.deletedAt && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Deleted at</dt>
                  <dd className="text-destructive">
                    {new Date(user.deletedAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Subscription card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            {!subscription ? (
              <p className="text-sm text-muted-foreground">
                No active subscription.
              </p>
            ) : (
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>
                    <Badge variant="outline" className="capitalize">
                      {subscription.status ?? "—"}
                    </Badge>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Price ID</dt>
                  <dd className="font-mono text-xs">
                    {subscription.stripePriceId ?? "—"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Period end</dt>
                  <dd>
                    {subscription.stripeCurrentPeriodEnd
                      ? new Date(
                          subscription.stripeCurrentPeriodEnd,
                        ).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Cancel at period end</dt>
                  <dd>{subscription.cancelAtPeriodEnd ? "Yes" : "No"}</dd>
                </div>
              </dl>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sessions */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">
            <Shield size={14} className="mr-2 inline" />
            Active sessions ({sessions.length})
          </CardTitle>
          {sessions.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRevokeSessions}
              disabled={revoke.isPending}
            >
              {revoke.isPending ? "Revoking…" : "Revoke all sessions"}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active sessions.</p>
          ) : (
            <div className="divide-y">
              {sessions.map((session) => (
                <SessionRow key={session.id} session={session} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
