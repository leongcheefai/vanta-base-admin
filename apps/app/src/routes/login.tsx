import { Button, Checkbox, Input, Label, Logo } from "@vanta-base-admin/ui";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { signIn } from "../lib/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn.email({ email, password, rememberMe });
      if (result.error) {
        setError(result.error.message ?? "Sign in failed");
      } else {
        const params = new URLSearchParams(search);
        const redirectTo = params.get("redirect");
        const safe =
          redirectTo?.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/dashboard";
        navigate(safe, { replace: true });
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div
        aria-hidden="true"
        className="relative hidden overflow-hidden bg-[linear-gradient(135deg,var(--brand-700),var(--brand-600)_45%,var(--brand-400))] p-12 text-white lg:flex lg:flex-col"
      >
        {/* Decorative glows */}
        <div className="-right-24 -top-24 pointer-events-none absolute size-80 rounded-full bg-white/15 blur-3xl" />
        <div className="-bottom-32 -left-20 pointer-events-none absolute size-96 rounded-full bg-white/10 blur-3xl" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <span className="inline-flex items-center justify-center rounded-lg bg-white/15 p-1.5">
            <Logo variant="mark" size={28} />
          </span>
          <span className="font-semibold text-lg tracking-tight">Vanta Base Admin</span>
        </div>

        {/* Headline */}
        <div className="relative mt-16 max-w-md">
          <h2 className="font-semibold text-3xl leading-tight tracking-tight">
            Welcome back to your workspace
          </h2>
          <p className="mt-3 text-base text-white/70">
            Sign in to manage your team, settings, and everything in between.
          </p>
        </div>

        {/* Faux product mock */}
        <div className="relative mt-auto">
          <div className="rotate-[-4deg] rounded-2xl bg-white/95 p-5 text-foreground shadow-2xl ring-1 ring-black/5">
            {/* Mock header */}
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 rounded-full bg-foreground/80" />
              <div className="flex gap-1.5">
                <div className="size-2.5 rounded-full bg-muted" />
                <div className="size-2.5 rounded-full bg-muted" />
                <div className="size-2.5 rounded-full bg-muted" />
              </div>
            </div>
            {/* Mock stat tiles */}
            <div className="mt-5 grid grid-cols-3 gap-3">
              {["Users", "Revenue", "Active"].map((label) => (
                <div key={label} className="rounded-lg bg-muted p-3">
                  <div className="h-2 w-10 rounded-full bg-muted-foreground/40" />
                  <div className="mt-2 h-4 w-12 rounded-full bg-foreground/70" />
                </div>
              ))}
            </div>
            {/* Mock bar chart */}
            <div className="mt-5 flex h-24 items-end gap-2">
              {[40, 65, 50, 80, 55, 90, 70].map((h, i) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: static decorative bars
                  key={i}
                  className="flex-1 rounded-t-sm bg-primary/70"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-background p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-6">
          {/* Mobile logo */}
          <div className="lg:hidden">
            <Logo variant="wordmark" size={28} />
          </div>

          <div className="space-y-1.5">
            <h1 className="font-semibold text-2xl tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground text-sm">Sign in to your account to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-muted-foreground text-xs hover:text-foreground"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <Label htmlFor="remember" className="font-normal text-muted-foreground">
                Remember me
              </Label>
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
