import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  AlertCircle,
  Download,
  Plus,
  ArrowUpRight,
  Columns3,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { csvDownload, key, title, type Row } from "@/lib/api";
export function Status({ value }: { value: string }) {
  return (
    <Badge variant="outline" className={"status status-" + value}>
      {title(value || "not_available")}
    </Badge>
  );
}
export function ErrorNotice({ error }: { error?: string | null }) {
  return error ? (
    <Alert variant="destructive" className="error-notice">
      <AlertCircle size={17} />
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  ) : null;
}
export function Choice({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: string;
  onChange: (s: string) => void;
  options: { value: string; label: string }[];
  label: string;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className={className || "w-48"}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
export function PageTitle({
  meta,
  title: heading,
  description,
  action,
}: {
  /** Small context line above the title (detail pages only). */
  meta?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        {meta && <p className="page-meta">{meta}</p>}
        <h1>{heading}</h1>
        <p className="muted">{description}</p>
      </div>
      {action}
    </div>
  );
}
export function Empty({
  title: heading = "Nothing here yet",
  detail = "Records will appear as your applications are used.",
}: {
  title?: string;
  detail?: string;
}) {
  return (
    <div className="empty-state">
      <div className="empty-symbol">
        <ArrowUpRight />
      </div>
      <h3>{heading}</h3>
      <p>{detail}</p>
    </div>
  );
}
const TablePreferences = createContext("anonymous");
export const TablePreferencesProvider = TablePreferences.Provider;
export interface Column {
  key: string;
  label: string;
  align?: "left" | "right";
  exportable?: boolean;
  render?: (r: Row) => ReactNode;
}
function readHidden(key: string): string[] {
  try {
    const stored = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(stored) && stored.every((v) => typeof v === "string")
      ? stored
      : [];
  } catch {
    return [];
  }
}
function TableTool({
  label,
  children,
  onClick,
  disabled = false,
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="table-tool-button"
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
export function DataTable({
  rows,
  columns,
  onSelect,
  title: heading,
  filters,
  exportName,
  tableId,
  searchText,
  searchPlaceholder,
}: {
  rows: Row[];
  columns: Column[];
  onSelect?: (r: Row) => void;
  title?: string;
  filters?: ReactNode;
  exportName?: string;
  tableId?: string;
  /** Extra text a row matches on, e.g. names and phones of linked people. */
  searchText?: (r: Row) => string;
  searchPlaceholder?: string;
}) {
  const user = useContext(TablePreferences);
  const id =
    tableId || exportName || heading || columns.map((c) => c.key).join("-");
  const storageKey = "loadmaster-table-columns:" + user + ":" + id;
  const [hidden, setHidden] = useState<string[]>(() => readHidden(storageKey));
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  useEffect(() => {
    setHidden(readHidden(storageKey));
    const update = (e: StorageEvent) => {
      if (e.key === storageKey) setHidden(readHidden(storageKey));
    };
    window.addEventListener("storage", update);
    return () => window.removeEventListener("storage", update);
  }, [storageKey]);
  const effectiveHidden = columns.some((c) => !hidden.includes(c.key))
    ? hidden
    : [];
  const visible = columns.filter((c) => !effectiveHidden.includes(c.key));
  const changeHidden = (next: string[]) => {
    setHidden(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* Browser storage is optional. */
    }
  };
  const terms = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const digits = (v: string) => v.replace(/[^0-9a-z]/g, "");
  const filtered = rows.filter((r) => {
    if (!terms.length) return true;
    const hay = (
      JSON.stringify(r) +
      " " +
      (searchText?.(r) || "")
    ).toLowerCase();
    const compact = digits(hay);
    // Every word must match; phone numbers and plates match without spaces.
    return terms.every((t) => hay.includes(t) || compact.includes(digits(t)));
  });
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages - 1);
  useEffect(() => {
    setPage((p) => Math.min(p, pages - 1));
  }, [pages]);
  const numeric = (c: Column) =>
    c.align === "right" ||
    (c.align === undefined &&
      /^(amount|total|earning|refunded|fee|balance|paid|outstanding|matched|debitAmount|creditAmount)$/.test(
        c.key,
      ));
  const exported = visible.filter(
    (c) => c.exportable !== false && !["action", "resolve"].includes(c.key),
  );
  const exportRows = () =>
    csvDownload(
      exportName || id,
      filtered.map((r) =>
        Object.fromEntries(
          exported.map((c) => [c.label, exportValue(r, c.key)]),
        ),
      ),
    );
  return (
    <section
      className="data-panel"
      aria-label={heading || title(exportName || id)}
      data-table-id={id}
    >
      {heading && (
        <div className="panel-heading">
          <h2>{heading}</h2>
          <span className="muted">{rows.length} records</span>
        </div>
      )}
      <div className="table-toolbar">
        <div className="search-input">
          <Search size={16} aria-hidden="true" />
          <Input
            aria-label="Search table"
            placeholder={searchPlaceholder || "Search records…"}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
          {search && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="search-clear"
              aria-label="Clear table search"
              onClick={() => {
                setSearch("");
                setPage(0);
              }}
            >
              <X size={14} />
            </Button>
          )}
        </div>
        <div className="toolbar-actions">
          {filters}
          <div className="table-tools">
            <TableTool
              label="Export CSV"
              onClick={exportRows}
              disabled={!filtered.length || !exported.length}
            >
              <Download size={16} />
            </TableTool>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="table-tool-button"
                  aria-label="Choose columns"
                  title="Choose columns"
                >
                  <Columns3 size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {columns.map((c) => (
                  <DropdownMenuCheckboxItem
                    key={c.key}
                    checked={!effectiveHidden.includes(c.key)}
                    disabled={
                      visible.length === 1 && !effectiveHidden.includes(c.key)
                    }
                    onSelect={(e) => e.preventDefault()}
                    onCheckedChange={(checked) =>
                      changeHidden(
                        checked
                          ? effectiveHidden.filter((k) => k !== c.key)
                          : [...effectiveHidden, c.key],
                      )
                    }
                  >
                    {c.label}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => changeHidden([])}>
                  Show all columns
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      <Table
        aria-label={heading || title(exportName || id)}
        className="data-table"
        data-density="compact"
      >
        <TableHeader>
          <TableRow>
            {columns.map((c) => (
              <TableHead
                scope="col"
                key={c.key}
                hidden={effectiveHidden.includes(c.key)}
                className={numeric(c) ? "table-number" : undefined}
              >
                {c.label}
              </TableHead>
            ))}
            {onSelect && (
              <TableHead scope="col" className="table-action-column">
                <span className="sr-only">Open</span>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered
            .slice(currentPage * pageSize, (currentPage + 1) * pageSize)
            .map((r, i) => (
              <TableRow
                key={r.id || r.reference || i}
                className={onSelect ? "clickable-row" : undefined}
                onClick={
                  onSelect
                    ? (e) => {
                        // Ignore clicks on links/buttons inside the row.
                        if ((e.target as HTMLElement).closest("button, a"))
                          return;
                        onSelect(r);
                      }
                    : undefined
                }
              >
                {columns.map((c) => (
                  <TableCell
                    key={c.key}
                    hidden={effectiveHidden.includes(c.key)}
                    className={numeric(c) ? "table-number" : undefined}
                  >
                    {c.render ? c.render(r) : String(r[c.key] ?? "—")}
                  </TableCell>
                ))}
                {onSelect && (
                  <TableCell className="table-action-column">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="table-row-action"
                      aria-label={"Open " + (r.id || "record")}
                      onClick={() => onSelect(r)}
                    >
                      <ChevronRight size={15} />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
        </TableBody>
      </Table>
      {!filtered.length && (
        <Empty
          title={search ? "No matching records" : "No records yet"}
          detail={
            search
              ? "Try another name, ID or search term."
              : "New activity will appear here."
          }
        />
      )}
      <div className="table-footer">
        <span role="status" aria-live="polite">
          {filtered.length
            ? `${currentPage * pageSize + 1}–${Math.min((currentPage + 1) * pageSize, filtered.length)} of ${filtered.length} records`
            : "0 records"}
        </span>
        <div className="pagination">
          <Choice
            value={String(pageSize)}
            onChange={(v) => {
              setPageSize(Number(v));
              setPage(0);
            }}
            label="Rows per page"
            options={[10, 25, 50].map((n) => ({
              value: String(n),
              label: n + " per page",
            }))}
            className="page-size"
          />
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous page"
            disabled={!currentPage}
            onClick={() => setPage(currentPage - 1)}
          >
            <ChevronLeft />
          </Button>
          <span>
            Page {currentPage + 1} of {pages}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next page"
            disabled={currentPage >= pages - 1}
            onClick={() => setPage(currentPage + 1)}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </section>
  );
}
export interface FieldSpec {
  name: string;
  label: string;
  type?:
    | "text"
    | "email"
    | "tel"
    | "number"
    | "textarea"
    | "select"
    | "password"
    /** Several options; the value is a comma-separated list. */
    | "checks";
  value?: string | number;
  options?: { value: string; label: string }[];
  required?: boolean;
  min?: number;
  step?: string;
}
export interface FormSpec {
  title: string;
  description?: string;
  fields: FieldSpec[];
  submit?: string;
  onSubmit: (values: Row, key: string) => Promise<void>;
}
export function FormDialog({
  spec,
  onClose,
}: {
  spec: FormSpec | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={!!spec}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {spec && (
        <DialogContent className="sm:max-w-lg max-h-[90dvh] overflow-y-auto">
          <FormBody key={spec.title} spec={spec} onClose={onClose} />
        </DialogContent>
      )}
    </Dialog>
  );
}
function FormBody({ spec, onClose }: { spec: FormSpec; onClose: () => void }) {
  const [values, setValues] = useState<Row>(() =>
    Object.fromEntries(spec.fields.map((f) => [f.name, String(f.value ?? "")])),
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const requestKey = useRef(key());
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        setError(null);
        setBusy(true);
        try {
          await spec.onSubmit(values, requestKey.current);
          onClose();
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <DialogHeader>
        <DialogTitle>{spec.title}</DialogTitle>
        <DialogDescription>
          {spec.description ||
            "Changes are saved to the shared demo service. No real money or messages are sent."}
        </DialogDescription>
      </DialogHeader>
      <div className="form-fields">
        {spec.fields.map((f) => (
          <div className="field" key={f.name}>
            <Label htmlFor={"form-" + f.name}>{f.label}</Label>
            {f.type === "checks" ? (
              <div className="check-list">
                {(f.options || []).map((o) => {
                  const chosen = String(values[f.name] || "")
                    .split(",")
                    .filter(Boolean);
                  const on = chosen.includes(o.value);
                  return (
                    <label key={o.value} className="check-item">
                      <Checkbox
                        checked={on}
                        onCheckedChange={(c) =>
                          setValues({
                            ...values,
                            [f.name]: (c
                              ? [...chosen, o.value]
                              : chosen.filter((x) => x !== o.value)
                            ).join(","),
                          })
                        }
                      />
                      <span>{o.label}</span>
                    </label>
                  );
                })}
              </div>
            ) : f.type === "select" ? (
              <Choice
                value={values[f.name]}
                onChange={(v) => setValues({ ...values, [f.name]: v })}
                options={f.options || []}
                label={f.label}
                className="w-full"
              />
            ) : f.type === "textarea" ? (
              <Textarea
                id={"form-" + f.name}
                required={f.required !== false}
                value={values[f.name]}
                onChange={(e) =>
                  setValues({ ...values, [f.name]: e.target.value })
                }
              />
            ) : (
              <Input
                id={"form-" + f.name}
                type={f.type || "text"}
                required={f.required !== false}
                min={f.min}
                step={f.step}
                value={values[f.name]}
                onChange={(e) =>
                  setValues({ ...values, [f.name]: e.target.value })
                }
              />
            )}
          </div>
        ))}
      </div>
      <ErrorNotice error={error} />
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy && <LoaderCircle className="animate-spin" />}
          {spec.submit || "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}
export function AddButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <Button onClick={onClick}>
      <Plus />
      {children}
    </Button>
  );
}

function exportValue(row: Row, key: string) {
  const value = row[key];
  if (value !== undefined)
    return typeof value === "object" ? JSON.stringify(value) : value;
  const fallback: Row = {
    route: row.routeLabel,
    pickup: row.quote?.pickup?.name,
    destination: row.quote?.destination?.name,
    collectionMethod: row.method,
    total: row.quote?.total,
    customer: row.customerName || row.customerId,
    driver: row.driverName || row.driverId,
    earning: row.financial?.earning,
    refunded: row.financial?.refunded,
    payout: row.financial?.payoutStatus,
    collection: row.payment?.status,
    status: row.payment?.status,
    reason: row.detail?.reason,
  };
  return fallback[key] ?? "";
}
