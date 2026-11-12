# Historical engagement proposal

Text extracted from the former proposal screen on 4 November 2026; presentation styles and application behavior were removed. Dates, prices, signatures and scope statements are historical reference, not a new agreement. Table cells are separated by vertical bars.



LoadMastr — Engagement Plan

Summary
Product
Ecosystem
Architecture
Flows
Screens
Redesign
System
Timeline
Commercials
Addendum
Shadcn
Coverage review
Acceptance

Print / Save PDF

Product Design & Engineering Engagement

/ Prepared for LoadMastr / September 2026

LoadMastr V2

Trucking Marketplace — Design System, Three-Portal Build & Home/Payments Redesign

This plan covers the LoadMastr V2 engagement end to end: a Uganda-focused trucking marketplace connecting customers who need a truck with verified drivers, plus the admin console that runs it. It documents what has already been delivered, what the recent home-screen and payments redesign changed, and the original timeline and cost for interactive-prototype handoff. Production delivery is separate under Section 25. The dated coverage review records the current implementation and outstanding decisions.

Core engagement value

UGX 7,300,000

Design system, 3-portal build, interactive prototype & admin expansion

Duration

11 weeks

~23 hours per week

September planning baseline

Weeks 1–4 delivered

Week 5 in progress; Weeks 6–11 newly scoped (Sections 27–28)

Product Discovery
Design System
Customer App
Driver App
Admin Portal
Interactive Prototype
Payments UI/UX
Admin Roles & Audit Trail
Driver Tracking
Shadcn/ui Migration

Prepared byIgnatius Musaazi
Senior Product Designer / Product Design Strategist

Prepared forLoadMastr

DocumentEngagement Plan & Investment Summary

FormatBrowser, URL and PDF ready

Reviewed 2 November 2026 against the pasted admin brief. The September plan remains a commercial baseline. See all 25 addendum deliverables, implementation gaps and source conflicts in the coverage review.

/ Section 01

Executive Summary

01

LoadMastr V2 is a trucking and logistics marketplace for Uganda: customers request a truck or get matched with a nearby driver, drivers accept and fulfil the trip, and an admin console runs verification, trips, transactions and revenue across the platform.

This engagement built the product from a locked design brief through to a working, interactively demoable prototype — a full design system, three complete portals (Customer, Driver, Admin), a real backend with persisted accounts and trips, and a full payments layer. It then carried out a deliberate redesign of the Customer home screen and payment experience based on direct product feedback.

This plan does not cover production infrastructure — live payment gateway contracts, real GPS/maps integration, hosting or native mobile apps. Those are scoped as an optional next phase in Section 25.

Reduce Launch Risk

Core prototype journeys are available for review. Acceptance still requires the documented role, error, accessibility and device checks; implemented screens are distinguished from planned screens in the coverage review.

Prove the Marketplace Loop

Customer request → driver accept → live tracking → completion → payment runs end to end against a real backend, not static mockups.

Redesign From Real Feedback

The home screen and payments experience were rebuilt once real usage surfaced what the first pass got wrong — documented in Section 18.

/ Section 02

Understanding The Product

02

LoadMastr spans three coordinated surfaces

- Customer app — request a truck, track it live, pay

- Driver app — register, get verified, accept trips, earn

- Admin portal — approve drivers, monitor trips and revenue

- Five-tier truck taxonomy — Small to Extra Large

- Cash and Mobile Money cargo payments; separate experimental wallet

- Real-time trip tracking (simulated GPS, real trip state)

The product has to serve both sides of a two-sided marketplace at once. A customer needs a fast, trustworthy way to book a truck and know what it costs before committing. A driver needs a reliable stream of trip requests and a clear, honest earnings picture. An admin needs to approve real drivers, watch real trips, and reconcile real money — none of it can be faked once the business is live.

Customer

Requests & pays

Driver

Fulfils & earns

Admin

Approves & monitors

Backend

Keeps it real

/ Section 03

Product Vision

03

LoadMastr should feel like a serious, dependable transportation product for Uganda — not a generic delivery app wearing a trucking skin.

Trip Lifecycle

01
Request

02
Match / Accept

