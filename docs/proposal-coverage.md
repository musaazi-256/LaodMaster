# Historical proposal coverage and decisions

Extracted from the prototype on 4 November 2026. Statuses describe the 2 November review, before implementation removal. They are not current completion claims.

## A01 — Universal Login

Historical status: Not built.

Individual admin email/phone + password, invalid-credential errors and forgot-password link. Customer/driver login is not an admin login.

## A02 — First-Login / Forced Password Reset

Historical status: Not built.

Existing shared-login administrators claim an individual identity; new password strength/confirmation; then OTP.

## A03 — OTP Verification

Historical status: Not built.

Code input, resend cooldown, remaining time, incorrect/expired errors and re-verification for sensitive actions. Display demo codes instead of sending real SMS.

## A04 — Forgot Password / Reset Request

Historical status: Not built.

Admin account identifier, neutral confirmation, reset-code/link preview and reset completion. Mobile recovery preview is separate.

## A05 — Create Admin User

Historical status: Not built.

Super Admin: name, email, phone and role. No initial password field; recipient sets one during first login. Invitation/OTP delivery is simulated.

## A06 — Assign / Edit Role

Historical status: Not built.

Super Admin: five-role selection, permission description, confirmation and immediate access refresh.

## A07 — Edit Admin Account

Historical status: Not built.

Super Admin: edit another account name/email/phone/role, save/cancel and link to that person’s audit history.

## A08 — Deactivate / Reactivate Account

Historical status: Not built.

Super Admin: reversible status action, confirmation, optional reason, session revocation and active-Super-Admin cap validation.

## A09 — Reset Another User’s Credentials

Historical status: Not built.

Pasted brief: Super Admin only, confirmation, simulated reset delivery and audit event. Prior matrix conflicts; review required.

## A10 — View Own Profile

Historical status: Not built.

All admin roles: name, email, phone, read-only role and creation date.

## A11 — Edit Own Phone Number

Historical status: Not built.

Pasted brief allows phone only; own name/email/role stay read-only. Prior matrix also allowed name; reconcile before build.

## A12 — Change Own Password

Historical status: Not built.

All admin roles: current/new/confirm password, strength errors and distinct route from profile editing.

## A13 — List All Staff / Admin Users

Historical status: Not built.

Search, role/status filters and active/inactive badges; render only for permitted roles.

## A14 — Staff Detail View

Historical status: Not built.

Profile, scoped audit history and authorized edit/deactivate/reset actions.

## A15 — Global Audit Log

Historical status: Not built.

Actor, role, action and date filters; pagination. Payment events alone do not constitute a global admin audit trail.

## A16 — Per-User Audit Log

Historical status: Not built.

Chronological actions for one staff account; reachable from staff detail/edit.

## A17 — Audit Log Detail / Expand View

Historical status: Not built.

Before/after values, timestamp, actor and changed fields; protect sensitive credential values.

## T01 — Online Driver Tracking Map

Historical status: Not built.

Admin map with simulated locations of online drivers, last update, vehicle, filters and selected-driver detail. Public /map explorer is not this screen.

## T02 — Online Drivers Companion List

Historical status: Partial.

General driver list exists. Dedicated online-location list, last-seen state and map/list selection synchronization are missing.

## P01 — Payments Overview

Historical status: Partial.

/admin/payments has cargo collection, fees, dues, payout status, filters and demo actions; full platform-wide payments coverage needs reconciliation with legacy wallet entries.

## P02 — Withdrawal Approval Queue

Historical status: Not built.

List requested withdrawals, review destination/amount, approve/reject with reason and record simulated result. Scheduled trip payouts are not a withdrawal request queue.

## P03 — Payment Method Oversight

Historical status: Not built.

Admin view of customer/driver payment methods, masked accounts, ownership and relevant statuses. Individual mobile method selection does not meet this requirement.

## P04 — Transaction Reconciliation

Historical status: Partial.

Cargo payments supports CSV export, manual matching and events; settlement-file comparison/import, mismatch queue and reconciliation detail are missing.

## R01 — Driver Referrals Ledger

Historical status: Not built.

Driver/customer, referral code, first trip link/cost, bonus, Pending/Paid and duplicate-safe demo Mark as Paid. Signup referral_code alone is not a bonus ledger.

## R02 — Customer Cashbacks Ledger

Historical status: Not built.

Customer/trip/date/cost, cashback, Pending/Paid and duplicate-safe demo Mark as Paid. Reward-payment permissions remain unresolved.

## Own profile edit

Pasted brief says phone only; the older matrix says name and phone. Treat phone-only as the proposed latest rule and obtain explicit scope sign-off.

## Reset another administrator

Pasted brief reserves this to Super Admin; older matrix allows every role. Matrix cells are marked Review until the policy is confirmed.

## Create-admin password

The pasted fields mention password and then explicitly say no password field. Proposed flow: provision identity/role, then the new admin sets a password on first login.

## Audit/staff visibility

Pasted brief says other roles per permissions. Preserve the detailed matrix, distinguish own-account access from staff-management access and test direct routes as well as menus.

## Document deletion and rewards

Permissions for non-Super-Admin document deletion and all bonus/cashback payment updates remain unresolved. Do not infer permissions from a visible demo action.

## Tracking and OTP

The pasted text uses live and secure language; Section 25 excludes production GPS and SMS. Prototype acceptance is clearly labelled simulated locations and on-screen OTP, with production integration separate.

## Super Admin count

Retain the proposal’s two-active-account limit and independent sessions; test both account creation and reactivation against the limit.

## Commercial baseline

This review does not change the UGX 7,300,000 budget, milestones, commercial scope or acceptance signatures. Role-aware variants of existing screens remain an identified unpriced scope question.
