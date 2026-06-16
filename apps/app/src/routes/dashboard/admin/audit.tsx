import {
  Badge,
  Button,
  DatePicker,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@vanta-base-admin/ui";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { type AuditEntry, useAuditLog } from "../../../lib/audit";

const PAGE_SIZE = 20;

const ACTION_LABELS: Record<string, string> = {
  "user.create": "created user",
  "user.update": "edited user",
  "user.role_change": "changed role for",
  "user.ban": "banned",
  "user.unban": "unbanned",
  "user.delete": "deleted",
  "user.restore": "restored",
  "user.sessions_revoke": "revoked sessions for",
  "role.create": "created role",
  "role.update": "updated role",
  "role.delete": "deleted role",
};

const ACTION_OPTIONS = [
  { value: "user.create", label: "User — create" },
  { value: "user.update", label: "User — edit" },
  { value: "user.role_change", label: "User — role change" },
  { value: "user.ban", label: "User — ban" },
  { value: "user.unban", label: "User — unban" },
  { value: "user.delete", label: "User — delete" },
  { value: "user.restore", label: "User — restore" },
  { value: "user.sessions_revoke", label: "User — revoke sessions" },
  { value: "role.create", label: "Role — create" },
  { value: "role.update", label: "Role — update" },
  { value: "role.delete", label: "Role — delete" },
];

function formatRelativeTime(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function AuditRow({ entry }: { entry: AuditEntry }) {
  const [expanded, setExpanded] = useState(false);
  const actionLabel = ACTION_LABELS[entry.action] ?? entry.action;
  const actorLabel = entry.actorName ?? entry.actorId;
  const targetLabel =
    entry.targetType === "user"
      ? `user ${entry.targetName ?? entry.targetId}`
      : `role ${entry.targetName ?? entry.targetId}`;

  return (
    <>
      <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => setExpanded((v) => !v)}>
        <TableCell className="font-mono text-xs text-muted-foreground">
          {formatRelativeTime(entry.createdAt)}
        </TableCell>
        <TableCell>
          <span className="text-sm">
            <span className="font-medium">{actorLabel}</span>{" "}
            <span className="text-muted-foreground">{actionLabel}</span>{" "}
            <span className="font-medium">{targetLabel}</span>
          </span>
        </TableCell>
        <TableCell>
          <Badge variant="outline" className="font-mono text-xs">
            {entry.action}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge variant="secondary" className="text-xs">
            {entry.targetType}
          </Badge>
        </TableCell>
        <TableCell className="w-8 text-muted-foreground">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow>
          <TableCell colSpan={5} className="bg-muted/30 p-4">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Context
                  </p>
                  <p>IP: {entry.ipAddress ?? "—"}</p>
                  <p className="truncate max-w-xs">UA: {entry.userAgent ?? "—"}</p>
                  <p>At: {new Date(entry.createdAt).toLocaleString()}</p>
                </div>
              </div>
              {(entry.metadata.before !== undefined || entry.metadata.after !== undefined) && (
                <div>
                  <p className="font-medium text-muted-foreground uppercase tracking-wide text-xs mb-1">
                    Change payload
                  </p>
                  <pre className="text-xs bg-background rounded border p-3 overflow-auto max-h-64">
                    {JSON.stringify(
                      {
                        before: entry.metadata.before,
                        after: entry.metadata.after,
                      },
                      null,
                      2,
                    )}
                  </pre>
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export function AdminAuditPage() {
  const [page, setPage] = useState(0);
  const [actor, setActor] = useState("");
  const [action, setAction] = useState<string>("");
  const [targetType, setTargetType] = useState<"" | "user" | "role">("");
  const [from, setFrom] = useState<Date | undefined>(undefined);
  const [to, setTo] = useState<Date | undefined>(undefined);

  const params = {
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    actor: actor || undefined,
    action: action || undefined,
    targetType: (targetType || undefined) as "user" | "role" | undefined,
    from: from ? from.toISOString().slice(0, 10) : undefined,
    to: to ? to.toISOString().slice(0, 10) : undefined,
  };

  const { data, isLoading } = useAuditLog(params);

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  function resetPage() {
    setPage(0);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Append-only record of sensitive admin actions on users and roles.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Filter by actor ID"
          value={actor}
          onChange={(e) => {
            setActor(e.target.value);
            resetPage();
          }}
          className="h-8 w-52 text-sm"
        />

        <Select
          value={action}
          onValueChange={(v) => {
            setAction(v === "all" ? "" : v);
            resetPage();
          }}
        >
          <SelectTrigger className="h-8 w-52 text-sm">
            <SelectValue placeholder="All actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {ACTION_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={targetType}
          onValueChange={(v) => {
            setTargetType(v === "all" ? "" : (v as "user" | "role"));
            resetPage();
          }}
        >
          <SelectTrigger className="h-8 w-36 text-sm">
            <SelectValue placeholder="All targets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All targets</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="role">Role</SelectItem>
          </SelectContent>
        </Select>

        <DatePicker
          value={from}
          onChange={(date) => {
            setFrom(date);
            resetPage();
          }}
          placeholder="From date"
        />

        <DatePicker
          value={to}
          onChange={(date) => {
            setTo(date);
            resetPage();
          }}
          placeholder="To date"
        />
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading audit log…</p>}

      {!isLoading && data && (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">When</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead className="w-40">Action</TableHead>
                  <TableHead className="w-20">Target</TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      No audit entries found.
                    </TableCell>
                  </TableRow>
                )}
                {data.data.map((entry) => (
                  <AuditRow key={entry.id} entry={entry} />
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {data.total} {data.total === 1 ? "entry" : "entries"} total
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span>
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
