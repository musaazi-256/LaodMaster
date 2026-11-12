import {
  lazy,
  Suspense,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  NavLink,
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  Activity,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  ArrowLeftRight,
  BarChart3,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  FileCheck,
  FileText,
  Gift,
  HelpCircle,
  KeyRound,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Package,
  PauseCircle,
  Pencil,
  PlayCircle,
  Power,
  Plus,
  Search,
  Settings,
  Shield,
  ShieldOff,
  Truck,
  UserX,
  Users,
  Wallet,
  WalletCards,
  X,
  type LucideIcon,
} from "lucide-react";
const OrderChart = lazy(() => import("./components/OrderChart"));
const TripMap = lazy(() => import("./components/TripMap"));
import { stagePosition, type TripStop } from "./components/tripGeometry";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { request, money, title, type AdminData, type Row } from "@/lib/api";
import {
  AddButton,
  Choice,
  DataTable,
  TablePreferencesProvider,
  Empty,
  ErrorNotice,
  FormDialog,
  PageTitle,
  Status,
  type FormSpec,
} from "@/components/shared";
interface ContextValue {
  data: AdminData;
  token: string;
  refresh: () => Promise<void>;
  mutate: (path: string, body: Row) => Promise<any>;
  form: (s: FormSpec) => void;
  notify: (s: string) => void;
  openOrder: (id: string) => void;
  openPerson: (id: string) => void;
  can: (s: string) => boolean;
}
const Context = createContext<ContextValue | null>(null);
const useAdmin = () => useContext(Context)!;

const reasonField = {
  name: "reason",
  label: "Reason (required)",
  type: "textarea" as const,
};
const outcomeField = {
  name: "outcome",
  label: "Demo outcome",
  type: "select" as const,
  value: "success",
  options: [
    { value: "success", label: "Success — apply the operation" },
    { value: "pending", label: "Pending — wait for confirmation" },
    { value: "failed", label: "Failed — do not move funds" },
  ],
};
const methodNames: Record<string, string> = {
  mtn: "MTN Mobile Money",
  airtel: "Airtel Money",
  card: "Card",
  cash: "Cash collection",
  wallet: "LoadMaster wallet",
  flexipay: "FlexiPay",
  external_wallet: "External wallet",
};
const methodName = (m: string) => methodNames[m] || title(m);
const personName = (data: AdminData, id: string) =>
  data.people.find((p) => p.id === id)?.name || "Not assigned";
const initials = (name: string) =>
  String(name || "?")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