03
Track Live

04
Complete & Pay

/ Section 04

Business Objectives

04

Move Real Cargo

Let customers book the right truck size for general goods, shifting, construction materials, agriculture and furniture — with fares shown upfront.

Build a Verified Driver Fleet

Registration, document upload and admin approval keep unverified drivers off the road and out of the earnings loop.

Own the Payment Loop

Simulated Cash, MTN and Airtel cargo payments with tracked platform dues and scheduled earnings. Cards, bank/RTGS and self-service payouts retain their later-phase status.

Give Admin Real Control

Approve or reject drivers, watch trips and revenue, issue refunds — from one operations console, not a spreadsheet.

Launch Lean

Ship the marketplace loop first; native apps, live GPS and a production payment gateway are a deliberate next phase, not day one.

/ Section 05

Product Ecosystem

05

System 1

Customer App

- Request

- Track

- Pay

- Wallet

- History

System 2

Driver App

- Register

- Get Verified

- Accept Trips

- Earn

- Withdraw

System 3

Admin Portal

- Approve Drivers

- Monitor Trips

- Track Revenue

- Issue Refunds

External Services (Next Phase)

Flutterwave / Mobile Money
Live Maps & GPS
SMS
Push Notifications

A trip placed on the Customer app has to appear on the Driver app, update the Admin portal, and generate a real transaction — all from one shared backend, not three disconnected surfaces.

/ Section 06

User Types and Actor Map

06

Customer

- Signs up

- Requests a truck

- Tracks the trip

- Pays

- Deposits / withdraws

- Reviews history

Driver

- Registers vehicle

- Uploads documents

- Waits for approval

- Goes online

- Accepts & runs trips

- Earns & withdraws

Admin

- Reviews submissions

- Approves / rejects drivers

- Monitors trips live

- Tracks revenue

- Issues refunds

- Runs reports

Approval is real, not cosmetic: a driver stays locked out of trip requests until an admin genuinely approves their submitted documents — verified against the persisted backend, not a demo shortcut.

/ Section 07

Build Phases & Prioritisation

07

| Phase | Scope | Status

| Phase 1 | Discovery, design tokens & 52-component library | Delivered

| Phase 2 | Customer app — 29 screens | Delivered

| Phase 3 | Driver app — 19 screens | Delivered

| Phase 4 | Admin portal — 10 screens & interactive prototype wiring | Delivered

| Phase 5 | Home & payments redesign, design QA, responsive polish and handoff documentation | In progress

| Phase 6 | Shadcn/ui foundation — 52-component library re-platformed on Radix UI | Planned

| Phase 7 | Customer & Driver App migration to shadcn/ui | Planned

| Phase 8 | Admin Portal migration to shadcn/ui & full regression pass | Planned

| Phase 9 | Admin accounts, roles, OTP-based first login & full audit trail (17 screens) | Planned

| Phase 10 | Driver tracking map & online drivers list | Planned

| Phase 11 | Payments portal, driver referrals & customer cashbacks | Planned

Outside this engagement: live payment gateway contracts, real GPS/maps integration, native mobile apps and production hosting — scoped separately in Section 25 once the prototype has proven the product.

/ Section 08

Platform Architecture

08

Layer 01

Client Layer

React 19 + Vite, Tailwind CSS

- Customer, Driver & Admin single-page apps

- 52-component shared design system

- Client-side session & polling-based live state

- Responsive from 375px mobile to desktop admin

Layer 02

API Layer

Node.js, Express

- REST endpoints for auth, trips, drivers, payments

- Hashed-password authentication (scrypt)

- Trip lifecycle & state-machine logic

- Admin approval & refund endpoints

Layer 03

Data Layer

PostgreSQL-backed prototype

- Users, drivers, trips, transactions, documents

- Every account, approval and payment genuinely persists

- Production operation, migrations and recovery still require separate delivery

Layer 04

External Integrations — Next Phase

Not yet wired

- Flutterwave / MTN / Airtel live payment rails

- Live maps & GPS tracking

- SMS & push notification delivery

Money movement is currently simulated — no real payment gateway is wired — but every deposit, withdrawal and trip payment creates a real, persisted transaction row and a real wallet-balance change.

