# Admin UI and table conventions

LoadMaster keeps shadcn UI primitives for buttons, inputs, selects, tables, badges, menus, tooltips and dialogs. The shared `DataTable` in `apps/admin/src/components/shared.tsx` applies the same styling and controls to every operational list, including overview, orders, people, collections, payouts, ledger, reconciliation, support and staff.

## SafariNexa reference

Reviewed the local SafariNexa admin/business implementation at `/Users/musaaziignatiusofloyola/Documents/SafariNexa GIT/Prototype`, specifically its `docs/compact-tables.md`, `docs/table-toolbar-review.md`, `docs/table-column-visibility.md`, table component, shared CSS and business-payments desktop screenshot. These files were used as design reference; only LoadMaster files were changed.

- Neutral white table surfaces, subtle slate borders and 16px outer corners.
- Pale headers at 40px, 12px labels, 13px body text, 10px vertical cell padding.
- One line per operational value; order date, pickup/destination, phone and vehicle registration have separate columns. Full values scroll horizontally instead of truncating or squeezing.
- Right-aligned amounts with tabular numerals; quiet status badges use semantic dots plus text.
- Search, filters and table tools share 36px height and 6px corners. Search includes a clear action. Export and Columns stay adjacent, with accessible names.
- Column choices persist per signed-in staff ID and semantic table ID in browser storage. Only excluded column IDs are stored; no row data or credentials. At least one data column remains visible; Show all resets the choice. Browser storage is optional and changes sync across tabs.
- CSV export covers filtered records and visible data columns, excluding action controls, and retains the existing formula-escaping safeguards.
- Shared pagination supports 10, 25 or 50 rows. Scrollable tables are keyboard focusable. Toolbars wrap on small screens without page-level horizontal overflow.

LoadMaster branding and green primary actions remain. Neutral surfaces and shared component rules keep the portal consistent with the SafariNexa table treatment without adopting SafariNexa business copy or data.

## Verification

`node scripts/admin-table-smoke.mjs` checks table density and header/body alignment across 13 portal sections, toolbar sizing, pagination, column persistence after reload, visible-column CSV export, no-result filtering and clearing, plus mobile horizontal scrolling at 390px. It uses an isolated in-memory demo server and synthetic records.

Screenshots: `audits/v2/admin-tables/collections-desktop.png`, `orders-desktop.png`, `orders-mobile-scrolled.png`, `columns-mobile.png`.

TypeScript, ESLint and production admin build passed. The connected customer/driver/admin walkthrough also passed through two-stop delivery, PIN handover, delayed payment recovery, partial refund, cash confirmation and admin remittance.

## LoadMaster theme and navigation update

The entire admin now follows the mobile app's `customerTheme`: primary green `#087443`, ink `#111827`, muted text `#6B7280`, background `#FAFBFA`, border `#E5E7EB`, mint `#F0FCF4` and white cards. The dashboard accent follows the app home gradient (`#F0FAF4` → `#DCF5E7`). Sidebar navigation, metric cards, chart strokes/fills, forms, tabs, dialogs, empty states and maps use this family. Error/warning colors retain their semantic meaning. The compact shadcn table dimensions and controls remain as approved.

Navigation:

- **Workspace:** Dashboard; Trips.
- **Trips:** Trip records and Driver tracking in one page, controlled by the existing order/tracking permissions.
- **People & Fleet:** Drivers & vehicles (all driver records and registered vehicle details); Customers (customer records and details).
- Existing money/control and management sections retain their functionality.

Canonical routes are `/operations/dashboard`, `/operations/trips` and `/operations/trips?view=tracking`. The former overview, orders and tracking links redirect to these routes. Existing demo APIs/permission names remain compatible. Trip table column preferences retain their existing storage ID while the visible labels and exports use Trips.

Browser checks additionally verify theme-token parity, Trips tab switching, mobile tracking, old-link redirects and restricted Customer Care/Field Agent navigation.
