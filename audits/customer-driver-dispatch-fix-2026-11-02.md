# Customer → driver dispatch restoration

## Confirmed causes

The local demo had a verified online Medium driver and a pending Small–Medium customer request. Exact-tier equality excluded the request. The redesigned dashboard also replaced automatic request presentation with a passive Home card, so another driver tab did not expose a new request.

## Fixes

- Capacity matching: larger categories may receive smaller-category cargo. The offer explicitly shows requested and registered truck categories and the agreed fare. Trucks smaller than the requested capacity remain excluded, including direct acceptance attempts.
- A router-scoped request listener in each phone opens Incoming Request from any driver screen. It works independently in the Live Demo's customer/driver routers and sessions.
- Offline and busy drivers do not receive requests. Stale incoming data is hidden as soon as eligibility stops. Declines exclude that request for the current driver session. Cancelled requests leave the queue; future scheduled requests wait until due.
- Driver Deliveries includes the accepted trip, alongside completed/cancelled history.
- Generated unique phone/password field IDs prevent duplicate label associations in the two-phone demo.

## End-to-end browser evidence

Used disposable accounts and the actual two-pane `/live-demo` interface:

1. Signed in customer and driver independently; put the Medium driver online and opened Earnings.
2. Customer selected a route, default Small–Medium truck and Cash, then requested.
3. Within the polling cycle, the driver automatically opened New cargo request from Earnings, with the same route and UGX 70,000 fare.
4. Driver accepted; customer automatically showed the assigned driver and pickup tracking.
5. Arrived at pickup → Start delivery → Arrived at destination updated both apps.
6. Confirmed the cash handover and completed the delivery. Customer displayed Trip completed; driver earnings showed UGX 59,500 cash kept and UGX 10,500 platform dues, without duplicate wallet earnings.

Regression coverage also checks default smaller-tier dispatch, offline/busy exclusion, declined/cancelled exclusion, undersized-truck rejection, and acceptance visibility in customer state and driver history. Existing payment/scheduling integration checks, build, lint and typography checks pass with advisory warnings.

## Running prototype

Restarted the existing API on port 4000 with the tested code, preserving user data. The subsequent database check showed a Medium delivery already accepted by the existing demo driver and a Small–Medium request waiting. A driver with an accepted delivery receives the next request after finishing the current one; this is intentional, not a failed ping. The final extra read-only API check was prevented by an automatic approval-review account usage limit; the prior database inspection and full isolated browser verification succeeded.

Screenshot: dispatch-request-ping.png. Demo maps, ETA and payments remain simulated. No user trip was accepted, completed or cancelled by the agent; all interactive completion tests used the temporary schema.