/ Section 09

Customer App Architecture

09

Home

Privacy-controlled wallet balance, quick cargo booking, separate scheduling and recent destinations.

Trips

Active and past trips, receipts, driver details.

Wallet

Balance, payment methods, deposit, withdraw, transaction history.

Profile

Account details, settings, help & support, account deletion.

/ Section 10

Driver App Architecture

10

Home

Verification status, online/offline, privacy-controlled scheduled earnings, fees due and current cargo work.

Trips

Incoming requests, active trip, history and per-trip earnings.

Wallet

Earnings, cash-due tracker, withdrawals, payout method.

More

Profile, vehicle details, payout method, support.

/ Section 11

Admin Portal Architecture

11

Dashboard

Trips, revenue, active drivers and customers at a glance, with real charts.

Drivers & Customers

Full account lists, detail views, document review, approve / reject.

Trips & Transactions

Every trip and payment, filterable, with refund actions.

Reports & Settings

Truck-tier distribution, driver verification breakdown, team access.

/ Section 12

End-to-End Trip Flow

12

Customer Request → Driver Fulfilment

01
Customer requests a truck

02
Online driver sees the real request

03
Driver accepts

04
Customer sees driver assigned live

05
Driver drives phases: pickup → in transit → arrived

06
Customer tracking updates in step, live

07
Driver completes & rates the trip

08
Cash creates tracked dues; digital collection and driver payout have separate states

| Step | Customer View | Driver View | Admin View

| Request | Searching for drivers | Not yet involved | New trip record

| Accept | Driver assigned, live map | Active trip screen | Trip status updated

| In transit | Live tracking states | Phase-by-phase actions | Trip visible in list

| Complete | Receipt available | Rating & earnings credited | Transaction recorded

/ Section 13

Driver Onboarding & Admin Verification

13

Registration to Approval

01
Vehicle details

02
Document upload

03
Submitted — pending review

04
Admin approves or rejects

What makes this real

- The driver dashboard genuinely stays locked until admin approves — no dev shortcut left in the product

- Approval updates the driver's own screen automatically, without a refresh

/ Section 14

Payment Architecture

14

Supported Methods

- MTN Mobile Money

- Airtel Money

- Cash (permanent)

- Cards / Bank-RTGS: later-phase previews

- Separate experimental LoadMastr wallet

Wallet Actions

- Deposit — quick amounts or custom

- Withdraw — Mobile Money or bank only

- Cargo bookings pay by Cash or selected Mobile Money account; wallet funding is optional

- Demo records persist; payment-provider money movement is simulated

Admin Controls

- Full transaction ledger

- Filter by status

- Issue refunds

- Real-time revenue on the dashboard

Trip Payment Flow

01
Driver marks trip complete

02
Server records delivery earning, cash dues or pending digital collection atomically

03
Customer payment, driver earning and admin record stay linked without double-paying cash earnings

/ Section 15

Information Architecture

15

Customer Platform

- Home: wallet, services, recent, refer & earn

- Request: truck size, fare, payment, tracking

- Trips: history & receipts

- Wallet: balance, methods, transactions

- Profile: account, settings, support

Driver App

- Registration: vehicle, documents, review

- Home: status, online toggle, today's activity

- Trips: requests, active trip, history

- Wallet: earnings, cash due, withdraw

- More: profile, vehicle, support

Admin Portal

- Dashboard: metrics & charts

- Drivers / Customers: lists & detail

- Trips / Transactions: full ledger

- Reports: tier & verification breakdown

- Settings: team access

/ Section 16

Original Delivered Screen Inventory

16

September inventory baseline. The simplified booking flow consolidates several original screens, and newer payment/scheduling screens add others. Counts below are historical planning figures, not a current unique-route count or acceptance result. Shared customer/driver authentication is separate from the planned admin identity flow.

Customer App

| Authentication | 6

| Home & request flow | 9

| Tracking & history | 3

| Wallet & payments | 7

| Profile & support | 4

| Subtotal | 29

Driver App

| Registration & verification | 3

| Dashboard & trip flow | 5

