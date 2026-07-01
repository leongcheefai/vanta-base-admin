import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  Checkbox,
  DatePicker,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  EmptyState,
  Eyebrow,
  Input,
  Kbd,
  Label,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Slider,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@vanta-base-admin/ui";
import { Bell, Inbox, Lock, MoreHorizontal, Settings2, Trash2, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

const contributionData = [
  { month: "Dec", amount: 620 },
  { month: "Jan", amount: 880 },
  { month: "Feb", amount: 540 },
  { month: "Mar", amount: 960 },
  { month: "Apr", amount: 430 },
  { month: "May", amount: 1040 },
];

const contributionConfig = {
  amount: { label: "Amount", color: "var(--chart-1)" },
} satisfies ChartConfig;

const transactions = [
  { name: "Blue Bottle Coffee", category: "Food & Drink", date: "Today", amount: "-$6.50" },
  { name: "Whole Foods Market", category: "Groceries", date: "Yesterday", amount: "-$142.30" },
  { name: "Stripe Payout", category: "Income", date: "Oct 12", amount: "+$4,200.00" },
  { name: "Uber Technologies", category: "Transport", date: "Oct 11", amount: "-$24.10" },
];

/** Small kicker label reused across bento cells. */
function CellHeader({ title, description }: { title: string; description?: string }) {
  return (
    <CardHeader>
      <CardTitle className="text-base">{title}</CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
    </CardHeader>
  );
}

export function ComponentsPage() {
  const [payout, setPayout] = useState([2500]);
  const [autoSave, setAutoSave] = useState(true);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Components</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live gallery of the <span className="font-medium">@vanta-base-admin/ui</span> design
          system — every primitive shown in a realistic composition.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* Contribution chart — wide */}
        <Card className="md:col-span-2">
          <CardHeader>
            <Eyebrow>Chart · Bar</Eyebrow>
            <CardTitle className="text-base">Contribution History</CardTitle>
            <CardDescription>Last 6 months of activity</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={contributionConfig} className="h-[180px] w-full">
              <BarChart data={contributionData} margin={{ left: 4, right: 4 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="amount" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Payout Threshold — tall form (Slider, Select, Textarea) */}
        <Card className="md:col-span-2 xl:col-span-1 xl:row-span-2">
          <CardHeader>
            <Eyebrow>Slider · Select · Textarea</Eyebrow>
            <CardTitle className="text-base">Payout Threshold</CardTitle>
            <CardDescription>Minimum balance before a payout triggers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="currency">Preferred Currency</Label>
              <Select defaultValue="usd">
                <SelectTrigger id="currency" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usd">USD — United States Dollar</SelectItem>
                  <SelectItem value="eur">EUR — Euro</SelectItem>
                  <SelectItem value="gbp">GBP — Pound Sterling</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Minimum Payout Amount</Label>
                <span className="text-lg font-semibold tabular-nums">
                  ${payout[0].toLocaleString()}.00
                </span>
              </div>
              <Slider value={payout} onValueChange={setPayout} min={50} max={10000} step={50} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>$50 (MIN)</span>
                <span>$10,000 (MAX)</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" placeholder="Add any notes for this payout configuration…" />
            </div>
          </CardContent>
          <CardContent>
            <Button className="w-full">Save Threshold</Button>
          </CardContent>
        </Card>

        {/* Savings Targets — Progress */}
        <Card>
          <CardHeader>
            <Eyebrow>Progress · Badge</Eyebrow>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Savings Targets</CardTitle>
              <Badge variant="secondary">2024</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Retirement</span>
                <span className="font-medium tabular-nums">65%</span>
              </div>
              <Progress value={65} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Real Estate</span>
                <span className="font-medium tabular-nums">32%</span>
              </div>
              <Progress value={32} />
            </div>
          </CardContent>
        </Card>

        {/* Account Access — Input + Button */}
        <Card>
          <CardHeader>
            <Eyebrow>Input · Button</Eyebrow>
            <CardTitle className="text-base">Account Access</CardTitle>
            <CardDescription>Update your credentials.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" defaultValue="artist@studio.inc" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Current Password</Label>
              <Input id="password" type="password" defaultValue="password" />
            </div>
            <Button className="w-full">
              <Lock className="size-4" /> Update Security
            </Button>
          </CardContent>
        </Card>

        {/* Buttons & Badges — wide */}
        <Card className="md:col-span-2">
          <CellHeader title="Buttons & Badges" description="All variants and sizes." />
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button disabled>Disabled</Button>
            </div>
            <Separator />
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Form controls — Checkbox / Switch */}
        <Card>
          <CellHeader title="Form Controls" description="Toggles and selections." />
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Checkbox id="c1" defaultChecked />
              <Label htmlFor="c1">Email notifications</Label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox id="c2" />
              <Label htmlFor="c2">SMS alerts</Label>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="autosave">Auto-save plan</Label>
              <Switch id="autosave" checked={autoSave} onCheckedChange={setAutoSave} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="marketing">Marketing emails</Label>
              <Switch id="marketing" />
            </div>
          </CardContent>
        </Card>

        {/* Overlays — Dialog / Sheet / AlertDialog / Popover / Dropdown / Tooltip */}
        <Card>
          <CellHeader title="Overlays" description="Dialogs, sheets, menus, tooltips." />
          <CardContent className="flex flex-wrap gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Dialog
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Dialog title</DialogTitle>
                  <DialogDescription>
                    A modal dialog composed from our primitives.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button>Done</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  Sheet
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Sheet panel</SheetTitle>
                  <SheetDescription>Slides in from the edge.</SheetDescription>
                </SheetHeader>
              </SheetContent>
            </Sheet>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="size-4" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Archive account?</AlertDialogTitle>
                  <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction>Confirm</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  Popover
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <PopoverHeader>
                  <PopoverTitle>Popover</PopoverTitle>
                  <PopoverDescription>Anchored floating content.</PopoverDescription>
                </PopoverHeader>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="size-4" /> Menu
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings2 className="size-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bell className="size-4" /> Notifications
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm">
                    Tooltip
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Helpful hint</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardContent>
        </Card>

        {/* Recent Transactions — Table (wide) */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <Eyebrow>Table · Avatar</Eyebrow>
                <CardTitle className="text-base">Recent Transactions</CardTitle>
              </div>
              <CardAction>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </CardAction>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.name}>
                    <TableCell className="flex items-center gap-2 font-medium">
                      <Avatar className="size-7">
                        <AvatarFallback>{tx.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      {tx.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{tx.category}</TableCell>
                    <TableCell className="text-muted-foreground">{tx.date}</TableCell>
                    <TableCell
                      className={`text-right tabular-nums ${
                        tx.amount.startsWith("+") ? "text-[var(--chart-2)]" : ""
                      }`}
                    >
                      {tx.amount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Card>
          <CellHeader title="Tabs" description="Segmented content." />
          <CardContent>
            <Tabs defaultValue="overview">
              <TabsList className="w-full">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="pt-3 text-sm text-muted-foreground">
                Summary of account activity and balances.
              </TabsContent>
              <TabsContent value="activity" className="pt-3 text-sm text-muted-foreground">
                A running log of recent events.
              </TabsContent>
              <TabsContent value="settings" className="pt-3 text-sm text-muted-foreground">
                Adjust preferences and notifications.
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Date */}
        <Card>
          <CellHeader title="Date Picker" description="Calendar in a popover." />
          <CardContent className="space-y-3">
            <DatePicker />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Press <Kbd>⌘</Kbd> <Kbd>K</Kbd> to search
            </div>
          </CardContent>
        </Card>

        {/* Avatars + Empty state */}
        <Card>
          <CellHeader title="Avatars & Empty State" />
          <CardContent className="space-y-4">
            <AvatarGroup>
              <Avatar>
                <AvatarFallback>AB</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>CD</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>EF</AvatarFallback>
              </Avatar>
              <AvatarGroupCount>+5</AvatarGroupCount>
            </AvatarGroup>
            <EmptyState
              icon={<Inbox />}
              title="No messages"
              description="You're all caught up."
              className="py-8"
            />
          </CardContent>
        </Card>

        {/* Stat / trend card */}
        <Card>
          <CellHeader title="Stat" />
          <CardContent className="space-y-1">
            <p className="text-3xl font-semibold tabular-nums">$420,000</p>
            <p className="flex items-center gap-1 text-sm text-[var(--chart-2)]">
              <TrendingUp className="size-4" /> +12.5% this quarter
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
