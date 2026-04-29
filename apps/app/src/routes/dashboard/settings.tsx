import { Card, CardContent, CardHeader, CardTitle, Input, Label, Button } from '@praxor-kit/ui'
import { useSession } from '../../lib/auth'

export function SettingsPage() {
  const { data: session } = useSession()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account settings.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              defaultValue={session?.user.name ?? ''}
              placeholder="Your name"
              disabled
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" defaultValue={session?.user.email ?? ''} type="email" disabled />
          </div>
          {/* TODO: wire up profile update mutation */}
          <Button disabled>Save changes</Button>
          <p className="text-xs text-muted-foreground">Profile editing coming soon.</p>
        </CardContent>
      </Card>
    </div>
  )
}