| Trip history & detail | 2

| Earnings & payments | 5

| Account & support | 4

| Subtotal | 19

Admin Portal

| Dashboard | 1

| Drivers (list + detail) | 2

| Customers (list + detail) | 2

| Trips & transactions | 3

| Reports & settings | 2

| Subtotal | 10

September baseline screen count

58

Built on a shared library of 52 reusable components — buttons, forms, cards, navigation, logistics and payment components — across 8 foundational families, so new screens are assembled from proven parts, not built from scratch each time.

/ Section 17

Responsive Strategy

17

Customer and Driver are mobile-first — the whole experience is designed inside a phone-width frame. The Admin portal is desktop-first and intentionally denser, using a smaller default type scale suited to an operations console rather than a consumer app.

Mobile

375–430px

Tablet

768–1024px

Admin desktop

1280px+

Native apps

Next phase

/ Section 18

The Redesign — Home Screen & Payments

18

Once the marketplace loop was working end to end, the Customer home screen was rebuilt around what real usage showed actually mattered: money and services on hand, not a map guessing where you want to go.

Before

Map-first home screen

- Large map preview as the dominant visual

- "Where do you need a truck?" search bar led the page

- No wallet balance visible from Home

- No deposit or withdraw action from Home

- Only Mobile Money as a payment option

After

Quick booking with private balances

- Wallet balance is visible on Home, with hide/show amounts and collapse/expand controls

- Quick cargo booking stays prominent; wallet actions are reached through the balance card

- One route-first booking path; scheduling and optional cargo details stay separate

- Map reserved for actual live trip tracking only

- Cash, MTN and Airtel for cargo; Card and Bank remain future-phase previews

Withdrawals were also added for customers for the first time — previously only drivers could cash out. Cards are deliberately excluded as a withdrawal destination; only Mobile Money and bank accounts can receive a payout.

/ Section 19

Design System Scope

19

Foundations

- Colour tokens (green primary, meaning-only accents)

- Typography scale (h1–small)

- 4px-based spacing system

- Radius scale (button, input, card, pill)

- Elevation & motion tokens

Component Families (52 total)

- Navigation (5)

- Forms (9)

- Actions (3)

- Feedback (7)

- Logistics (11)

- Payments (6)

- Identity (5)

- Admin (6)

Every screen is assembled from this shared library — a truck-tier card, a status badge or a payment method row looks and behaves identically everywhere it appears, in either app.

As of Section 28, this library is being re-platformed on shadcn/ui — Radix UI primitives plus class-variance-authority — reskinned to these exact tokens. Same 52 components, same 8 families, different foundation underneath.

/ Section 20

Interactive Prototype & Live Demo

20

What it actually does

- Real sign-up and login, not fixed demo personas

- Customer and Driver apps side by side on one page, each signed in separately

- A trip placed on one side appears live on the other — same backend, not a simulation trick

- Admin approval reflects on the driver's own screen automatically

Why it matters

Most design engagements hand over static screens or a click-through mockup. This one hands over a working product with a real database behind it — every account, approval, trip and payment survives a page refresh because it's genuinely persisted, not held in memory.

/ Section 21

Timeline and Estimated Effort

21

Pace

4 hrs/day

Schedule

6 days/week

Duration

11 weeks

Total

256 hours

Week 1

Discovery, Tokens & Component Library
Delivered
24 hrs

- Locked design brief, colour/type/spacing/radius tokens

- 52 components across 8 families

- Truck illustrations, 5-tier config, /style-guide gallery

Week 2

Customer App
Delivered
24 hrs

- 29 high-fidelity screens

- Request, tracking, wallet, profile

Week 3

Driver App
Delivered
24 hrs

- 19 high-fidelity screens

- Registration, dashboard, trip flow, earnings

Week 4

Admin Portal & Prototype Wiring
Delivered
24 hrs

- 10 operations-console screens

- Approvals, trips, transactions, reports

- Cross-app state & live dual-app demo

Week 5

Home & Payments Redesign, Design QA & Handoff
In progress
24 hrs

- Wallet-first home screen, service tabs, card & bank support UI

- Cross-device design QA & responsive polish

