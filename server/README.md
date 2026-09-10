# VELOOP Rewards — Giveaway Backend

Node.js / Express / MongoDB backend that is the single source of truth for
giveaway status, entry fees, balances, participation, winners, and prize
claims. The frontend is treated as untrusted — every value that matters
(price, currency, balance, identity, giveaway status) is re-derived
server-side on every request.

## Modeling note — how this maps to the frontend

The frontend already treats each reward (iPhone, Apple Watch, AirPods, each
Amazon voucher) as its own individually-routable giveaway page
(`/giveaway/iphone-15-pro`, `/giveaway/apple-watch`, ...), each with its own
entry fee/currency/winner count. To match that exactly without requiring a
frontend rewrite, this backend splits the spec's single "Giveaway" concept
into two collections:

- **`Giveaway`** — the campaign/event level (e.g. "September Rewards"),
  holding shared dates, rules, eligibility and participation settings.
- **`Prize`** — the actual joinable unit (e.g. "iPhone 15 Pro"), holding its
  own `entry.currency`/`entry.amount`/`winnerCount`/`prizeType`/`claimType`.
  This is what a `prizeId` refers to everywhere in the API.

Participation, winner and claim uniqueness are all enforced at the
`(userId, prizeId)` level — matching "one entry per reward" as already
built into the frontend's mock data (`joinedPrizeIds`).

## Getting started

```bash
cd server
cp .env.example .env      # then fill in MONGO_URI / JWT_SECRET / REFRESH_SECRET
npm install
npm run seed               # populates Mongo with the same data the frontend mocks used
npm run dev                 # nodemon, http://localhost:5000
```

Health check: `GET /health`

