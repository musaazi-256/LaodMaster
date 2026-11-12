export type Row = Record<string, any>;
export interface AdminData {
  me: Row;
  permissions: string[];
  people: Row[];
  orders: Row[];
  staff: Row[];
  audit: Row[];
  tickets: Row[];
  transfers: Row[];
  accounts: Record<string, number>;
  withdrawals: Row[];
  operations: Row[];
  ledger: Row[];
  reconciliations: Row[];
  rewards: Row[];
  walletTopups: Row[];
  notes: Row[];
  roles: Row[];
  permissionCatalog: [string, string][];
  settings: Row;
  trucks: Row[];
  places: Row[];
  serverTime: string;
}
export const API = import.meta.env.DEV ? "/api" : "";
export async function request<T = any>(
  path: string,
  token: string | null,
  body?: unknown,
): Promise<T> {
  const res = await fetch(API + path, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    const e = new Error(
      data.error?.message || "This action could not be completed.",
    ) as Error & { code: string };
    e.code = data.error?.code;
    throw e;
  }
  return data;
}
export const key = () => crypto.randomUUID();
export const money = (n: number) =>
  "UGX " + Math.round(n || 0).toLocaleString("en-UG");
export const title = (s: string) =>
  String(s || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
export function csvDownload(name: string, rows: Row[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const cell = (value: any) => {
    let s = String(value ?? "");
    if (/^[=+@-]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  const blob = new Blob(
    [
      headers.map(cell).join(",") +
        "\n" +
        rows
          .map((row) => headers.map((h) => cell(row[h])).join(","))
          .join("\n"),
    ],
    { type: "text/csv;charset=utf-8" },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name + ".csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