- Documentation & handoff package

Week 6

Shadcn/ui Foundation
Planned
24 hrs

- Radix UI + class-variance-authority setup

- 52-component library re-platformed, reskinned to LoadMastr tokens

Week 7

Customer & Driver App Migration
Planned
24 hrs

- 48 screens migrated to consume the new component library

- Visual & functional regression pass

Week 8

Admin Portal Migration & Regression
Planned
24 hrs

- 10 admin screens migrated to the new component library

- Full cross-app regression pass against the real backend

Week 9

Admin Accounts, Roles & Audit Trail
Planned
24 hrs

- Universal login, first-login reset, OTP & forgot-password flows

- Create/edit/deactivate admin users, role assignment

- Self-service profile, staff list & global/per-user audit log

Week 10

Driver Tracking
Planned
16 hrs

- Live map of online drivers (simulated positions)

- Online drivers list — companion table view

Week 11

Payments Portal, Referrals & Cashbacks
Planned
24 hrs

- Payments overview, withdrawal approvals, payment method oversight

- Driver referrals — bonus tracking & payment status

- Customer cashbacks — payment tracking & mark-as-paid

September sequencing baseline. Current code includes shared Radix/shadcn-style primitives and additional payment/mobile work, while expanded admin identity, global audit, tracking and rewards remain outstanding. Use the dated coverage review for implementation status; no new completion or pricing approval is implied by these historical week labels.

/ Section 22

Commercial Breakdown

22

Phase Breakdown

Discovery, Tokens & Component LibraryUGX 550,000

Customer App — UI/UX & PrototypeUGX 800,000

Driver App — UI/UX & PrototypeUGX 700,000

Admin Portal & Interactive Prototype WiringUGX 650,000

Home & Payments RedesignUGX 500,000

Shadcn/ui FoundationUGX 700,000

Customer & Driver App MigrationUGX 700,000

Admin Portal Migration & RegressionUGX 650,000

Admin Accounts, Roles & Audit TrailUGX 900,000

Driver TrackingUGX 450,000

Payments Portal, Referrals & CashbacksUGX 700,000

Total Engagement Value

UGX 7,300,000

256 total estimated hours

~UGX 28,516 effective hourly rate

~UGX 114,063 effective daily rate at 4 hrs/day

~UGX 663,636 effective weekly rate

This rate covers senior UI/UX design and interactive prototyping — not visual production alone. It includes discovery, structure, interaction decisions, a functional clickable prototype, and redesign iteration based on real usage. Backend/server engineering, payment processing and QA/test engineering are outside this scope — see Section 25.

/ Section 23

Payment Schedule

23

Milestone 1

Kickoff — Design Foundations & Component Library

20% — UGX 1,460,000
Due at kickoff

Milestone 2

Customer & Driver App UI/UX Approved

20% — UGX 1,460,000
Due once both mobile apps are demoable

Milestone 3

Shadcn/ui Migration Complete & Regression-Verified

25% — UGX 1,825,000
Due once all existing screens are re-verified on the new foundation

Milestone 4

Admin Portal — Roles/Audit, Tracking, Payments, Referrals & Cashbacks Approved

25% — UGX 1,825,000
Due once all admin screens are demoable

Milestone 5

Redesign, QA & Final Handoff

10% — UGX 730,000
Due at documented handoff

/ Section 24

Risks, Assumptions and Dependencies

24

Risks

- Scope creep from evolving redesign requests

- Concurrent edits when multiple contributors work the same codebase

- Truck tonnage bands still unresolved against real backend rules

- Payment provider not yet contractually confirmed

Assumptions

- Timely feedback from stakeholders

- PostgreSQL prototype persists demo state; production hosting and operations remain separate

- Truck taxonomy will be confirmed before production

- Payment provider decision confirmed during next phase

Dependencies

- Confirmed truck tonnage taxonomy

- Payment provider merchant credentials

- Hosting / infrastructure decision

- Admin access-control requirements

/ Section 25

Exclusions

25

The following are not included in the UGX 7,300,000 engagement unless separately scoped:

- Backend / server engineering beyond the interactive prototype

- Live payment gateway integration & merchant account