function Person({ p }: { p: Row }) {
  return (
    <div className="user-cell">
      <Avatar className="initials">
        {p.photo && <AvatarImage src={p.photo} alt="" />}
        <AvatarFallback>{initials(p.name)}</AvatarFallback>
      </Avatar>
      <div>
        <strong>{p.name}</strong>
        <small>{p.phone || p.email}</small>
      </div>
    </div>
  );
}
function Metric({
  label,
  value,
  note,
  icon: Icon,
  featured = false,
}: {
  label: string;
  value: string | number;
  note: string;
  icon: LucideIcon;
  featured?: boolean;
}) {
  return (
    <Card className={cn("metric-card", featured && "featured")}>
      <CardHeader className="metric-head p-0">
        {label.charAt(0) + label.slice(1).toLowerCase()}
        <Icon size={17} />
      </CardHeader>
      <CardContent className="p-0">
        <div className="metric-value">{value}</div>
        <CardDescription className="metric-note">{note}</CardDescription>
      </CardContent>
    </Card>
  );
}
export default function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem("loadmaster-admin-token") || "",
  );
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [form, setForm] = useState<FormSpec | null>(null);
  const [person, setPerson] = useState<string | null>(null);
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const location = useLocation();
  const [page = "dashboard", detail] = location.pathname
    .split("/")
    .filter(Boolean);
  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const received = await request<AdminData>("/admin", token);
      received.orders = received.orders.map((o) => ({
        ...o,
        customerName:
          received.people.find((p) => p.id === o.customerId)?.name ||
          o.customerId,
        driverName:
          received.people.find((p) => p.id === o.driverId)?.name ||
          "Not assigned",
        routeLabel: o.quote.pickup.name + " → " + o.quote.destination.name,
      }));
      setData(received);
      setError(null);
    } catch (e) {
      const v = e as Error & { code: string };
      setError(v.message);
      if (["SESSION_EXPIRED", "SESSION_REVOKED"].includes(v.code)) {
        localStorage.removeItem("loadmaster-admin-token");
        setToken("");
        setData(null);
      }
    }
  }, [token]);
  useEffect(() => {
    void refresh();
    if (!token) return;
    const id = setInterval(() => void refresh(), 4000);
    return () => clearInterval(id);
  }, [refresh, token]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 9000);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    setMenu(false);
    document.querySelector(".content")?.scrollTo(0, 0);
  }, [page, detail]);
  const login = (token: string) => {
    localStorage.setItem("loadmaster-admin-token", token);
    setToken(token);
  };
  const logout = () => {
    localStorage.removeItem("loadmaster-admin-token");
    setToken("");
    setData(null);
  };
  if (!token) return <Login onLogin={login} />;
  if (!data)
    return (
      <div className="login-screen">
        <div className="login-art">
          <div className="brand">↗ LoadMaster</div>
          <h1>Your operation, connected.</h1>
        </div>
        <div className="login-form">
          <LoaderCircle className="animate-spin" />
          <h1>Opening operations…</h1>
          <ErrorNotice error={error} />
          <Button onClick={() => void refresh()}>Try again</Button>
          <Button variant="ghost" onClick={logout}>
            Back to sign in
          </Button>
        </div>
      </div>
    );
  const can = (scope: string) =>
    scope === "trips"
      ? data.permissions.some((p) => p === "orders" || p === "tracking")
      : data.permissions.includes(scope);
  const mutate = async (path: string, body: Row) => {
    const result = await request(path, token, body);
    await refresh();
    setToast(
      body.outcome === "failed"
        ? "Demo operation failed. No funds moved."
        : body.outcome === "pending"
          ? "Operation pending confirmation. No funds moved yet."
          : "Changes saved to the connected demo.",
    );
    return result;
  };
  const navigation: {
    label: string;
    items: { path: string; name: string; icon: LucideIcon; scope: string }[];
  }[] = [
    {
      label: "Workspace",
      items: [
        {
          path: "dashboard",
          name: "Dashboard",
          icon: LayoutDashboard,
          scope: "overview",
        },
        { path: "trips", name: "Trips", icon: Package, scope: "trips" },
      ],
    },
    {
      label: "People & fleet",
      items: [
        {
          path: "drivers",
          name: "Drivers",
          icon: Truck,
          scope: "drivers",
        },
        {
          path: "customers",
          name: "Customers",
          icon: Users,
          scope: "customers",
        },
      ],
    },
    {
      label: "Money & control",
      items: [
        {
          path: "payments",
          name: "Collections",
          icon: WalletCards,
          scope: "finance",
        },
        {
          path: "payouts",
          name: "Driver payouts",
          icon: Wallet,
          scope: "finance",
        },
        {
          path: "transfers",
          name: "Transfers & ledger",
          icon: ArrowLeftRight,
          scope: "finance",
        },
        {
          path: "reconciliation",
          name: "Reconciliation",
          icon: ClipboardCheck,
          scope: "finance",
        },
        {
          path: "methods",
          name: "Payment methods",
          icon: WalletCards,
          scope: "finance",
        },
        {
          path: "rewards",
          name: "Referrals & cashbacks",
          icon: Gift,
          scope: "rewards",
        },
      ],
    },
    {
      label: "Management",
      items: [
        {
          path: "support",
          name: "Support",
          icon: HelpCircle,
          scope: "support",
        },
        { path: "staff", name: "Staff & roles", icon: Shield, scope: "staff" },
        { path: "audit", name: "Audit trail", icon: FileText, scope: "audit" },
        { path: "reports", name: "Reports", icon: BarChart3, scope: "reports" },
        {
          path: "settings",
          name: "Settings",
          icon: Settings,
          scope: "settings",
        },
      ],
    },
  ];
  const current = navigation
    .flatMap((n) => n.items)
    .find((n) => n.path === page);
  const fallback = navigation.flatMap((n) => n.items).find((n) => can(n.scope));
  return (
    <TablePreferencesProvider value={String(data.me.id)}>
      <TooltipProvider>
        <SidebarProvider defaultOpen={true}>
          <Context.Provider
            value={{
              data,
              token,
              refresh,
              mutate,
              form: setForm,
              notify: setToast,
              openOrder: (id) => navigate("/trips/" + encodeURIComponent(id)),
              openPerson: (id) => {
                const p = data.people.find((p) => p.id === id);
                if (p && ["driver", "customer"].includes(p.role))
                  navigate("/" + p.role + "s/" + encodeURIComponent(id));
                else setPerson(id);
              },
              can,
            }}
          >
            <Sidebar
              aria-label="Administration sidebar"
              className={cn("app-sidebar", menu && "open")}
              collapsible="none"
            >
              <SidebarHeader className="p-0">
                <Button
                  className="mobile-menu self-end"
                  size="icon"
                  variant="ghost"
                  aria-label="Close navigation"
                  onClick={() => setMenu(false)}
                >
                  <X />
                </Button>
                <div className="brand">
                  <div className="brand-mark">
                    <ArrowUpRight size={23} />
                  </div>
                  LoadMaster
                </div>
                <div className="workspace-switch">
                  <Avatar className="initials">
                    <AvatarFallback>LM</AvatarFallback>
                  </Avatar>
                  <div>
                    Cargo operations<small>KAMPALA · V2 DEMO</small>
                  </div>
                </div>
              </SidebarHeader>
              <SidebarContent className="sidebar-nav p-0">
                <nav aria-label="Primary navigation">
                  {navigation.map((group) => (
                    <SidebarGroup className="nav-group p-0" key={group.label}>
                      {group.items.some((i) => can(i.scope)) && (
                        <SidebarGroupLabel className="nav-caption">
                          {group.label}
                        </SidebarGroupLabel>
                      )}
                      <SidebarGroupContent>
                        <SidebarMenu className="gap-0.5">
                          {group.items
                            .filter((i) => can(i.scope))
                            .map((item) => (
                              <SidebarMenuItem key={item.path}>
                                <SidebarMenuButton
                                  asChild
                                  isActive={page === item.path}
                                >
                                  <NavLink
                                    to={"/" + item.path}
                                    className={cn(
                                      "nav-link",
                                      page === item.path && "active",
                                    )}
                                  >
                                    <item.icon />
                                    <span>{item.name}</span>
                                  </NavLink>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                      </SidebarGroupContent>
                    </SidebarGroup>
                  ))}
                </nav>
              </SidebarContent>
              <SidebarFooter className="sidebar-foot p-0">
                <SidebarSeparator className="mb-3" />
                <p>
                  <span style={{ color: "#087443" }}>●</span> Shared demo
                  service
                </p>
                <p>Customer · Driver · Operations</p>
                <Button
                  variant="ghost"
                  className="mt-3 text-muted-foreground hover:bg-accent"
                  onClick={logout}
                >
                  <LogOut size={15} />
                  Sign out
                </Button>
              </SidebarFooter>
            </Sidebar>
            <div className="shell-main">
              <header className="topbar">
                <div className="topbar-path">
                  <Button
                    className="mobile-menu"
                    size="icon"
                    variant="ghost"
                    aria-label="Open navigation"
                    onClick={() => setMenu(!menu)}
                  >
                    <Menu />
                  </Button>
                  {navigation
                    .find((group) =>
                      group.items.some((item) => item.path === page),
                    )
                    ?.label.toLowerCase()
                    .replace(/\b\w/g, (c) => c.toUpperCase()) || "Workspace"}
                  <ChevronRight size={13} />
                  <strong>{current?.name || "My profile"}</strong>
                </div>
                <div className="topbar-right">
                  <span className="topbar-date">
                    {new Date().toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <Badge variant="outline" className="demo-label">
                    DEMO
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="View my staff profile"
                    onClick={() => setPerson(data.me.id)}
                  >
                    <Avatar className="initials">
                      <AvatarFallback>{initials(data.me.name)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </div>
              </header>
              <main className="content">
                <ErrorNotice error={error} />
                {current && !can(current.scope) ? (
                  <Navigate to={"/" + fallback?.path} replace />
                ) : (
                  <>
                    {["overview", "orders", "tracking"].includes(page) ? (
                      <Navigate
                        to={
                          page === "overview"
                            ? "/dashboard"
                            : page === "tracking"
                              ? "/trips?view=tracking"
                              : "/trips"
                        }
                        replace
                      />
                    ) : page === "dashboard" ? (
                      <Overview />
                    ) : page === "trips" && detail ? (
                      <TripPage id={decodeURIComponent(detail)} />
                    ) : page === "trips" ? (
                      <TripsPage />
                    ) : (page === "drivers" || page === "customers") &&
                      detail ? (
                      <PersonPage id={decodeURIComponent(detail)} />
                    ) : page === "drivers" || page === "customers" ? (
                      <PeoplePage
                        kind={page === "drivers" ? "driver" : "customer"}
                      />
                    ) : page === "payments" ? (
                      <PaymentsPage />
                    ) : page === "payouts" ? (
                      <PayoutsPage />
                    ) : page === "transfers" ? (
                      <TransfersPage />
                    ) : page === "reconciliation" ? (
                      <ReconciliationPage />
                    ) : page === "methods" ? (
                      <MethodsPage />
                    ) : page === "rewards" ? (
                      <RewardsPage />
                    ) : page === "support" ? (
                      <SupportPage />
                    ) : page === "staff" ? (
                      <StaffPage />
                    ) : page === "audit" ? (
                      <AuditPage />
                    ) : page === "reports" ? (
                      <ReportsPage />
                    ) : page === "settings" ? (
                      <SettingsPage />
                    ) : (
                      <Navigate to={"/" + fallback?.path} replace />
                    )}
                  </>
                )}
              </main>
            </div>
            <FormDialog spec={form} onClose={() => setForm(null)} />
            <PersonDialog id={person} onClose={() => setPerson(null)} />
            {toast && (
              <div className="toast-message" role="status">
                {toast}
                <button
                  aria-label="Dismiss notification"
                  onClick={() => setToast("")}
                  className="ml-4"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </Context.Provider>
        </SidebarProvider>
      </TooltipProvider>
    </TablePreferencesProvider>
  );
}
function Login({ onLogin }: { onLogin: (s: string) => void }) {
  const [identifier, setIdentifier] = useState("irene@loadmaster.test");
  const [password, setPassword] = useState("DemoCargo2026!");
  const [code, setCode] = useState("");
  const [challenge, setChallenge] = useState<Row | null>(null);
  const [recover, setRecover] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="login-screen">
      <div className="login-art">
        <div className="brand">
          <div className="brand-mark">
            <ArrowUpRight />
          </div>
          LoadMaster
        </div>
        <div>
          <h1>Operations portal</h1>
          <p>
            Trips, drivers, customers and payments for LoadMaster cargo
            delivery.
          </p>
        </div>
        <p className="demo-label">Demo environment · no real money</p>
      </div>
      <div className="login-form">
        <h1>
          {challenge
            ? "Verify your identity"
            : recover
              ? "Let’s get you back in."
              : "Sign in"}
        </h1>
        <p className="muted">
          {challenge
            ? "Use the displayed demo code. No SMS or email is sent."
            : recover
              ? "Enter your email or phone to preview password recovery."
              : "Sign in with your individual staff account."}
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              const result = challenge
                ? await request("/auth/verify", null, {
                    challenge: challenge.challenge,
                    code,
                    password,
                  })
                : recover
                  ? await request("/auth/recover", null, { identifier })
                  : await request("/auth/login", null, {
                      role: "staff",
                      identifier,
                      password,
                    });
              if (result.token) onLogin(result.token);
              else setChallenge(result);
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="form-fields">
            {!challenge && (
              <div className="field">
                <Label htmlFor="login-id">Email or phone</Label>
                <Input
                  id="login-id"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>
            )}
            {challenge && (
              <>
                <div className="notice">
                  Demo code: <strong>{challenge.demoCode}</strong>
                </div>
                <div className="field">
                  <Label htmlFor="login-code">Verification code</Label>
                  <Input
                    id="login-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                  />
                </div>
              </>
            )}
            {(!recover || challenge) && (
              <div className="field">
                <Label htmlFor="login-password">
                  {challenge ? "New password" : "Password"}
                </Label>
                <Input
                  id="login-password"
                  type="password"
                  autoComplete={challenge ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
            )}
          </div>
          <ErrorNotice error={error} />
          <Button className="full-button" disabled={busy}>
            {busy && <LoaderCircle className="animate-spin" />}
            {challenge ? "Verify & continue" : recover ? "Continue" : "Sign in"}
            <ArrowRight />
          </Button>
        </form>
        <Button
          variant="link"
          className="mt-4 px-0"
          onClick={() => {
            setRecover(!recover);
            setChallenge(null);
            setError("");
          }}
        >
          {recover || challenge ? "Back to sign in" : "Forgot your password?"}
        </Button>
        <div className="notice mt-6">
          <strong>Demo access</strong>
          <br />
          Super Admin: irene@loadmaster.test
          <br />
          Password: DemoCargo2026!
          <br />
          <span className="muted">
            Other roles: daniel, rita, peter, joan @loadmaster.test.
          </span>
        </div>
      </div>
    </div>
  );
}
function Overview() {
  const { data, can, openOrder } = useAdmin();
  const completed = data.orders.filter((o) =>
    ["delivered", "returned"].includes(o.stage),
  );
  const collected = completed
    .filter((o) => o.payment?.status === "paid")
    .reduce((n, o) => n + o.quote.total - o.financial.refunded, 0);
  const active = data.orders.filter(
    (o) =>
      !["cancelled", "delivered", "returned", "scheduled"].includes(o.stage),
  );
  const drivers = data.people.filter((p) => p.role === "driver" && p.online);
  const chart = Array.from({ length: 7 }, (_, i) => {
    const day = new Date();
    day.setDate(day.getDate() - 6 + i);
    const date = day.toISOString().slice(0, 10);
    return {
      day: day.toLocaleDateString("en-GB", { weekday: "short" }),
      orders: data.orders.filter((o) => o.createdAt.startsWith(date)).length,
    };
  });
  return (
    <>
      <PageTitle
        title="Dashboard"
        description="Today’s trips, drivers and collections."
        action={
          <Badge variant="outline">● Updated from shared demo service</Badge>
        }
      />
      <div className="metric-grid">
        <Metric
          featured
          label="TOTAL TRIPS"
          value={data.orders.length}
          note={`${completed.length} completed deliveries`}
          icon={Package}
        />
        <Metric
          label="MOVES IN PROGRESS"
          value={active.length}
          note="Searching, pickup and delivery"
          icon={Activity}
        />
        <Metric
          label="DRIVERS ONLINE"
          value={drivers.length}
          note="Availability confirmed by service"
          icon={Truck}
        />
        <Metric
          label={can("finance") ? "NET COLLECTIONS" : "REGISTERED CUSTOMERS"}
          value={
            can("finance")
              ? money(collected)
              : data.people.filter((p) => p.role === "customer").length
          }
          note={
            can("finance")
              ? "Confirmed collections, less refunds"
              : "Accounts in this demo"
          }
          icon={can("finance") ? Wallet : Users}
        />
      </div>
      <div className="two-columns">
        <Card className="panel p-0 gap-0">
          <CardHeader className="panel-heading">
            <CardTitle>Trip activity</CardTitle>
            <span className="muted">Last 7 days</span>
          </CardHeader>
          <CardContent className="p-0">
            <Suspense fallback={<Skeleton className="chart" />}>
              <OrderChart data={chart} />
            </Suspense>
          </CardContent>
        </Card>
        <Card className="panel p-0 gap-0">
          <CardHeader className="panel-heading">
            <CardTitle>At a glance</CardTitle>
            <Activity size={17} />
          </CardHeader>
          <CardContent className="panel-body">
            {[
              [
                "Trips awaiting a driver",
                data.orders.filter((o) => o.stage === "searching").length,
              ],
              [
                "Scheduled pickups",
                data.orders.filter((o) => o.stage === "scheduled").length,
              ],
              [
                "Drivers awaiting verification",
                data.people.filter((p) => p.role === "driver" && !p.verified)
                  .length,
              ],
              [
                "Open support cases",
                data.tickets.filter((t) => t.status !== "resolved").length,
              ],
            ].map(([l, n]) => (
              <div className="activity-row" key={l}>
                <span className="activity-dot" />
                <p className="flex-1">{l}</p>
                <strong className="text-sm">{n}</strong>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <DataTable
        title="Latest trips"
        rows={[...data.orders].reverse()}
        columns={orderColumns(data, can("finance"))}
        onSelect={(r) => openOrder(r.id)}
        exportName="trips"
        tableId="orders"
        searchText={(r) => tripSearch(data, r)}
        searchPlaceholder="Trip ID, customer, driver ID, plate, phone or email"
      />
    </>
  );
}
/** A name in a table that opens the person's page without opening the row. */
function PersonLink({ id, plate }: { id?: string; plate?: boolean }) {
  const { data, openPerson } = useAdmin();
  const p = data.people.find((p) => p.id === id);
  if (!p) return <span className="muted">Not assigned</span>;
  return (
    <span className="person-link-cell">
      <button
        className="person-link"
        onClick={(e) => {
          e.stopPropagation();
          openPerson(p.id);
        }}
      >
        {p.name}
      </button>
      {plate && p.plate && <small>{p.plate}</small>}
    </span>
  );
}
function orderColumns(data: AdminData, finance = true) {
  return [
    { key: "id", label: "Trip", render: (r: Row) => <strong>{r.id}</strong> },
    {
      key: "createdAt",
      label: "Created",
      render: (r: Row) => new Date(r.createdAt).toLocaleDateString(),
    },
    { key: "pickup", label: "Pickup", render: (r: Row) => r.quote.pickup.name },
    {
      key: "destination",
      label: "Destination",
      render: (r: Row) => r.quote.destination.name,
    },
    {
      key: "customer",
      label: "Customer",
      render: (r: Row) => <PersonLink id={r.customerId} />,
    },
    {
      key: "driver",
      label: "Driver",
      render: (r: Row) => <PersonLink id={r.driverId} plate />,
    },
    {
      key: "stage",
      label: "Status",
      render: (r: Row) => <Status value={r.stage} />,
    },
    ...(finance
      ? [
          {
            key: "total",
            label: "Fare",
            render: (r: Row) => <strong>{money(r.quote.total)}</strong>,
          },
        ]
      : []),
  ];
}
function TripsPage() {
  const { can } = useAdmin();
  const [params, setParams] = useSearchParams();
  const view =
    params.get("view") === "tracking" && can("tracking")
      ? "tracking"
      : can("orders")
        ? "records"
        : "tracking";
  return (
    <>
      <PageTitle
        title="Trips"
        description="All cargo trips and live driver positions."
      />
      <Tabs
        value={view}
        onValueChange={(value) =>
          setParams(value === "tracking" ? { view: "tracking" } : {})
        }
        className="trips-tabs"
      >
        <TabsList aria-label="Trip views">
          {can("orders") && (
            <TabsTrigger value="records">Trip records</TabsTrigger>
          )}
          {can("tracking") && (
            <TabsTrigger value="tracking">
              <MapPin size={15} />
              Driver tracking
            </TabsTrigger>
          )}
        </TabsList>
        {can("orders") && (
          <TabsContent value="records">
            <TripRecords />
          </TabsContent>
        )}
        {can("tracking") && (
          <TabsContent value="tracking">
            <Tracking />
          </TabsContent>
        )}
      </Tabs>
    </>
  );
}
const IN_PROGRESS = [
  "assigned",
  "to_pickup",
  "at_pickup",
  "loading",
  "in_transit",
  "at_destination",
  "offloading",
  "returning",
];
const tripGroups: [string, string, (o: Row) => boolean][] = [
  ["all", "All trips", () => true],
  ["in_progress", "In progress", (o) => IN_PROGRESS.includes(o.stage)],
  ["searching", "Finding a driver", (o) => o.stage === "searching"],
  ["scheduled", "Scheduled", (o) => o.stage === "scheduled"],
  ["completed", "Completed", (o) => o.stage === "delivered"],
  ["returned", "Returned", (o) => o.stage === "returned"],
  ["cancelled", "Cancelled", (o) => o.stage === "cancelled"],
];
/** Names, IDs, phones, emails and plates a trip can be found by. */
function tripSearch(data: AdminData, o: Row) {
  const who = (id: string) => {
    const p = data.people.find((p) => p.id === id);
    return p ? [p.id, p.name, p.phone, p.email, p.plate, p.vehicle] : [];
  };
  return [
    ...who(o.customerId),
    ...who(o.driverId),
    o.quote?.pickup?.name,
    ...(o.cargoPlan?.stops || []).flatMap((s: Row) => [
      s.place?.name,
      s.recipient?.name,
      s.recipient?.phone,
    ]),
    o.recipient,
    o.recipientPhone,
  ]
    .filter(Boolean)
    .join(" ");
}
function FilterChips({
  items,
  value,
  onChange,
}: {
  items: { value: string; label: string; count?: number }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Tabs value={value} onValueChange={onChange} className="w-auto">
      <TabsList
        variant="line"
        role="tablist"
        className="filter-chips h-auto flex-wrap justify-start gap-1.5 p-0 bg-transparent border-0"
      >
        {items.map((i) => (
          <TabsTrigger
            key={i.value}
            value={i.value}
            className={cn("filter-chip", value === i.value && "active")}
          >
            {i.label}
            {i.count !== undefined && (
              <Badge
                variant={value === i.value ? "secondary" : "outline"}
                className="filter-chip-count ml-1 px-1.5 py-0 text-[11px] h-4 rounded-full pointer-events-none"
              >
                {i.count}
              </Badge>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
function TripRecords() {
  const { data, can, openOrder } = useAdmin();
  const [params, setParams] = useSearchParams();
  const group = params.get("status") || "all";
  const [range, setRange] = useState("all");
  const since = range === "all" ? 0 : Date.now() - Number(range) * 86400000;
  const inRange = data.orders.filter((o) => Date.parse(o.createdAt) >= since);
  const test = tripGroups.find((g) => g[0] === group)?.[2] || (() => true);
  return (
    <>
      <FilterChips
        value={group}
        onChange={(v) => {
          const next = new URLSearchParams(params);
          if (v === "all") next.delete("status");
          else next.set("status", v);
          setParams(next);
        }}
        items={tripGroups.map(([value, label, t]) => ({
          value,
          label,
          count: inRange.filter(t).length,
        }))}
      />
      <DataTable
        rows={[...inRange].reverse().filter(test)}
        columns={orderColumns(data, can("finance"))}
        onSelect={(r) => openOrder(r.id)}
        exportName="trips"
        tableId="orders"
        searchText={(r) => tripSearch(data, r)}
        searchPlaceholder="Trip ID, customer, driver ID, plate, phone or email"
        filters={
          <Choice
            value={range}
            onChange={setRange}
            label="Created"
            options={[
              { value: "all", label: "Any date" },
              { value: "1", label: "Last 24 hours" },
              { value: "7", label: "Last 7 days" },
              { value: "30", label: "Last 30 days" },
            ]}
          />
        }
      />
    </>
  );
}
function tripStops(o: Row): TripStop[] {
  return [
    {
      ...o.quote.pickup,
      kind: "pickup" as const,
      status: ["searching", "scheduled", "assigned", "to_pickup"].includes(
        o.stage,
      )
        ? "pending"
        : "done",
      label: "Pickup · " + o.quote.pickup.name,
    },
    ...(o.cargoPlan?.stops || [{ place: o.quote.destination }]).map(
      (s: Row, i: number) => ({
        ...s.place,
        kind: "stop" as const,
        status: s.status || (o.stage === "delivered" ? "delivered" : ""),
        label:
          "Stop " +
          (i + 1) +
          " · " +
          s.place.name +
          (s.status ? " · " + title(s.status) : ""),
      }),
    ),
  ];
}
function TripRoute({ o }: { o: Row }) {
  const { token, data } = useAdmin();
  const [route, setRoute] = useState<Row | null>(null);
  const [error, setError] = useState("");
  const stops = useMemo(() => tripStops(o), [o]);
  useEffect(() => {
    let live = true;
    setError("");
    request("/routes", token, { orderId: o.id })
      .then((r) => live && setRoute(r))
      .catch((e) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [o.id, token]);
  const coords: number[][] = route?.coordinates || [];
  const { truck, completedTo } = stagePosition(
    stops,
    coords,
    o.stage,
    o.currentStop || 0,
  );
  const active = !["delivered", "cancelled", "returned", "scheduled"].includes(
    o.stage,
  );
  const at = (stage: string) =>
    o.timeline.find((t: Row) => t.stage === stage)?.at;
  const truckName = data.trucks.find((t) => t.id === o.quote.truckId)?.name;
  return (
    <div className="trip-route">
      <Suspense fallback={<Skeleton className="trip-map" />}>
        <TripMap
          stops={stops}
          coordinates={coords}
          truck={truck}
          completedTo={completedTo}
          caption={
            (route?.label ||
              (error ? "Route unavailable · " + error : "Loading route…")) +
            (active
              ? " · Truck position estimated from the trip stage, refreshed every 4 s"
              : "")
          }
        />
      </Suspense>
      <Card className="panel trip-stops p-0 gap-0">
        <CardHeader className="panel-heading">
          <CardTitle>Route</CardTitle>
          {active ? (
            <Badge variant="outline">● Live</Badge>
          ) : (
            <Status value={o.stage} />
          )}
        </CardHeader>
        <CardContent className="panel-body">
          <div className="detail-grid compact">
            {[
              [
                "Distance",
                route?.distanceKm
                  ? route.distanceKm.toFixed(1) + " km"
                  : o.quote.distanceKm
                    ? Number(o.quote.distanceKm).toFixed(1) + " km"
                    : "—",
              ],
              [
                "Estimated drive",
                route?.durationMinutes ? route.durationMinutes + " min" : "—",
              ],
              ["Truck", truckName || "—"],
              [
                "Trip time",
                at("assigned") && (at("delivered") || at("returned"))
                  ? Math.round(
                      (Date.parse(at("delivered") || at("returned")) -
                        Date.parse(at("assigned"))) /
                        60000,
                    ) + " min (accepted → delivered)"
                  : active
                    ? "In progress"
                    : "—",
              ],
            ].map(([k, v]) => (
              <div className="detail-field" key={k}>
                <small>{k}</small>
                <p>{v}</p>
              </div>
            ))}
          </div>
          {stops.map((s, i) => (
            <div className="route-stop" key={s.label + i}>
              <span
                className={"trip-pin small " + s.kind + " " + (s.status || "")}
              >
                {s.kind === "pickup" ? "P" : i}
              </span>
              <div className="flex-1">
                <p>{s.name}</p>
                <small>
                  {s.kind === "pickup"
                    ? at("loading")
                      ? "Collected " + new Date(at("loading")).toLocaleString()
                      : "Awaiting collection"
                    : s.status
                      ? title(s.status)
                      : "Not reached"}
                </small>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
function PartyCard({ id, label }: { id?: string; label: string }) {
  const { data, openPerson } = useAdmin();
  const p = data.people.find((p) => p.id === id);
  return (
    <button
      className="party-card"
      disabled={!p}
      onClick={() => p && openPerson(p.id)}
    >
      <small>{label}</small>
      {p ? (
        <>
          <Person p={p} />
          {p.role === "driver" && (
            <span className="muted">
              {p.vehicle} · {p.plate}
            </span>
          )}
          <span className="party-link">
            View {p.role} <ArrowRight size={13} />
          </span>
        </>
      ) : (
        <p className="muted">Not assigned yet</p>
      )}
    </button>
  );
}
function TripPage({ id }: { id: string }) {
  const { data, mutate, form, can } = useAdmin();
  const navigate = useNavigate();
  const o = data.orders.find((o) => o.id === id);
  const finance = can("finance");
  const adjust = (kind: string, retryAmount?: number) =>
    form({
      title:
        kind === "refund"
          ? "Refund customer"
          : kind === "guarantee"
            ? "Pay driver from platform reserve"
            : "Pay driver from settlement",
      description:
        "Review the amount, funding and reason. All outcomes are simulated and audited.",
      fields: [
        {
          name: "amount",
          label: "Amount (UGX)",
          type: "number",
          min: 1,
          value:
            retryAmount ??
            (kind === "refund"
              ? o!.quote.total - o!.financial.refunded
              : o!.financial.earning),
        },
        reasonField,
        outcomeField,
      ],
      onSubmit: async (v, k) => {
        await mutate(`/orders/${id}/admin`, {
          ...v,
          key: k,
          action: kind,
          amount: Number(v.amount),
        });
      },
    });
  return (
    <>
      {o ? (
        <>
          <button className="back-link" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <PageTitle
            meta={"Trip · created " + new Date(o.createdAt).toLocaleString()}
            title={o.id}
            description={[
              o.quote.pickup.name,
              ...(o.cargoPlan?.stops.map((s: Row) => s.place.name) || [
                o.quote.destination.name,
              ]),
            ].join(" → ")}
            action={
              <div className="flex gap-2 flex-wrap">
                <Status value={o.stage} />
                {finance && <Status value={o.payment.status} />}
                {finance && (
                  <Badge variant="outline">{money(o.quote.total)}</Badge>
                )}
              </div>
            }
          />
          <TripRoute o={o} />
          <div className="party-grid">
            <PartyCard id={o.customerId} label="CUSTOMER" />
            <PartyCard id={o.driverId} label="DRIVER" />
            <div className="party-card">
              <small>PAYMENT</small>
              <p>
                <strong>{methodName(o.method)}</strong>
              </p>
              <span className="muted">
                {o.cargoPlan?.payer === "recipient"
                  ? "Recipient at stop 1 pays"
                  : "Ordering customer pays"}
              </span>
              {finance && <Status value={o.payment.status} />}
            </div>
            <div className="party-card">
              <small>RATING</small>
              <p>
                <strong>
                  {o.rating
                    ? "★".repeat(o.rating) + "☆".repeat(5 - o.rating)
                    : "Not rated"}
                </strong>
              </p>
              <span className="muted">{o.review || "No review"}</span>
            </div>
          </div>
          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">Trip details</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="dispatch">
                Driver requests ({(o.dispatch || []).length})
              </TabsTrigger>
              {finance && (
                <TabsTrigger value="payments">Payments & actions</TabsTrigger>
              )}
              <TabsTrigger value="issues">
                Issues ({o.issues.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="details">
              {o.cargoPlan && <CargoAdminPanel order={o} />}
              <div className="detail-grid">
                {[
                  ["Customer", personName(data, o.customerId)],
                  ["Driver", personName(data, o.driverId)],
                  [
                    "Truck",
                    data.trucks.find((t) => t.id === o.quote.truckId)?.name,
                  ],
                  ["Pickup", o.quote.pickup.name],
                  ["Destination", o.quote.destination.name],
                  [
                    "Loading",
                    o.quote.loading
                      ? o.quote.loading + " helper(s)"
                      : "Customer arranged",
                  ],
                  [
                    "Offloading",
                    o.quote.offloading
                      ? o.quote.offloading + " helper(s)"
                      : "Customer arranged",
                  ],
                  ["Cargo", o.cargo || "No extra notes"],
                  [
                    "Recipient",
                    [o.recipient, o.recipientPhone]
                      .filter(Boolean)
                      .join(" · ") || "Not supplied",
                  ],
                  ["Created", new Date(o.createdAt).toLocaleString()],
                ].map(([k, v]) => (
                  <div className="detail-field" key={k}>
                    <small>{k}</small>
                    <p>{v}</p>
                  </div>
                ))}
              </div>
              {can("orders") &&
                ["searching", "assigned", "to_pickup", "at_pickup"].includes(
                  o.stage,
                ) && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      form({
                        title: "Assign or reassign driver",
                        fields: [
                          {
                            name: "driverId",
                            label: "Verified online driver",
                            type: "select",
                            options: data.people
                              .filter(
                                (p) =>
                                  p.role === "driver" && p.online && p.verified,
                              )
                              .map((p) => ({
                                value: p.id,
                                label: p.name + " · " + p.plate,
                              })),
                          },
                          reasonField,
                        ],
                        onSubmit: async (v) => {
                          await mutate("/admin/dispatch", { ...v, id: o.id });
                        },
                      })
                    }
                  >
                    Manage assignment
                  </Button>
                )}
            </TabsContent>
            <TabsContent value="dispatch">
              <div className="mt-6">
                {(o.dispatch || []).length ? (
                  [...o.dispatch].reverse().map((e: Row, i: number) => (
                    <div
                      key={e.driverId + e.offeredAt + i}
                      className="timeline-row"
                    >
                      <span>
                        <PersonLink id={e.driverId} /> ·{" "}
                        <Status value={e.status} />
                      </span>
                      <small>
                        Offered {new Date(e.offeredAt).toLocaleString()}
                        {e.respondedAt
                          ? " · answered " +
                            new Date(e.respondedAt).toLocaleTimeString()
                          : " · expires " +
                            new Date(e.expiresAt).toLocaleTimeString()}
                      </small>
                      {e.reason && <small>{e.reason}</small>}
                    </div>
                  ))
                ) : (
                  <p className="muted">
                    No driver has been offered this trip yet.
                  </p>
                )}
              </div>
            </TabsContent>
            <TabsContent value="timeline">
              <div className="mt-6">
                {o.timeline.map((t: Row, i: number) => (
                  <div key={t.at + i} className="timeline-row">
                    {title(t.stage)}
                    <small>{new Date(t.at).toLocaleString()}</small>
                    {t.note && <small>{t.note}</small>}
                  </div>
                ))}
              </div>
            </TabsContent>
            {finance && (
              <TabsContent value="payments">
                <div className="detail-grid">
                  {[
                    ["Agreed fare", money(o.quote.total)],
                    ["Payment method", methodName(o.method)],
                    [
                      "Collection source",
                      o.method === "wallet"
                        ? o.customerId + " wallet"
                        : o.method === "cash"
                          ? "Customer cash"
                          : methodName(o.method),
                    ],
                    [
                      "Collection destination",
                      o.method === "cash" ? o.driverId : "Platform settlement",
                    ],
                    ["Driver account", o.driverId || "Unassigned"],
                    [
                      "Payment reference",
                      o.payment.reference || "Awaiting confirmation",
                    ],
                    [
                      "Paid at",
                      o.payment.paidAt
                        ? new Date(o.payment.paidAt).toLocaleString()
                        : "Awaiting confirmation",
                    ],
                    ["Platform fee", money(o.financial.fee)],
                    ["Driver entitlement", money(o.financial.earning)],
                    ["Collection", title(o.payment.status)],
                    ["Payout", title(o.financial.payoutStatus)],
                    ["Refunded", money(o.financial.refunded)],
                  ].map(([k, v]) => (
                    <div className="detail-field" key={k}>
                      <small>{k}</small>
                      <p>{v}</p>
                    </div>
                  ))}
                </div>
                <div className="notice">
                  Customer collection, delivery and driver payout are separate
                  records. A refund does not silently claw back driver earnings.
                </div>
                <div className="detail-actions">
                  {o.payment.status === "paid" &&
                    o.financial.refunded < o.quote.total && (
                      <Button onClick={() => adjust("refund")}>
                        <ArrowDownLeft />
                        Issue refund
                      </Button>
                    )}
                  {["delivered", "returned"].includes(o.stage) &&
                    o.financial.payoutStatus === "scheduled" && (
                      <Button
                        variant="outline"
                        onClick={() =>
                          adjust(
                            o.payment.status === "paid"
                              ? "payout"
                              : "guarantee",
                          )
                        }
                      >
                        <Wallet />
                        Pay driver
                      </Button>
                    )}
                </div>
                {data.operations
                  .filter((op) => op.orderId === id)
                  .map((op) => (
                    <Card key={op.id} className="mb-3">
                      <CardContent className="pt-5">
                        <div className="flex justify-between gap-4">
                          <strong className="text-sm">
                            {title(op.kind)} · {money(op.amount)}
                          </strong>
                          <Status value={op.status} />
                        </div>
                        <p className="muted mt-2">{op.reason}</p>
                        {op.status === "failed" && (
                          <>
                            <p className="muted mt-2">
                              The simulated provider failed. No funds were
                              moved.
                            </p>
                            <Button
                              className="mt-3"
                              size="sm"
                              variant="outline"
                              onClick={() => adjust(op.kind, op.amount)}
                            >
                              Retry operation
                            </Button>
                          </>
                        )}
                        {op.status === "pending" && (
                          <Button
                            className="mt-3"
                            size="sm"
                            onClick={() =>
                              form({
                                title: "Confirm pending operation",
                                fields: [reasonField],
                                submit: "Confirm demo success",
                                onSubmit: async () => {
                                  await mutate(`/orders/${id}/admin`, {
                                    action: "resolve-operation",
                                    operationId: op.id,
                                  });
                                },
                              })
                            }
                          >
                            Check & confirm operation
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                <h3 className="mt-5 mb-3">Payment attempts</h3>
                {o.payment.attempts.map((a: Row) => (
                  <div className="activity-row" key={a.id}>
                    <div className="flex-1">
                      <p>
                        {a.id} · {methodName(a.method)} ·{" "}
                        {money(a.amount ?? o.quote.total)}
                      </p>
                      <small>
                        {a.message || "Awaiting demo approval"} ·{" "}
                        {new Date(a.createdAt).toLocaleString()}
                        {a.resolvedAt &&
                          " · Resolved " +
                            new Date(a.resolvedAt).toLocaleString()}
                      </small>
                    </div>
                    <Status value={a.status} />
                  </div>
                ))}
              </TabsContent>
            )}
            <TabsContent value="issues">
              {o.issues.length ? (
                o.issues.map((i: Row) => (
                  <Card key={i.id} className="mt-4">
                    <CardContent className="pt-5">
                      <Status value={i.status} />
                      <p className="text-sm mt-3">{i.message}</p>
                      {i.replies?.map((r: Row) => (
                        <div key={r.id} className="notice mt-3">
                          {r.message}
                        </div>
                      ))}
                      {can("support") && (
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() =>
                            form({
                              title: "Respond to trip issue",
                              fields: [
                                {
                                  name: "reply",
                                  label: "Reply",
                                  type: "textarea",
                                },
                                {
                                  name: "status",
                                  label: "Case status",
                                  type: "select",
                                  value: i.status,
                                  options: [
                                    "open",
                                    "in_review",
                                    "resolved",
                                  ].map((value) => ({
                                    value,
                                    label: title(value),
                                  })),
                                },
                              ],
                              onSubmit: async (v) => {
                                await mutate("/admin/support", {
                                  ...v,
                                  id: i.id,
                                });
                              },
                            })
                          }
                        >
                          Reply or resolve
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Empty title="No issues reported" />
              )}
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <Empty
          title="Trip not found"
          detail="It may have been removed, or your role cannot see it."
        />
      )}
    </>
  );
}
function PeoplePage({ kind }: { kind: "driver" | "customer" }) {
  const { data, openPerson, form, refresh, notify, can } = useAdmin();
  const [filter, setFilter] = useState("all");
  const driver = kind === "driver";
  const seesTrips = can("orders");
  const finance = can("finance");
  const people = data.people.filter((p) => p.role === kind);
  const stats = (p: Row) => {
    const trips = data.orders.filter(
      (o) => (driver ? o.driverId : o.customerId) === p.id,
    );
    const completed = trips.filter((o) => DONE.includes(o.stage));
    const rated = trips.filter((o) => o.rating);
    const offers = data.orders.flatMap((o) =>
      (o.dispatch || []).filter((e: Row) => e.driverId === p.id),
    );
    const answered = offers.filter((e: Row) =>
      ["accepted", "declined", "missed"].includes(e.status),
    );
    const onTrip = trips.some((o) => IN_PROGRESS.includes(o.stage));
    return {
      trips: trips.length,
      completed: completed.length,
      cancelled: trips.filter((o) => o.stage === "cancelled").length,
      value: completed.reduce(
        (n, o) => n + (driver ? o.financial?.earning || 0 : o.quote.total || 0),
        0,
      ),
      rating: rated.length
        ? rated.reduce((n, o) => n + o.rating, 0) / rated.length
        : null,
      acceptance: answered.length
        ? Math.round(
            (answered.filter((e: Row) => e.status === "accepted").length /
              answered.length) *
              100,
          )
        : null,
      last: trips.at(-1)?.createdAt,
      state: onTrip ? "on_trip" : p.online ? "available" : "offline",
    };
  };
  const rows = people.map((p) => ({ ...p, stats: stats(p) }));
  const groups: [string, string, (r: Row) => boolean][] = driver
    ? [
        ["all", "All drivers", () => true],
        ["on_trip", "On trip", (r) => r.stats.state === "on_trip"],
        ["available", "Available", (r) => r.stats.state === "available"],
        ["offline", "Offline", (r) => r.stats.state === "offline"],
        ["pending", "Awaiting verification", (r) => !r.verified],
        ["suspended", "Suspended", (r) => r.status === "suspended"],
        ["inactive", "Deactivated", (r) => r.status === "inactive"],
      ]
    : [
        ["all", "All customers", () => true],
        ["active", "Active", (r) => r.status === "active"],
        ...(seesTrips
          ? ([
              [
                "ordering",
                "Trip in progress",
                (r: Row) =>
                  data.orders.some(
                    (o) =>
                      o.customerId === r.id &&
                      !["delivered", "returned", "cancelled"].includes(o.stage),
                  ),
              ],
              ["new", "No trips yet", (r: Row) => r.stats.trips === 0],
            ] as [string, string, (r: Row) => boolean][])
          : []),
        ["suspended", "Suspended", (r) => r.status === "suspended"],
        ["inactive", "Deactivated", (r) => r.status === "inactive"],
      ];
  const test = groups.find((g) => g[0] === filter)?.[2] || (() => true);
  return (
    <>
      <PageTitle
        title={driver ? "Drivers" : "Customers"}
        description={
          driver
            ? "Accounts, vehicles, verification, availability and performance."
            : "Accounts, trips, payments and support history."
        }
        action={
          <AddButton
            onClick={() =>
              form({
                title:
                  kind === "driver"
                    ? "Add a demo driver"
                    : "Add a demo customer",
                fields: [
                  { name: "name", label: "Full name" },
                  { name: "phone", label: "Phone number", type: "tel" },
                  {
                    name: "email",
                    label: "Email",
                    type: "email",
                    required: false,
                  },
                  {
                    name: "password",
                    label: "Initial demo password",
                    type: "password",
                    value: "DemoCargo2026!",
                  },
                ],
                onSubmit: async (v) => {
                  const result = await request("/auth/register", null, {
                    ...v,
                    role: kind,
                  });
                  notify(
                    "Demo account created. Verification code: " +
                      result.demoCode,
                  );
                  await refresh();
                },
              })
            }
          >
            Add {kind}
          </AddButton>
        }
      />
      <FilterChips
        value={filter}
        onChange={setFilter}
        items={groups.map(([value, label, t]) => ({
          value,
          label,
          count: rows.filter(t).length,
        }))}
      />
      <DataTable
        rows={rows.filter(test)}
        searchPlaceholder={
          driver
            ? "Name, driver ID, plate, phone or email"
            : "Name, customer ID, phone or email"
        }
        columns={[
          {
            key: "name",
            label: driver ? "Driver" : "Customer",
            render: (r) => (
              <span className="person-link-cell">
                <strong>{r.name}</strong>
                <small>{r.id}</small>
              </span>
            ),
          },
          {
            key: "phone",
            label: "Contact",
            render: (r) => (
              <span className="person-link-cell">
                {r.phone}
                <small>{r.email || "No email"}</small>
              </span>
            ),
          },
          ...(driver
            ? [
                {
                  key: "plate",
                  label: "Vehicle",
                  render: (r: Row) => (
                    <span className="person-link-cell">
                      {r.plate || "Not registered"}
                      <small>
                        {r.vehicle || ""}
                        {r.truckId
                          ? " · " +
                            (data.trucks.find((t) => t.id === r.truckId)
                              ?.name || "")
                          : ""}
                      </small>
                    </span>
                  ),
                },
                {
                  key: "availability",
                  label: "Now",
                  render: (r: Row) => <Status value={r.stats.state} />,
                },
                {
                  key: "verified",
                  label: "Verification",
                  render: (r: Row) => (
                    <Status
                      value={
                        r.verified
                          ? "approved"
                          : r.vehicleStatus === "pending"
                            ? "pending"
                            : "not_submitted"
                      }
                    />
                  ),
                },
              ]
            : []),
          ...(seesTrips
            ? [
                {
                  key: "trips",
                  label: "Trips",
                  render: (r: Row) =>
                    r.stats.completed +
                    " done · " +
                    r.stats.cancelled +
                    " cancelled",
                },
                ...(driver
                  ? [
                      {
                        key: "acceptance",
                        label: "Acceptance",
                        render: (r: Row) =>
                          r.stats.acceptance === null
                            ? "—"
                            : r.stats.acceptance + "%",
                      },
                    ]
                  : []),
                {
                  key: "rating",
                  label: "Rating",
                  render: (r: Row) =>
                    r.stats.rating ? r.stats.rating.toFixed(1) + " ★" : "—",
                },
                ...(finance
                  ? [
                      {
                        key: "value",
                        label: driver ? "Earnings" : "Spent",
                        render: (r: Row) => money(r.stats.value),
                      },
                    ]
                  : []),
                {
                  key: "last",
                  label: "Last trip",
                  render: (r: Row) =>
                    r.stats.last
                      ? new Date(r.stats.last).toLocaleDateString()
                      : "—",
                },
              ]
            : []),
          {
            key: "status",
            label: "Account",
            render: (r) => <Status value={r.status} />,
          },
          {
            key: "createdAt",
            label: "Joined",
            render: (r: Row) => new Date(r.createdAt).toLocaleDateString(),
          },
        ]}
        onSelect={(r) => openPerson(r.id)}
        exportName={kind + "-accounts"}
        tableId={kind + "-accounts"}
      />
    </>
  );
}
const DONE = ["delivered", "returned"];
const ENDED = ["delivered", "returned", "cancelled"];
function personTransactions(data: AdminData, p: Row) {
  const mine = data.orders.filter(
    (o) => o.customerId === p.id || o.driverId === p.id,
  );
  const ids = new Set(mine.map((o) => o.id));
  const rows: Row[] = [];
  if (p.role === "customer") {
    for (const o of mine.filter((o) => o.customerId === p.id))
      for (const a of o.payment?.attempts || [])
        rows.push({
          at: a.createdAt,
          type: "Trip payment",
          reference: a.id,
          orderId: o.id,
          method: methodName(a.method),
          amount: -o.quote.total,
          status: a.status,
        });
    for (const t of data.walletTopups.filter((t) => t.account === p.id))
      rows.push({
        at: t.createdAt,
        type: "Wallet top-up",
        reference: t.id,
        method: methodName(t.method),
        amount: t.amount,
        status: t.status,
      });
  } else {
    for (const o of mine.filter(
      (o) => o.driverId === p.id && DONE.includes(o.stage),
    ))
      rows.push({
        at: o.timeline.at(-1)?.at || o.createdAt,
        type: o.method === "cash" ? "Earning · cash retained" : "Trip earning",
        reference: o.id,
        orderId: o.id,
        method: methodName(o.method),
        amount: o.financial?.earning || 0,
        status: o.financial?.payoutStatus,
      });
    for (const w of data.withdrawals.filter((w) => w.driverId === p.id))
      rows.push({
        at: w.createdAt,
        type: "Payout request",
        reference: w.id,
        method:
          w.fee == null
            ? "Payout · charge unrecorded"
            : `Payout · charge ${money(w.fee)} (${w.feePayer || "driver"}) · net ${money(w.netAmount ?? w.amount)}`,
        amount: -w.amount,
        status: w.status,
      });
    for (const o of mine.filter((o) => o.financial?.cash))
      rows.push({
        at: o.timeline.at(-1)?.at || o.createdAt,
        type: "Cash fee owed to platform",
        reference: o.id,
        orderId: o.id,
        method: "Cash",
        amount: -(o.financial.cash.feeDue || 0),
        status: o.financial.cash.remitted ? "remitted" : "due",
      });
  }
  for (const op of data.operations.filter((op) => ids.has(op.orderId)))
    if (
      (p.role === "customer" && op.kind === "refund") ||
      (p.role === "driver" && op.kind !== "refund")
    )
      rows.push({
        at: op.createdAt,
        type: title(op.kind),
        reference: op.id,
        orderId: op.orderId,
        method: "Operations",
        amount: op.amount,
        status: op.status,
        note: op.reason,
      });
  for (const t of data.transfers.filter(
    (t) => t.source === p.id || t.destination === p.id,
  ))
    rows.push({
      at: t.createdAt,
      type: "Transfer",
      reference: t.id,
      method: "Ledger",
      amount: t.destination === p.id ? t.amount : -t.amount,
      status: t.status,
      note: t.reason,
    });
  for (const r of data.rewards.filter((r) => r.account === p.id))
    rows.push({
      at: r.createdAt,
      type: title(r.kind || "reward"),
      reference: r.id,
      orderId: r.orderId,
      method: "Reward",
      amount: r.amount,
      status: r.status,
    });
  return rows.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

const PHOTO_MAX = 5 * 1024 * 1024;
/** Reads an image and shrinks it to at most 256 px so it stays small in the record. */
const resizePhoto = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, 256 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas
        .getContext("2d")!
        .drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(
        canvas.toDataURL(
          file.type === "image/png" ? "image/png" : "image/jpeg",
          0.86,
        ),
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That image couldn’t be read."));
    };
    img.src = url;
  });

/** Contact, vehicle plate and profile photo, edited in place on the Profile tab. */
function ProfileEditCard({ p }: { p: Row }) {
  const { form, mutate, notify } = useAdmin();
  const driver = p.role === "driver";
  const [phone, setPhone] = useState(p.phone || "");
  const [plate, setPlate] = useState(p.plate || "");
  const [email, setEmail] = useState(p.email || "");
  const [photo, setPhoto] = useState<string | null>(p.photo || null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setPhone(p.phone || "");
    setPlate(p.plate || "");
    setEmail(p.email || "");
    setPhoto(p.photo || null);
  }, [p.id, p.phone, p.plate, p.email, p.photo]);
  const changes: Row = {};
  if (phone.trim() !== (p.phone || "")) changes.phone = phone.trim();
  if (driver && plate.trim().toUpperCase() !== (p.plate || ""))
    changes.plate = plate.trim();
  if (!driver && email.trim() !== (p.email || "")) changes.email = email.trim();
  if ((photo || null) !== (p.photo || null)) changes.photo = photo;
  const dirty = Object.keys(changes).length > 0;
  const pick = async (file?: File) => {
    setError("");
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type))
      return setError("Upload a JPG or PNG image.");
    if (file.size > PHOTO_MAX) return setError("Choose an image up to 5 MB.");
    try {
      setPhoto(await resizePhoto(file));
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const save = () =>
    form({
      title: "Save profile changes",
      description:
        "Changes to " + p.name + "’s account are recorded in the audit trail.",
      fields: [reasonField],
      submit: "Save changes",
      onSubmit: async (v) => {
        await mutate("/admin/user", { ...changes, reason: v.reason, id: p.id });
        notify("Profile updated for " + p.name + ".");
      },
    });
  return (
    <section className="profile-edit">
      <header className="profile-edit-head">
        <div>
          <small>{(driver ? "Driver" : "Customer") + " · " + p.id}</small>
          <strong>{p.name}</strong>
          <span>{p.email || "No email"}</span>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <Status value={p.status} />
          {driver && <Status value={p.online ? "online" : "offline"} />}
          {driver && <Status value={p.verified ? "approved" : "pending"} />}
        </div>
      </header>
      <hr />
      <div className="profile-edit-fields">
        <div className="profile-photo">
          <Avatar className="profile-photo-avatar">
            {photo && (
              <AvatarImage src={photo} alt={p.name + " profile photo"} />
            )}
            <AvatarFallback>{initials(p.name)}</AvatarFallback>
          </Avatar>
          <div>
            <Label htmlFor={"photo-" + p.id}>Profile photo</Label>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
              >
                {photo ? "Replace photo" : "Upload photo"}
              </Button>
              {photo && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPhoto(null)}
                >
                  Remove
                </Button>
              )}
            </div>
            <input
              ref={fileRef}
              id={"photo-" + p.id}
              type="file"
              accept="image/jpeg,image/png"
              hidden
              onChange={(e) => {
                void pick(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <small className={error ? "text-destructive" : undefined}>
              {error || "JPG or PNG · Up to 5 MB"}
            </small>
          </div>
        </div>
        <div className="profile-field">
          <Label htmlFor={"phone-" + p.id}>Phone number</Label>
          <Input
            id={"phone-" + p.id}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <small>Include the country code.</small>
        </div>
        {driver ? (
          <div className="profile-field">
            <Label htmlFor={"plate-" + p.id}>
              Car registration number plate
            </Label>
            <Input
              id={"plate-" + p.id}
              value={plate}
              placeholder="Enter number plate"
              autoCapitalize="characters"
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
            />
            <small>As shown on the vehicle registration.</small>
          </div>
        ) : (
          <div className="profile-field">
            <Label htmlFor={"email-" + p.id}>Email</Label>
            <Input
              id={"email-" + p.id}
              type="email"
              value={email}
              placeholder="name@example.com"
              onChange={(e) => setEmail(e.target.value)}
            />
            <small>Optional. Used for receipts and sign-in.</small>
          </div>
        )}
      </div>
      <footer className="profile-edit-foot">
        <small>
          {driver
            ? "Update contact details, vehicle identification and profile photo."
            : "Update contact details and profile photo."}
        </small>
        <Button size="sm" disabled={!dirty} onClick={save}>
          Save changes
        </Button>
      </footer>
    </section>
  );
}

const platformName: Record<string, string> = {
  ios: "iOS",
  android: "Android",
  web: "Web",
  other: "Other",
};
// Android reports some brands in lower case ("samsung").
const brandName = (b?: string) =>
  b ? b.charAt(0).toUpperCase() + b.slice(1) : "";
const deviceLabel = (d: Row) =>
  [
    d.brand &&
    !String(d.model || "")
      .toLowerCase()
      .startsWith(d.brand.toLowerCase())
      ? brandName(d.brand)
      : "",
    d.model,
  ]
    .filter(Boolean)
    .join(" ") ||
  platformName[d.platform] ||
  "Unknown device";
const ago = (iso?: string) => {
  if (!iso) return "—";
  const m = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (m < 2) return "Just now";
  if (m < 60) return m + " min ago";
  if (m < 48 * 60) return Math.round(m / 60) + " h ago";
  return new Date(iso).toLocaleDateString();
};
/** The phone or tablet a customer or driver uses, reported by the mobile app. */
function DeviceCard({ p }: { p: Row }) {
  const d: Row | undefined = p.device;
  const others: Row[] = (p.devices || []).slice(1);
  return (
    <section className="device-card">
      <header>
        <strong>App & device</strong>
        <small>
          Reported by the {p.role === "driver" ? "Driver" : "Customer"} app each
          time it connects.
        </small>
      </header>
      {d ? (
        <>
          <div className="detail-grid">
            {[
              ["Device", deviceLabel(d)],
              ["Device type", title(d.type || "unknown")],
              [
                "Operating system",
                [platformName[d.platform] || d.platform, d.osVersion]
                  .filter(Boolean)
                  .join(" "),
              ],
              ["Device name", d.name || "Not shared"],
              ["App version", d.appVersion || "—"],
              ["Last active", ago(d.lastSeenAt)],
              [
                "First seen on this device",
                d.firstSeenAt ? new Date(d.firstSeenAt).toLocaleString() : "—",
              ],
            ].map(([k, v]) => (
              <div key={k} className="detail-field">
                <small>{k}</small>
                <p>{v}</p>
              </div>
            ))}
          </div>
          {others.length > 0 && (
            <div className="device-history">
              <span>Earlier devices</span>
              {others.map((o) => (
                <div key={o.key}>
                  <strong>{deviceLabel(o)}</strong>
                  <small>
                    {[platformName[o.platform], o.osVersion]
                      .filter(Boolean)
                      .join(" ")}
                    {" · app "}
                    {o.appVersion || "—"}
                    {" · last active "}
                    {ago(o.lastSeenAt)}
                  </small>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="device-empty">
          No device reported yet. It appears after this account next opens the
          mobile app.
        </p>
      )}
    </section>
  );
}

function PersonPage({ id }: { id: string }) {
  const { data, form, mutate, can, openOrder, notify } = useAdmin();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const p = data.people.find((p) => p.id === id);
  if (!p)
    return (
      <Empty
        title="Account not found"
        detail="It may have been removed, or your role cannot see it."
      />
    );
  const driver = p.role === "driver";
  const finance = can("finance");
  const manageable = can("accounts.edit");
  // Roles with only "Approve drivers" may verify but not edit or suspend.
  const canVerify = can("drivers.verify");
  // Roles without trip access never see trip-derived sections (not even empty).
  const seesTrips = can("orders");
  const trips = [...data.orders]
    .filter((o) => (driver ? o.driverId : o.customerId) === p.id)
    .reverse();
  const completed = trips.filter((o) => DONE.includes(o.stage));
  const cancelled = trips.filter((o) => o.stage === "cancelled");
  const active = trips.filter((o) => !ENDED.includes(o.stage));
  const rated = trips.filter((o) => o.rating);
  const rating = rated.length
    ? (rated.reduce((n, o) => n + o.rating, 0) / rated.length).toFixed(1)
    : null;
  const value = completed.reduce(
    (n, o) => n + (driver ? o.financial?.earning || 0 : o.quote.total || 0),
    0,
  );
  const shown = trips.filter(
    (o) =>
      filter === "all" ||
      (filter === "active" && !ENDED.includes(o.stage)) ||
      (filter === "completed" && DONE.includes(o.stage)) ||
      (filter === "cancelled" && o.stage === "cancelled"),
  );
  const tx = finance ? personTransactions(data, p) : [];
  const tickets = [
    ...data.tickets
      .filter((t) => t.account === p.id)
      .map((t) => ({ ...t, source: "Account case" })),
    ...trips.flatMap((o) =>
      o.issues.map((i: Row) => ({
        ...i,
        subject: i.message,
        orderId: o.id,
        source: "Trip issue",
      })),
    ),
  ];
  const notes = data.notes.filter((n) => n.account === p.id).reverse();
  const activity = data.audit
    .filter((e) => e.actor === p.id || e.target === p.id)
    .slice(-60)
    .reverse();
  const act = (
    titleText: string,
    body: Row,
    description?: string,
    after?: (r: Row) => void,
  ) =>
    form({
      title: titleText,
      description,
      fields: [reasonField],
      onSubmit: async (v) => {
        const r = await mutate("/admin/user", { ...v, ...body, id: p.id });
        after?.(r);
      },
    });
  const current = active[0];
  return (
    <>
      <button className="back-link" onClick={() => navigate(-1)}>
        ← Back
      </button>
      <PageTitle
        meta={(driver ? "Driver" : "Customer") + " · " + p.id}
        title={p.name}
        description={[p.phone, p.email || "No email"].join(" · ")}
        action={
          <div className="flex gap-2 flex-wrap">
            <Status value={p.status} />
            {driver && <Status value={p.online ? "online" : "offline"} />}
            {driver && <Status value={p.verified ? "approved" : "pending"} />}
          </div>
        }
      />
      {(manageable || can("support") || (driver && canVerify)) && (
        <div className="detail-actions person-actions">
          {manageable && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                form({
                  title: "Edit account details",
                  fields: [
                    { name: "name", label: "Full name", value: p.name },
                    {
                      name: "phone",
                      label: "Phone number",
                      type: "tel",
                      value: p.phone,
                    },
                    {
                      name: "email",
                      label: "Email",
                      type: "email",
                      value: p.email || "",
                      required: false,
                    },
                    reasonField,
                  ],
                  onSubmit: async (v) => {
                    await mutate("/admin/user", { ...v, id: p.id });
                  },
                })
              }
            >
              <Pencil /> Edit details
            </Button>
          )}
          {can("support") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                form({
                  title: "Send a message to " + p.name,
                  description:
                    "Appears in their app under Updates. Use it for account and trip follow-ups.",
                  fields: [
                    { name: "subject", label: "Subject" },
                    { name: "text", label: "Message", type: "textarea" },
                  ],
                  submit: "Send message",
                  onSubmit: async (v) => {
                    await mutate("/admin/message", { ...v, id: p.id });
                    notify("Message sent to " + p.name + ".");
                  },
                })
              }
            >
              <MessageSquare /> Message
            </Button>
          )}
          {driver && !p.verified && canVerify && (
            <Button
              size="sm"
              onClick={() => act("Approve driver & vehicle", { verify: true })}
            >
              <Check /> Approve driver
            </Button>
          )}
          {manageable && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" aria-label="More actions">
                  More <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {driver && (
                  <DropdownMenuItem
                    onSelect={() =>
                      form({
                        title: "Edit vehicle",
                        description:
                          "Correct the registered vehicle. Not possible during a trip. The change is audited.",
                        fields: [
                          {
                            name: "vehicle",
                            label: "Make & model",
                            value: p.vehicle || "",
                          },
                          {
                            name: "plate",
                            label: "Number plate",
                            value: p.plate || "",
                          },
                          {
                            name: "truckId",
                            label: "Truck category",
                            type: "select",
                            value: p.truckId || data.trucks[0]?.id,
                            options: data.trucks.map((t) => ({
                              value: t.id,
                              label: t.name + " · " + t.capacity,
                            })),
                          },
                          reasonField,
                        ],
                        onSubmit: async (v) => {
                          await mutate("/admin/user", { ...v, id: p.id });
                        },
                      })
                    }
                  >
                    <Truck /> Edit vehicle
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onSelect={() =>
                    act(
                      "Reset password",
                      { resetPassword: true },
                      "Signs them out everywhere and sets a temporary demo password they must change on next sign-in.",
                      (r) =>
                        notify(
                          "Temporary password: " +
                            r.demoTemporaryPassword +
                            " · they must change it at sign-in.",
                        ),
                    )
                  }
                >
                  <KeyRound /> Reset password
                </DropdownMenuItem>
                {driver && p.online && (
                  <DropdownMenuItem
                    onSelect={() =>
                      act(
                        "Set driver offline",
                        { offline: true },
                        "Withdraws any open request. Accepted trips stay assigned.",
                      )
                    }
                  >
                    <Power /> Set offline
                  </DropdownMenuItem>
                )}
                {driver && p.verified && (
                  <DropdownMenuItem
                    onSelect={() =>
                      act(
                        "Revoke verification",
                        { verify: false },
                        "The driver goes offline and cannot receive requests until documents and vehicle are approved again.",
                      )
                    }
                  >
                    <ShieldOff /> Revoke verification
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {p.status === "active" ? (
                  <DropdownMenuItem
                    onSelect={() =>
                      act(
                        "Suspend " + p.name,
                        { status: "suspended" },
                        "They are signed out everywhere and cannot sign in" +
                          (driver ? " or receive requests" : " or order") +
                          " until reactivated. Active trips are not cancelled.",
                      )
                    }
                  >
                    <PauseCircle /> Suspend account
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onSelect={() =>
                      act("Reactivate " + p.name, { status: "active" })
                    }
                  >
                    <PlayCircle /> Reactivate account
                  </DropdownMenuItem>
                )}
                {p.status !== "inactive" && (
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() =>
                      act(
                        "Deactivate " + p.name,
                        { status: "inactive" },
                        "Closes the account: they are signed out and cannot sign in" +
                          (driver ? " or receive requests" : " or order") +
                          ". Records are kept, and it can be reactivated later.",
                      )
                    }
                  >
                    <UserX /> Deactivate account
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}
      {seesTrips && (
        <div className="metric-grid">
          <Metric
            featured
            label="TRIPS"
            value={trips.length}
            note={`${active.length} active now`}
            icon={Package}
          />
          <Metric
            label="COMPLETED"
            value={completed.length}
            note={
              trips.length
                ? Math.round((completed.length / trips.length) * 100) +
                  "% of trips"
                : "No trips yet"
            }
            icon={Check}
          />
          <Metric
            label="CANCELLED"
            value={cancelled.length}
            note={
              driver
                ? (trips
                    .flatMap((o) => o.dispatch || [])
                    .filter(
                      (e: Row) =>
                        e.driverId === p.id && e.status === "released",
                    ).length || 0) + " released by driver"
                : "Cancelled before collection"
            }
            icon={X}
          />
          {finance ? (
            <Metric
              label={driver ? "EARNINGS" : "SPENT"}
              value={money(value)}
              note={
                driver
                  ? "Completed trips, after platform fee"
                  : "Wallet balance " + money(data.accounts[p.id] || 0)
              }
              icon={Wallet}
            />
          ) : (
            <Metric
              label="RATING"
              value={rating ? rating + " ★" : "—"}
              note={rated.length + " rated trips"}
              icon={Activity}
            />
          )}
        </div>
      )}
      {seesTrips && current && (
        <button
          className="notice current-trip"
          onClick={() => openOrder(current.id)}
        >
          <strong>Current trip {current.id}</strong> · {title(current.stage)} ·{" "}
          {current.quote.pickup.name} → {current.quote.destination.name}
          <ArrowRight size={14} />
        </button>
      )}
      <Tabs defaultValue={seesTrips ? "trips" : "profile"} className="mt-6">
        <TabsList>
          {seesTrips && (
            <TabsTrigger value="trips">Trips ({trips.length})</TabsTrigger>
          )}
          {finance && (
            <TabsTrigger value="transactions">
              Transactions ({tx.length})
            </TabsTrigger>
          )}
          <TabsTrigger value="profile">Profile</TabsTrigger>
          {driver && seesTrips && (
            <TabsTrigger value="requests">Requests</TabsTrigger>
          )}
          {driver && <TabsTrigger value="documents">Documents</TabsTrigger>}
          {can("support") && (
            <TabsTrigger value="support">
              Support ({tickets.length})
            </TabsTrigger>
          )}
          <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
          {can("audit") && <TabsTrigger value="activity">Activity</TabsTrigger>}
        </TabsList>
        {seesTrips && (
          <TabsContent value="trips">
            <DataTable
              rows={shown}
              columns={orderColumns(data, finance).filter(
                (c) => c.key !== (driver ? "driver" : "customer"),
              )}
              onSelect={(r) => openOrder(r.id)}
              exportName={p.id + "-trips"}
              tableId="person-trips"
              filters={
                <Choice
                  value={filter}
                  onChange={setFilter}
                  label="Trip status"
                  options={[
                    ["all", `All (${trips.length})`],
                    ["active", `Active (${active.length})`],
                    ["completed", `Completed (${completed.length})`],
                    ["cancelled", `Cancelled (${cancelled.length})`],
                  ].map(([value, label]) => ({ value, label }))}
                />
              }
            />
          </TabsContent>
        )}
        {finance && (
          <TabsContent value="transactions">
            <div className="metric-grid">
              <Metric
                label="WALLET / ACCOUNT BALANCE"
                value={money(data.accounts[p.id] || 0)}
                note="Ledger account held by the platform"
                icon={WalletCards}
              />
              <Metric
                label={driver ? "SCHEDULED PAYOUT" : "REFUNDED"}
                value={money(
                  driver
                    ? completed
                        .filter(
                          (o) => o.financial?.payoutStatus === "scheduled",
                        )
                        .reduce((n, o) => n + o.financial.earning, 0)
                    : trips.reduce(
                        (n, o) => n + (o.financial?.refunded || 0),
                        0,
                      ),
                )}
                note={driver ? "Earned, not yet paid out" : "Across all trips"}
                icon={ArrowDownLeft}
              />
            </div>
            <DataTable
              rows={tx}
              columns={[
                {
                  key: "at",
                  label: "Date",
                  render: (r: Row) =>
                    r.at ? new Date(r.at).toLocaleString() : "—",
                },
                { key: "type", label: "Type" },
                { key: "reference", label: "Reference" },
                {
                  key: "orderId",
                  label: "Trip",
                  render: (r: Row) => r.orderId || "—",
                },
                { key: "method", label: "Method" },
                {
                  key: "amount",
                  label: "Amount",
                  render: (r: Row) => (
                    <strong className={r.amount < 0 ? "text-destructive" : ""}>
                      {r.amount < 0 ? "− " : "+ "}
                      {money(Math.abs(r.amount))}
                    </strong>
                  ),
                },
                {
                  key: "status",
                  label: "Status",
                  render: (r: Row) => <Status value={r.status} />,
                },
              ]}
              onSelect={(r) => r.orderId && openOrder(r.orderId)}
              exportName={p.id + "-transactions"}
              tableId="person-transactions"
            />
          </TabsContent>
        )}
        <TabsContent value="profile">
          {manageable && <ProfileEditCard p={p} />}
          <DeviceCard p={p} />
          <div className="detail-grid">
            {[
              ["Account ID", p.id],
              ["Role", title(p.role)],
              ["Phone", p.phone],
              ["Email", p.email || "Not supplied"],
              ["Phone verified", p.phoneVerified === false ? "No" : "Yes"],
              ["Joined", new Date(p.createdAt).toLocaleString()],
              ["Account status", title(p.status)],
              ...(seesTrips
                ? [
                    [
                      driver
                        ? "Average rating received"
                        : "Average rating given",
                      rating
                        ? rating + " ★ (" + rated.length + ")"
                        : "No ratings",
                    ],
                  ]
                : []),
              ...(driver
                ? [
                    ["Pairing number", p.pairCode || "—"],
                    ["Availability", p.online ? "Online" : "Offline"],
                    ["Vehicle", p.vehicle || "Not supplied"],
                    ["Plate", p.plate || "Not supplied"],
                    [
                      "Truck category",
                      data.trucks.find((t) => t.id === p.truckId)?.name ||
                        "Not registered",
                    ],
                    [
                      "Capacity",
                      data.trucks.find((t) => t.id === p.truckId)?.capacity ||
                        "—",
                    ],
                    ["Vehicle review", title(p.vehicleStatus || "—")],
                    ["Verified", p.verified ? "Approved" : "Awaiting review"],
                    [
                      "Last known location",
                      (p.lastKnown?.label || "Unknown") + " (simulated)",
                    ],
                  ]
                : [
                    ...(finance
                      ? [
                          [
                            "Payment methods",
                            (p.paymentMethods || [])
                              .map(
                                (m: Row) =>
                                  methodName(m.kind) +
                                  " •••• " +
                                  m.last4 +
                                  (m.isDefault ? " (default)" : ""),
                              )
                              .join(", ") || "None saved",
                          ],
                        ]
                      : []),
                    ...(finance
                      ? [["Wallet balance", money(data.accounts[p.id] || 0)]]
                      : []),
                  ]),
            ].map(([k, v]) => (
              <div className="detail-field" key={String(k)}>
                <small>{k}</small>
                <p>{v}</p>
              </div>
            ))}
          </div>
        </TabsContent>
        {driver && seesTrips && (
          <TabsContent value="requests">
            <DriverRequests p={p} />
          </TabsContent>
        )}
        {driver && (
          <TabsContent value="documents">
            <DriverDocuments p={p} />
          </TabsContent>
        )}
        {can("support") && (
          <TabsContent value="support">
            {tickets.length ? (
              tickets.map((t) => (
                <button
                  key={t.id}
                  className="activity-row w-full text-left"
                  onClick={() =>
                    t.orderId ? openOrder(t.orderId) : navigate("/support")
                  }
                >
                  <HelpCircle size={18} />
                  <span className="flex-1 text-sm">
                    {t.subject}
                    <small>
                      {t.source} · {t.id}
                      {t.orderId ? " · " + t.orderId : ""} ·{" "}
                      {new Date(t.createdAt).toLocaleString()}
                    </small>
                  </span>
                  <Status value={t.status} />
                </button>
              ))
            ) : (
              <Empty title="No support cases" />
            )}
          </TabsContent>
        )}
        <TabsContent value="notes">
          <div className="notice">
            Internal notes are visible to operations staff only, never to the{" "}
            {p.role}.
          </div>
          <Button
            variant="outline"
            className="my-4"
            onClick={() =>
              form({
                title: "Add internal note",
                fields: [{ name: "text", label: "Note", type: "textarea" }],
                onSubmit: async (v) => {
                  await mutate("/admin/note", { ...v, id: p.id });
                },
              })
            }
          >
            Add note
          </Button>
          {notes.map((n) => (
            <div key={n.id} className="timeline-row">
              <span>{n.text}</span>
              <small>
                {data.staff.find((s) => s.id === n.by)?.name || "Staff member"}{" "}
                · {new Date(n.at).toLocaleString()}
              </small>
            </div>
          ))}
        </TabsContent>
        {can("audit") && (
          <TabsContent value="activity">
            {activity.length ? (
              activity.map((e) => (
                <div key={e.id} className="timeline-row">
                  <span>
                    {title(e.action.replaceAll(".", " "))}
                    {e.target && e.target !== p.id ? " · " + e.target : ""}
                  </span>
                  <small>
                    {e.actor === p.id
                      ? "By " + p.name
                      : "By " +
                        (data.staff.find((s) => s.id === e.actor)?.name ||
                          personName(data, e.actor))}{" "}
                    · {new Date(e.at).toLocaleString()}
                    {e.detail?.reason ? " · " + e.detail.reason : ""}
                  </small>
                </div>
              ))
            ) : (
              <Empty title="No recorded activity" />
            )}
          </TabsContent>
        )}
      </Tabs>
    </>
  );
}
function DriverDocuments({ p }: { p: Row }) {
  const { form, mutate, can, token } = useAdmin();
  const [preview, setPreview] = useState<Row | null>(null);
  const [error, setError] = useState("");
  return (
    <>
      {can("documents.upload") && <DocumentUpload account={p.id} />}
      <ErrorNotice error={error} />
      {p.documents?.length ? (
        p.documents.map((d: Row) => (
          <div className="activity-row" key={d.id}>
            <FileCheck size={20} className="text-primary mt-1" />
            <div className="flex-1">
              <p>{d.name}</p>
              <small>
                {d.fileName} {d.reason ? "· " + d.reason : ""}
              </small>
              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setError("");
                    void request("/documents/" + d.id, token)
                      .then(setPreview)
                      .catch((e) => setError(e.message));
                  }}
                >
                  Preview
                </Button>
                {can("documents.review") && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      form({
                        title: "Review " + d.name,
                        fields: [
                          {
                            name: "status",
                            label: "Decision",
                            type: "select",
                            value:
                              d.status === "rejected" ? "rejected" : "approved",
                            options: [
                              {
                                value: "approved",
                                label: "Approve",
                              },
                              {
                                value: "rejected",
                                label: "Reject and request resubmission",
                              },
                            ],
                          },
                          reasonField,
                        ],
                        onSubmit: async (v) => {
                          await mutate("/admin/document", {
                            ...v,
                            id: d.id,
                            account: p.id,
                          });
                        },
                      })
                    }
                  >
                    Review
                  </Button>
                )}
                {can("documents.delete") && d.status !== "removed" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      form({
                        title: "Remove document evidence",
                        description:
                          "The image is removed; audit metadata is retained and the driver must resubmit.",
                        fields: [reasonField],
                        onSubmit: async (v) => {
                          await mutate("/admin/document", {
                            ...v,
                            id: d.id,
                            account: p.id,
                            status: "removed",
                          });
                        },
                      })
                    }
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
            <Status value={d.status} />
          </div>
        ))
      ) : (
        <Empty
          title="Documents not submitted"
          detail="The driver can submit documents from their native app."
        />
      )}
      <Dialog
        open={!!preview}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{preview?.name}</DialogTitle>
            <DialogDescription>{preview?.fileName}</DialogDescription>
          </DialogHeader>
          {preview?.content ? (
            <img
              className="doc-preview"
              src={preview.content}
              alt={preview.name}
            />
          ) : (
            <div className="notice">
              This is a seeded demo verification record. No real document image
              is attached.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
function DriverRequests({ p, limit }: { p: Row; limit?: number }) {
  const { data, openOrder } = useAdmin();
  const entries = data.orders
    .flatMap((o) =>
      (o.dispatch || [])
        .filter((e: Row) => e.driverId === p.id)
        .map((e: Row) => ({ ...e, order: o })),
    )
    .sort((a, b) => Date.parse(b.offeredAt) - Date.parse(a.offeredAt));
  const count = (k: string) => entries.filter((e) => e.status === k).length;
  const answered = count("accepted") + count("declined") + count("missed");
  return (
    <>
      <div className="detail-grid">
        {[
          ["Accepted", count("accepted")],
          ["Declined", count("declined")],
          ["Missed", count("missed")],
          ["Released", count("released")],
          [
            "Acceptance rate",
            answered
              ? Math.round((count("accepted") / answered) * 100) + "%"
              : "No requests yet",
          ],
        ].map(([k, v]) => (
          <div className="detail-field" key={k}>
            <small>{k}</small>
            <p>{v}</p>
          </div>
        ))}
      </div>
      {(limit ? entries.slice(0, limit) : entries).map((e) => (
        <button
          key={e.order.id + e.offeredAt}
          className="timeline-row w-full text-left"
          onClick={() => openOrder(e.order.id)}
        >
          <span>
            {e.order.id} · <Status value={e.status} />
          </span>
          <small>
            {e.order.quote.pickup.name} → {e.order.quote.destination.name} ·{" "}
            Offered {new Date(e.offeredAt).toLocaleString()}
            {e.respondedAt
              ? " · answered " + new Date(e.respondedAt).toLocaleTimeString()
              : ""}
          </small>
          {e.reason && <small>{e.reason}</small>}
        </button>
      ))}
      {!entries.length && <Empty title="No requests offered yet" />}
    </>
  );
}
function PersonDialog({
  id,
  onClose,
}: {
  id: string | null;
  onClose: () => void;
}) {
  const { data, form, mutate, openOrder, can } = useAdmin();
  const p =
    data.people.find((p) => p.id === id) ||
    data.staff.find((p) => p.id === id) ||
    (data.me.id === id ? data.me : null);
  const staff = !!p && !["driver", "customer"].includes(p.role);
  const manageable = can("accounts.edit");
  const related = data.orders.filter(
    (o) => o.customerId === id || o.driverId === id,
  );
  return (
    <>
      <Dialog
        open={!!id}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90dvh] overflow-y-auto">
          {p ? (
            <>
              <DialogHeader>
                <DialogTitle>{p.name}</DialogTitle>
                <DialogDescription>
                  {p.phone} · {p.email || "No email supplied"}
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-3">
                <Status value={p.status} />
                <Badge variant="outline">{title(p.role)}</Badge>
              </div>
              <div className="detail-grid">
                {[
                  ["Account ID", p.id],
                  ["Joined", new Date(p.createdAt).toLocaleDateString()],
                  ...(p.role === "driver"
                    ? [
                        ["Vehicle", p.vehicle || "Not supplied"],
                        ["Plate", p.plate || "Not supplied"],
                        [
                          "Capacity",
                          data.trucks.find((t) => t.id === p.truckId)
                            ?.capacity || "Not registered",
                        ],
                        [
                          "Verification",
                          p.verified ? "Approved" : "Awaiting review",
                        ],
                      ]
                    : []),
                ].map(([k, v]) => (
                  <div className="detail-field" key={k}>
                    <small>{k}</small>
                    <p>{v}</p>
                  </div>
                ))}
              </div>
              {!staff && manageable && (
                <div className="detail-actions">
                  <Button
                    variant="outline"
                    onClick={() =>
                      form({
                        title: "Update account",
                        fields: [
                          { name: "name", label: "Name", value: p.name },
                          {
                            name: "status",
                            label: "Account status",
                            type: "select",
                            value: p.status,
                            options: ["active", "suspended", "inactive"].map(
                              (value) => ({ value, label: title(value) }),
                            ),
                          },
                          reasonField,
                        ],
                        onSubmit: async (v) => {
                          await mutate("/admin/user", { ...v, id: p.id });
                        },
                      })
                    }
                  >
                    Edit account
                  </Button>
                  {p.role === "driver" && !p.verified && (
                    <Button
                      onClick={() =>
                        form({
                          title: "Approve driver & vehicle",
                          fields: [reasonField],
                          onSubmit: async (v) => {
                            await mutate("/admin/user", {
                              ...v,
                              id: p.id,
                              verify: true,
                            });
                          },
                        })
                      }
                    >
                      <Check />
                      Approve driver
                    </Button>
                  )}
                </div>
              )}
              {staff && p.id === data.me.id && (
                <div className="detail-actions">
                  <Button
                    variant="outline"
                    onClick={() =>
                      form({
                        title: "Update my profile",
                        fields: [
                          { name: "name", label: "Full name", value: p.name },
                          {
                            name: "phone",
                            label: "Phone number",
                            type: "tel",
                            value: p.phone,
                          },
                        ],
                        onSubmit: async (v) => {
                          await mutate("/admin/self", v);
                        },
                      })
                    }
                  >
                    Edit my name & phone
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      form({
                        title: "Change my password",
                        fields: [
                          {
                            name: "current",
                            label: "Current password",
                            type: "password",
                          },
                          {
                            name: "password",
                            label: "New password",
                            type: "password",
                          },
                        ],
                        onSubmit: async (v) => {
                          await mutate("/admin/self", v);
                        },
                      })
                    }
                  >
                    Change password
                  </Button>
                </div>
              )}
              {p.role === "driver" && (
                <>
                  <h3>Request record</h3>
                  <DriverRequests p={p} limit={8} />
                  <h3>Driver documents</h3>
                  <DriverDocuments p={p} />
                </>
              )}
              {!staff && related.length > 0 && (
                <>
                  <h3 className="mt-5">Related trips</h3>
                  {related.map((o) => (
                    <button
                      key={o.id}
                      className="activity-row w-full text-left"
                      onClick={() => {
                        onClose();
                        openOrder(o.id);
                      }}
                    >
                      <Package size={18} />
                      <span className="flex-1 text-sm">
                        {o.id}
                        <small>
                          {o.quote.pickup.name} → {o.quote.destination.name}
                        </small>
                      </span>
                      <Status value={o.stage} />
                    </button>
                  ))}
                </>
              )}
            </>
          ) : (
            <Empty title="Account not available" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
const FleetMap = lazy(() => import("./components/FleetMap"));
type FleetState = "on_trip" | "available" | "offline";
function Tracking() {
  const { data, token, openPerson, openOrder, can } = useAdmin();
  const [query, setQuery] = useState("");
  const [show, setShow] = useState("online");
  const [selected, setSelected] = useState<string>();
  const [routes, setRoutes] = useState<Record<string, number[][]>>({});
  const drivers = data.people.filter((p) => p.role === "driver");
  const activeTrip = (id: string) =>
    data.orders.find((o) => o.driverId === id && IN_PROGRESS.includes(o.stage));
  const activeIds = data.orders
    .filter((o) => o.driverId && IN_PROGRESS.includes(o.stage))
    .map((o) => o.id)
    .join("|");
  // Road routes for trips in progress (cached by the service for 5 min).
  useEffect(() => {
    let live = true;
    for (const id of activeIds.split("|").filter(Boolean))
      if (!routes[id])
        request("/routes", token, { orderId: id })
          .then(
            (r) => live && setRoutes((m) => ({ ...m, [id]: r.coordinates })),
          )
          .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [activeIds, token]);
  const fleet = drivers.map((p) => {
    const trip = activeTrip(p.id);
    const state: FleetState = trip
      ? "on_trip"
      : p.online
        ? "available"
        : "offline";
    let position: [number, number] = [
      p.lastKnown?.longitude ?? 32.599,
      p.lastKnown?.latitude ?? 0.343,
    ];
    let where = p.lastKnown?.label || "Location unknown";
    if (trip) {
      const stops = tripStops(trip);
      const est = stagePosition(
        stops,
        routes[trip.id] || [],
        trip.stage,
        trip.currentStop || 0,
      ).truck;
      position = est || [stops[0].longitude, stops[0].latitude];
      where =
        title(trip.stage) +
        " · " +
        (["assigned", "to_pickup", "at_pickup", "loading"].includes(trip.stage)
          ? "pickup " + trip.quote.pickup.name
          : "towards " +
            (stops[Math.min(stops.length - 1, (trip.currentStop || 0) + 1)]
              ?.name || trip.quote.destination.name));
    }
    return { p, trip, state, position, where };
  });
  const count = (st: FleetState) => fleet.filter((f) => f.state === st).length;
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const compact = (v: string) => v.toLowerCase().replace(/[^0-9a-z]/g, "");
  const matches = (f: (typeof fleet)[number]) =>
    words.every((w) => {
      const hay = [
        f.p.id,
        f.p.name,
        f.p.phone,
        f.p.email,
        f.p.plate,
        f.p.vehicle,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(w) || compact(hay).includes(compact(w));
    });
  const listed = fleet.filter(
    (f) =>
      matches(f) &&
      (show === "all" ||
        (show === "online" && f.state !== "offline") ||
        f.state === show),
  );
  const onMap = fleet.filter(
    (f) =>
      f.p.id === selected ||
      (show === "all"
        ? true
        : show === "online"
          ? f.state !== "offline"
          : f.state === show),
  );
  const sel = fleet.find((f) => f.p.id === selected);
  const selStops = useMemo(
    () => (sel?.trip ? tripStops(sel.trip) : undefined),
    [sel?.trip?.id, sel?.trip?.stage, sel?.trip?.currentStop],
  );
  return (
    <>
      <div className="metric-grid fleet-metrics">
        <Metric
          featured
          label="ONLINE"
          value={count("on_trip") + count("available")}
          note={`of ${drivers.length} drivers`}
          icon={Activity}
        />
        <Metric
          label="ON A TRIP"
          value={count("on_trip")}
          note="Assigned through to handover"
          icon={Truck}
        />
        <Metric
          label="AVAILABLE"
          value={count("available")}
          note="Online and free for requests"
          icon={Check}
        />
        <Metric
          label="OFFLINE"
          value={count("offline")}
          note="Not receiving requests"
          icon={X}
        />
      </div>
      <div className="fleet-layout">
        <div className="fleet-map">
          <Suspense fallback={<Skeleton className="fleet-map-canvas" />}>
            <FleetMap
              drivers={onMap.map((f) => ({
                id: f.p.id,
                name: f.p.name,
                plate: f.p.plate,
                longitude: f.position[0],
                latitude: f.position[1],
                state: f.state,
              }))}
              selected={selected}
              onSelect={setSelected}
              route={sel?.trip ? routes[sel.trip.id] : undefined}
              stops={selStops}
            />
          </Suspense>
          <div className="fleet-legend">
            <span>
              <i className="fleet-dot on_trip" /> On a trip
            </span>
            <span>
              <i className="fleet-dot available" /> Available
            </span>
            <span>
              <i className="fleet-dot offline" /> Offline (last known)
            </span>
          </div>
          <div className="map-caption">
            Simulated positions · trip stage for drivers on a trip, last
            drop-off otherwise · not live GPS · refreshed every 4 s
          </div>
        </div>
        <Card className="panel fleet-panel p-0 gap-0">
          <CardContent className="panel-body">
            <div className="search-input">
              <Search size={16} aria-hidden="true" />
              <Input
                aria-label="Find a driver"
                placeholder="Find driver: name, ID, plate or phone"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <FilterChips
              value={show}
              onChange={setShow}
              items={[
                {
                  value: "online",
                  label: "Online",
                  count: count("on_trip") + count("available"),
                },
                { value: "on_trip", label: "On trip", count: count("on_trip") },
                {
                  value: "available",
                  label: "Available",
                  count: count("available"),
                },
                { value: "offline", label: "Offline", count: count("offline") },
                { value: "all", label: "All", count: drivers.length },
              ]}
            />
            {sel ? (
              <div className="fleet-detail">
                <div className="flex justify-between items-start gap-3">
                  <Person p={sel.p} />
                  <button
                    className="muted text-sm"
                    onClick={() => setSelected(undefined)}
                    aria-label="Close driver details"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="flex gap-2 flex-wrap my-3">
                  <Status value={sel.state} />
                  {sel.p.status !== "active" && <Status value={sel.p.status} />}
                  {!sel.p.verified && <Status value="unverified" />}
                </div>
                <div className="detail-grid compact">
                  {[
                    ["Driver ID", sel.p.id],
                    [
                      "Vehicle",
                      (sel.p.vehicle || "—") + " · " + (sel.p.plate || "—"),
                    ],
                    [
                      "Truck",
                      data.trucks.find((t) => t.id === sel.p.truckId)?.name ||
                        "—",
                    ],
                    ["Location", sel.where],
                  ].map(([k, v]) => (
                    <div className="detail-field" key={k}>
                      <small>{k}</small>
                      <p>{v}</p>
                    </div>
                  ))}
                </div>
                {sel.trip ? (
                  <div className="fleet-trip">
                    <div className="flex justify-between items-center gap-2">
                      <strong>{sel.trip.id}</strong>
                      <Status value={sel.trip.stage} />
                    </div>
                    {tripStops(sel.trip).map((s, i) => (
                      <div className="route-stop" key={s.label + i}>
                        <span
                          className={
                            "trip-pin small " + s.kind + " " + (s.status || "")
                          }
                        >
                          {s.kind === "pickup" ? "P" : i}
                        </span>
                        <div className="flex-1">
                          <p>{s.name}</p>
                          <small>
                            {s.status
                              ? title(s.status)
                              : s.kind === "pickup"
                                ? "Pickup"
                                : "Not reached"}
                          </small>
                        </div>
                      </div>
                    ))}
                    <p className="muted text-sm mt-2">
                      Customer: <PersonLink id={sel.trip.customerId} />
                      {can("finance") && sel.trip.quote.total
                        ? " · " + money(sel.trip.quote.total)
                        : ""}
                    </p>
                    <Button
                      className="mt-3 w-full"
                      onClick={() => openOrder(sel.trip!.id)}
                    >
                      Open trip details
                    </Button>
                  </div>
                ) : (
                  <p className="muted text-sm">
                    {sel.state === "available"
                      ? "Online and waiting for a request."
                      : "Offline. Shown at their last known location."}
                  </p>
                )}
                <Button
                  variant="outline"
                  className="mt-3 w-full"
                  onClick={() => openPerson(sel.p.id)}
                >
                  Open driver profile
                </Button>
              </div>
            ) : (
              <div className="fleet-list">
                {listed.length ? (
                  listed.map((f) => (
                    <button
                      key={f.p.id}
                      className="activity-row w-full text-left"
                      onClick={() => setSelected(f.p.id)}
                    >
                      <i className={"fleet-dot " + f.state} />
                      <span className="flex-1 text-sm">
                        <strong>{f.p.name}</strong> · {f.p.plate || "No plate"}
                        <small className="block muted">
                          {f.trip ? f.trip.id + " · " : ""}
                          {f.where}
                        </small>
                      </span>
                      <ChevronRight size={16} />
                    </button>
                  ))
                ) : (
                  <Empty
                    title="No matching drivers"
                    detail="Try another name, plate or filter."
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
function PaymentsPage() {
  const { data, openOrder } = useAdmin();
  const [status, setStatus] = useState("all");
  const orders = data.orders.filter(
    (o) =>
      o.stage !== "cancelled" &&
      (status === "all" || o.payment.status === status),
  );
  const paid = orders.filter((o) => o.payment.status === "paid");
  return (
    <>
      <PageTitle
        title="Collections"
        description="Trip payments, retries, refunds and exceptions."
      />
      <div className="metric-grid">
        <Metric
          featured
          label="CONFIRMED COLLECTIONS"
          value={money(paid.reduce((n, o) => n + o.quote.total, 0))}
          note="Gross successful collections"
          icon={WalletCards}
        />
        <Metric
          label="REFUNDS ISSUED"
          value={money(orders.reduce((n, o) => n + o.financial.refunded, 0))}
          note="Refunds returned through the original payment method"
          icon={ArrowDownLeft}
        />
        <Metric
          label="PAYMENT EXCEPTIONS"
          value={
            orders.filter((o) =>
              ["failed", "unknown"].includes(o.payment.status),
            ).length
          }
          note="Failed or awaiting confirmation"
          icon={Activity}
        />
        <Metric
          label="AWAITING PAYMENT"
          value={money(
            orders
              .filter(
                (o) =>
                  ["delivered", "returned"].includes(o.stage) &&
                  o.payment.status !== "paid",
              )
              .reduce((n, o) => n + o.quote.total, 0),
          )}
          note="Outstanding collection obligations"
          icon={ClipboardCheck}
        />
      </div>
      <DataTable
        rows={[...orders].reverse()}
        columns={[
          { key: "id", label: "Trip" },
          {
            key: "customerId",
            label: "Customer",
            render: (r) => <PersonLink id={r.customerId} />,
          },
          {
            key: "driverId",
            label: "Driver",
            render: (r) =>
              r.driverId ? <PersonLink id={r.driverId} /> : "Unassigned",
          },
          { key: "total", label: "Fare", render: (r) => money(r.quote.total) },
          {
            key: "fee",
            label: "Commission",
            render: (r) => money(r.financial.fee),
          },
          {
            key: "earning",
            label: "Driver earning",
            render: (r) => money(r.financial.earning),
          },
          {
            key: "reference",
            label: "Payment reference",
            render: (r) =>
              r.payment.reference || r.payment.attempts.at(-1)?.id || "—",
          },
          {
            key: "attempts",
            label: "Attempts",
            render: (r) => r.payment.attempts.length,
          },
          {
            key: "method",
            label: "Method",
            render: (r) => methodName(r.method),
          },
          {
            key: "status",
            label: "Collection",
            render: (r) => <Status value={r.payment.status} />,
          },
          {
            key: "refunded",
            label: "Refunded",
            render: (r) => money(r.financial.refunded),
          },
          {
            key: "payout",
            label: "Driver payout",
            render: (r) => <Status value={r.financial.payoutStatus} />,
          },
        ]}
        onSelect={(r) => openOrder(r.id)}
        filters={
          <Choice
            label="Collection status"
            value={status}
            onChange={setStatus}
            options={[
              "all",
              "paid",
              "failed",
              "unknown",
              "processing",
              "awaiting_approval",
              "not_due",
            ].map((value) => ({ value, label: title(value) }))}
          />
        }
        exportName="collections"
      />
    </>
  );
}
function PayoutsPage() {
  const { data, form, mutate, openOrder } = useAdmin();
  const earned = data.orders.filter((o) =>
    ["delivered", "returned"].includes(o.stage),
  );
  return (
    <>
      <PageTitle
        title="Driver payouts"
        description="Office approval followed by finance disbursement. Provider payments are simulated."
      />
      <div className="metric-grid">
        <Metric
          label="CONFIRMED PAYOUT CHARGES"
          value={money(
            data.withdrawals
              .filter((w) => w.status === "paid")
              .reduce((n, w) => n + (w.fee || 0), 0),
          )}
          note="Charges recorded on successful withdrawals"
          icon={Wallet}
        />
        <Metric
          label="RECORDED NET PAYOUTS"
          value={money(
            data.withdrawals
              .filter((w) => w.status === "paid" && w.netAmount != null)
              .reduce((n, w) => n + (w.netAmount ?? 0), 0),
          )}
          note="Net destination amounts"
          icon={Wallet}
        />
      </div>
      <DataTable
        title="Payout requests"
        rows={[...data.withdrawals].reverse()}
        columns={[
          { key: "id", label: "Request" },
          {
            key: "driverId",
            label: "Driver",
            render: (r) => <PersonLink id={r.driverId} />,
          },
          { key: "amount", label: "Amount", render: (r) => money(r.amount) },
          {
            key: "method",
            label: "Platform",
            render: (r) => r.provider || methodName(r.method || "mtn"),
          },
          { key: "destination", label: "Destination" },
          {
            key: "fee",
            label: "Payout charge",
            render: (r) =>
              r.fee == null ? "Awaiting confirmation" : money(r.fee),
          },
          {
            key: "feePayer",
            label: "Charge paid by",
            render: (r) => (r.feePayer ? title(r.feePayer) : "—"),
          },
          {
            key: "netAmount",
            label: "Driver receives",
            render: (r) =>
              r.netAmount == null
                ? "Awaiting confirmation"
                : money(r.netAmount),
          },
          { key: "reference", label: "Payment reference" },
          { key: "approvedBy", label: "Approved by" },
          { key: "paidBy", label: "Paid by" },
          {
            key: "approvedAt",
            label: "Approved",
            render: (r) =>
              r.approvedAt ? new Date(r.approvedAt).toLocaleString() : "—",
          },
          {
            key: "paidAt",
            label: "Paid",
            render: (r) =>
              r.paidAt ? new Date(r.paidAt).toLocaleString() : "—",
          },
          {
            key: "status",
            label: "Status",
            render: (r) => <Status value={r.status} />,
          },
          {
            key: "action",
            label: "Review",
            render: (r) =>
              r.status === "requested" ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    form({
                      title: "Review payout request",
                      fields: [
                        {
                          name: "status",
                          label: "Decision",
                          type: "select",
                          value: "approved",
                          options: [
                            {
                              value: "approved",
                              label: "Approve for finance payment",
                            },
                            { value: "rejected", label: "Reject with reason" },
                          ],
                        },
                        reasonField,
                      ],
                      onSubmit: async (v) => {
                        await mutate("/admin/withdrawal", { ...v, id: r.id });
                      },
                    })
                  }
                >
                  Review request
                </Button>
              ) : ["approved", "failed", "processing"].includes(r.status) ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    form({
                      title:
                        r.status === "processing"
                          ? "Resolve pending payout"
                          : "Finance payment",
                      description: `${money(r.amount)} to ${r.destination || "registered phone"} via ${r.provider || r.method || "mtn"}. Confirm the external result before recording payment.`,
                      fields: [
                        {
                          name: "outcome",
                          label: "Demo payment outcome",
                          type: "select",
                          value: "success",
                          options: (r.status === "processing"
                            ? ["success", "failed"]
                            : ["success", "pending", "failed", "reject"]
                          ).map((value) => ({ value, label: title(value) })),
                        },
                        {
                          name: "fee",
                          label: "Provider payout charge (UGX)",
                          type: "number",
                          min: 0,
                          step: "1",
                          value: String(r.fee ?? 0),
                        },
                        {
                          name: "feePayer",
                          label: "Charge paid by",
                          type: "select",
                          value:
                            r.feePayer ||
                            (r.status === "processing" ? "driver" : "platform"),
                          options: [
                            {
                              value: "platform",
                              label: "LoadMaster covers the charge",
                            },
                            {
                              value: "driver",
                              label: "Deduct from the requested withdrawal",
                            },
                          ],
                        },
                        {
                          name: "reference",
                          label: "Finance / provider reference",
                          required: false,
                        },
                        reasonField,
                      ],
                      onSubmit: async (v, key) => {
                        await mutate("/admin/withdrawal", {
                          ...v,
                          fee: Number(v.fee),
                          id: r.id,
                          status:
                            v.outcome === "reject"
                              ? "rejected"
                              : r.status === "processing"
                                ? "resolve"
                                : "pay",
                          key,
                        });
                      },
                    })
                  }
                >
                  {r.status === "processing"
                    ? "Check payout result"
                    : r.status === "failed"
                      ? "Retry payout"
                      : "Finance payment"}
                </Button>
              ) : (
                <span className="muted">{r.reason || "Processed"}</span>
              ),
          },
        ]}
      />
      <DataTable
        title="Payout attempts"
        rows={data.withdrawals.flatMap((w) =>
          (w.attempts || []).map((a: Row) => ({
            ...a,
            withdrawalId: w.id,
            driverId: w.driverId,
            amount: w.amount,
          })),
        )}
        columns={[
          { key: "id", label: "Attempt" },
          { key: "withdrawalId", label: "Withdrawal" },
          {
            key: "driverId",
            label: "Driver",
            render: (r) => <PersonLink id={r.driverId} />,
          },
          { key: "amount", label: "Amount", render: (r) => money(r.amount) },
          {
            key: "status",
            label: "Status",
            render: (r) => <Status value={r.status} />,
          },
          {
            key: "fee",
            label: "Recorded charge",
            render: (r) => (r.fee == null ? "—" : money(r.fee)),
          },
          {
            key: "feePayer",
            label: "Charge paid by",
            render: (r) => (r.feePayer ? title(r.feePayer) : "—"),
          },
          {
            key: "netAmount",
            label: "Net on success",
            render: (r) => (r.netAmount == null ? "—" : money(r.netAmount)),
          },
          { key: "reference", label: "Provider reference" },
          { key: "message", label: "Reason" },
        ]}
        exportName="payout-attempts"
      />
      <DataTable
        title="Completed delivery earnings"
        rows={[...earned].reverse()}
        columns={[
          { key: "id", label: "Trip" },
          {
            key: "driverId",
            label: "Driver",
            render: (r) => <PersonLink id={r.driverId} />,
          },
          {
            key: "earning",
            label: "Entitlement",
            render: (r) => money(r.financial.earning),
          },
          {
            key: "disbursed",
            label: "Disbursed",
            render: (r) =>
              money(
                r.financial.disbursed ??
                  (r.financial.payoutStatus === "paid"
                    ? r.financial.earning
                    : 0),
              ),
          },
          {
            key: "remaining",
            label: "Remaining",
            render: (r) =>
              money(
                r.financial.payoutStatus === "paid"
                  ? 0
                  : r.financial.earning - (r.financial.disbursed || 0),
              ),
          },
          {
            key: "collection",
            label: "Customer collection",
            render: (r) => <Status value={r.payment.status} />,
          },
          {
            key: "payout",
            label: "Payout status",
            render: (r) => <Status value={r.financial.payoutStatus} />,
          },
        ]}
        onSelect={(r) => openOrder(r.id)}
        exportName="driver-earnings"
      />
    </>
  );
}
function TransfersPage() {
  const { data, form, mutate } = useAdmin();
  const accounts = Object.entries(data.accounts);
  const options = accounts.map(([value]) => ({
    value,
    label:
      personName(data, value) === "Not assigned"
        ? title(value)
        : personName(data, value),
  }));
  return (
    <>
      <PageTitle
        title="Transfers & ledger"
        description="Account balances, transfers and double-entry ledger."
        action={
          <AddButton
            onClick={() =>
              form({
                title: "Create demo transfer",
                fields: [
                  {
                    name: "source",
                    label: "Source account",
                    type: "select",
                    value: "platform",
                    options,
                  },
                  {
                    name: "destination",
                    label: "Destination account",
                    type: "select",
                    options,
                  },
                  {
                    name: "amount",
                    label: "Amount (UGX)",
                    type: "number",
                    min: 1,
                  },
                  reasonField,
                  outcomeField,
                ],
                onSubmit: async (v, k) => {
                  await mutate("/admin/transfer", {
                    ...v,
                    amount: Number(v.amount),
                    key: k,
                  });
                },
              })
            }
          >
            New transfer
          </AddButton>
        }
      />
      <div className="account-grid">
        {accounts.map(([id, n]) => (
          <Card key={id} className="account-balance p-0 gap-0">
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground">
                {personName(data, id) === "Not assigned"
                  ? title(id)
                  : personName(data, id)}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <strong className="text-2xl font-bold">{money(n)}</strong>
              <p className="muted mt-2">
                {id === "platform"
                  ? "Platform funding reserve"
                  : id === "settlement"
                    ? "Collected funds available for settlement"
                    : "Demo adjustment / payout clearing account"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <DataTable
        title="Transfer history"
        rows={[...data.transfers].reverse()}
        columns={[
          { key: "id", label: "Reference" },
          {
            key: "source",
            label: "From",
            render: (r) => options.find((o) => o.value === r.source)?.label,
          },
          {
            key: "destination",
            label: "To",
            render: (r) =>
              options.find((o) => o.value === r.destination)?.label,
          },
          { key: "amount", label: "Amount", render: (r) => money(r.amount) },
          {
            key: "status",
            label: "Status",
            render: (r) => <Status value={r.status} />,
          },
          { key: "reason", label: "Reason" },
          {
            key: "resolve",
            label: "Action",
            render: (r) =>
              r.status === "pending" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    form({
                      title: "Resolve pending transfer",
                      fields: [reasonField],
                      onSubmit: async (v) => {
                        await mutate("/admin/transfer", {
                          ...v,
                          mode: "resolve",
                          id: r.id,
                        });
                      },
                    })
                  }
                >
                  Check status
                </Button>
              ) : (
                "—"
              ),
          },
        ]}
        exportName="transfers"
      />
      <DataTable
        title="Balanced ledger"
        rows={[...data.ledger].reverse().map((l) => ({
          ...l,
          debit: l.entries.find((e: Row) => e.amount < 0)?.account,
          credit: l.entries.find((e: Row) => e.amount > 0)?.account,
          amount: l.entries.find((e: Row) => e.amount > 0)?.amount,
        }))}
        columns={[
          { key: "id", label: "Entry" },
          { key: "kind", label: "Operation" },
          { key: "reference", label: "Reference" },
          { key: "debit", label: "Debit account" },
          { key: "credit", label: "Credit account" },
          {
            key: "amount",
            label: "Balanced amount",
            render: (r) => money(r.amount),
          },
        ]}
        exportName="ledger"
      />
    </>
  );
}
function ReconciliationPage() {
  const { data, form, mutate } = useAdmin();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const latest =
    data.reconciliations.find((r) => r.id === selectedId) ||
    data.reconciliations.at(-1);
  return (
    <>
      <PageTitle
        title="Reconciliation"
        description="Match provider settlement reports to payments."
        action={
          <AddButton
            onClick={() =>
              form({
                title: "Import demo settlement report",
                description:
                  "Paste CSV rows using reference,amount. Use payment references shown in Collections. No external provider is contacted.",
                fields: [
                  { name: "csv", label: "reference,amount", type: "textarea" },
                ],
                submit: "Compare records",
                onSubmit: async (v) => {
                  const lines = String(v.csv)
                    .trim()
                    .split(/\r?\n/)
                    .filter(Boolean);
                  if (lines[0]?.toLowerCase().includes("reference"))
                    lines.shift();
                  const rows = lines.map((l) => {
                    const [reference, amount] = l
                      .split(",")
                      .map((c) => c.trim().replace(/^"|"$/g, ""));
                    if (
                      !reference ||
                      !Number.isSafeInteger(Number(amount)) ||
                      Number(amount) <= 0
                    )
                      throw new Error(
                        "Use reference,positive whole amount for every row.",
                      );
                    return { reference, amount: Number(amount) };
                  });
                  await mutate("/admin/reconcile", { rows });
                  setSelectedId(null);
                },
              })
            }
          >
            Import report
          </AddButton>
        }
      />
      <div className="notice">
        Provider reports cover external payment attempts. Cash and LoadMaster
        wallet collections are recorded in the ledger. Missing, duplicate,
        unexpected, amount mismatches and provider confirmations awaiting
        application confirmation remain visible for review.
      </div>
      {latest ? (
        <DataTable
          title={"Reconciliation · " + latest.id}
          rows={latest.rows.map((r: Row, i: number) => ({
            ...r,
            id: r.reference + "-" + i,
          }))}
          columns={[
            { key: "reference", label: "Provider reference" },
            {
              key: "kind",
              label: "Record type",
              render: (r) => title(r.kind || "trip_payment"),
            },
            { key: "account", label: "Wallet account" },
            { key: "orderId", label: "Trip" },
            {
              key: "method",
              label: "Method",
              render: (r) => (r.method ? methodName(r.method) : "—"),
            },
            {
              key: "collectionStatus",
              label: "Application status",
              render: (r) =>
                r.collectionStatus ? (
                  <Status value={r.collectionStatus} />
                ) : (
                  "—"
                ),
            },
            {
              key: "expectedAmount",
              label: "Expected amount",
              render: (r) =>
                r.expectedAmount == null ? "—" : money(r.expectedAmount),
            },
            {
              key: "amount",
              label: "Amount",
              render: (r) => money(Number(r.amount)),
            },
            {
              key: "status",
              label: "Match result",
              render: (r) => <Status value={r.status} />,
            },
          ]}
          exportName="reconciliation"
        />
      ) : (
        <Empty
          title="Ready for your first comparison"
          detail="Import a demo provider report after collecting a trip payment."
        />
      )}
      <DataTable
        title="Import history"
        rows={[...data.reconciliations].reverse().map((r) => ({
          ...r,
          total: r.rows.length,
          matched: r.rows.filter((x: Row) => x.status === "matched").length,
          exceptions: r.rows.filter((x: Row) => x.status !== "matched").length,
        }))}
        columns={[
          { key: "id", label: "Run" },
          {
            key: "createdAt",
            label: "Imported",
            render: (r) => new Date(r.createdAt).toLocaleString(),
          },
          { key: "total", label: "Rows" },
          { key: "matched", label: "Matched" },
          { key: "exceptions", label: "Exceptions" },
        ]}
        onSelect={(r) => setSelectedId(r.id)}
      />
    </>
  );
}
function MethodsPage() {
  const { data } = useAdmin();
  const rows = data.people.flatMap((p) =>
    (p.paymentMethods || []).map((m: Row) => ({
      ...m,
      id: p.id + "-" + m.id,
      owner: p.name,
      role: p.role,
    })),
  );
  return (
    <>
      <PageTitle
        title="Payment methods"
        description="Saved customer and driver methods (masked)."
      />
      <DataTable
        rows={rows}
        columns={[
          { key: "owner", label: "Account owner" },
          { key: "role", label: "Role" },
          { key: "kind", label: "Method", render: (r) => title(r.kind) },
          { key: "label", label: "Label" },
          { key: "last4", label: "Account", render: (r) => "•••• " + r.last4 },
          {
            key: "isDefault",
            label: "Default",
            render: (r) =>
              r.isDefault ? <Badge variant="outline">Default</Badge> : "—",
          },
        ]}
        exportName="payment-methods"
      />
    </>
  );
}
function RewardsPage() {
  const { data, form, mutate } = useAdmin();
  return (
    <>
      <PageTitle
        title="Referrals & cashbacks"
        description="Trip-linked rewards awaiting approval or paid."
        action={
          <AddButton
            onClick={() =>
              form({
                title: "Create a demo reward",
                fields: [
                  {
                    name: "account",
                    label: "Recipient",
                    type: "select",
                    options: data.people.map((p) => ({
                      value: p.id,
                      label: p.name,
                    })),
                  },
                  {
                    name: "kind",
                    label: "Reward type",
                    type: "select",
                    value: "referral",
                    options: [
                      { value: "referral", label: "Referral bonus" },
                      { value: "cashback", label: "Customer cashback" },
                    ],
                  },
                  {
                    name: "orderId",
                    label: "Completed trip",
                    type: "select",
                    options: data.orders
                      .filter((o) => o.stage === "delivered")
                      .map((o) => ({ value: o.id, label: o.id })),
                  },
                  {
                    name: "amount",
                    label: "Amount (UGX)",
                    type: "number",
                    min: 1,
                  },
                  reasonField,
                ],
                onSubmit: async (v) => {
                  await mutate("/admin/reward", {
                    ...v,
                    mode: "create",
                    amount: Number(v.amount),
                  });
                },
              })
            }
          >
            New reward
          </AddButton>
        }
      />
      <DataTable
        rows={[...data.rewards].reverse()}
        columns={[
          { key: "id", label: "Reference" },
          { key: "kind", label: "Type", render: (r) => title(r.kind) },
          {
            key: "account",
            label: "Recipient",
            render: (r) => <PersonLink id={r.account} />,
          },
          { key: "orderId", label: "Trip" },
          { key: "amount", label: "Reward", render: (r) => money(r.amount) },
          {
            key: "status",
            label: "Status",
            render: (r) => <Status value={r.status} />,
          },
          {
            key: "action",
            label: "Action",
            render: (r) =>
              r.status === "pending" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    form({
                      title: "Pay demo reward",
                      fields: [reasonField],
                      onSubmit: async (v) => {
                        await mutate("/admin/reward", {
                          ...v,
                          id: r.id,
                          mode: "pay",
                        });
                      },
                    })
                  }
                >
                  Pay reward
                </Button>
              ) : (
                "Recorded"
              ),
          },
        ]}
        exportName="rewards"
      />
    </>
  );
}
function SupportPage() {
  const { data, form, mutate, openOrder } = useAdmin();
  const [filter, setFilter] = useState("all");
  const cases = [
    ...data.tickets,
    ...data.orders.flatMap((o) =>
      o.issues.map((i: Row) => ({
        ...i,
        orderId: o.id,
        account: o.customerId,
        subject: "Trip " + o.id,
      })),
    ),
  ].filter((c) => filter === "all" || c.status === filter);
  return (
    <>
      <PageTitle
        title="Support"
        description="Customer and driver cases, trip issues and replies."
      />
      <DataTable
        rows={[...cases].reverse()}
        columns={[
          { key: "id", label: "Case" },
          {
            key: "account",
            label: "Account",
            render: (r) => <PersonLink id={r.account} />,
          },
          { key: "subject", label: "Subject" },
          {
            key: "message",
            label: "Issue",
            render: (r) => (
              <span className="block max-w-xs truncate">{r.message}</span>
            ),
          },
          {
            key: "status",
            label: "Status",
            render: (r) => <Status value={r.status} />,
          },
          {
            key: "reply",
            label: "Response",
            render: (r) => (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  form({
                    title: "Respond to " + r.id,
                    description: r.message,
                    fields: [
                      {
                        name: "reply",
                        label: "Reply to customer/driver",
                        type: "textarea",
                      },
                      {
                        name: "status",
                        label: "Status",
                        type: "select",
                        value: r.status,
                        options: ["open", "in_review", "resolved"].map(
                          (value) => ({ value, label: title(value) }),
                        ),
                      },
                    ],
                    onSubmit: async (v) => {
                      await mutate("/admin/support", { ...v, id: r.id });
                    },
                  })
                }
              >
                Reply / resolve
              </Button>
            ),
          },
          {
            key: "orderId",
            label: "Linked trip",
            render: (r) =>
              r.orderId ? (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => openOrder(r.orderId)}
                >
                  {r.orderId}
                </Button>
              ) : (
                "Account support"
              ),
          },
        ]}
        filters={
          <Choice
            label="Case status"
            value={filter}
            onChange={setFilter}
            options={["all", "open", "in_review", "resolved"].map((value) => ({
              value,
              label: title(value),
            }))}
          />
        }
        onSelect={(r) =>
          form({
            title: "Case history · " + r.id,
            description: [
              r.message,
              ...(r.replies || []).map((x: Row) => x.message),
            ].join("\n\n"),
            fields: [],
            submit: "Close review",
            onSubmit: async () => {},
          })
        }
        exportName="support-cases"
      />
    </>
  );
}
function StaffPage() {
  const { data, can, form, mutate, notify, openPerson } = useAdmin();
  const create = () =>
    form({
      title: "Invite individual staff member",
      description:
        "No initial password field. The demo generates a temporary setup credential; the recipient sets a new password and confirms a displayed OTP on first login.",
      fields: [
        { name: "name", label: "Full name" },
        { name: "email", label: "Email", type: "email" },
        { name: "phone", label: "Phone", type: "tel" },
        {
          name: "role",
          label: "Role",
          type: "select",
          value: "Customer Care",
          options: data.roles.map((r) => ({ value: r.name, label: r.name })),
        },
      ],
      onSubmit: async (v) => {
        const result = await mutate("/admin/staff", { ...v, mode: "create" });
        notify(
          "Demo invitation created. Temporary setup password: " +
            result.demoTemporaryPassword,
        );
      },
    });
  return (
    <>
      <PageTitle
        title="Staff & roles"
        description="Staff accounts, roles and permissions."
        action={
          can("staff.write") && (
            <AddButton onClick={create}>Invite staff</AddButton>
          )
        }
      />
      <DataTable
        rows={data.staff}
        columns={[
          {
            key: "name",
            label: "Staff member",
            render: (r) => <strong>{r.name}</strong>,
          },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
          { key: "role", label: "Role" },
          {
            key: "status",
            label: "Status",
            render: (r) => <Status value={r.status} />,
          },
          {
            key: "forceReset",
            label: "Setup",
            render: (r) =>
              r.forceReset ? <Status value="setup_required" /> : "Complete",
          },
          {
            key: "actions",
            label: "Actions",
            render: (r) =>
              r.id === data.me.id ? (
                <span className="muted">You · edit from My profile</span>
              ) : can("staff.write") ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      form({
                        title: "Update staff account",
                        description:
                          "Changes revoke this person's sessions immediately. Keep one or two active Super Admins.",
                        fields: [
                          { name: "name", label: "Full name", value: r.name },
                          {
                            name: "email",
                            label: "Work email",
                            type: "email",
                            value: r.email,
                          },
                          {
                            name: "phone",
                            label: "Phone number",
                            type: "tel",
                            value: r.phone,
                            required: false,
                          },
                          {
                            name: "role",
                            label: "Role",
                            type: "select",
                            value: r.role,
                            options: data.roles.map((r) => ({
                              value: r.name,
                              label: r.name,
                            })),
                          },
                          {
                            name: "status",
                            label: "Account status",
                            type: "select",
                            value: r.status,
                            options: [
                              { value: "active", label: "Active" },
                              { value: "inactive", label: "Inactive" },
                            ],
                          },
                          reasonField,
                        ],
                        onSubmit: async (v) => {
                          await mutate("/admin/staff", {
                            ...v,
                            id: r.id,
                            mode: "update",
                          });
                        },
                      })
                    }
                  >
                    Edit account
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      form({
                        title: "Reset staff credentials",
                        fields: [reasonField],
                        onSubmit: async (v) => {
                          const result = await mutate("/admin/staff", {
                            ...v,
                            id: r.id,
                            mode: "reset",
                          });
                          notify(
                            "Demo reset credential: " +
                              result.demoTemporaryPassword,
                          );
                        },
                      })
                    }
                  >
                    Reset
                  </Button>
                </div>
              ) : (
                <span className="muted">Read only</span>
              ),
          },
        ]}
        onSelect={(r) => openPerson(r.id)}
        exportName="staff"
      />
      <RolesPanel />
    </>
  );
}
function RolesPanel() {
  const { data, form, mutate, can } = useAdmin();
  const label = Object.fromEntries(data.permissionCatalog);
  const edit = (r?: Row) =>
    form({
      title: r ? "Edit role · " + r.name : "New role",
      description: r
        ? "Changes apply to everyone with this role on their next request."
        : "Create a role, then assign it to staff from the table above.",
      fields: [
        { name: "name", label: "Role name", value: r?.name || "" },
        {
          name: "description",
          label: "Description",
          value: r?.description || "",
          required: false,
        },
        {
          name: "permissions",
          label: "Permissions",
          type: "checks",
          value: (r?.permissions || []).join(","),
          options: data.permissionCatalog.map(([value, l]: string[]) => ({
            value,
            label: l,
          })),
        },
        ...(r ? [reasonField] : []),
      ],
      onSubmit: async (v) => {
        await mutate("/admin/role", {
          ...v,
          mode: r ? "update" : "create",
          role: r?.name,
        });
      },
    });
  return (
    <DataTable
      title="Roles"
      tableId="roles"
      rows={data.roles.map((r) => ({
        ...r,
        id: r.name,
        holders: data.staff.filter((x) => x.role === r.name).length,
      }))}
      columns={[
        {
          key: "name",
          label: "Role",
          render: (r) => (
            <span className="person-link-cell">
              <strong>{r.name}</strong>
              <small>{r.description || "—"}</small>
            </span>
          ),
        },
        {
          key: "permissions",
          label: "Permissions",
          render: (r) => (
            <div className="perm-list">
              {r.permissions.map((p: string) => (
                <Badge key={p} variant="secondary">
                  {label[p] || p}
                </Badge>
              ))}
            </div>
          ),
        },
        { key: "holders", label: "Staff" },
        {
          key: "actions",
          label: "",
          render: (r) =>
            r.system ? (
              <span className="muted">Fixed</span>
            ) : can("staff.write") ? (
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => edit(r)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() =>
                    form({
                      title: "Delete role · " + r.name,
                      description: r.holders
                        ? `${r.holders} staff member(s) have this role. Move them to another role first.`
                        : "The role is removed. This cannot be undone.",
                      fields: [reasonField],
                      submit: "Delete role",
                      onSubmit: async (v) => {
                        await mutate("/admin/role", {
                          ...v,
                          mode: "delete",
                          role: r.name,
                        });
                      },
                    })
                  }
                >
                  Delete
                </Button>
              </div>
            ) : null,
        },
      ]}
      filters={
        can("staff.write") && (
          <Button size="sm" onClick={() => edit()}>
            <Plus /> New role
          </Button>
        )
      }
    />
  );
}
function AuditPage() {
  const { data, form } = useAdmin();
  const [actor, setActor] = useState("all");
  const actors = [...new Set(data.audit.map((a) => a.actor))];
  return (
    <>
      <PageTitle
        title="Audit trail"
        description="Every action, who performed it and why."
      />
      <DataTable
        rows={[...data.audit]
          .reverse()
          .filter((a) => actor === "all" || a.actor === actor)}
        columns={[
          {
            key: "at",
            label: "Timestamp",
            render: (r) => new Date(r.at).toLocaleString(),
          },
          {
            key: "actor",
            label: "Actor",
            render: (r) =>
              data.staff.find((s) => s.id === r.actor)?.name ||
              (personName(data, r.actor) !== "Not assigned" &&
                personName(data, r.actor)) ||
              r.actor,
          },
          {
            key: "action",
            label: "Action",
            render: (r) => title(r.action.replaceAll(".", " ")),
          },
          { key: "target", label: "Target" },
          {
            key: "reason",
            label: "Reason",
            render: (r) => r.detail?.reason || "—",
          },
        ]}
        onSelect={(r) =>
          form({
            title: "Audit event · " + r.id,
            description: JSON.stringify(
              {
                actor: r.actor,
                action: r.action,
                target: r.target,
                at: r.at,
                detail: r.detail,
              },
              null,
              2,
            ),
            fields: [],
            submit: "Close",
            onSubmit: async () => {},
          })
        }
        filters={
          <Choice
            label="Actor"
            value={actor}
            onChange={setActor}
            options={[
              { value: "all", label: "All actors" },
              ...actors.map((value) => ({
                value,
                label: data.staff.find((s) => s.id === value)?.name || value,
              })),
            ]}
          />
        }
        exportName="audit-trail"
      />
    </>
  );
}
function ReportsPage() {
  const { data, can } = useAdmin();
  const finance = can("finance");
  const rows = data.people
    .filter((p) => p.role === "driver")
    .map((p) => {
      const orders = data.orders.filter((o) => o.driverId === p.id);
      return {
        id: p.id,
        name: p.name,
        completed: orders.filter((o) => o.stage === "delivered").length,
        cancelled: orders.filter((o) => o.stage === "cancelled").length,
        ...(finance
          ? {
              fare: orders
                .filter((o) => o.stage === "delivered")
                .reduce((n, o) => n + o.quote.total, 0),
              earning: orders
                .filter((o) => o.stage === "delivered")
                .reduce((n, o) => n + o.financial.earning, 0),
            }
          : {}),
      };
    });
  return (
    <>
      <PageTitle
        title="Reports"
        description="Delivery, cancellation and driver performance."
      />
      <div className="metric-grid">
        <Metric
          featured
          label="COMPLETED DELIVERIES"
          value={data.orders.filter((o) => o.stage === "delivered").length}
          note="Recorded delivery handovers"
          icon={Check}
        />
        <Metric
          label="CANCELLATIONS"
          value={data.orders.filter((o) => o.stage === "cancelled").length}
          note="Cancelled before cargo handling"
          icon={X}
        />
        <Metric
          label="OPEN ISSUES"
          value={
            data.orders
              .flatMap((o) => o.issues)
              .filter((i) => i.status !== "resolved").length
          }
          note="Trip-linked support cases"
          icon={HelpCircle}
        />
        <Metric
          label="REGISTERED DRIVERS"
          value={data.people.filter((p) => p.role === "driver").length}
          note="Across all verification states"
          icon={Truck}
        />
      </div>
      <DataTable
        title="Driver activity"
        rows={rows}
        columns={[
          { key: "name", label: "Driver" },
          { key: "completed", label: "Completed" },
          { key: "cancelled", label: "Cancelled" },
          ...(finance
            ? [
                {
                  key: "fare",
                  label: "Delivery value",
                  render: (r: Row) => money(r.fare),
                },
                {
                  key: "earning",
                  label: "Driver entitlement",
                  render: (r: Row) => money(r.earning),
                },
              ]
            : []),
        ]}
        exportName="driver-activity"
      />
    </>
  );
}
function SettingsPage() {
  const { data, mutate, form } = useAdmin();
  return (
    <>
      <PageTitle
        title="Settings"
        description="Pricing and dispatch rules for new trips."
      />
      <div className="two-columns">
        <Card>
          <CardContent className="pt-6">
            <h2>Pricing & service</h2>
            <div className="detail-grid">
              <div className="detail-field">
                <small>Platform fee</small>
                <p>{Math.round(data.settings.feeRate * 100)}%</p>
              </div>
              <div className="detail-field">
                <small>Handling per helper, per location</small>
                <p>{money(data.settings.helperRate)}</p>
              </div>
              <div className="detail-field">
                <small>Driver response window</small>
                <p>{data.settings.offerSeconds ?? 45} seconds</p>
              </div>
              <div className="detail-field">
                <small>Service area</small>
                <p>{data.settings.serviceArea}</p>
              </div>
              <div className="detail-field">
                <small>Payment environment</small>
                <p>Simulated Mobile Money & card</p>
              </div>
            </div>
            <Button
              onClick={() =>
                form({
                  title: "Update demo pricing",
                  fields: [
                    {
                      name: "feeRate",
                      label: "Platform fee (decimal, e.g. 0.15)",
                      type: "number",
                      step: "0.01",
                      min: 0,
                      value: data.settings.feeRate,
                    },
                    {
                      name: "helperRate",
                      label: "Helper fee per location (UGX)",
                      type: "number",
                      min: 0,
                      value: data.settings.helperRate,
                    },
                    {
                      name: "offerSeconds",
                      label:
                        "Seconds a driver has to answer a request (15–300)",
                      type: "number",
                      min: 15,
                      value: data.settings.offerSeconds ?? 45,
                    },
                  ],
                  onSubmit: async (v) => {
                    await mutate("/admin/settings", {
                      offerSeconds: Number(v.offerSeconds),
                      feeRate: Number(v.feeRate),
                      helperRate: Number(v.helperRate),
                    });
                  },
                })
              }
            >
              Edit pricing rules
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <h2>Prototype boundaries</h2>
            <p className="muted mt-4">
              All accounts and financial outcomes in this workspace are
              synthetic. No provider, production database, SMS or email
              integration is active. Driver locations on the operations map are
              explicitly simulated.
            </p>
            <p className="muted mt-4">
              Loading and offloading are itemized independently. Complex
              equipment, stairs and heavy handling need an assisted quote. The
              current demo applies the configured platform fee to the full
              quote.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
function DocumentUpload({ account }: { account: string }) {
  const { mutate } = useAdmin();
  const [name, setName] = useState("Driver licence");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <Card className="rounded-xl bg-muted border-0 p-0 gap-0 mt-3 mb-5">
      <CardContent className="p-4">
        <Label>Submit document evidence</Label>
        <div className="mt-3 flex gap-3 flex-wrap">
          <Choice
            value={name}
            onChange={setName}
            label="Document type"
            options={[
              "Driver licence",
              "Identity document",
              "Vehicle registration",
              "Third-party insurance",
            ].map((value) => ({ value, label: value }))}
          />
          <Input
            aria-label="Upload driver document"
            type="file"
            accept="image/jpeg,image/png"
            disabled={busy}
            className="flex-1 min-w-48"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              e.target.value = "";
              setError("");
              if (
                !["image/jpeg", "image/png"].includes(file.type) ||
                file.size > 2000000
              ) {
                setError("Use a JPG or PNG image under 2 MB.");
                return;
              }
              setBusy(true);
              try {
                const content = await new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(String(reader.result));
                  reader.onerror = () =>
                    reject(new Error("Could not read this file."));
                  reader.readAsDataURL(file);
                });
                await mutate("/admin/upload", {
                  account,
                  name,
                  fileName: file.name,
                  content,
                });
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          />
        </div>
        <p className="muted mt-2">
          Use a synthetic image for this prototype. Submitting a replacement
          requires a new review.
        </p>
        {busy && <p className="muted">Uploading…</p>}
        <ErrorNotice error={error} />
      </CardContent>
    </Card>
  );
}

function CargoAdminPanel({ order: o }: { order: Row }) {
  const { form, mutate, can } = useAdmin();
  const supervisor = can("cargo.supervise");
  const action = (kind: string, label: string) =>
    form({
      title: label,
      description:
        "Review cargo custody and contact the parties before confirming. Every action is audited. No automatic return surcharge is added.",
      fields: [reasonField],
      onSubmit: async (v) => {
        await mutate("/admin/cargo", {
          id: o.id,
          action: kind,
          reason: v.reason,
          confirmed: true,
        });
      },
    });
  return (
    <div className="space-y-4 my-5">
      <div className="rounded-xl border p-4 space-y-2">
        <h3 className="font-semibold">Cargo & handovers</h3>
        <p>
          Pickup contact: {o.cargoPlan.sender.name} · {o.cargoPlan.sender.phone}
        </p>
        <p>{o.cargoPlan.pickupInstructions}</p>
        <p>
          Payer:{" "}
          {o.cargoPlan.payer === "recipient"
            ? "Recipient at stop 1"
            : "Ordering customer"}{" "}
          · {title(o.method)} {o.cargoPlan.externalWalletName}
        </p>
        {o.cargoPlan.stops.map((s: Row, i: number) => (
          <div className="border-t pt-3 space-y-1" key={s.id}>
            <h4 className="font-semibold">
              Stop {i + 1}: {s.place.name} · {title(s.status)}
            </h4>
            <p>
              {s.recipient.name} · {s.recipient.phone}
            </p>
            <p>
              {s.helpers} offloading helpers ·{" "}
              {s.pinRequired ? "Recipient PIN required" : "Driver confirmation"}{" "}
              · {s.instructions}
            </p>
            {o.cargoPlan.items
              .filter((it: Row) => it.stopId === s.id)
              .map((it: Row) => (
                <p key={it.id}>
                  {it.quantity} × {it.description} · {it.weightKg} kg each{" "}
                  {it.fragile ? "· Fragile" : ""} {it.dimensions}
                </p>
              ))}
            {s.reason && (
              <p className="text-destructive">Failed handover: {s.reason}</p>
            )}
            {s.overrideReason && <p>PIN exception: {s.overrideReason}</p>}
          </div>
        ))}
      </div>
      {supervisor && can("orders") && (
        <div className="flex flex-wrap gap-2">
          {o.stage === "offloading" &&
            o.cargoPlan.stops[o.currentStop]?.pinRequired && (
              <Button
                variant="outline"
                onClick={() =>
                  action("pin-override", "Authorize PIN exception")
                }
              >
                Review PIN exception
              </Button>
            )}
          {o.cargoPlan.stops[o.currentStop]?.status === "failed" &&
            o.currentStop < o.cargoPlan.stops.length - 1 && (
              <Button
                variant="outline"
                onClick={() =>
                  action("skip-failed", "Proceed with failed cargo in custody")
                }
              >
                Proceed to next stop
              </Button>
            )}
          {["loading", "in_transit", "at_destination", "offloading"].includes(
            o.stage,
          ) && (
            <Button
              variant="outline"
              onClick={() => action("return", "Authorize return to sender")}
            >
              Authorize cargo return
            </Button>
          )}
          {o.stage === "returning" && (
            <Button
              onClick={() =>
                action("returned", "Confirm cargo returned to sender")
              }
            >
              Confirm returned handover
            </Button>
          )}
        </div>
      )}
      {can("finance") && o.method === "cash" && (
        <div className="rounded-xl border p-4 space-y-2">
          <h3 className="font-semibold">Cash reconciliation</h3>
          <p>
            Driver declaration:{" "}
            {o.cashDeclaration
              ? money(o.cashDeclaration.amount)
              : "Awaiting cash collection"}
          </p>
          <p>
            Payer confirmation:{" "}
            {o.payment.status === "paid" ? "Confirmed" : "Pending"}
          </p>
          {o.financial.cash && (
            <>
              <p>
                Retained driver earning: {money(o.financial.earning)} · Platform
                fee due: {money(o.financial.cash.feeDue)} · Remitted:{" "}
                {money(o.financial.cash.remitted)}
              </p>
              <p className="text-sm text-muted-foreground">
                The driver retains their earning from cash. A second payout is
                blocked. Refunds credit the customer’s LoadMaster account
                through the demo ledger.
              </p>
              {!o.financial.cash.remitted && (
                <Button
                  onClick={() =>
                    form({
                      title: "Record cash fee remittance",
                      description:
                        "Confirm receipt of the platform fee from the driver and include the remittance reference.",
                      fields: [reasonField],
                      onSubmit: async (v) => {
                        await mutate("/admin/cash", {
                          id: o.id,
                          reason: v.reason,
                        });
                      },
                    })
                  }
                >
                  Record platform fee remittance
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
