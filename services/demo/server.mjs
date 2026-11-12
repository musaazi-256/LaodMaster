import http from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, extname, resolve } from "node:path";
import { DomainError } from "./model.mjs";
import { CargoStore } from "./cargo.mjs";
import { routePreview, publicPage } from "./routes.mjs";
import { populate } from "./demo-data.mjs";
const adminRoot = fileURLToPath(
  new URL("../../apps/admin/dist/", import.meta.url),
);
export function createServer(
  store = new CargoStore(
    process.env.DEMO_STATE_PATH ||
      fileURLToPath(new URL("./data/state.json", import.meta.url)),
  ),
) {
  return http.createServer(async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, Idempotency-Key, X-Device",
    );
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }
    try {
      const path = new URL(req.url, "http://localhost").pathname;
      if (
        req.method === "GET" &&
        (path === "/operations" || path.startsWith("/operations/"))
      ) {
        const relative = path.replace(/^\/operations\/?/, "");
        const candidate = resolve(adminRoot, relative);
        const file =
          candidate.startsWith(adminRoot) &&
          existsSync(candidate) &&
          extname(candidate)
            ? candidate
            : join(adminRoot, "index.html");
        if (!existsSync(file)) {
          res.writeHead(503);
          res.end(
            JSON.stringify({
              error: {
                code: "ADMIN_NOT_BUILT",
                message: "Run npm run admin:build, then open /operations.",
              },
            }),
          );
          return;
        }
        const types = {
          ".html": "text/html",
          ".js": "text/javascript",
          ".css": "text/css",
          ".svg": "image/svg+xml",
          ".png": "image/png",
          ".woff2": "font/woff2",
        };
        res.setHeader(
          "Content-Type",
          types[extname(file)] || "application/octet-stream",
        );
        res.end(readFileSync(file));
        return;
      }
      if (path === "/health") {
        res.end(JSON.stringify({ ok: true, mode: "demo" }));
        return;
      }
      let body = {};
      if (req.method === "POST") {
        let raw = "";
        for await (const chunk of req) {
          raw += chunk;
          if (raw.length > 12000000)
            throw new DomainError(
              "BODY_TOO_LARGE",
              "Use a smaller attachment.",
              413,
            );
        }
        try {
          body = JSON.parse(raw || "{}");
        } catch {
          throw new DomainError("JSON_INVALID", "Invalid request data.", 400);
        }
      }
      const auth = path.match(/^\/auth\/([^/]+)$/);
      if (auth && req.method === "POST" && store.auth) {
        res.end(JSON.stringify(store.auth(auth[1], body)));
        return;
      }
      const publicMatch = path.match(
        /^\/(track|pay)\/([a-f0-9]{32})(\/action)?$/,
      );
      if (publicMatch && store.tracking) {
        const [, kind, key, action] = publicMatch;
        const result =
          kind === "track"
            ? store.tracking(key)
            : store.recipientPayment(
                key,
                req.method === "POST" ? body : undefined,
              );
        if (req.method === "GET" && !action) {
          res.setHeader("Content-Type", "text/html");
          res.end(publicPage(kind, key, result));
          return;
        }
        res.end(JSON.stringify(result));
        return;
      }
      const token = req.headers.authorization?.replace(/^Bearer /, "");
      const actor = store.resolveToken
        ? store.resolveToken(token)
        : token === "demo-admin"
          ? "admin"
          : token?.replace(/^demo-/, "");
      if (!store.resolveToken && actor !== "admin") store.profile(actor);
      // Device details sent by the mobile apps; ignored for staff and web admin.
      if (store.recordDevice && req.headers["x-device"])
        store.recordDevice(actor, req.headers["x-device"]);
      let out;
      const match = path.match(/^\/orders\/([^/]+)(?:\/([^/]+))?$/);
      const mobile = path.match(/^\/account\/([^/]+)$/);
      const administration = path.match(/^\/admin\/([^/]+)$/);
      if (req.method === "POST" && path === "/routes")
        out = await routePreview(store, actor, body);
      else if (
        req.method === "POST" &&
        path === "/admin/cash" &&
        store.adminCash
      )
        out = store.adminCash(actor, body);
      else if (
        match &&
        req.method === "POST" &&
        match[2] === "cargo" &&
        store.cargoAction
      )
        out = store.cargoAction(actor, match[1], body);
      else if (req.method === "GET" && path === "/snapshot")
        out = store.snapshot(actor);
      else if (req.method === "GET" && path === "/admin") {
        if (store.adminSnapshot) out = store.adminSnapshot(actor);
        else if (actor === "admin")
          out = {
            orders: store.state.orders,
            people: store.state.profiles,
            audit: store.state.audit,
            funding: store.state.funding,
          };
        else
          throw new DomainError("FORBIDDEN", "Staff access is required.", 403);
      } else if (administration && req.method === "POST" && store.adminAction)
        out = store.adminAction(actor, administration[1], body);
      else if (mobile && req.method === "POST" && store.mobile)
        out = store.mobile(actor, mobile[1], body);
      else if (path.startsWith("/documents/") && req.method === "GET") {
        store.permit(actor, "drivers");
        const id = path.split("/")[2];
        const doc = store.state.profiles
          .flatMap((p) => p.documents || [])
          .find((d) => d.id === id);
        if (!doc)
          throw new DomainError("NOT_FOUND", "Document not found.", 404);
        out = doc;
      } else if (req.method === "POST" && path === "/quotes")
        out = store.quote(actor, body);
      else if (req.method === "POST" && path === "/orders")
        out = store.create(actor, body, req.headers["idempotency-key"]);
      else if (req.method === "POST" && path === "/availability")
        out = store.availability(actor, body);
      else if (req.method === "POST" && path === "/profile")
        out = store.edit(actor, body);
      else if (match) {
        const [, id, action] = match;
        if (req.method === "GET" && !action) out = store.order(id, actor);
        else if (
          req.method === "POST" &&
          [
            "accept",
            "decline",
            "advance",
            "cancel",
            "payment",
            "issue",
          ].includes(action)
        )
          out = store[action](actor, id, body);
        else if (
          req.method === "POST" &&
          action === "admin" &&
          ((store.permit && store.permit(actor, "finance")) ||
            actor === "admin")
        )
          out = store.admin(id, body, actor);
        else
          throw new DomainError(
            "NOT_FOUND",
            "This action is unavailable.",
            404,
          );
      } else
        throw new DomainError(
          "NOT_FOUND",
          "This resource is unavailable.",
          404,
        );
      res.end(JSON.stringify(out));
    } catch (e) {
      const status = e instanceof DomainError ? e.status : 500;
      if (status === 500) console.error(e);
      res.writeHead(status);
      res.end(
        JSON.stringify({
          error: {
            code: e.code || "SERVER_ERROR",
            message:
              status === 500
                ? "The demo service could not complete this action. Try again."
                : e.message,
          },
        }),
      );
    }
  });
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4000);
  // Loopback by default: demo tokens and recovery codes are discoverable, so
  // never expose this service to the network unless HOST is set deliberately.
  const host = process.env.HOST || "127.0.0.1";
  const store = new CargoStore(
    process.env.DEMO_STATE_PATH ||
      fileURLToPath(new URL("./data/state.json", import.meta.url)),
  );
  // Fill a fresh demo with 30 days of realistic activity (once per state file).
  if (process.env.DEMO_DATA !== "off" && !store.state.demoData) {
    const result = populate(store);
    console.log(
      `Demo data: ${result.trips} trips, 50 drivers, 30 customers added.`,
    );
  }
  createServer(store).listen(port, host, () =>
    console.log(
      `LoadMaster demo: http://${host}:${port}\nAdmin: http://localhost:${port}/operations\niOS: localhost · Android emulator: 10.0.2.2 · synthetic data only` +
        (host === "127.0.0.1"
          ? "\nPhysical devices: restart with HOST=0.0.0.0 on a trusted network."
          : "\nWARNING: reachable from the network. Anyone who can connect gets full demo access."),
    ),
  );
}