- Software QA / test engineering

- Real GPS / live maps tracking

- Native mobile apps (iOS / Android)

- Production hosting & DevOps

- SMS / push notification infrastructure

- Load testing & penetration testing

- Ongoing maintenance & support post-handoff

- Legal documents (Terms, Privacy Policy)

This is a UI/UX design and interactive-prototyping engagement. Where the prototype needs functional-feeling data (accounts, trips, a wallet balance) to demonstrate a flow convincingly, that plumbing is built as part of the prototype itself — it is not delivered or billed as production backend engineering. The Driver Tracking screen added in Section 27 is the same kind of prototype: a map showing simulated positions for online drivers, not a live GPS feed — real GPS integration remains excluded above.

Live Payment Integration

UGX 1,500,000 – 2,500,000

Live Maps & GPS

UGX 1,000,000 – 1,800,000

Native Mobile Apps

UGX 3,000,000 – 4,500,000

/ Section 26

Final Recommendation

26

LoadMastr V2 should move from prototype to a limited pilot before committing to full production infrastructure.

The marketplace loop — request, accept, track, complete, pay — already works end to end against a real backend. The next honest step is a small real-world pilot with a handful of drivers and customers on the current build, using it to validate demand and surface what production hardening actually needs to prioritise, before spending on live payment gateways, GPS and native apps.

Great products are not built from screens alone. They are built from working flows, real data, and decisions tested against how people actually use them.

/ Section 27

Scope Addendum — Driver Tracking, Payments Portal & Admin Roles

27

Added to scope on 18 September 2026, after the original three-portal build was reviewed, and extended on 20 September 2026 with screenshots of the real, currently-live LoadMaster admin system. This replaces the Admin Portal's current shared-credential login with individual admin accounts across five roles, adds a full audit trail, and adds new admin surfaces: live driver tracking, an online drivers list, a payments portal, driver referrals and customer cashbacks. The figures in Sections 21–23 above already include this addendum.

Driver Tracking

A map showing the live location of currently-online drivers, plus a companion table view (Online Drivers) — simulated positions on the existing prototype map, the same pattern used everywhere else in the app. Real GPS integration stays excluded (Section 25).

Payments Portal, Referrals & Cashbacks

Deposits, withdrawals and payment methods platform-wide, plus two new ledgers seen in the real system: driver referral bonuses and customer cashbacks, each with their own paid/pending tracking. Screen breakdown below reflects what the reference screenshots actually show.

Admin Roles & Audit Trail

Individual logins replacing shared credentials, an OTP-based first-login flow, and a full audit trail of admin actions with before/after diffs — five roles: Super Admin, Admin, Team Lead, Field Agent, Customer Care. Full permission matrix received 20 September 2026 and incorporated below.

Driver Referrals & Customer Cashbacks — field reference

Neither concept exists in the current schema — both need a real ledger table, not just a screen. Fields below are transcribed from the live reference system's screenshots, not invented.

Driver Referrals — fields

| Driver Name | text

| Customer Name (who they referred) | text

| Referral Code | text

| First Trip ID | link

| Trip Cost | currency

| Referral Bonus | currency

| Bonus Payment Status | Pending / Paid

| Actions | Mark as Paid

Customer Cashbacks — fields

| Customer Name | text

| Trip ID | link

| Trip Date | date

| Trip Cost | currency

| Cashback Amount | currency

| Cashback Payment Status | Pending / Paid

| Actions | Mark as Paid

Two things worth naming: (1) "Mark as Paid" is modelled the same way as the rest of this prototype's payments — it updates a real record in the database, it does not move real money, consistent with the live-payment-gateway exclusion in Section 25. (2) The reference system's Driver Referrals table has many rows with blank Trip Cost, Referral Bonus and Status — that looks like a data quality gap in the real system, not a design spec, so it isn't being replicated as a "blank state" requirement here.

Admin Roles — Definitions

| Role | Definition

| Super Admin | Overall admin. Only role that can create other admin accounts and assign their rights. Capped at 2 active accounts, each with its own session. Full access to the entire admin portal.

| Admin | Access to the entire admin portal besides creating admin accounts.