Seed creates:
- `demo@veloop.test` / `Password123!` — regular user (`VE10025`, matches the
  frontend's `demoUser`, already joined the Apple Watch giveaway)
- `admin@veloop.test` / `Password123!` — admin user
- The **September Rewards** giveaway (active) with all 6 prizes at the exact
  entry fees from the spec
- The **August Reward Rush** giveaway (archived) with one finalized winner

## Connecting the frontend

In the frontend project root:
```bash
cp .env.example .env   # VITE_API_BASE_URL=http://localhost:5000/api
npm install
npm run dev
```
`src/services/giveawayApi.js` is a real fetch client against this backend
(JWT stored in `localStorage`, attached as `Authorization: Bearer <token>`).
`GiveawayHome.jsx` and `GiveawayDetails.jsx` fetch live data on mount —
`giveawayApi.getCurrent()` / `getPrize()` / `getMyStatus()` / `getWinners()` /
`getPrevious()` — and show `<GiveawayLoader />` while the request is in
flight. Join and claim actions call the real, transaction-backed endpoints.
A minimal `/login` page (`LoginPage.jsx`) exercises `/api/auth/login` and
`/api/auth/register` so the flow is testable end-to-end without a real
VELOOP auth integration yet.

The `?demo=<state>` query param (visitor / participant / winner / nonwinner /
ended / upcoming / loading / error / empty) still works for QA/screenshot
purposes — it now *overlays* the real fetched giveaway (forcing status/auth/
joined for the screenshot) rather than switching between static mock
objects, so the "Auto" state is genuinely live backend data end to end.

The static `src/data/giveawayData.js` mock module is no longer imported by
any page — it's left in place only as a schema reference for the shape the
frontend originally expected; safe to delete once you're confident the live
integration covers everything you need.

## Security measures implemented

- **Untrusted client input**: join requests only ever accept `prizeId`; the
  entry currency/amount are always read from the `Prize` document server-side.
- **Atomicity**: `participationService.join()` runs inside a MongoDB
  transaction — balance deduction, participation record, and ledger entry
  either all commit or all roll back together.
- **Duplicate-join protection**: a compound unique index on
  `(userId, prizeId)` in `GiveawayParticipation` — not just an
  application-level `if` check — so two simultaneous requests can't both
  succeed.
- **Negative-balance protection**: the balance deduction uses a conditional
  `findOneAndUpdate({ balance: { $gte: amount } }, { $inc: ... })`, so even
  under a race, the balance can never go negative.
- **Giveaway status/time authority**: `join()` independently checks
  `startAt <= now <= endAt` and the giveaway's actual status — a stale
  frontend countdown showing "Join" after the real end time is rejected.
- **Fraud layer**: `fraudService.assessJoinRisk()` scores device-join
  velocity, multi-account-per-device signals, and account age into a 0-100
  score; `BLOCKED` requests are rejected and logged to `FraudEvent` before
  any balance/participation work happens.
- **Winner integrity**: `GiveawayWinner` has a unique `(prizeId, userId)`
  index, and `selectWinnersForPrize` only draws `winnerCount - alreadySelected`
  additional winners, never more.
- **Claim ownership**: every claim/winner read is scoped to
  `req.user.id` from the verified JWT — there is no `winnerId` parameter a
  client could tamper with to claim someone else's prize.
- **Rate limiting**: dedicated limiters on `/join`, `/claim`, and auth
  endpoints, plus a global limiter.
- **Audit trail**: `AuditLog` records every join, deduction, rejection,
  duplicate attempt, fraud flag, claim submission and winner selection.
- **Security headers / sanitization**: `helmet`, `express-mongo-sanitize`,
  a strict CORS origin, and a small JSON body size cap.

## API reference

All responses are JSON: `{ success: true, ... }` or
`{ success: false, code, message, details? }`. Error codes match spec
section 42 exactly (`GIVEAWAY_NOT_FOUND`, `GIVEAWAY_ENDED`,
`ALREADY_PARTICIPATING`, `INSUFFICIENT_VE_BALANCE`, etc.).

### Auth
_(stand-in for VELOOP's real auth system — see note in authController.js)_

| Method | Endpoint | Auth | Body | Notes |
|---|---|---|---|---|
| POST | `/api/auth/register` | — | `{ name, email, password }` | Creates a user with demo starting balances |
| POST | `/api/auth/login` | — | `{ email, password }` | Returns `{ token, user }` |
| GET | `/api/auth/me` | Bearer | — | Current user + balances |

### Giveaway (public reads)

| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| GET | `/api/giveaways/current` | — | Live giveaway if one exists, else soonest upcoming, else `{ giveaway: null }` |
| GET | `/api/giveaways/previous` | — | Archived/ended giveaways with finalized winners |
| GET | `/api/giveaways/:id` | — | By id or slug |
| GET | `/api/prizes/:slug` | — | Single prize + parent giveaway context, for the individual giveaway page |

### Participation

| Method | Endpoint | Auth | Body | Notes |
|---|---|---|---|---|
| GET | `/api/giveaways/:id/my-status` | Bearer | — | `{ joined, entries, joinedPrizeIds }` across all prizes in the giveaway |
| POST | `/api/giveaways/:id/join` | Bearer | `{ prizeId }` | Rate-limited, fraud-checked, transactional |

### Winners

| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| GET | `/api/giveaways/:id/winners` | optional | `{ finalized: false, winners: [] }` while active; real list once ended |
| GET | `/api/giveaways/:id/my-win` | optional | Personalizes "did I win?" for the caller only |

### Claim

| Method | Endpoint | Auth | Body | Notes |
|---|---|---|---|---|
| GET | `/api/giveaways/:id/my-claim` | Bearer | — | Caller's own claim status only |
| POST | `/api/giveaways/:id/claim` | Bearer | `{ email }` or `{ fullName, phone, address, city, state, pinCode }` | Which fields are required is decided server-side from the winner's prize `claimType`, not from the request |

### Admin (`requireAuth` + `requireAdmin`)

| Method | Endpoint | Body |
|---|---|---|
| POST | `/api/admin/giveaways` | Giveaway fields |
| PATCH | `/api/admin/giveaways/:id` | Partial giveaway fields |
| PATCH | `/api/admin/giveaways/:id/status` | `{ status }` |
| POST | `/api/admin/giveaways/:id/prizes` | Prize fields |
| PATCH | `/api/admin/prizes/:prizeId` | Partial prize fields |
| POST | `/api/admin/prizes/:prizeId/select-winners` | — draws remaining winners up to `winnerCount` |

## Testing checklist covered

- Normal join → correct currency/amount deducted, participation +
  transaction created (`participationService.join`)
- Duplicate join (double-click or concurrent) → unique index rejects the
  second insert; transaction rolls back the balance deduction automatically
- Insufficient balance / wrong currency → rejected before any DB write
- Giveaway not yet started / already ended → rejected regardless of what
  the frontend displays
- Tampered `userId`/`amount`/`currency` in the request body → ignored;
  only `prizeId` is read, identity comes from the JWT
- Suspicious device/account velocity → scored, logged to `FraudEvent`,
  blocked above the configured threshold

## Environment variables

See `.env.example`. Never commit `.env`. Balances/secrets are never sent to
the frontend as anything other than the authenticated user's own read-only
balance in `/api/auth/me`.