| Team Lead | Function-based lead role (e.g. marketing). Broad operational access; no account creation rights.

| Field Agent | Field-facing role. Uploads and verifies driver documents; can view customer and driver details but not trip details or financial figures (daily earnings, orders, spend).

| Customer Care | Customer-facing support role. Full customer management access; limited driver edit rights; no staff management access.

Permission Matrix

Received as a functional specification on 20 September 2026. Shown below with dated coverage-review annotations — cells marked Pending are open items the source document itself left unresolved (see the callout at the end of this section).

3.1 Drivers Section

| Action | Super Admin | Admin | Team Lead | Field Agent | Customer Care

| View driver list screen | Yes | Yes | Yes | Yes (excl. daily earnings) | Yes

| View action buttons on driver list | Yes | Yes | Yes | Yes (verify + change to customer only) | Yes

| View driver profile | Yes | Yes | Yes | Yes | Yes

| Edit driver profile (name, email, phone) | Yes | Yes | Yes | No | No

| Verify driver | Yes | Yes | Yes | Yes | No

| Suspend driver | Yes | Yes | Yes | No | No

| Deactivate driver | Yes | Yes | Yes | No | No

| Change driver → customer role | Yes | Yes | Yes | Yes | Yes

| View driver documents | Yes | Yes | Yes | Yes | Yes

| Upload driver documents | Yes | Yes | Yes | Yes | Yes

| Delete driver documents | Yes | Pending | Pending | Pending | Pending

| View trip history | Yes | Yes | Yes | No | Yes

| Update driver bonus payments | Pending | Pending | Pending | Pending | Pending

| Update customer rewards payments | Pending | Pending | Pending | Pending | Pending

3.2 Customers Section

| Action | Super Admin | Admin | Team Lead | Field Agent | Customer Care

| View customer list | Yes | Yes | Yes | Yes | Yes

| View customer profile | Yes | Yes | Yes | Yes | Yes

| Edit customer profile | Yes | Yes | Yes | No | No

| View customer orders | Yes | Yes | Yes | No | Yes

| Change customer → driver role | Yes | Yes | Yes | Yes | Yes

3.3 Dashboard Section

| Action | Super Admin | Admin | Team Lead | Field Agent | Customer Care

| Access to Admin Dashboard | Yes | Yes | Yes | No | Yes

3.4 Staff Management Section

| Action | Super Admin | Admin | Team Lead | Field Agent | Customer Care

| Access to admin accounts section | Yes | No | No | No | No

| Create new staff account | Yes | No | No | No | No

| Edit staff profile (name, email, phone) | Yes | No | No | No | No

| Change staff role | Yes | No | No | No | No

| Deactivate staff account | Yes | No | No | No | No

| Reactivate staff account | Yes | No | No | No | No

| Reset another staff account (brief/matrix conflict) | Yes | Review | Review | Review | Review

| Viewing admin actions (audit trail) | Yes | Yes | Yes | No | No

3.5 Own Account (All Roles)

| Action | Super Admin | Admin | Team Lead | Field Agent | Customer Care

| View own profile | Yes | Yes | Yes | Yes | Yes

| Edit own phone only (latest pasted brief; name/email read-only) | Yes | Yes | Yes | Yes | Yes

| Change own password | Yes | Yes | Yes | Yes | Yes

| Change own role | No | No | No | No | No

| Deactivate own account | No | No | No | No | No

Cross-Cutting Requirements

- Every admin action is attributed to the individual who performed it and traceable back to that account, visible only to roles permitted per the matrix above

- Each admin account holds its own independent session — sessions are never shared across users

- Super Admin is capped at 2 active accounts

UI/UX Requirements

- Sections or actions a role cannot access are not rendered at all, rather than shown disabled — a Field Agent never sees a visibly-blocked "daily earnings" field, for example

- Mobile view respects the same visibility rules as desktop — no restricted data or action is exposed on mobile just because it's hidden on desktop

Open items pending your confirmation before this scope is locked: (1) who besides Super Admin can delete driver documents — Admin, Team Lead, Field Agent and Customer Care are all marked "??" in the source spec; (2) which roles, if any, can update driver bonus payments and customer rewards payments — neither row has any values filled in yet. These two gaps sit inside the 900,000 already priced for this module in Section 22, but the actual design effort depends on the answers — e.g. a bonus-payment flow with its own approval step is more than a single permission toggle.

Admin Roles & Audit Trail — confirmed

| Universal login & auth (login, first-login reset, OTP, forgot password) | 4

| Account creation & management (Super Admin only) | 5

| Self-service profile (own phone, own password) | 3

| Staff listing & oversight | 2

| Audit trail (global, per-user, detail/diff) | 3

| Subtotal | 17

Driver Tracking — confirmed

| Live driver map | 1

| Online drivers list | 1

| Subtotal | 2

Payments Portal — indicative

| Payments overview | 1

| Withdrawal approval queue | 1

| Payment method oversight | 1

| Transaction reconciliation | 1

| Subtotal (indicative) | 4

Referrals & Cashbacks — confirmed

| Driver referrals list | 1

| Customer cashbacks list | 1

| Subtotal | 2

New screens in this addendum

25

17 confirmed from the admin roles & audit trail brief, plus 4 confirmed from the driver-tracking/referrals/cashbacks reference screenshots, plus 4 indicative for the wider payments portal — brings the total screen inventory from 58 (Section 16) to roughly 83 once built.

OTP codes are shown on-screen for this prototype rather than sent by SMS, consistent with the SMS/push-notification exclusion in Section 25 — the same "real data, simulated delivery" pattern already used for payments elsewhere in the app.

One scope note worth flagging: the "hide, don't disable" UI/UX requirement above applies to every role-aware screen, not just the 17 new ones. The Drivers, Customers and Dashboard screens already delivered in Week 4 were built for a single generic admin role — showing or hiding fields per role (e.g. a Field Agent's driver list without daily earnings) means those existing screens need role-aware variants too. That work isn't yet counted in the Section 22 pricing and would sit on top of the current UGX 7,300,000 total.

/ Section 28

Scope Addendum — Shadcn/ui Migration

28

Added to scope on 19 September 2026: standardise the whole app on shadcn/ui rather than the hand-rolled Tailwind components built in Weeks 1–5. This re-platforms the 52-component library on Radix UI primitives and class-variance-authority, reskinned to LoadMastr's exact tokens, then migrates every already-delivered screen to consume it. The admin expansion in Section 27 is sequenced after this migration and gets built shadcn-native from the start, so it isn't billed twice.

What actually changes

- Component internals — Button, TextField, Tabs, Checkbox, Dialog and the rest rebuilt on Radix UI primitives

- Accessibility that used to be hand-written — keyboard navigation, focus management, ARIA attributes — now comes from Radix by default

- Component code lives in the repo (shadcn's copy-in model), not an opaque npm dependency

What doesn't change

- Screen layouts, copy, and user flows — untouched

- The real backend, its API contracts and the database — untouched

- LoadMastr's own tokens — green, Inter, 16px/12px/pill radius scale — carried over exactly

Worth stating plainly: this phase adds no new user-facing functionality. It's a foundation swap under 58 screens that already work and have already been tested against the real backend — that carries genuine regression risk (a working Button behaving differently after rebuild, a form losing a validation state) for a maintainability benefit, not a feature. Going in with that tradeoff explicit is the point of this section.

Migration coverage by component family

| Navigation (5 components) | Migrate

| Forms (9 components) | Migrate

| Actions (3 components) | Migrate

| Feedback (7 components) | Migrate

| Logistics (11 components) | Migrate (domain-specific — no direct shadcn equivalent, built on shadcn primitives)

| Payments (6 components) | Migrate

| Identity (5 components) | Migrate

| Admin (6 components) | Migrate

| Total | 52 components, 58 screens

[Expanded coverage inventory is preserved in docs/proposal-coverage.md.]

/ Section 29

Acceptance

29

Prepared by: Ignatius Musaazi, Senior Product Designer

Name / Title

Signature

Date

Accepted by: LoadMastr Representative

Name / Title

Signature

Date

LoadMastr Engagement Plan — Prepared September 2026
